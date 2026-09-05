import { supabaseAdmin } from "@/lib/supabase"
import { getWhatsAppService } from "@/lib/whatsapp"
import { logger } from "@/lib/logger"

// ── Parsed Info (extended) ──

interface ParsedInfo {
  currentCtc: string | null
  expectedCtc: string | null
  noticePeriod: string | null
  totalExperience: number | null
  location: string | null
  willingToRelocate: boolean | null
  reasonForSwitching: string | null
}

const REJECTION_REASONS = [
  "not_looking_to_switch",
  "comp_mismatch",
  "location_mismatch",
  "already_placed",
  "role_not_relevant",
  "other",
] as const

export type RejectionReason = (typeof REJECTION_REASONS)[number]

export function isValidRejectionReason(value: string): value is RejectionReason {
  return (REJECTION_REASONS as readonly string[]).includes(value)
}

// ── Parse candidate's free-text reply for screening details ──
// Expected format (one reply):
//   "8 LPA, 12 LPA, 5 years, 30 days, Mumbai, yes, better growth"
// Or partial:
//   "8 LPA, 12 LPA, 30 days"
//   "8 LPA, 12 LPA, 30 days, Mumbai, yes, looking for growth"

export function parseDetailedInfoReply(text: string): ParsedInfo {
  const lower = text.toLowerCase().trim()
  const result: ParsedInfo = {
    currentCtc: null,
    expectedCtc: null,
    noticePeriod: null,
    totalExperience: null,
    location: null,
    willingToRelocate: null,
    reasonForSwitching: null,
  }

  // Split by comma, slash, or newline
  const parts = lower.split(/[,\n/]+/).map(p => p.trim()).filter(Boolean)

  for (const part of parts) {
    const p = part.trim()
    if (!p) continue

    // Notice period: "30 days", "1 month", "immediate"
    if (/\d+\s*(day|days|week|weeks|month|months)/.test(p) || /immediate|asap|join now/.test(p)) {
      if (!result.noticePeriod) result.noticePeriod = extractNoticePeriod(p)
      continue
    }

    // Experience: "5 years", "3.5 years", "5 yrs", "5 yoe"
    const expMatch = p.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?|yoe|experience)/)
    if (expMatch) {
      result.totalExperience = parseFloat(expMatch[1])
      continue
    }

    // Willing to relocate: "yes", "no", "relocate", "willing"
    if (/^(yes|no|relocate|willing|not?\s*willing|can\s*relocate|cannot\s*relocate|na)$/i.test(p)) {
      result.willingToRelocate = /^(yes|relocate|willing|can\s*relocate)$/i.test(p)
      continue
    }

    // CTC: "8 LPA", "800000", "80K"
    const ctcValue = extractCtc(p)
    if (ctcValue) {
      if (!result.currentCtc) {
        result.currentCtc = ctcValue
      } else if (!result.expectedCtc) {
        result.expectedCtc = ctcValue
      }
      continue
    }

    // Location: if it's a city name (no digits, reasonable length)
    if (/^[a-z\s]{2,30}$/.test(p) && !result.location) {
      result.location = p.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      continue
    }

    // Reason for switching: everything else
    if (!result.reasonForSwitching && p.length > 3) {
      result.reasonForSwitching = p.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }
  }

  return result
}

// ── Backward-compatible parse for simple info (CTC + notice only) ──

interface ParsedSimpleInfo {
  currentCtc: string | null
  expectedCtc: string | null
  noticePeriod: string | null
}

export function parseInfoReply(text: string): ParsedSimpleInfo {
  const detailed = parseDetailedInfoReply(text)
  return {
    currentCtc: detailed.currentCtc,
    expectedCtc: detailed.expectedCtc,
    noticePeriod: detailed.noticePeriod,
  }
}

function extractCtc(text: string): string | null {
  const cleaned = text.replace(/(current|expected|ctc|lpa|per annum|pa|annual|lakhs|lakh|k|inr|rs|rupees|salary)/g, "").trim()
  const numMatch = cleaned.match(/(\d+(?:\.\d+)?)/)
  if (!numMatch) return null

  const num = parseFloat(numMatch[1])
  if (num < 100) return `${num} LPA`
  if (num > 100000) return `${(num / 100000).toFixed(1)} LPA`
  if (num > 1000 && num < 100000) return `${(num / 1000).toFixed(0)}K`
  return `${num}`
}

