# 🔍 Deep Codebase Analysis - Hekayaty Store (Data-Sculptor)

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Authentication Flow](#authentication-flow)
6. [Data Flow](#data-flow)
7. [Key Features](#key-features)
8. [File Structure](#file-structure)
9. [API Endpoints](#api-endpoints)
10. [Frontend Components](#frontend-components)
11. [State Management](#state-management)
12. [Payment & Economic System](#payment--economic-system)
13. [Deployment & Configuration](#deployment--configuration)

---

## 📖 Project Overview

**Hekayaty Store** (codename: Data-Sculptor) is a **multi-creator digital marketplace** platform that enables:
- **Writers** to sell eBooks and stories
- **Artists** to sell digital assets (covers, illustrations, textures)
- **Readers** to discover, purchase, and read content

### Core Business Model
- **80/20 Revenue Split**: Creators earn 80%, platform takes 20% commission
- **Customizable Creator Stores**: Each creator gets their own branded storefront
- **Multiple Product Types**: eBooks, digital assets, bundles, physical products
- **Social Features**: Follow creators, like products, save to library, reviews
- **Multi-language Support**: English and Arabic (RTL support)

---

## 🏗️ Architecture

### Hybrid Architecture
The platform uses a **unique hybrid architecture** combining:

1. **Express.js Backend** (server/)
   - Handles API routes and business logic
   - Uses in-memory storage (MemStorage) for local dev
   - Bridges frontend with Supabase for production data

2. **Supabase Backend** (PostgreSQL + Auth)
   - Primary database for production
   - Authentication provider (JWT-based)
   - Row Level Security (RLS) for data protection
   - Storage buckets for file uploads

3. **React Frontend** (client/)
   - Single Page Application (SPA) using Wouter for routing
   - TanStack Query for data fetching & caching
   - Supabase client for direct database access
   - Custom hooks for all business logic

### Why Hybrid?
```
Frontend ←→ Supabase Auth (Authentication)
    ↓
Frontend ←→ Express API ←→ Supabase DB (Data Operations)
    ↓
Frontend ←→ Supabase DB (Direct reads for some features)
```

**Benefits:**
- Express provides business logic layer (fees, validation)
- Supabase handles auth & data persistence
- Direct Supabase queries for real-time features
- In-memory storage for rapid local development

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Drizzle ORM (schema definition)
- **Authentication**: Passport.js + Supabase Auth
- **Session Store**: MemoryStore (dev) / PostgreSQL (production)
- **File Storage**: Cloudinary (images) + Supabase Storage

### Frontend
- **UI Framework**: React 18.x with TypeScript
- **Routing**: Wouter (lightweight React Router alternative)
- **State Management**: TanStack Query (React Query)
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS 4.x
- **Forms**: React Hook Form + Zod validation
- **Internationalization**: i18next + react-i18next
- **Icons**: Lucide React + React Icons
- **Animations**: Framer Motion
- **Toast Notifications**: Custom toast system using Radix Toast

### Build & Dev Tools
- **Bundler**: Vite 7.x
- **Type Checking**: TypeScript 5.6
- **CSS Processing**: PostCSS + Autoprefixer + Tailwind
- **Code Quality**: ESBuild for bundling

### External Services
- **Supabase**: Authentication, Database, Storage
- **Cloudinary**: Image optimization & CDN
- **Stripe** (planned): Payment processing

---

## 🗄️ Database Schema

### Core Tables

#### 1. **users** (Identity & Profiles)
```sql
- id: UUID (primary key) - From Supabase Auth
- email: TEXT (unique)
- username: TEXT (unique)
- display_name: TEXT
- role: TEXT ('reader' | 'writer' | 'artist' | 'admin')
- bio: TEXT (nullable)
- avatar_url: TEXT (nullable)
- banner_url: TEXT (nullable)
- store_settings: JSONB {
    themeColor, accentColor, welcomeMessage, 
    font, socialLinks, headerLayout
  }
- stripe_account_id: TEXT (nullable)
- subscription_tier: TEXT (default: 'free')
- commission_rate: INTEGER (default: 20)
- created_at, updated_at: TIMESTAMP
```

#### 2. **products** (Digital Goods)
```sql
- id: SERIAL (primary key)
- writer_id: UUID (FK → users.id)
- title, description: TEXT
- cover_url: TEXT (required)
- file_url: TEXT (nullable) - Actual product file
- content: TEXT (nullable) - Extracted text for reading
- type: TEXT ('ebook' | 'asset' | 'bundle' | 'physical')
- genre: TEXT
- is_published: BOOLEAN (default: false)
- rating: INTEGER (0-5 stars, default: 0)
- review_count: INTEGER (default: 0)
- price: INTEGER (in cents)
- sale_price: INTEGER (nullable)
- sale_ends_at: TIMESTAMP (nullable)
- license_type: TEXT ('personal' | 'commercial' | 'standard' | 'extended')
- created_at, updated_at: TIMESTAMP
```

#### 3. **product_variants** (Licensing Options)
```sql
- id: SERIAL
- product_id: INTEGER (FK → products.id)
- name: TEXT (e.g., "Standard License", "Extended License")
- type: TEXT ('digital' | 'physical')
- price: INTEGER
- license_type: TEXT
- file_url: TEXT (nullable)
```

#### 4. **cart_items** (Shopping Cart)
```sql
- id: SERIAL
- user_id: UUID (FK → users.id)
- product_id: INTEGER (FK → products.id)
- variant_id: INTEGER (FK → product_variants.id, nullable)
- quantity: INTEGER (default: 1)
- added_at: TIMESTAMP
```

#### 5. **orders** (Purchase Records)
```sql
- id: SERIAL
- user_id: UUID (FK → users.id)
- total_amount: INTEGER (in cents)
- platform_fee: INTEGER (20% of total)
- creator_earnings: INTEGER (80% of total)
- status: TEXT ('pending' | 'paid' | 'failed' | 'refunded' | 
                'pending_verification' | 'rejected' | 'completed')
- payment_intent_id: TEXT
- payment_method: TEXT ('card' | 'instapay' | 'vodafone_cash' | 
                        'orange_cash' | 'bank_transfer')
- payment_proof_url: TEXT (for manual payment verification)
- payment_reference: TEXT
- is_verified: BOOLEAN (admin approval for manual payments)
- created_at: TIMESTAMP
```

#### 6. **order_items** (Order Line Items)
```sql
- id: SERIAL
- order_id: INTEGER (FK → orders.id)
- product_id: INTEGER (FK → products.id)
- variant_id: INTEGER (FK → product_variants.id, nullable)
- price: INTEGER (price at time of purchase)
- license_type: TEXT
- creator_id: UUID (FK → users.id) - For earnings tracking
```

#### 7. **earnings** (Creator Payouts)
```sql
- id: SERIAL
- creator_id: UUID (FK → users.id)
- order_id: INTEGER (FK → orders.id)
- amount: INTEGER (80% of order item price)
- status: TEXT ('pending' | 'available' | 'paid_out')
- created_at: TIMESTAMP
```

#### 8. **payouts** (Withdrawal Requests)
```sql
- id: BIGINT
- user_id: UUID (FK → users.id)
- amount: INTEGER (in cents)
- status: TEXT ('pending' | 'processed' | 'rejected')
- method: TEXT ('stripe' | 'bank_transfer')
- requested_at: TIMESTAMP
- processed_at: TIMESTAMP (nullable)
```

### Social Tables

#### 9. **follows** (Creator Following)
```sql
- id: SERIAL
- follower_id: UUID (FK → users.id)
- creator_id: UUID (FK → users.id)
- created_at: TIMESTAMP
```

#### 10. **likes** (Product Likes)
```sql
- id: SERIAL
- user_id: UUID (FK → users.id)
- product_id: INTEGER (FK → products.id)
- created_at: TIMESTAMP
```

#### 11. **saved_library** (User's Saved Products)
```sql
- id: SERIAL
- user_id: UUID (FK → users.id)
- product_id: INTEGER (FK → products.id)
- saved_at: TIMESTAMP
```

#### 12. **reviews** (Product Reviews)
```sql
- id: SERIAL
- product_id: INTEGER (FK → products.id)
- user_id: UUID (FK → users.id)
- rating: INTEGER (1-5)
- comment: TEXT (nullable)
- created_at: TIMESTAMP
```

#### 13. **coupons** (Discount Codes)
```sql
- id: SERIAL
- writer_id: UUID (FK → users.id)
- code: TEXT (unique discount code)
- discount_type: TEXT ('percentage' | 'fixed')
- discount_value: INTEGER
- usage_limit: INTEGER (nullable)
- usage_count: INTEGER (default: 0)
- expires_at: TIMESTAMP (nullable)
- created_at: TIMESTAMP
```

### 🔒 Row Level Security (RLS) Policies

All tables have RLS enabled with policies:

**Users:**
- ✅ Anyone can view public profiles
- ✅ Anyone can insert during registration
- ✅ Users can only update their own profile

**Products:**
- ✅ Everyone can view published products
- ✅ Creators can view their own unpublished products
- ✅ Creators can only manage their own products

**Cart, Orders, Payouts:**
- ✅ Users can only access their own data

**Order Items:**
- ✅ Users can view items from their own orders

---

## 🔐 Authentication Flow

### Registration Flow
```
1. User submits form (AuthPage.tsx)
   ↓
2. useAuth().registerMutation
   ↓
3. Supabase Auth creates user → Returns UUID
   ↓
4. Insert user profile into 'users' table with UUID
   ↓
5. Auto-login + Redirect to dashboard
```

### Login Flow
```
1. User submits credentials
   ↓
2. Supabase Auth validates → Returns session (JWT)
   ↓
3. Fetch user profile from 'users' table
   ↓
4. Store session in browser
   ↓
5. Redirect based on role:
   - Writers/Artists → /dashboard (Creator Dashboard)
   - Readers → /dashboard (My Profile)
```

### Session Management
```
Frontend uses Supabase client:
- autoRefreshToken: true (refresh before expiry)
- persistSession: true (localStorage)
- detectSessionInUrl: true (OAuth callbacks)

Backend uses Passport.js:
- X-User-ID header for dev authentication override
- Express session store for traditional auth
```

---

## 🔄 Data Flow

### Product Creation Flow (Writer/Artist)
```
1. Creator fills form in Dashboard → Products tab
   ↓
2. Upload cover image to Cloudinary
   ↓
3. Upload product file to Supabase Storage
   ↓
4. Submit to /api/products (POST)
   ↓
5. Express validates data
   ↓
6. Insert into Supabase 'products' table
   ↓
7. Invalidate React Query cache
   ↓
8. Product appears in creator's store
```

### Shopping Cart → Checkout Flow
```
1. Reader adds product to cart
   ↓
2. POST /api/cart (Express + MemStorage hybrid)
   ↓
3. Cart UI fetches from /api/cart
   ↓
4. Reader proceeds to checkout
   ↓
5. Select payment method:
   - Card → Stripe (future)
   - Manual → Upload proof + reference
   ↓
6. POST /api/orders with items array
   ↓
7. Express calculates fees per creator:
   - Platform Fee = price × (commission_rate / 100)
   - Creator Earning = price - Platform Fee
   ↓
8. Create order with status:
   - Manual payment → 'pending' (awaits admin verification)
   - Card payment → 'paid' (instant)
   ↓
9. Create order_items for each product
   ↓
10. If paid immediately → Create earnings records
    ↓
11. Clear cart
    ↓
12. Redirect to dashboard (order history)
```

### Admin Order Verification (Manual Payments)
```
1. Admin views /admin dashboard
   ↓
2. Fetch pending orders: /api/admin/orders/pending
   ↓
3. Admin reviews payment proof
   ↓
4. POST /api/admin/orders/:id/verify
   ↓
5. Express:
   - Fetch order + order_items
   - Group by creator
   - Calculate earnings per creator
   - Create earnings records
   - Update order status → 'paid'
   ↓
6. Earnings appear in creator dashboard
```

### Creator Earnings Flow
```
1. Creator views Dashboard → Overview tab
   ↓
2. Fetch /api/creator/stats
   ↓
3. Express queries Supabase:
   - earnings WHERE creator_id = user.id
   - payouts WHERE user_id = user.id
   ↓
4. Calculate:
   - Total Earnings = SUM(earnings.amount)
   - Total Paid = SUM(payouts WHERE status='processed')
   - Current Balance = Total Earnings - Total Paid
   ↓
5. Display in UI with recent earnings list
```

---

## ✨ Key Features

### 1. **Multi-Role System**
- **Readers**: Browse, purchase, review, follow creators
- **Writers**: Sell eBooks, manage store, track earnings
- **Artists**: Sell assets (covers, art), offer licensing options
- **Admins**: Verify payments, manage platform

### 2. **Customizable Creator Stores**
Each creator gets `/writer/:username` with customization:
```javascript
storeSettings: {
  themeColor: "#7c3aed",     // Primary color
  accentColor: "#f59e0b",    // Accent color
  welcomeMessage: "Welcome!",
  font: "serif" | "sans" | "display",
  socialLinks: [
    { platform: "twitter", url: "..." }
  ],
  headerLayout: "standard" | "minimal" | "hero"
}
```

### 3. **Product Variants & Licensing**
Artists can offer multiple licenses:
```javascript
// Example: Book Cover Product
Product: "Phoenix Rising Cover"
  ├─ Variant 1: Standard License ($49.99)
  ├─ Variant 2: Extended Commercial License ($149.99)
  └─ Variant 3: Exclusive Rights ($999.99)
```

### 4. **Economic System**
```javascript
// Commission Calculation (per creator in order)
const commissionRate = creator.commission_rate || 20; // %
const platformFee = price * (commissionRate / 100);
const creatorEarning = price - platformFee;

// Example:
// Product price: $100
// Platform fee (20%): $20
// Creator earning: $80
```

### 5. **Payment Methods**
- **Card** (via Stripe) - Instant approval
- **Instapay** (Egyptian mobile wallet)
- **Vodafone Cash**
- **Orange Cash**
- **Etisalat Cash**
- **Bank Transfer**

Manual payments require:
- Payment proof image upload
- Reference number
- Admin verification

### 6. **i18n Support**
```javascript
// English (LTR)
/client/src/locales/en.json

// Arabic (RTL)
/client/src/locales/ar.json

// Auto-detection
document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
```

### 7. **Social Features**
- Follow/Unfollow creators
- Like products (saved as favorites)
- Save to personal library
- Leave reviews (1-5 stars + comment)
- View follower/following counts

---

## 📁 File Structure

```
Data-Sculptor/
├── 📂 server/                    # Express Backend
│   ├── index.ts                  # Server entry point
│   ├── routes.ts                 # API route handlers (800+ lines)
│   ├── auth.ts                   # Passport authentication
│   ├── storage.ts                # In-memory storage interface
│   ├── db.ts                     # Database connection
│   ├── static.ts                 # Static file serving
│   └── vite.ts                   # Vite dev server integration
│
├── 📂 client/src/                # React Frontend
│   ├── App.tsx                   # Root component + routing
│   ├── main.tsx                  # React entry point
│   ├── index.css                 # Global Tailwind styles
│   │
│   ├── 📂 pages/                 # Route pages
│   │   ├── Home.tsx              # Landing page
│   │   ├── AuthPage.tsx          # Login/Signup forms
│   │   ├── Marketplace.tsx       # Browse all products
│   │   ├── WriterStore.tsx       # Creator storefront
│   │   ├── ProductDetails.tsx    # Product detail page
│   │   ├── ReadBook.tsx          # eBook reader
│   │   ├── Cart.tsx              # Shopping cart
│   │   ├── Dashboard.tsx         # User dashboard (role-based)
│   │   ├── Writers.tsx           # Browse creators
│   │   └── admin/
│   │       └── AdminDashboard.tsx # Admin panel
│   │
│   ├── 📂 components/            # Reusable UI components
│   │   ├── 📂 ui/                # Radix UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (50+ components)
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── ProductCard.tsx
│   │
│   ├── 📂 hooks/                 # Custom React hooks
│   │   ├── use-auth.ts           # Authentication logic
│   │   ├── use-cart.ts           # Shopping cart operations
│   │   ├── use-products.ts       # Product CRUD
│   │   ├── use-users.ts          # User profile management
│   │   ├── use-social.ts         # Follow/like/save
│   │   ├── use-earnings.ts       # Creator earnings
│   │   ├── use-admin.ts          # Admin panel operations
│   │   ├── use-orders.ts         # Order history
│   │   ├── use-reviews.ts        # Product reviews
│   │   └── use-toast.ts          # Toast notifications
│   │
│   ├── 📂 lib/                   # Utilities
│   │   ├── supabase.ts           # Supabase client + types
│   │   ├── queryClient.ts        # TanStack Query config
│   │   ├── i18n.ts               # i18next configuration
│   │   └── utils.ts              # Helper functions
│   │
│   └── 📂 locales/               # Translations
│       ├── en.json
│       └── ar.json
│
├── 📂 shared/                    # Shared types (server + client)
│   ├── schema.ts                 # Drizzle ORM schema + Zod validation
│   └── routes.ts                 # API route type definitions
│
├── 📂 supabase/                  # Supabase configuration
│   ├── SETUP_DB.sql              # Complete DB setup script
│   └── 📂 migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_fix_rls_policies.sql
│       ├── 003_storage_buckets.sql
│       └── ...
│
├── .env                          # Environment variables
├── drizzle.config.ts             # Drizzle ORM config
├── vite.config.ts                # Vite bundler config
├── tailwind.config.ts            # Tailwind CSS config
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript config
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/register` - Create new user account
- `POST /api/login` - Login with credentials
- `POST /api/logout` - End session
- `GET /api/user` - Get current user profile

### Users
- `GET /api/users/:username` - Get user profile by username
- `GET /api/users/listWriters` - Get all creators
- `PATCH /api/users/profile` - Update own profile

### Products
- `GET /api/products` - List products (with filters: writerId, genre, search, type)
- `GET /api/products/:id` - Get single product with variants
- `POST /api/products` - Create new product (authenticated)
- `PATCH /api/products/:id` - Update product (owner only)
- `DELETE /api/products/:id` - Delete product (owner only)
- `POST /api/products/:id/variants` - Add variant to product

### Shopping Cart
- `GET /api/cart` - Get current user's cart
- `POST /api/cart` - Add item to cart
- `DELETE /api/cart/:id` - Remove item from cart

### Orders
- `POST /api/orders` - Create order (checkout)
- `GET /api/orders/user` - Get user's order history
- `GET /api/orders/creator` - Get creator's sales

### Social Features
- `POST /api/social/follow` - Follow a creator
- `POST /api/social/unfollow` - Unfollow a creator
- `POST /api/social/like` - Toggle like on product
- `GET /api/social/library` - Get saved products
- `POST /api/social/library` - Save product to library

### Creator Economy
- `GET /api/creator/stats` - Get earnings summary
- `POST /api/creator/payouts` - Request payout
- `GET /api/creator/payouts` - Get payout history

### Admin
- `GET /api/admin/orders/pending` - Get orders awaiting verification
- `POST /api/admin/orders/:id/verify` - Approve manual payment

### Reviews & Coupons
- `GET /api/reviews/:productId` - Get product reviews
- `POST /api/reviews` - Create review
- `GET /api/coupons/:writerId` - Get creator's coupons
- `POST /api/coupons` - Create coupon
- `POST /api/coupons/validate` - Validate coupon code

### Debug (Development)
- `GET /api/debug/dump-tables` - View database contents

---

## 🧩 Frontend Components

### Layout Components
- `Navbar` - Top navigation with cart, user menu, language switcher
- `Footer` - Site footer with links
- `Sidebar` - Dashboard sidebar navigation

### Page Components
- `Home` - Hero section + featured products
- `Marketplace` - Product grid with filters
- `WriterStore` - Customized creator storefront
- `ProductDetails` - Product description, variants, reviews
- `Cart` - Shopping cart with checkout
- `Dashboard` - Role-based tabs (products, earnings, settings)
- `ReadBook` - eBook reader interface

### UI Components (Radix-based)
All styled with Tailwind + CSS variables:
- Button, Input, Textarea, Select, Checkbox, Switch
- Dialog, AlertDialog, Sheet, Drawer
- Dropdown Menu, Context Menu, Menubar
- Toast, Tooltip, Popover, Hover Card
- Tabs, Accordion, Collapsible
- Scroll Area, Separator, Avatar
- Progress, Slider, Label
- Card, Badge, etc.

---

## 📊 State Management

### React Query (TanStack Query)
All data fetching uses React Query for:
- Automatic caching
- Background refetching
- Optimistic updates
- Error handling
- Loading states

### Query Keys Convention
```javascript
// Session
["/api/session"]

// User
["/api/user", userId]

// Products
["/api/products"]
["/api/products", { writerId, genre }]
["/api/products/:id"]

// Cart
["/api/cart"]

// Orders
["/api/orders/user"]
["/api/orders/creator"]

// Earnings
["/api/creator/stats"]
```

### Custom Hooks Pattern
```typescript
// Example: use-products.ts
export function useProducts(filters) {
  return useQuery({
    queryKey: ["/api/products", filters],
    queryFn: async () => {
      const res = await fetch(`/api/products?${params}`);
      return res.json();
    }
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product) => {
      const res = await fetch("/api/products", {
        method: "POST",
        body: JSON.stringify(product)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/products"]);
    }
  });
}
```

---

## 💰 Payment & Economic System

### Revenue Split Model
```javascript
// Default commission: 20%
// Example order with 2 creators:

Order Total: $150
├─ Creator A (2 products = $80)
│  ├─ Platform Fee (20%): $16
│  └─ Creator Earning: $64
│
└─ Creator B (1 product = $70)
   ├─ Platform Fee (20%): $14
   └─ Creator Earning: $56

Platform Total Fee: $30
Creators Total Earning: $120
```

### Payment Flow States
```
Manual Payment:
pending → paid (admin verified) → completed

Card Payment:
paid → completed

Failed Payment:
pending → failed → refunded (if applicable)
```

### Payout System
```javascript
// Creator requests payout
const currentBalance = totalEarnings - totalPayouts;

// Minimum: $20
if (amount >= 2000 && amount <= currentBalance) {
  createPayout({
    userId,
    amount,
    status: 'pending',
    method: 'stripe' | 'bank_transfer'
  });
}

// Admin processes
updatePayout({
  status: 'processed',
  processedAt: new Date()
});
```

---

## 🚀 Deployment & Configuration

### Environment Variables (.env)
```bash
# Supabase (Frontend)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase (Backend)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=123456
CLOUDINARY_API_SECRET=abc123
VITE_CLOUDINARY_UPLOAD_PRESET=preset_name

# Server
PORT=5000
NODE_ENV=development
```

### Development Setup
```bash
# 1. Install dependencies
npm install

# 2. Setup Supabase database
# Run supabase/SETUP_DB.sql in Supabase SQL Editor

# 3. Configure .env
# Copy .env.example and fill in credentials

# 4. Start dev server
npm run dev
# → http://localhost:5000
```

### Production Build
```bash
# 1. Build frontend + backend
npm run build

# 2. Start production server
npm start
# Uses NODE_ENV=production
```

### Database Migrations
```bash
# Push schema changes to Supabase
npm run db:push

# Using Drizzle Kit
npx drizzle-kit push:pg --config=drizzle.config.ts
```

---

## 🔑 Key Insights

### 1. **Dual Authentication System**
- Supabase Auth handles user credentials (JWT)
- Express uses X-User-ID header for API authentication
- Passport.js provides session management layer

### 2. **Hybrid Data Access**
- Frontend directly queries Supabase for real-time features
- Express API handles business logic (fees, validation)
- MemStorage provides fast local development experience

### 3. **Commission Flexibility**
- Each creator can have custom commission rate
- Default is 20%, but can be adjusted per user
- Allows for VIP creators with better rates

### 4. **Payment Verification Flow**
- Manual payments create "pending" orders
- Admin reviews payment proof
- Approval triggers earnings creation
- Prevents fraud while supporting local payment methods

### 5. **Store Personalization**
- Each creator's store can have unique branding
- Settings stored as JSONB (flexible schema)
- Applied dynamically via CSS variables

### 6. **Content Delivery**
- Cover images → Cloudinary (optimized CDN)
- Product files → Supabase Storage (private buckets)
- eBook content extracted and stored in DB for reading

### 7. **Internationalization Ready**
- RTL support for Arabic
- Font switching per language
- Translation keys for all UI text

---

## 📈 Current Status

### ✅ Implemented
- User registration & authentication
- Role-based dashboards
- Product CRUD operations
- Shopping cart
- Checkout with multiple payment methods
- Order management
- Creator earnings tracking
- Admin payment verification
- Store customization
- Social features (follow, like, save)
- Multi-language support
- Responsive design

### 🚧 In Progress / Planned
- Stripe integration for card payments
- File upload for products (currently using URLs)
- Advanced eBook reader features
- Email notifications
- Analytics dashboard
- Payout automation
- Review moderation
- Coupon functionality (created but not used in UI)

---

## 🎯 Summary

**Hekayaty Store** is a full-featured digital marketplace with:
- **Robust economic system** (80/20 split, earnings, payouts)
- **Creator empowerment** (customizable stores, multi-product types)
- **Flexible payment options** (card + local Egyptian methods)
- **Modern tech stack** (React, Express, Supabase, TypeScript)
- **Production-ready architecture** (RLS, auth, validation)
- **International support** (English + Arabic)

The codebase is well-structured with clear separation of concerns, comprehensive type safety, and scalable patterns for future growth.

---

**Last Updated**: January 21, 2026
**Analyzed By**: AI Deep Code Analysis
**Total Lines of Code**: ~15,000+
**Main Technologies**: TypeScript, React, Express, Supabase, Tailwind CSS
