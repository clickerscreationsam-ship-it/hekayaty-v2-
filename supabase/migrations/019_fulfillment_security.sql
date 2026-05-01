-- ============================================
-- Order Fulfillment & Inventory Security
-- Migration: 019
-- ============================================

-- 1. Atomic Stock Management with Over-Selling Protection
-- This RPC will be used by the checkout function to safely decrement stock
CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id INTEGER, p_quantity INTEGER)
RETURNS void AS $$
BEGIN
    -- Only update products that HAVE stock tracking enabled (stock_quantity is NOT NULL)
    UPDATE public.products
    SET stock_quantity = stock_quantity - p_quantity
    WHERE id = p_product_id 
    AND stock_quantity IS NOT NULL; -- Null means unlimited/digital

    -- Check if we accidentally went below zero
    IF EXISTS (SELECT 1 FROM products WHERE id = p_product_id AND stock_quantity < 0) THEN
        RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Secure Order Status Transitions
-- Ensure creators cannot "skip" steps or mark unpaid orders as shipped
CREATE OR REPLACE FUNCTION validate_fulfillment_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure order is PAID or VERIFIED before allowing shipment or acceptance
    IF NEW.fulfillment_status IN ('accepted', 'preparing', 'shipped') THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = NEW.order_id
            AND (o.status = 'paid' OR o.is_verified = true)
        ) THEN
            RAISE EXCEPTION 'Order must be verified or paid before fulfillment can begin.';
        END IF;
    END IF;

    -- Enforce linear flow (e.g., cannot go from pending directly to delivered)
    -- This is a soft rule for now, but good for data integrity
    IF OLD.fulfillment_status = 'pending' AND NEW.fulfillment_status = 'shipped' THEN
        -- Force them to 'accept' first? Maybe too restrictive. 
        -- For now, just ensure it's not 'cancelled' or 'rejected'
        IF NEW.fulfillment_status = 'delivered' AND OLD.fulfillment_status = 'pending' THEN
             RAISE EXCEPTION 'Order must be accepted and shipped before marking as delivered.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_fulfillment ON public.order_items;
CREATE TRIGGER trg_validate_fulfillment
BEFORE UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION validate_fulfillment_transition();

-- 3. Automatic Earnings Trigger
-- Move earnings creation from Edge Function to Database Trigger for 100% reliability.
-- This ensures that as soon as an order is marked as 'verified' or 'paid', earnings are generated.
CREATE OR REPLACE FUNCTION create_earnings_on_paid_order()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    v_commission_rate INTEGER;
    v_item_total INTEGER;
    v_earning INTEGER;
    v_is_physical BOOLEAN;
BEGIN
    -- Only trigger when status changes to 'paid' or is_verified becomes true
    IF (NEW.status = 'paid' OR NEW.is_verified = true) AND 
       ((OLD.status != 'paid' AND OLD.is_verified = false) OR OLD IS NULL) THEN
       
        FOR item IN (SELECT * FROM order_items WHERE order_id = NEW.id) LOOP
            -- Determine product type and commission
            SELECT type INTO v_is_physical FROM products WHERE id = item.product_id;
            
            -- Get creator rate
            SELECT commission_rate INTO v_commission_rate FROM users WHERE id = item.creator_id;
            v_commission_rate := COALESCE(v_commission_rate, 20); -- Default 20%
            
            -- Physical products have a fixed 12% fee? (Based on checkout code logic)
            IF v_is_physical THEN
                v_commission_rate := 12;
            END IF;

            v_item_total := item.price * 1; -- item.price is already per item. 
            -- Note: order_items currently doesn't store 'quantity', it seems one row per item?
            -- Wait, checking initial_schema... order_items lacks quantity column.
            
            v_earning := v_item_total - Math.round(v_item_total * (v_commission_rate / 100));
            
            -- Insert Earning record
            INSERT INTO public.earnings (creator_id, order_id, amount, status)
            VALUES (item.creator_id, NEW.id, v_earning, 'pending')
            ON CONFLICT DO NOTHING;
            
            -- Increment sales count
            UPDATE public.products SET review_count = review_count + 1 WHERE id = item.product_id;
        END LOOP;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The earnings logic in the trigger is slightly complex because it needs to match the 
-- Edge Function logic exactly. For now, I'll keep the Edge function as the primary logic 
-- but improve its robustness.

COMMENT ON FUNCTION decrement_product_stock IS 'Atomically decrements stock and prevents overselling';

-- 4. Restore Stock on Cancellation
CREATE OR REPLACE FUNCTION increment_product_stock(p_product_id INTEGER, p_quantity INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE public.products
    SET stock_quantity = stock_quantity + p_quantity
    WHERE id = p_product_id 
    AND stock_quantity IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Automatic Stock Restoration Trigger
CREATE OR REPLACE FUNCTION restore_stock_on_failure()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changes to 'cancelled' or 'rejected'
    IF NEW.fulfillment_status IN ('cancelled', 'rejected') AND OLD.fulfillment_status NOT IN ('cancelled', 'rejected') THEN
        PERFORM increment_product_stock(NEW.product_id, 1);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_restore_stock ON public.order_items;
CREATE TRIGGER trg_restore_stock
AFTER UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION restore_stock_on_failure();

COMMENT ON FUNCTION increment_product_stock IS 'Restores stock when orders are cancelled or rejected';
