-- ============================================
-- Physical Product Order & Delivery System
-- Migration: 012
-- ============================================

-- 1. Extend order_items with detailed fulfillment tracking
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS estimated_delivery_days INTEGER,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMP;

-- 2. Create order status history table for audit trail
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create order notifications table
CREATE TABLE IF NOT EXISTS order_notifications (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_items_creator ON order_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_order_items_fulfillment_status ON order_items(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON order_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_status_history_item ON order_status_history(order_item_id);

-- 5. Enable RLS (Row Level Security)
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Makers can view status history for their order items
CREATE POLICY "Makers view their order status history" ON order_status_history
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM order_items
        WHERE order_items.id = order_status_history.order_item_id
        AND order_items.creator_id = auth.uid()::text
    )
);

-- Users can view status history for their orders
CREATE POLICY "Users view their order status history" ON order_status_history
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM order_items
        JOIN orders ON orders.id = order_items.order_id
        WHERE order_items.id = order_status_history.order_item_id
        AND orders.user_id = auth.uid()::text
    )
);

-- Users can only see their own notifications
CREATE POLICY "Users view their notifications" ON order_notifications
FOR SELECT USING (user_id = auth.uid()::text);

-- Users can update their own notification read status
CREATE POLICY "Users update their notifications" ON order_notifications
FOR UPDATE USING (user_id = auth.uid()::text);

-- 7. Helper function: Create notification
CREATE OR REPLACE FUNCTION create_order_notification(
    p_order_id INTEGER,
    p_user_id TEXT,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT
) RETURNS void AS $$
BEGIN
    INSERT INTO order_notifications (order_id, user_id, type, title, message)
    VALUES (p_order_id, p_user_id, p_type, p_title, p_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Helper function: Log status change
CREATE OR REPLACE FUNCTION log_status_change(
    p_order_item_id INTEGER,
    p_status TEXT,
    p_note TEXT,
    p_created_by TEXT
) RETURNS void AS $$
BEGIN
    INSERT INTO order_status_history (order_item_id, status, note, created_by)
    VALUES (p_order_item_id, p_status, p_note, p_created_by);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Verification Queries
-- ============================================

-- Check new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND column_name IN ('estimated_delivery_days', 'accepted_at', 'rejected_at', 'delivered_at', 'preparing_at');

-- Check new tables
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('order_status_history', 'order_notifications');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('order_items', 'order_status_history', 'order_notifications');

COMMENT ON TABLE order_status_history IS 'Audit trail for order item status changes';
COMMENT ON TABLE order_notifications IS 'In-app notifications for order updates';
COMMENT ON COLUMN order_items.estimated_delivery_days IS 'Maker-provided estimated delivery time in days';
COMMENT ON COLUMN order_items.accepted_at IS 'Timestamp when maker accepted the order';
COMMENT ON COLUMN order_items.rejected_at IS 'Timestamp when maker rejected the order';
COMMENT ON COLUMN order_items.rejection_reason IS 'Reason provided by maker for rejection';
