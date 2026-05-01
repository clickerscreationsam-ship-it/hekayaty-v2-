# Supabase Edge Functions Migration Plan

## Overview
Migrating from Express.js backend to 100% serverless Supabase Edge Functions architecture.

## Current Express Routes Analysis

### Critical Business Logic Routes (Require Edge Functions)

1. **POST `/api/orders`** - Checkout & Order Creation
   - Complex fee calculation (80/20 split)
   - Shipping cost integration
   - Earnings distribution
   - Sales count increment
   - **Priority: CRITICAL**

2. **POST `/api/admin/orders/:id/verify`** - Manual Payment Verification
   - Admin-only route
   - Payment verification
   - Earnings creation
   - Order status update
   - **Priority: HIGH**

3. **POST `/api/shipping/calculate`** - Shipping Cost Calculator
   - Per-creator shipping calculation
   - Address-based rate lookup
   - **Priority: HIGH**

4. **POST `/api/earnings/payout`** - Payout Request
   - Creator balance validation
   - Payout record creation
   - **Priority: MEDIUM**

5. **GET `/api/earnings/overview`** - Financial Dashboard
   - Aggregate earnings calculation
   - Available balance
   - **Priority: MEDIUM**

### Routes That Can Use RLS (No Edge Function Needed)

The following routes can be replaced with direct Supabase calls + Row Level Security:

- **GET `/api/cart`** → Direct Supabase query
- **POST `/api/cart`** → Direct Supabase insert
- **DELETE `/api/cart/:id`** → Direct Supabase delete
- **GET `/api/users/:username`** → Direct Supabase query
- **PATCH `/api/users/profile`** → Direct Supabase update
- **POST `/api/social/follow`** → Direct Supabase insert
- **POST `/api/social/unfollow`** → Direct Supabase delete
- **GET `/api/social/library`** → Direct Supabase query
- **POST `/api/social/library`** → Direct Supabase insert

## Edge Functions to Create

### 1. `checkout` (CRITICAL)
**Path:** `/supabase/functions/checkout/index.ts`
**Purpose:** Handle complete checkout flow with secure payment processing
**Features:**
- Fee calculation (physical 12%, digital 20%)
- Shipping cost integration
- Earnings distribution per creator
- Order creation
- Cart clearing
- Sales count increment

### 2. `verify-payment` (HIGH)
**Path:** `/supabase/functions/verify-payment/index.ts`
**Purpose:** Admin verification of manual payments
**Features:**
- Admin authentication check
- Payment proof validation
- Earnings creation
- Order status update

### 3. `calculate-shipping` (HIGH)
**Path:** `/supabase/functions/calculate-shipping/index.ts`
**Purpose:** Calculate shipping costs based on address
**Features:**
- Creator-specific shipping rates
- Multi-creator cart support
- City/region-based calculation

### 4. `request-payout` (MEDIUM)
**Path:** `/supabase/functions/request-payout/index.ts`
**Purpose:** Handle creator payout requests
**Features:**
- Balance validation
- Minimum payout check
- Payout record creation

### 5. `earnings-overview` (MEDIUM)
**Path:** `/supabase/functions/earnings-overview/index.ts`
**Purpose:** Aggregate financial data for creators
**Features:**
- Total earnings
- Available balance (paid - withdrawn)
- Pending earnings

### 6. `seller-orders` (MEDIUM)
**Path:** `/supabase/functions/seller-orders/index.ts`
**Purpose:** Get orders for creators to fulfill
**Features:**
- Creator-specific order filtering
- Physical product orders
- Fulfillment status

### 7. `update-fulfillment` (MEDIUM)
**Path:** `/supabase/functions/update-fulfillment/index.ts`
**Purpose:** Update order fulfillment status
**Features:**
- Tracking number update
- Status change (shipped, delivered)

## Database Changes Needed

### RLS Policies to Add
```sql
-- Cart Items
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cart" ON cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Orders (Read only for users)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Earnings (Read only for creators)
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can view own earnings" ON earnings
  FOR SELECT USING (auth.uid() = creator_id);

-- Payouts (Read only for creators)
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can view own payouts" ON payouts
  FOR SELECT USING (auth.uid() = user_id);
```

## Frontend Changes Needed

### Update API Calls
Replace Express endpoints with Edge Function URLs:
```typescript
// Before
fetch('/api/orders', { method: 'POST', body: ... })

// After
fetch(`${SUPABASE_URL}/functions/v1/checkout`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: ...
})
```

### Environment Variables
```
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Deployment Steps

1. Create all Edge Functions
2. Deploy RLS policies
3. Test each Edge Function
4. Update frontend API calls
5. Remove Express server dependencies
6. Update deployment config

## Benefits of Migration

1. **No Server Management** - Serverless, auto-scaling
2. **Better Security** - Service role keys only in Edge Functions
3. **Lower Costs** - Pay per request
4. **Global Distribution** - Deno Deploy CDN
5. **Type Safety** - TypeScript across stack
6. **Easier Deployment** - `supabase functions deploy`

## Testing Strategy

1. Unit test each Edge Function locally
2. Integration tests with Supabase Dev
3. Parallel deployment (keep Express until verified)
4. Gradual migration (enable Edge Functions per feature)
5. Monitor error rates
6. Rollback plan ready
