-- SECURITY LOCKDOWN: Prevent users from escalating their own privileges
-- This is a "Zero-Error" implementation that protects the live database.

-- 1. Create a function to validate user updates
CREATE OR REPLACE FUNCTION public.check_user_privileges()
RETURNS TRIGGER AS $$
BEGIN
    -- If the user is NOT an admin, block them from changing sensitive columns
    IF (SELECT role FROM public.users WHERE id = auth.uid()) != 'admin' THEN
        -- Revert changes to sensitive columns
        NEW.role := OLD.role;
        NEW.commission_rate := OLD.commission_rate;
        NEW.is_active := OLD.is_active;
        NEW.subscription_tier := OLD.subscription_tier;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to the users table
DROP TRIGGER IF EXISTS tr_lockdown_user_roles ON public.users;
CREATE TRIGGER tr_lockdown_user_roles
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.check_user_privileges();

-- 3. Product Protection: Ensure owners cannot be changed (stealing content)
CREATE OR REPLACE FUNCTION public.protect_product_ownership()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.writer_id != OLD.writer_id THEN
        RAISE EXCEPTION 'Ownership of a masterpiece cannot be transferred.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_products ON public.products;
CREATE TRIGGER tr_protect_products
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.protect_product_ownership();

-- 4. Enable RLS on ALL tables (just in case)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
-- Add more tables here as they are created
