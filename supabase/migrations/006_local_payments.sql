-- Create Local Payment System columns
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'card', -- 'instapay', 'vodafone_cash', 'card', etc.
ADD COLUMN IF NOT EXISTS payment_proof_url text, -- Screenshot URL
ADD COLUMN IF NOT EXISTS payment_reference text, -- Transaction ID
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Allow status to reflect payment workflow
-- Status can be: 'pending_payment', 'pending_verification', 'paid', 'rejected', 'completed'