function extractNoticePeriod(text: string): string | null {
  const dayMatch = text.match(/(\d+)\s*(day|days)/)
  if (dayMatch) return `${dayMatch[1]} days`

  const weekMatch = text.match(/(\d+)\s*(week|weeks)/)
  if (weekMatch) return `${parseInt(weekMatch[1]) * 7} days`

  const monthMatch = text.match(/(\d+)\s*(month|months)/)
  if (monthMatch) return `${parseInt(monthMatch[1]) * 30} days`

  const numMatch = text.match(/(\d+)/)
  if (numMatch) {
    const num = parseInt(numMatch[1])
    if (num >= 1 && num <= 90) return `${num} days`
    if (num > 90) return `${Math.round(num / 30)} months`
  }

  if (/immediate|immed|asap|join now/.test(text)) return "Immediate"
  return null
}

// ── Handle simple info reply (backward compatible) ──

export async function handleInfoReply(
  participantId: string,
  replyText: string
): Promise<{ success: boolean; error?: string; parsed?: ParsedSimpleInfo }> {
  try {
    const { data: participant, error: fetchError } = await supabaseAdmin
      .from("phone_screening_participants")
      .select(`
        id, status, job_id, candidate_id, origin,
        candidates: candidate_id (id, name, phone),
        jobs: job_id (id, title, client_name)
      `)
      .eq("id", participantId)
      .single()

    if (fetchError || !participant) {
      return { success: false, error: "Participant not found" }
    }

    const parsed = parseInfoReply(replyText)
    if (!parsed.currentCtc && !parsed.expectedCtc && !parsed.noticePeriod) {
      return { success: false, error: "Could not parse info. Please reply in format: '8 LPA, 12 LPA, 30 days'" }
    }

    const updates: any = { updated_at: new Date().toISOString() }
    if (parsed.currentCtc) updates.current_ctc = parsed.currentCtc
    if (parsed.expectedCtc) updates.expected_ctc = parsed.expectedCtc
    if (parsed.noticePeriod) updates.notice_period = parsed.noticePeriod
    updates.info_collected_at = new Date().toISOString()

    const { error: updateError } = await supabaseAdmin
      .from("candidates")
      .update(updates)
      .eq("id", participant.candidate_id)

    if (updateError) {
      logger.error("Failed to update candidate info", { error: updateError })
      return { success: false, error: "Failed to save info" }
    }

    await supabaseAdmin
      .from("phone_screening_participants")
      .update({
        status: "info_received",
        info_received_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", participantId)

    const whatsapp = getWhatsAppService()
    const candidate = participant.candidates as any
    await whatsapp.sendInfoReceivedConfirm({
      phoneNumber: candidate.phone || "",
      candidateName: candidate.name || "",
      currentCtc: parsed.currentCtc || "Not provided",
      expectedCtc: parsed.expectedCtc || "Not provided",
      noticePeriod: parsed.noticePeriod || "Not provided"
    })

    logger.info("Info collected and confirmed", {
      participantId, candidateId: participant.candidate_id,
      currentCtc: parsed.currentCtc, expectedCtc: parsed.expectedCtc, noticePeriod: parsed.noticePeriod
    })

    return { success: true, parsed }
  } catch (error: any) {
    logger.error("Error handling info reply", { error: error.message })
    return { success: false, error: error.message }
  }
}

// ── Handle detailed info reply (extended screening) ──

export async function handleDetailedInfoReply(
  participantId: string,
  replyText: string
): Promise<{ success: boolean; error?: string; parsed?: ParsedInfo; prescreen?: { decision: string; reason: string } }> {
  try {
    const { data: participant, error: fetchError } = await supabaseAdmin
      .from("phone_screening_participants")
      .select(`
        id, status, job_id, candidate_id, origin, screening_context,
        candidates: candidate_id (id, name, phone),
        jobs: job_id (id, title, client_name, salary_min, salary_max, salary_type,
                       experience_min_years, experience_max_years, city, skills_must_have)
      `)
      .eq("id", participantId)
      .single()

    if (fetchError || !participant) {
      return { success: false, error: "Participant not found" }
    }

    const parsed = parseDetailedInfoReply(replyText)
    if (!parsed.currentCtc && !parsed.expectedCtc && !parsed.noticePeriod && !parsed.totalExperience) {
      return { success: false, error: "Could not parse info. Please share: CTC, expected CTC, experience, notice period, location, willing to relocate (yes/no), reason for switching" }
    }

    // Save to candidates table
    const candidateUpdates: any = { updated_at: new Date().toISOString(), info_collected_at: new Date().toISOString() }
    if (parsed.currentCtc) candidateUpdates.current_ctc = parsed.currentCtc
    if (parsed.expectedCtc) candidateUpdates.expected_ctc = parsed.expectedCtc
    if (parsed.noticePeriod) candidateUpdates.notice_period = parsed.noticePeriod
    if (parsed.totalExperience != null) candidateUpdates.total_experience_years = parsed.totalExperience
    if (parsed.location) candidateUpdates.location_preference = parsed.location
    if (parsed.willingToRelocate != null) candidateUpdates.willing_to_relocate = parsed.willingToRelocate
    if (parsed.reasonForSwitching) candidateUpdates.reason_for_switching = parsed.reasonForSwitching

    const { error: updateError } = await supabaseAdmin
      .from("candidates")
      .update(candidateUpdates)
      .eq("id", participant.candidate_id)

    if (updateError) {
      logger.error("Failed to update candidate info (detailed)", { error: updateError })
      return { success: false, error: "Failed to save info" }
    }

    // Pre-screening evaluation
    const job = participant.jobs as any
    const prescreen = evaluateCandidate(parsed, job)

    // Update participant
    await supabaseAdmin
      .from("phone_screening_participants")
      .update({
        status: prescreen.decision === "filtered_out" ? "filtered_out" : "info_received",
        info_received_at: new Date().toISOString(),
        prescreen_decision: prescreen.decision,
        prescreen_reason: prescreen.reason,
        updated_at: new Date().toISOString()
      })
      .eq("id", participantId)

    // Send appropriate response
    const whatsapp = getWhatsAppService()
    const candidate = participant.candidates as any

    if (prescreen.decision === "filtered_out") {
      await whatsapp.sendScreeningFilteredOut({
        phoneNumber: candidate.phone || "",
        candidateName: candidate.name || "",
        reason: prescreen.reason
      })
      logger.info("Candidate filtered out after pre-screen", {
        participantId, candidateId: participant.candidate_id, reason: prescreen.reason
      })
    } else {
      await whatsapp.sendInfoReceivedConfirm({
        phoneNumber: candidate.phone || "",
        candidateName: candidate.name || "",
        currentCtc: parsed.currentCtc || "Not provided",
        expectedCtc: parsed.expectedCtc || "Not provided",
        noticePeriod: parsed.noticePeriod || "Not provided"
      })
      logger.info("Detailed info collected, proceeding to AI call", {
        participantId, candidateId: participant.candidate_id
      })
    }

    return { success: true, parsed, prescreen }
  } catch (error: any) {
    logger.error("Error handling detailed info reply", { error: error.message })
    return { success: false, error: error.message }
  }
}

// ── Pre-screening evaluation (rule-based) ──

function evaluateCandidate(parsed: ParsedInfo, job: any): { decision: string; reason: string } {
  const reasons: string[] = []

  // 1. Salary range check
  if (parsed.expectedCtc && job?.salary_min != null && job?.salary_max != null) {
    const expectedNum = extractCtcNumber(parsed.expectedCtc)
    if (expectedNum != null) {
      const jobMin = Number(job.salary_min)
      const jobMax = Number(job.salary_max)
      // Allow 20% buffer on both sides
      if (expectedNum < jobMin * 0.8) {
        reasons.push(`expected_ctc_below_range (expected ${parsed.expectedCtc}, job range ${jobMin}-${jobMax})`)
      } else if (expectedNum > jobMax * 1.2) {
        reasons.push(`expected_ctc_above_range (expected ${parsed.expectedCtc}, job range ${jobMin}-${jobMax})`)
      }
    }
  }

  // 2. Experience range check
  if (parsed.totalExperience != null && job?.experience_min_years != null) {
    const minExp = Number(job.experience_min_years)
    if (parsed.totalExperience < minExp * 0.7) {
      reasons.push(`experience_insufficient (has ${parsed.totalExperience}y, min ${minExp}y)`)
    }
  }
  if (parsed.totalExperience != null && job?.experience_max_years != null) {
    const maxExp = Number(job.experience_max_years)
    if (maxExp > 0 && parsed.totalExperience > maxExp * 1.5) {
      reasons.push(`experience_overqualified (has ${parsed.totalExperience}y, max ${maxExp}y)`)
    }
  }

  // 3. Location check (non-binding — just flag if not willing to relocate and different city)
  if (parsed.willingToRelocate === false && parsed.location && job?.city) {
    const candidateCity = parsed.location.toLowerCase()
    const jobCity = String(job.city).toLowerCase()
    if (candidateCity !== jobCity && !candidateCity.includes(jobCity) && !jobCity.includes(candidateCity)) {
      reasons.push(`location_mismatch (candidate in ${parsed.location}, job in ${job.city}, not willing to relocate)`)
    }
  }

  // 4. Notice period check — if > 90 days and not immediate, flag
  if (parsed.noticePeriod && parsed.noticePeriod !== "Immediate") {
    const daysMatch = parsed.noticePeriod.match(/(\d+)/)
    if (daysMatch) {
      const days = parseInt(daysMatch[1])
      if (days > 90) {
        reasons.push(`notice_period_long (${parsed.noticePeriod})`)
      }
    }
  }

  if (reasons.length === 0) {
    return { decision: "proceed", reason: "Meets basic criteria" }
  }

  // If any critical mismatch (salary or location), filter out
  const hasCritical = reasons.some(r => r.startsWith("expected_ctc_") || r.startsWith("location_mismatch"))
  return {
    decision: hasCritical ? "filtered_out" : "proceed",
    reason: reasons.join("; ")
  }
}

function extractCtcNumber(ctc: string): number | null {
  const cleaned = ctc.replace(/(lpa|per annum|pa|annual|lakhs|lakh|k|inr|rs|rupees|salary)/g, "").trim()
  const numMatch = cleaned.match(/(\d+(?:\.\d+)?)/)
  if (!numMatch) return null
  const num = parseFloat(numMatch[1])
  if (num < 100) return num // Already LPA
  if (num > 100000) return num / 100000 // Convert to LPA
  if (num > 1000 && num < 100000) return num / 1000 // Convert K to LPA-ish
  return num
}

// ── Handle rejection reason from WhatsApp button ──

export async function handleRejectionReason(
  participantId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  if (!isValidRejectionReason(reason)) {
    return { success: false, error: `Invalid rejection reason. Valid: ${REJECTION_REASONS.join(", ")}` }
  }

  try {
    const { error } = await supabaseAdmin
      .from("phone_screening_participants")
      .update({
        status: "not_interested",
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq("id", participantId)

    if (error) {
      logger.error("Failed to save rejection reason", { error })
      return { success: false, error: "Failed to save reason" }
    }

    logger.info("Rejection reason captured", { participantId, reason })
    return { success: true }
  } catch (error: any) {
    logger.error("Error saving rejection reason", { error: error.message })
    return { success: false, error: error.message }
  }
}

// ── Send info request (extended or simple based on mode) ──

export async function sendInfoRequest(
  participantId: string,
  mode: "simple" | "extended" = "simple"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: participant, error: fetchError } = await supabaseAdmin
      .from("phone_screening_participants")
      .select(`
        id, status, origin,
        candidates: candidate_id (id, name, phone),
        jobs: job_id (id, title, client_name)
      `)
      .eq("id", participantId)
      .single()

    if (fetchError || !participant) {
      return { success: false, error: "Participant not found" }
    }

    const candidate = participant.candidates as any
    const job = participant.jobs as any

    if (!candidate?.phone) {
      return { success: false, error: "No phone number" }
    }

    const whatsapp = getWhatsAppService()
    const origin = participant.origin || "outbound"

    let result
    let templateName: string

    if (mode === "extended") {
      result = await whatsapp.sendDetailedInfoRequest({
        phoneNumber: candidate.phone,
        candidateName: candidate.name || "",
        jobTitle: job?.title || "",
        companyName: job?.client_name || ""
      })
      templateName = "detailed_info_request"
    } else {
      result = origin === "inbound"
        ? await whatsapp.sendInboundInfoRequest({
            phoneNumber: candidate.phone,
            candidateName: candidate.name || "",
            jobTitle: job?.title || "",
            companyName: job?.client_name || ""
          })
        : await whatsapp.sendOutboundInfoRequest({
            phoneNumber: candidate.phone,
            candidateName: candidate.name || "",
            jobTitle: job?.title || "",
            companyName: job?.client_name || ""
          })
      templateName = origin === "inbound" ? "inbound_info_request" : "outbound_info_request"
    }

    if (result.success) {
      await supabaseAdmin
        .from("phone_screening_participants")
        .update({
          status: "info_requested",
          info_request_sent_at: new Date().toISOString(),
          whatsapp_message_id: result.messageId || null,
          whatsapp_sent_at: new Date().toISOString(),
          whatsapp_delivery_status: "sent",
          whatsapp_outbound_template: templateName,
          updated_at: new Date().toISOString()
        })
        .eq("id", participantId)
    }

    return result.success
      ? { success: true }
      : { success: false, error: result.error }
  } catch (error: any) {
    logger.error("Error sending info request", { error: error.message })
    return { success: false, error: error.message }
  }
}
