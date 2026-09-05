import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getWhatsAppService } from "@/lib/whatsapp"
import { scheduleBolnaCall } from "@/lib/scheduled-call"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"

/**
 * POST /api/phone-screening/review
 *
 * HR reviews a candidate flagged by the AI prescreen.
 * - approve: sends template 11 (info_received_confirm) to schedule call
 * - reject: sends template 15 (screening_filtered_out) with HR note
 *
 * Also supports bulk operations:
 * Body: { actions: [{ participantId, decision, note? }] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    // Support both single and bulk
    const actions = Array.isArray(body.actions)
      ? body.actions
      : [{ participantId: body.participantId, decision: body.decision, note: body.note }]

    if (!actions.length || !actions[0].participantId) {
      return NextResponse.json({ error: "Missing participantId" }, { status: 400 })
    }

    const results: Array<{ participantId: string; success: boolean; error?: string }> = []
    const whatsapp = getWhatsAppService()

    for (const action of actions) {
      const { participantId, decision, note } = action

      if (!participantId || !["approved", "rejected"].includes(decision)) {
        results.push({ participantId, success: false, error: "Invalid participantId or decision" })
        continue
      }

      try {
        // Fetch participant with candidate and job info
        const { data: participant, error: fetchError } = await supabaseAdmin
          .from("phone_screening_participants")
          .select(`
            id, status, job_id, candidate_id, origin,
            candidates: candidate_id (id, name, phone, current_ctc, expected_ctc, notice_period,
                                      total_experience_years, location_preference, willing_to_relocate, reason_for_switching),
            jobs: job_id (id, title, client_name)
          `)
          .eq("id", participantId)
          .single()

        if (fetchError || !participant) {
          results.push({ participantId, success: false, error: "Participant not found" })
          continue
        }

        if (participant.status !== "needs_review") {
          results.push({ participantId, success: false, error: `Participant status is "${participant.status}", not "needs_review"` })
          continue
        }

        const candidate = participant.candidates as any
        const job = participant.jobs as any

        if (decision === "approved") {
          // Update participant status to info_received → ready for scheduling
          await supabaseAdmin
            .from("phone_screening_participants")
            .update({
              status: "info_received",
              prescreen_decision: "approved",
              updated_at: new Date().toISOString(),
            })
            .eq("id", participantId)

          // Update candidate prescreen
          await supabaseAdmin
            .from("candidates")
            .update({
              ai_prescreen_decision: "approved",
              ai_prescreen_reason: note || "Approved by HR after review",
              updated_at: new Date().toISOString(),
            })
            .eq("id", participant.candidate_id)

          // Send template 11 (info_received_confirm) with schedule buttons
          await whatsapp.sendInfoReceivedConfirm({
            phoneNumber: candidate?.phone || "",
            candidateName: candidate?.name || "",
            currentCtc: candidate?.current_ctc || "Not provided",
            expectedCtc: candidate?.expected_ctc || "Not provided",
            noticePeriod: candidate?.notice_period || "Not provided",
          })

          // Auto-schedule AI call (1 minute delay so candidate sees confirmation first)
          const callDelaySec = 60
          const scheduled = await scheduleBolnaCall(participantId, callDelaySec)
          if (scheduled.scheduled) {
            await supabaseAdmin
              .from("phone_screening_participants")
              .update({
                status: "call_scheduled",
                scheduled_at: new Date(Date.now() + callDelaySec * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", participantId)
          } else {
            logger.error("Failed to auto-schedule call after HR approve", {
              participantId, candidateId: participant.candidate_id, error: scheduled.error
            })
          }

          logger.info("HR approved candidate after prescreen review", { participantId, candidateId: participant.candidate_id })
          results.push({ participantId, success: true })

        } else {
          // rejected
          await supabaseAdmin
            .from("phone_screening_participants")
            .update({
              status: "filtered_out",
              prescreen_decision: "rejected",
              updated_at: new Date().toISOString(),
            })
            .eq("id", participantId)

          await supabaseAdmin
            .from("candidates")
            .update({
              ai_prescreen_decision: "rejected",
              ai_prescreen_reason: note || "Rejected by HR after review",
              updated_at: new Date().toISOString(),
            })
            .eq("id", participant.candidate_id)

          // Send template 15 (screening_filtered_out)
          await whatsapp.sendScreeningFilteredOut({
            phoneNumber: candidate?.phone || "",
            candidateName: candidate?.name || "",
            reason: note || "After review, this role may not be the best fit at this time",
          })

          logger.info("HR rejected candidate after prescreen review", { participantId, candidateId: participant.candidate_id, note })
          results.push({ participantId, success: true })
        }
      } catch (err: any) {
        logger.error("Error processing review action", { participantId, error: err.message })
        results.push({ participantId, success: false, error: err.message })
      }
    }

    const allSuccess = results.every(r => r.success)
    return NextResponse.json({
      success: allSuccess,
      results,
      message: allSuccess
        ? `${results.length} candidate(s) reviewed successfully`
        : `${results.filter(r => r.success).length} approved, ${results.filter(r => !r.success).length} failed`,
    })
  } catch (error: any) {
    logger.error("Error in review endpoint", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
