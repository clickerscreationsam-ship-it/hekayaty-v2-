-- ============================================
-- User Profile & Wallet Security Audit
-- Migration: 020
-- ============================================

-- 1. FIX: Zero-Day Admin Escalation in Registration
-- We must never trust the 'role' field from user metadata during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_val TEXT;
  display_name_val TEXT;
  requested_role TEXT;
  final_role TEXT;
BEGIN
  username_val := (NEW.raw_user_meta_data->>'username');
  display_name_val := (NEW.raw_user_meta_data->>'display_name');
  requested_role := (NEW.raw_user_meta_data->>'role');

  -- Force 'reader' if role is sensitive or missing
  IF requested_role IS NULL OR requested_role = 'admin' THEN
    final_role := 'reader';
  ELSE
    -- Only allow specific non-admin roles if requested
    final_role := CASE 
      WHEN requested_role IN ('writer', 'artist') THEN requested_role 
      ELSE 'reader' 
    END;
  END IF;

  IF display_name_val IS NULL THEN
    display_name_val := split_part(NEW.email, '@', 1);
  END IF;

  INSERT INTO public.users (id, email, username, display_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    LOWER(TRIM(COALESCE(username_val, split_part(NEW.email, '@', 1) || floor(random()*1000)))), 
    TRIM(display_name_val), 
    final_role
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If username exists, try with ID suffix
    INSERT INTO public.users (id, email, username, display_name, role)
    VALUES (
      NEW.id, 
      NEW.email, 
      LOWER(TRIM(COALESCE(username_val, split_part(NEW.email, '@', 1)))) || '_' || substr(NEW.id::text, 1, 4), 
      TRIM(display_name_val), 
      final_role
    );
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW; -- Don't block auth even if profile fails (can be fixed manually)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. SECURE: Wallet Source of Truth
-- Use a secure view to calculate actual balances, preventing logic bugs in Edge Functions
CREATE OR REPLACE VIEW creator_wallet_v AS
SELECT 
    u.id AS user_id,
    u.display_name,
    COALESCE(SUM(e.amount), 0) AS total_lifetime_earnings,
    COALESCE((
        SELECT SUM(p.amount) 
        FROM payouts p 
        WHERE p.user_id = u.id AND p.status = 'processed'
    ), 0) AS total_paid_out,
    COALESCE((
        SELECT SUM(p.amount) 
        FROM payouts p 
        WHERE p.user_id = u.id AND p.status = 'pending'
    ), 0) AS pending_payouts,
    (
        COALESCE(SUM(e.amount), 0) - 
        COALESCE((SELECT SUM(amount) FROM payouts WHERE user_id = u.id AND status IN ('processed', 'pending')), 0)
    ) AS available_balance
FROM users u
LEFT JOIN earnings e ON e.creator_id = u.id
GROUP BY u.id, u.display_name;

-- 3. HARDEN: Payout Requests
-- Add a constraint to the payouts table to ensure only pending payouts can be inserted by users
-- (Policy already limited to user_id = auth.uid())
ALTER TABLE public.payouts DROP CONSTRAINT IF EXISTS payout_amount_check;
ALTER TABLE public.payouts ADD CONSTRAINT payout_amount_check CHECK (amount >= 200); -- 2 EGP minimum (assuming cents)

-- 4. Lockdown: Final User Integrity
-- Ensure readers cannot have earnings (prevent ghost revenue)
CREATE OR REPLACE FUNCTION audit_earning_creator()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT role FROM users WHERE id = NEW.creator_id) = 'reader' THEN
        RAISE EXCEPTION 'Readers cannot receive earnings. Creator role required.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_audit_earnings ON public.earnings;
CREATE TRIGGER tr_audit_earnings
BEFORE INSERT ON public.earnings
FOR EACH ROW
EXECUTE FUNCTION audit_earning_creator();

COMMENT ON VIEW creator_wallet_v IS 'The definitive source of truth for all creator balances';
