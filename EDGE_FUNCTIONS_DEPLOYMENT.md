# Supabase Edge Functions Deployment Guide

## Prerequisites
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link to your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

## Deploy All Functions

### Deploy Individual Functions
```bash
# Deploy checkout function
supabase functions deploy checkout

# Deploy verify-payment function
supabase functions deploy verify-payment

# Deploy calculate-shipping function
supabase functions deploy calculate-shipping

# Deploy request-payout function
supabase functions deploy request-payout

# Deploy earnings-overview function
supabase functions deploy earnings-overview

# Deploy seller-orders function
supabase functions deploy seller-orders

# Deploy update-fulfillment function
supabase functions deploy update-fulfillment
```

### Deploy All at Once
```bash
supabase functions deploy --all
```

## Set Secrets (Environment Variables)

Your Edge Functions need these environment variables. Set them using:

```bash
supabase secrets set SUPABASE_URL=https://yourproject.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
supabase secrets set SUPABASE_ANON_KEY=your_anon_key_here
```

## Apply Database Migrations

```bash
supabase db push
```

Or manually in Supabase Dashboard SQL Editor:
- Run `011_enable_rls_policies.sql`

## Testing Edge Functions Locally

### Start Local Development Server
```bash
supabase start
supabase functions serve
```

### Test Individual Function
```bash
# Test checkout
curl -i --location --request POST 'http://localhost:54321/functions/v1/checkout' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"items": [...], "totalAmount": 5000, "paymentMethod": "card"}'
```

## Frontend Integration

### Update Environment Variables
```env
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Example API Call
```typescript
const { data: { session } } = await supabase.auth.getSession()

const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/checkout`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: cartItems,
      totalAmount: total,
      paymentMethod: 'instapay',
    }),
  }
)

const result = await response.json()
```

## Monitoring

View function logs:
```bash
supabase functions logs checkout
supabase functions logs verify-payment
```

## Rollback Plan

If issues occur:
1. Keep Express server running in parallel
2. Use feature flags to toggle between Express and Edge Functions
3. Monitor error rates
4. Gradually migrate routes one at a time

## Cost Estimation

Supabase Edge Functions pricing:
- 500K requests/month: Free
- Additional: $2 per 1M requests
- Execution time: Included

Much cheaper than running a full Express server!

## Security Checklist

✅ RLS policies enabled on all tables
✅ Service Role Key only in Edge Functions (server-side)
✅ Anon Key used for frontend
✅ User authentication verified in each function
✅ Input validation with Zod (recommended)
✅ CORS configured properly

## Next Steps

1. Deploy all Edge Functions
2. Apply RLS policies (migration 011)
3. Update frontend hooks to call Edge Functions
4. Test thoroughly in development
5. Deploy to production
6. Remove Express server dependencies
