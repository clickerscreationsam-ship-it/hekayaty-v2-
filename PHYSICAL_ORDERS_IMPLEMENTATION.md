# 🚀 Physical Orders System - Implementation Guide

## ✅ What's Been Created

### 1. **Documentation**
- `PHYSICAL_ORDERS_SYSTEM.md` - Complete system specification

### 2. **Database Migration**
- `supabase/migrations/012_physical_orders_system.sql` - Database schema updates

### 3. **Edge Functions** (4/7 completed)
- ✅ `get-maker-orders` - Fetch orders for makers
- ✅ `accept-order` - Maker accepts order
- ✅ `reject-order-item` - Maker rejects order  
- ✅ `update-shipment` - Update to shipped with tracking
- ⏳ `mark-delivered` - Mark as delivered (TODO)
- ⏳ `get-user-orders` - User order tracking (TODO)
- ⏳ `get-order-notifications` - Fetch notifications (TODO)

---

## 📋 Quick Start - Deploy What We Have

### Step 1: Run Database Migration

```bash
# In Supabase Dashboard SQL Editor, run:
# File: supabase/migrations/012_physical_orders_system.sql

# Or via CLI:
npx supabase db push
```

**Verify:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND column_name IN ('estimated_delivery_days', 'accepted_at');
-- Should show both columns
```

### Step 2: Deploy Edge Functions

```bash
# Navigate to project root
cd "e:\hekayaty new version + hekayaty store included\version 7\Data-Sculptor"

# Deploy all 4 functions
npx supabase functions deploy get-maker-orders
npx supabase functions deploy accept-order
npx supabase functions deploy reject-order-item
npx supabase functions deploy update-shipment
```

### Step 3: Test Edge Functions

**Test get-maker-orders:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/get-maker-orders \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "x-user-id: YOUR_MAKER_ID" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Test accept-order:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/accept-order \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "x-user-id: YOUR_MAKER_ID" \
  -H "Content-Type: application/json" \
  -d '{"orderItemId": 1, "estimatedDeliveryDays": 5}'
```

---

## 🎨 Frontend Integration (Next Steps)

### Create React Hooks

Create `client/src/hooks/use-physical-orders.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Fetch maker's orders
export function useMakerOrders(status?: string) {
  return useQuery({
    queryKey: ['maker-orders', status],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-maker-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always'
  });
}

// Accept order mutation
export function useAcceptOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderItemId, estimatedDeliveryDays }: { orderItemId: number, estimatedDeliveryDays: number }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify({ orderItemId, estimatedDeliveryDays })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept order');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maker-orders'] });
    }
  });
}

// Similar patterns for useRejectOrder, useUpdateShipment, etc.
```

### Create Maker Dashboard Component

Create `client/src/pages/creator/MakerOrders.tsx`:

```tsx
import { useState } from "react";
import { useMakerOrders, useAcceptOrder } from "@/hooks/use-physical-orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function MakerOrders() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data, isLoading } = useMakerOrders(statusFilter);
  const acceptOrder = useAcceptOrder();

  const [acceptModal, setAcceptModal] = useState<{ open: boolean, orderItemId?: number }>({ open: false });
  const [deliveryDays, setDeliveryDays] = useState(5);

  const handleAccept = async () => {
    if (acceptModal.orderItemId) {
      await acceptOrder.mutateAsync({
        orderItemId: acceptModal.orderItemId,
        estimatedDeliveryDays: deliveryDays
      });
      setAcceptModal({ open: false });
    }
  };

  if (isLoading) return <div>Loading orders...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Physical Product Orders</h1>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6">
        {['All', 'pending', 'accepted', 'preparing', 'shipped', 'delivered'].map(status => (
          <Button
            key={status}
            variant={statusFilter === (status === 'All' ? undefined : status) ? 'default' : 'outline'}
            onClick={() => setStatusFilter(status === 'All' ? undefined : status)}
          >
            {status === 'All' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Orders List */}
      <div className="grid gap-4">
        {data?.orders?.map((order: any) => (
          <div key={order.orderItemId} className="border rounded-lg p-4 bg-white shadow">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <img src={order.productCoverUrl} alt={order.productTitle} className="w-20 h-20 object-cover rounded" />
                <div>
                  <h3 className="font-semibold">{order.productTitle}</h3>
                  <p className="text-sm text-gray-600">Buyer: {order.buyerName}</p>
                  <p className="text-sm text-gray-600">Price: ${(order.price / 100).toFixed(2)}</p>
                  <Badge className="mt-2">{order.fulfillmentStatus}</Badge>
                </div>
              </div>

              <div className="text-right">
                {order.shippingAddress && (
                  <div className="text-sm text-gray-600 mb-2">
                    <p><strong>Ship to:</strong></p>
                    <p>{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.city}</p>
                    <p>{order.shippingAddress.phoneNumber}</p>
                  </div>
                )}

                {order.fulfillmentStatus === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => setAcceptModal({ open: true, orderItemId: order.orderItemId })}
                    >
                      Accept
                    </Button>
                    <Button size="sm" variant="destructive">Reject</Button>
                  </div>
                )}

                {order.fulfillmentStatus === 'accepted' && (
                  <Button size="sm">Mark Preparing</Button>
                )}

                {order.fulfillmentStatus === 'preparing' && (
                  <Button size="sm">Add Tracking</Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Accept Order Modal */}
      <Dialog open={acceptModal.open} onOpenChange={(open) => setAcceptModal({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Estimated Delivery (days)</label>
              <Input 
                type="number" 
                min="1" 
                max="90" 
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(parseInt(e.target.value))}
              />
            </div>
            <Button onClick={handleAccept} className="w-full">
              Confirm Acceptance
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## ⏭️ What's Left to Build

### 1. Remaining Edge Functions (30 min)
- `mark-delivered`
- `get-user-orders`
- `get-order-notifications`

### 2. User Order Tracking Page (45 min)
- Timeline visual component
- Order status badges
- Tracking link integration

### 3. Admin Physical Orders Panel (30 min)
- Add tab to Admin Dashboard
- Table with all physical orders
- Override actions

### 4. Notifications System (1 hour)
- Notification bell component
- Real-time subscriptions
- Mark as read functionality

---

## 🧪 Testing Checklist

- [ ] Database migration runs without errors
- [ ] All 4 Edge Functions deploy successfully
- [ ] Maker can fetch their orders
- [ ] Maker can accept order with delivery estimate
- [ ] Maker can reject order with reason
- [ ] Maker can update shipment with tracking
- [ ] Notifications are created in database
- [ ] Status history is logged
- [ ] RLS policies work correctly

---

## 📊 Current Status

**✅ Completed:**
- Database schema design
- Migration file
- 4 core Edge Functions
- Documentation

**⏳ In Progress:**
- Frontend hooks & components

**📝 TODO:**
- 3 remaining Edge Functions
- Full UI implementation
- Testing & deployment

---

**Estimated time to completion: 4-6 hours**  
**Status**: 50% Complete - Backend foundation ready!
