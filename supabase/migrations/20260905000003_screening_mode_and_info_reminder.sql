-- Add screening_mode to distinguish info_first vs extended_screening
-- info_first: collect info, schedule call for everyone who replies
-- extended_screening: collect info, pre-screen, only call if 'proceed'
ALTER TABLE phone_screening_participants
ADD COLUMN IF NOT EXISTS screening_mode text;

COMMENT ON COLUMN phone_screening_participants.screening_mode IS 'How the candidate was screened: info_first, extended_screening, or null (legacy)';

-- Add info_reminder_sent tracking to screening_context (JSONB, no schema change needed)
-- The info_reminder_sent flag is stored inside the existing screening_context JSONB column
