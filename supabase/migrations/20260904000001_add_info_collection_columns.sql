-- Migration: Add columns for info collection flow
-- This migration adds columns to support the new info collection flow
-- where candidates provide CTC, expected CTC, and notice period before screening calls.

-- 1. Add info collection columns to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS current_ctc TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS expected_ctc TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS notice_period TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS info_collected_at TIMESTAMPTZ;

-- 2. Add info collection tracking to phone_screening_participants
ALTER TABLE phone_screening_participants ADD COLUMN IF NOT EXISTS info_request_sent_at TIMESTAMPTZ;
ALTER TABLE phone_screening_participants ADD COLUMN IF NOT EXISTS info_received_at TIMESTAMPTZ;

-- 3. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_candidates_info_collected ON candidates(info_collected_at) WHERE info_collected_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_participants_info_status ON phone_screening_participants(status) WHERE status IN ('info_requested', 'info_received');

-- 4. Add comments for documentation
COMMENT ON COLUMN candidates.current_ctc IS 'Current annual CTC collected via WhatsApp (e.g., 8 LPA)';
COMMENT ON COLUMN candidates.expected_ctc IS 'Expected annual CTC collected via WhatsApp (e.g., 12 LPA)';
COMMENT ON COLUMN candidates.notice_period IS 'Notice period collected via WhatsApp (e.g., 30 days)';
COMMENT ON COLUMN candidates.info_collected_at IS 'Timestamp when basic info was collected from candidate';
COMMENT ON COLUMN phone_screening_participants.info_request_sent_at IS 'Timestamp when info request was sent to candidate';
COMMENT ON COLUMN phone_screening_participants.info_received_at IS 'Timestamp when candidate replied with their info';
