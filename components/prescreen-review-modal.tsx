"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface PrescreenCheck {
  field: string
  verdict: "pass" | "review" | "fail"
  detail: string
}

export interface ReviewCandidate {
  participantId: string
  candidateId: string
  name: string
  currentRole?: string
  currentCompany?: string
  phone?: string
  email?: string
  // Parsed info
  currentCtc?: string
  expectedCtc?: string
  totalExperience?: number
  noticePeriod?: string
  location?: string
  willingToRelocate?: boolean | null
  reasonForSwitching?: string
  // AI prescreen
  aiPrescreenDecision?: string
  aiPrescreenReason?: string
  checks?: PrescreenCheck[]
  // Job info
  jobTitle?: string
  jobSalaryMin?: number
  jobSalaryMax?: number
  jobExpMin?: number
  jobExpMax?: number
  jobCity?: string
  // Timing
  infoReceivedAt?: string
}

interface PrescreenReviewModalProps {
  candidate: ReviewCandidate | null
  open: boolean
  onClose: () => void
  onReviewed: () => void
  // Bulk support
  onBulkApprove?: (participantIds: string[]) => void
  onBulkReject?: (participantIds: string[]) => void
  totalCount?: number
  currentIndex?: number
  onNext?: () => void
  onPrev?: () => void
}

