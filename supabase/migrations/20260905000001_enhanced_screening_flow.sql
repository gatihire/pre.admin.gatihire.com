-- Enhanced WhatsApp screening flow:
-- 1. Rejection reason capture
-- 2. Extended info collection (experience, location, relocation, reason for switching)
-- 3. Per-job campaign config (nudge timing, max attempts)
-- 4. Fix CHECK constraint (add info_requested, info_received, rejected, filtered_out)
-- 5. Candidate dedup tracking

-- ═══════════════════════════════════════════════════════════
-- 1. Fix phone_screening_participants status CHECK constraint
-- ═══════════════════════════════════════════════════════════
ALTER TABLE phone_screening_participants
  DROP CONSTRAINT IF EXISTS phone_screening_participants_status_check;

ALTER TABLE phone_screening_participants
  ADD CONSTRAINT phone_screening_participants_status_check CHECK (
    status IN (
      'pending', 'whatsapp_sent', 'whatsapp_delivered', 'whatsapp_read',
      'interested', 'call_me_now', 'scheduled', 'call_scheduled',
      'calling', 'in_progress', 'completed', 'failed',
      'not_interested', 'unreachable', 'rescheduled', 'needs_manual_followup',
      'info_requested', 'info_received', 'filtered_out', 'rejected'
    )
  );

-- ═══════════════════════════════════════════════════════════
-- 2. Rejection reason on phone_screening_participants
-- ═══════════════════════════════════════════════════════════
ALTER TABLE phone_screening_participants
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN phone_screening_participants.rejection_reason IS
  'Reason for not interested: not_looking_to_switch, comp_mismatch, location_mismatch, already_placed, role_not_relevant, other';

-- ═══════════════════════════════════════════════════════════
-- 3. Extended info collection on candidates table
-- ═══════════════════════════════════════════════════════════
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS total_experience_years NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS location_preference TEXT,
  ADD COLUMN IF NOT EXISTS willing_to_relocate BOOLEAN,
  ADD COLUMN IF NOT EXISTS reason_for_switching TEXT,
  ADD COLUMN IF NOT EXISTS job_specific_answers JSONB;

COMMENT ON COLUMN candidates.total_experience_years IS 'Total years of experience collected via WhatsApp screening';
COMMENT ON COLUMN candidates.location_preference IS 'Current city/location collected via WhatsApp';
COMMENT ON COLUMN candidates.willing_to_relocate IS 'Whether candidate is willing to relocate for the role';
COMMENT ON COLUMN candidates.reason_for_switching IS 'Why candidate is looking to switch jobs';
COMMENT ON COLUMN candidates.job_specific_answers IS 'Answers to job-specific must-have questions collected via WhatsApp';

-- ═══════════════════════════════════════════════════════════
-- 4. Per-job campaign config on phone_screening_campaigns
-- ═══════════════════════════════════════════════════════════
ALTER TABLE phone_screening_campaigns
  ADD COLUMN IF NOT EXISTS nudge_hours INT NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS escalate_hours INT NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS max_call_attempts INT NOT NULL DEFAULT 2;

COMMENT ON COLUMN phone_screening_campaigns.nudge_hours IS 'Hours before sending reminder nudge (1-48)';
COMMENT ON COLUMN phone_screening_campaigns.escalate_hours IS 'Hours before escalating to human recruiter (1-48)';
COMMENT ON COLUMN phone_screening_campaigns.max_call_attempts IS 'Max auto-retry attempts for failed calls (2-3)';

-- ═══════════════════════════════════════════════════════════
-- 5. Pre-screening decision tracking on participants
-- ═══════════════════════════════════════════════════════════
ALTER TABLE phone_screening_participants
  ADD COLUMN IF NOT EXISTS prescreen_decision TEXT,
  ADD COLUMN IF NOT EXISTS prescreen_reason TEXT;

COMMENT ON COLUMN phone_screening_participants.prescreen_decision IS
  'Pre-screening result after info collection: proceed, filtered_out';
COMMENT ON COLUMN phone_screening_participants.prescreen_reason IS
  'Why candidate was filtered out before AI call (e.g., comp_mismatch, experience_insufficient)';

-- ═══════════════════════════════════════════════════════════
-- 6. Indexes for new query patterns
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_participants_rejection_reason
  ON phone_screening_participants (rejection_reason)
  WHERE rejection_reason IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_participants_prescreen
  ON phone_screening_participants (prescreen_decision)
  WHERE prescreen_decision IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_config
  ON phone_screening_campaigns (nudge_hours, escalate_hours, max_call_attempts);
