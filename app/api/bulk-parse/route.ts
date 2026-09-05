import { NextRequest, NextResponse } from 'next/server'
import { BulkResumeParser } from '@/lib/bulk-resume-parser'
import { getInternalAuthContext, hasPermission } from '@/lib/internal-auth'
import { getOrAnalyzeFit } from '@/lib/candidate-fit'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const ctx = await getInternalAuthContext(request)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasPermission(ctx, "candidates.edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const jobId = formData.get('jobId') as string | null
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Validate file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]

    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type))
    if (invalidFiles.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid file types detected',
          invalidFiles: invalidFiles.map(f => f.name)
        },
        { status: 400 }
      )
    }

    // Estimate cost
    const costEstimate = BulkResumeParser.estimateCost(files.length)
    
    console.log(`💰 Cost estimate for ${files.length} files:`)
    console.log(`   Input tokens: ${costEstimate.estimatedTokens.toLocaleString()}`)
    console.log(`   Estimated cost: $${costEstimate.estimatedCost.toFixed(4)}`)
    console.log(`   Input cost: $${costEstimate.breakdown.inputCost.toFixed(4)}`)
    console.log(`   Output cost: $${costEstimate.breakdown.outputCost.toFixed(4)}`)

    // Start bulk parsing
    const result = await BulkResumeParser.parseBulkResumes(
      files,
      (progress) => {
        console.log(`📊 Progress: ${progress.processed}/${progress.total} - ${progress.current}`)
      }
    )

    // Auto-trigger fit analysis if jobId provided
    let fitAnalysisResults: Record<string, unknown> = {}
    if (jobId && result.candidateIds.length > 0) {
      logger.info("Auto-triggering fit analysis after bulk parse", { jobId, candidateCount: result.candidateIds.length })

      // Get job data
      const { data: job } = await supabaseAdmin
        .from("jobs")
        .select(`
          id, title, industry, client_name, city, location,
          experience_min_years, experience_max_years,
          skills_must_have, skills_good_to_have, description
        `)
        .eq("id", jobId)
        .single()

      if (job) {
        // Get candidate data for parsed candidates
        const { data: candidates } = await supabaseAdmin
          .from("candidates")
          .select("id,name,current_role,current_company,total_experience,location,technical_skills,resume_text,summary")
          .in("id", result.candidateIds)

        for (const candidate of candidates || []) {
          try {
            fitAnalysisResults[candidate.id] = await getOrAnalyzeFit(jobId, candidate.id, candidate, job)
          } catch (err: any) {
            logger.warn("Auto-fit failed for candidate after bulk parse", { candidateId: candidate.id, error: err.message })
          }
        }

        // Ensure applications exist for these candidates
        const candidateIds = candidates?.map(c => c.id) || []
        for (const cid of candidateIds) {
          const { data: existing } = await supabaseAdmin
            .from("applications")
            .select("id")
            .eq("job_id", jobId)
            .eq("candidate_id", cid)
            .limit(1)

          if (!existing || existing.length === 0) {
            await supabaseAdmin
              .from("applications")
              .insert({ job_id: jobId, candidate_id: cid, status: "applied" })
          }
        }

        logger.info("Auto-fit analysis complete after bulk parse", {
          jobId,
          analyzed: Object.keys(fitAnalysisResults).length
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${result.successful} out of ${files.length} files`,
      results: {
        total: files.length,
        successful: result.successful,
        failed: result.failed,
        candidateIds: result.candidateIds
      },
      fitAnalysis: jobId ? fitAnalysisResults : undefined,
      costEstimate,
      errors: result.errors
    })

  } catch (error) {
    console.error('Bulk parsing failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Bulk parsing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const ctx = await getInternalAuthContext(request)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!hasPermission(ctx, "candidates.edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const jobs = await BulkResumeParser.getAllParsingJobs()
    
    return NextResponse.json({
      success: true,
      jobs
    })
  } catch (error) {
    console.error('Failed to fetch parsing jobs:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch parsing jobs' },
      { status: 500 }
    )
  }
}