function formatTimeSince(iso: string | null): string {
  if (!iso) return "unknown"
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const verdictStyles = {
  pass: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  review: { icon: Search, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  fail: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
}

export function PrescreenReviewModal({
  candidate,
  open,
  onClose,
  onReviewed,
  totalCount,
  currentIndex,
  onNext,
  onPrev,
}: PrescreenReviewModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [rejectNote, setRejectNote] = useState("")

  if (!candidate) return null

  const approve = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/phone-screening/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: candidate.participantId, decision: "approved" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to approve")
      toast({ title: "Candidate approved", description: "Schedule link sent via WhatsApp" })
      onReviewed()
      onClose()
    } catch (err: any) {
      toast({ title: "Failed to approve", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const reject = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/phone-screening/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: candidate.participantId, decision: "rejected", note: rejectNote.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to reject")
      toast({ title: "Candidate passed", description: "Candidate notified via WhatsApp" })
      onReviewed()
      onClose()
    } catch (err: any) {
      toast({ title: "Failed to reject", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const passCount = candidate.checks?.filter(c => c.verdict === "pass").length || 0
  const reviewCount = candidate.checks?.filter(c => c.verdict === "review").length || 0
  const failCount = candidate.checks?.filter(c => c.verdict === "fail").length || 0

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-6 pb-6"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur px-6 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900 truncate">Prescreen Review</h2>
                  {totalCount != null && currentIndex != null && (
                    <span className="text-xs text-gray-400 shrink-0">{currentIndex + 1} of {totalCount}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{candidate.name} — {candidate.jobTitle || "Role"}</p>
              </div>
              <div className="flex items-center gap-2">
                {totalCount != null && totalCount > 1 && (
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={onPrev} disabled={currentIndex === 0} className="h-8 w-8 p-0">
                      ←
                    </Button>
                    <Button variant="outline" size="sm" onClick={onNext} disabled={currentIndex === totalCount - 1} className="h-8 w-8 p-0">
                      →
                    </Button>
                  </div>
                )}
                <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* Pending timer */}
              {candidate.infoReceivedAt && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Waiting for review — {formatTimeSince(candidate.infoReceivedAt)}
                  </span>
                </div>
              )}

              {/* AI Verdict */}
              <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                failCount > 0 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
              }`}>
                <ShieldCheck className={`h-5 w-5 ${failCount > 0 ? "text-red-600" : "text-amber-600"}`} />
                <div>
                  <p className={`text-sm font-bold ${failCount > 0 ? "text-red-800" : "text-amber-800"}`}>
                    {failCount > 0 ? "Auto-filtered — HR override available" : "Needs HR review"}
                  </p>
                  {candidate.aiPrescreenReason && (
                    <p className="text-xs text-gray-600 mt-0.5">{candidate.aiPrescreenReason}</p>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-xs">
                  <span className="text-emerald-600 font-medium">{passCount} pass</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-amber-600 font-medium">{reviewCount} review</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-red-600 font-medium">{failCount} fail</span>
                </div>
              </div>

              {/* WhatsApp conversation */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">WhatsApp conversation</p>
                </div>
                <div className="space-y-2">
                  <div className="rounded-xl rounded-tl-sm bg-indigo-50 border border-indigo-100 px-3 py-2 max-w-[85%]">
                    <p className="text-xs text-indigo-800">Hi {candidate.name}, please share: CTC, Expected CTC, Experience, Notice period, City, Willing to relocate (yes/no), Reason for switching</p>
                  </div>
                  <div className="rounded-xl rounded-tr-sm bg-white border border-gray-200 px-3 py-2 max-w-[85%] ml-auto">
                    <p className="text-xs text-gray-700">
                      {[
                        candidate.currentCtc,
                        candidate.expectedCtc,
                        candidate.totalExperience != null ? `${candidate.totalExperience} years` : null,
                        candidate.noticePeriod,
                        candidate.location,
                        candidate.willingToRelocate != null ? (candidate.willingToRelocate ? "yes" : "no") : null,
                        candidate.reasonForSwitching,
                      ].filter(Boolean).join(", ") || "No response parsed"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parsed details */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Parsed details</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {candidate.currentCtc && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400 font-medium">Current CTC</p>
                      <p className="text-sm font-semibold text-gray-800">{candidate.currentCtc}</p>
                    </div>
                  )}
                  {candidate.expectedCtc && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400 font-medium">Expected CTC</p>
                      <p className="text-sm font-semibold text-gray-800">{candidate.expectedCtc}</p>
                    </div>
                  )}
                  {candidate.totalExperience != null && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400 font-medium">Experience</p>
                      <p className="text-sm font-semibold text-gray-800">{candidate.totalExperience} yrs</p>
                    </div>
                  )}
                  {candidate.noticePeriod && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400 font-medium">Notice</p>
                      <p className="text-sm font-semibold text-gray-800">{candidate.noticePeriod}</p>
                    </div>
                  )}
                  {candidate.location && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400 font-medium">Location</p>
                      <p className="text-sm font-semibold text-gray-800">{candidate.location}</p>
                    </div>
                  )}
                  {candidate.willingToRelocate != null && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400 font-medium">Relocate</p>
                      <p className="text-sm font-semibold text-gray-800">{candidate.willingToRelocate ? "Yes" : "No"}</p>
                    </div>
                  )}
                  {candidate.reasonForSwitching && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 col-span-2 sm:col-span-3">
                      <p className="text-[10px] text-gray-400 font-medium">Reason for switching</p>
                      <p className="text-sm font-semibold text-gray-800">{candidate.reasonForSwitching}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI check breakdown */}
              {candidate.checks && candidate.checks.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="h-4 w-4 text-gray-400" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">AI assessment breakdown</p>
                  </div>
                  <div className="space-y-2">
                    {candidate.checks.map((check, i) => {
                      const style = verdictStyles[check.verdict]
                      const Icon = style.icon
                      return (
                        <div key={i} className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 ${style.border} ${style.bg}`}>
                          <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${style.color}`} />
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold capitalize ${style.color}`}>{check.field.replace(/_/g, " ")}</p>
                            <p className="text-xs text-gray-600">{check.detail}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Job requirements */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Job requirements</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {candidate.jobSalaryMin != null && candidate.jobSalaryMax != null && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400 font-medium">Salary</p>
                      <p className="text-sm font-semibold text-gray-800">{candidate.jobSalaryMin}–{candidate.jobSalaryMax}</p>
                    </div>
                  )}
                  {candidate.jobExpMin != null && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400 font-medium">Experience</p>
                      <p className="text-sm font-semibold text-gray-800">{candidate.jobExpMin}+ yrs{candidate.jobExpMax ? ` (max ${candidate.jobExpMax})` : ""}</p>
                    </div>
                  )}
                  {candidate.jobCity && (
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                      <p className="text-[10px] text-gray-400 font-medium">Location</p>
                      <p className="text-sm font-semibold text-gray-800">{candidate.jobCity}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-gray-100 bg-white px-6 py-4">
              {!showReject ? (
                <div className="flex items-center gap-3">
                  <Button onClick={approve} disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Approve — Send Schedule Link
                  </Button>
                  <Button onClick={() => setShowReject(true)} disabled={loading} variant="outline" className="h-11 border-red-200 text-red-600 hover:bg-red-50">
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600">Reason for passing (optional)</label>
                  <textarea
                    autoFocus
                    rows={2}
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g. Salary mismatch, relocation concern…"
                  />
                  <div className="flex gap-2">
                    <Button onClick={reject} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Confirm pass
                    </Button>
                    <Button onClick={() => { setShowReject(false); setRejectNote("") }} variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
