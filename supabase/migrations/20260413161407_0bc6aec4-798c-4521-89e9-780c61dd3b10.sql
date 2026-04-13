
-- Add balance and status columns to sms_messages
ALTER TABLE public.sms_messages ADD COLUMN IF NOT EXISTS sms_balance NUMERIC DEFAULT NULL;
ALTER TABLE public.sms_messages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'verified';

-- Add last_balance to balance_tracker
ALTER TABLE public.balance_tracker ADD COLUMN IF NOT EXISTS last_balance NUMERIC NOT NULL DEFAULT 0;
