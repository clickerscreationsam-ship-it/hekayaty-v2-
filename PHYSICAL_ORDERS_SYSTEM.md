# 📦 Physical Product Order & Delivery System - Hekayaty

## System Overview

Complete order fulfillment system allowing:
- **Makers**: Receive physical product orders, manage inventory, process shipments
- **Users**: Track order status in real-time with detailed stages
- **Admins**: Monitor all orders, intervene when needed, resolve disputes

---

## 🗄️ Database Schema

### Enhanced Order Tracking

```sql
-- Extend order_items with detailed fulfillment tracking
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS estimated_delivery_days INTEGER;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMP;

-- New table: order_status_history for audit trail
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- pending, accepted, preparing, shipped, delivered, rejected, cancelled
    note TEXT,
    created_by TEXT, -- User ID who made the change
    created_at TIMESTAMP DEFAULT NOW()
);

-- New table: order_notifications
CREATE TABLE IF NOT EXISTS order_notifications (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Recipient
    type TEXT NOT NULL, -- order_placed, order_accepted, order_shipped, order_delivered, order_rejected
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_items_creator ON order_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_order_items_fulfillment_status ON order_items(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON order_notifications(user_id, is_read);
```

### Fulfillment Status States

```typescript
type FulfillmentStatus = 
  | 'pending'      // Order placed, waiting for maker acceptance
  | 'accepted'     // Maker accepted, preparing to ship
  | 'preparing'    // Maker is preparing/packaging the order
  | 'shipped'      // Order shipped with tracking number
  | 'delivered'    // Order delivered to customer
  | 'rejected'     // Maker rejected the order
  | 'cancelled';   // Customer or admin cancelled
```

---

## 🔌 API Endpoints (Supabase Edge Functions)

### 1. **get-maker-orders** (Maker Dashboard)
**Purpose:** Fetch all orders for a specific maker's products

```typescript
// GET/POST /functions/v1/get-maker-orders
Request: { makerId: string, status?: FulfillmentStatus }
Response: {
  orders: [{
    orderItemId: number,
    orderId: number,
    productId: number,
    productTitle: string,
    productCoverUrl: string,
    price: number,
    fulfillmentStatus: string,
    trackingNumber: string | null,
    shippingAddress: {
      fullName: string,
      phoneNumber: string,
      city: string,
      addressLine: string
    },
    buyerName: string,
    buyerId: string,
    orderDate: string,
    acceptedAt: string | null,
    shippedAt: string | null,
    estimatedDeliveryDays: number | null
  }]
}
```

### 2. **accept-order** (Maker Action)
**Purpose:** Maker accepts an order and sets estimated delivery time

```typescript
// POST /functions/v1/accept-order
Request: {
  orderItemId: number,
  makerId: string,
  estimatedDeliveryDays: number // 3-30 days
}
Response: { success: true, message: "Order accepted" }
```

### 3. **reject-order-item** (Maker Action)
**Purpose:** Maker rejects an order with reason

```typescript
// POST /functions/v1/reject-order-item
Request: {
  orderItemId: number,
  makerId: string,
  reason: string // "Out of stock", "Cannot ship to location", etc.
}
Response: { success: true, message: "Order rejected" }
```

### 4. **update-shipment** (Maker Action)
**Purpose:** Update order to "shipped" with tracking number

```typescript
// POST /functions/v1/update-shipment
Request: {
  orderItemId: number,
  makerId: string,
  trackingNumber: string,
  carrier?: string // Optional: "DHL", "Aramex", etc.
}
Response: { success: true, message: "Shipment updated" }
```

### 5. **mark-delivered** (Maker/Admin Action)
**Purpose:** Mark order as delivered

```typescript
// POST /functions/v1/mark-delivered
Request: {
  orderItemId: number,
  userId: string // Maker or Admin
}
Response: { success: true, message: "Order marked as delivered" }
```

### 6. **get-user-orders** (User Tracking)
**Purpose:** User views their order history with tracking

```typescript
// GET/POST /functions/v1/get-user-orders
Request: { userId: string }
Response: {
  orders: [{
    orderId: number,
    orderDate: string,
    totalAmount: number,
    items: [{
      orderItemId: number,
      productTitle: string,
      productCoverUrl: string,
      price: number,
      fulfillmentStatus: string,
      trackingNumber: string | null,
      estimatedDeliveryDate: string | null,
      makerName: string,
      shippedAt: string | null,
      deliveredAt: string | null,
      statusHistory: [{
        status: string,
        note: string,
        timestamp: string
      }]
    }],
    shippingAddress: {...}
  }]
}
```

### 7. **get-order-notifications** (User Notifications)
**Purpose:** Fetch unread notifications for a user

```typescript
// GET/POST /functions/v1/get-order-notifications
Request: { userId: string, onlyUnread?: boolean }
Response: {
  notifications: [{
    id: number,
    type: string,
    title: string,
    message: string,
    isRead: boolean,
    createdAt: string
  }]
}
```

---

## 🎨 UI Components

### 1. Maker Dashboard - Orders Tab

#### Features:
- **Order Tabs**: All, Pending, Accepted, Preparing, Shipped, Delivered
- **Order Cards** showing:
  - Product thumbnail
  - Buyer name & shipping address
  - Order date
  - Price
  - Current status
  - Actions (Accept/Reject, Mark Shipped, Mark Delivered)

