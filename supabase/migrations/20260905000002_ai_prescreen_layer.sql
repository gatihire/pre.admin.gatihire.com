-- AI Pre-Screen Layer
-- Adds columns to track AI prescreen decision on candidates
-- and a "needs_review" status for HR review queue

-- Candidates: track AI pre-screen result
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS ai_prescreen_decision TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS ai_prescreen_reason TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS ai_prescreened_at TIMESTAMPTZ;

COMMENT ON COLUMN candidates.ai_prescreen_decision IS
  'AI prescreen result: proceed, needs_review, or filtered_out';
COMMENT ON COLUMN candidates.ai_prescreen_reason IS
  'Human-readable reason for the prescreen decision';
COMMENT ON COLUMN candidates.ai_prescreened_at IS
  'Timestamp when AI prescreen was evaluated';

-- Index for filtering candidates by prescreen decision
CREATE INDEX IF NOT EXISTS idx_candidates_ai_prescreen
  ON candidates (ai_prescreen_decision)
  WHERE ai_prescreen_decision IS NOT NULL;

-- Participants: add needs_review to the valid statuses
-- The existing CHECK constraint on phone_screening_participants.status
-- was already updated in the previous migration to include filtered_out.
-- needs_review is a new status that means "awaiting HR review after AI prescreen".
-- We need to update the CHECK constraint to include it.

-- Drop the old constraint if it exists, then recreate with the new status
DO $$
BEGIN
  -- Try to drop the existing CHECK constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname LIKE '%phone_screening_participants%status%'
    AND contype = 'c'
  ) THEN
    ALTER TABLE phone_screening_participants
      DROP CONSTRAINT IF EXISTS phone_screening_participants_status_check;
  END IF;
END $$;

-- Recreate the CHECK constraint with all valid statuses
ALTER TABLE phone_screening_participants
  ADD CONSTRAINT phone_screening_participants_status_check
  CHECK (status IN (
    'pending', 'applied', 'calling', 'call_scheduled', 'in_progress',
    'completed', 'failed', 'retrying', 'no_answer', 'busy',
    'unreachable', 'not_interested', 'rejected', 'cancelled',
    'whatsapp_sent', 'interested', 'call_me_now',
    'info_requested', 'info_received', 'filtered_out',
    'needs_review',
    'needs_manual_followup'
  ));

COMMENT ON COLUMN phone_screening_participants.status IS
  'Participant status. needs_review = awaiting HR review after AI prescreen.';