#### Actions:
- **Accept Order**: Modal to set estimated delivery (3-30 days)
- **Reject Order**: Modal with reason dropdown
- **Mark Preparing**: Button to change status
- **Ship Order**: Modal to input tracking number
- **Mark Delivered**: Confirmation button

### 2. User Order Tracking Page

#### Features:
- **Order List**: All orders with status badges
- **Order Details**: Expandable cards showing:
  - Product images & titles
  - Shipping address
  - Status timeline (visual progress bar)
  - Tracking number (clickable link if available)
  - Estimated delivery date
  - Maker contact info  - **Status Timeline** (Visual):
  ```
  ● Pending → ● Accepted → ● Preparing → ● Shipped → ● Delivered
  ```

### 3. Admin Control Panel

#### Features:
- **All Physical Orders** table with filters
- **Dispute Resolution**: Override status, refund
- **Maker Performance**: View fulfillment times, rejection rates
- **Bulk Actions**: Export data, send reminders

---

## 🔔 Notification System

### Trigger Points:
1. **Order Placed** → Notify maker
2. **Order Accepted** → Notify user
3. **Order Shipped** → Notify user (with tracking)
4. **Order Delivered** → Notify user & maker
5. **Order Rejected** → Notify user (with reason)

### Implementation:
- Real-time via Supabase Realtime subscriptions
- In-app notifications (stored in `order_notifications`)
- Optional: Email notifications (future)

---

## 🔒 Security & Validation

### Rules:
1. **Payment Verification**: Only accept orders with `is_verified = true`
2. **Address Privacy**: Only show full address to maker & admin
3. **Maker Authorization**: Verify `creatorId` matches logged-in user
4. **Status Flow Validation**: Enforce proper state transitions
5. **Tracking Number**: Required when marking as "shipped"

### RLS Policies:
```sql
-- Makers can only see orders for their products
CREATE POLICY "Makers view their orders" ON order_items
FOR SELECT USING (creator_id = auth.uid());

-- Users can see their own orders
CREATE POLICY "Users view their orders" ON orders
FOR SELECT USING (user_id = auth.uid());

-- Only maker can update their order items
CREATE POLICY "Makers update fulfillment" ON order_items
FOR UPDATE USING (creator_id = auth.uid());
```

---

## 📋 Implementation Checklist

### Phase 1: Database & API
- [ ] Run migration to add new columns & tables
- [ ] Create 7 Edge Functions listed above
- [ ] Deploy Edge Functions to Supabase
- [ ] Test each endpoint with Postman/curl
- [ ] Implement RLS policies

### Phase 2: Maker Dashboard
- [ ] Create `MakerOrders.tsx` component
- [ ] Create `OrderCard.tsx` with action buttons
- [ ] Create modals: `AcceptOrderModal`, `RejectOrderModal`, `ShipOrderModal`
- [ ] Integrate with `get-maker-orders` API
- [ ] Add React Query hooks: `useMakerOrders`, `useAcceptOrder`, etc.
- [ ] Test full flow: Accept → Prepare → Ship → Deliver

### Phase 3: User Tracking
- [ ] Create `OrderTracking.tsx` page
- [ ] Create `OrderTimeline.tsx` component (visual progress)
- [ ] Integrate with `get-user-orders` API
- [ ] Add React Query hook: `useUserOrders`
- [ ] Display shipping address & tracking number
- [ ] Test user viewing order status updates

### Phase 4: Admin Panel
- [ ] Add "Physical Orders" tab to Admin Dashboard
- [ ] Create `PhysicalOrdersTable.tsx` with filters
- [ ] Add admin override actions (mark delivered, refund)
- [ ] Integrate with existing admin hooks
- [ ] Test admin viewing all orders

### Phase 5: Notifications
- [ ] Create `get-order-notifications` Edge Function
- [ ] Create `NotificationBell.tsx` component in Navbar
- [ ] Add Supabase Realtime subscription for new notifications
- [ ] Create `NotificationsDrawer.tsx` for viewing all
- [ ] Test notification flow end-to-end

---

## 🚀 Quick Start Commands

```bash
# 1. Run database migration
psql -h <your-db-host> -U postgres -d postgres -f supabase/migrations/012_physical_orders_system.sql

# 2. Deploy Edge Functions
npx supabase functions deploy get-maker-orders
npx supabase functions deploy accept-order
npx supabase functions deploy reject-order-item
npx supabase functions deploy update-shipment
npx supabase functions deploy mark-delivered
npx supabase functions deploy get-user-orders
npx supabase functions deploy get-order-notifications

# 3. Start dev server and test
npm run dev
```

---

## 🎯 Success Criteria

✅ Maker can view pending orders with full addresses  
✅ Maker can accept/reject orders with reasons  
✅ Maker can update shipment status with tracking  
✅ User can track order in real-time with visual timeline  
✅ Admin can view all physical orders and intervene  
✅ Notifications sent at every status change  
✅ Payment verified before shipping  
✅ Secure address handling

---

**Status**: 📝 Specification Complete  
**Next Step**: Create migration file & Edge Functions  
**Estimated Time**: 6-8 hours total implementation
