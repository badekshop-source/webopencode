# badekshop - Product Requirements Document

## 1. Executive Summary

**badekshop** is an e-commerce platform for Bali tourists selling eSIM and physical SIM cards. The platform provides instant connectivity with a seamless KYC (Know Your Customer) process.

- "STRICT: Jangan pernah membaca atau memindahkan file biner/media (images/videos/PDF)."
- "Hanya fokus pada file teks (.ts, .tsx, .css, .json, .md)."
- "Jika butuh referensi aset, cukup tanyakan nama filenya saja, jangan baca isinya."
- "Gunakan 'context7' hanya untuk memindai struktur (ls), bukan membaca isi file > 50KB kecuali diminta."

### Value Proposition

- **Activation at Our Outlet**: eSIM activated within minutes of landing
- **Airport Convenience**: Physical SIM pickup at Ngurah Rai International Airport
- **Secure KYC**: Automated passport verification with 3-attempt retry system
- **No Cart System**: Direct checkout per product for faster conversion

### Target Market

- International tourists visiting Bali
- Business travelers needing reliable connectivity
- Families requiring multiple SIM connections

---

## 2. Tech Stack

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.0+ (strict mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Button, Card, Dialog, Form, Input, Select, Table, Tabs, Accordion, Badge)
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend

- **Framework**: Next.js API Routes
- **Authentication**: better-auth
- **Validation**: Zod

### Database

- **Provider**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle ORM
- **Schema**: 7 tables (profiles, products, orders, kycDocuments, reviews, adminLogs, refundPolicies)

### Integrations

- **Payments**: Midtrans (Snap + Core API)
  - Supported: VISA, Mastercard, JCB, American Express, UnionPay
- **File Storage**: Cloudinary (passport uploads with signed URLs)
- **Email**: Resend (transactional emails)
- **PWA**: next-pwa

---

## 3. User Purchase Flow

### 10-Step Customer Journey

```
1. LANDING PAGE
   User visits website, views premium landing page
   ↓
2. BROWSE PRODUCTS
   Browse eSIM and SIM card packages by category
   ↓
3. SELECT PACKAGE
   Choose package (3/7/14/30 days duration)
   ↓
4. CHECKOUT FORM
   Fill: Full name, email, phone, nationality
        Arrival date, flight number, IMEI (15 digits)
   ↓
5. PAYMENT
   Redirect to Midtrans payment page
   Supports: Credit cards (VISA, MC, JCB, AMEX, UnionPay)
   ↓
6a. PAYMENT FAILED
    Show error message, allow retry (max 3 attempts)
    2-hour payment window before order expires
    ↓
6b. PAYMENT SUCCESS
    → 7. KYC DOCUMENTS
       Upload passport photo
       Enter IMEI number (required)
       ↓
       8. KYC PROCESSING
          Auto-approval for clear photos
          Max 3 attempts with user education messages
          Manual review after 3 failed attempts
          ↓
          9. QR CODE GENERATION
             Generated after KYC approval
             Sent via email
             ↓
             10. PICKUP AT OUTLET
                 Show QR code at Ngurah Rai Airport counter
                 Staff verifies identity manually
                 Hands over SIM card
                 ↓
                 11. ORDER COMPLETED
                    Send follow-up email
                    Invite to leave review
```

---

## 4. Database Schema Overview

### 7 Core Tables

| Table            | Purpose                                             | Key Relations      |
| ---------------- | --------------------------------------------------- | ------------------ |
| `profiles`       | User accounts (customer/admin roles)                | -                  |
| `products`       | eSIM/SIM packages (name, price, duration, category) | -                  |
| `orders`         | Order records with full status tracking             | products, profiles |
| `kycDocuments`   | Passport upload records                             | orders             |
| `reviews`        | Customer testimonials                               | orders             |
| `adminLogs`      | Audit trail for all admin actions                   | profiles           |
| `refundPolicies` | Refund configuration settings                       | -                  |

### Key Fields

- **Order Tracking**: orderNumber, orderStatus, paymentStatus, kycStatus
- **KYC**: passportUrl, passportPublicId, kycAttempts, kycStatus
- **Security**: accessToken (JWT), tokenExpiresAt
- **Payment**: paymentGatewayId (Midtrans), total, refundAmount

---

## 5. API Endpoints

### Customer APIs

| Endpoint                        | Method   | Description                      |
| ------------------------------- | -------- | -------------------------------- |
| `/api/products`                 | GET      | List all products with filtering |
| `/api/products/[id]`            | GET      | Get single product details       |
| `/api/orders`                   | POST     | Create new order                 |
| `/api/orders/[id]/payment`      | POST     | Initiate Midtrans payment        |
| `/api/kyc/upload`               | POST     | Upload passport and IMEI         |
| `/api/reviews`                  | GET/POST | List/create reviews              |
| `/api/email/order-confirmation` | POST     | Send order confirmation email    |
| `/api/email/kyc-approved`       | POST     | Send KYC approved email with QR  |
| `/api/email/pickup-reminder`    | POST     | Send pickup reminder email       |
| `/api/email/follow-up`          | POST     | Send follow-up review email      |

### Admin APIs

| Endpoint                   | Method         | Description                           |
| -------------------------- | -------------- | ------------------------------------- |
| `/api/admin/orders`        | GET            | List orders with pagination & filters |
| `/api/admin/orders/[id]`   | GET            | Get order details                     |
| `/api/admin/kyc`           | GET            | List pending KYC documents            |
| `/api/admin/products`      | GET/POST       | List/create products                  |
| `/api/admin/products/[id]` | GET/PUT/DELETE | Product CRUD operations               |
| `/api/admin/logs`          | GET            | List admin audit logs                 |

---

## 6. Security & Authentication

### Authentication

- **Provider**: better-auth
- **Methods**: Email/password (OAuth ready for future)
- **Session**: Server-side session management
- **Roles**: customer, admin

### Authorization

- Role-based access control (RBAC)
- Admin routes protected with session validation
- Token-based order access (30-day JWT)

### Input Validation

- **Library**: Zod
- All API inputs validated
- File upload validation (image only, max 5MB)

### Rate Limiting

- Upload: 5 attempts/hour per order
- Checkout: 3 attempts/hour per session
- Admin login: 5 attempts/15 minutes

### Webhook Security

- Midtrans signature verification (SHA512)
- 10-minute expiry for Cloudinary signed URLs

---

## 7. Business Rules

### Order Status Flow

```
pending → paid → processing → approved → completed
   ↓         ↓        ↓           ↓
expired  failed  rejected    cancelled
```

### KYC Status Flow

```
pending → auto_approved (clear photo)
      ↓
   retry_1 → retry_2 → under_review → approved/rejected
```

### Key Business Rules

| Rule                     | Description                                     |
| ------------------------ | ----------------------------------------------- |
| **Payment Window**       | 2 hours from order creation                     |
| **KYC Attempts**         | Maximum 3 attempts per order                    |
| **Auto-Approval**        | Clear photos approved instantly                 |
| **IMEI Required**        | 15-digit IMEI mandatory for all orders          |
| **Refund Calculation**   | `refund_amount = final_amount - admin_fee` (5%) |
| **Review Eligibility**   | Only approved customers can review              |
| **Auto-Review Approval** | 4-5 star ratings auto-approved                  |
| **No Cart**              | Direct checkout per product only                |

### User Education Messages

**Retry 1**: "Oops! The photo seems a bit blurry. Please try again in a brighter area to speed up your activation."

**Retry 2**: "The photo is still unclear, but don't worry! Our team will manually verify your photo now."

---

## 8. Email Workflows

### 4 Automated Email Types

| Email                  | Trigger                 | Content                                            |
| ---------------------- | ----------------------- | -------------------------------------------------- |
| **Order Confirmation** | Payment success         | Order details, KYC upload link, tracking info      |
| **KYC Approved**       | KYC approval            | QR code for pickup, airport location, instructions |
| **Pickup Reminder**    | 24h before arrival      | Flight details reminder, pickup location, contact  |
| **Follow-up**          | 3 days after completion | Review invitation, feedback request                |

---

## 9. Admin Features

### Dashboard Capabilities

**Order Management**

- View all orders with filters (status, date, search)
- Order detail view with customer info
- Update order status manually
- Process refunds

**KYC Management**

- List pending KYC documents
- View passport images (signed URLs)
- Approve/reject KYC with notes
- Auto-approval for clear photos

**Product Management**

- Create new products
- Edit product details (price, stock, description)
- Activate/deactivate products
- Soft delete (mark inactive)

**Audit & Logs**

- All admin actions logged
- View action history
- Filter by admin, action type, date

**QR Scanner**

- Dedicated scanner page for outlet staff
- Verify customer identity
- Mark order as completed

---

## 10. Implementation Status

### ✅ Completed Features

**Core Platform**

- [x] Premium landing page with animations
- [x] Product catalog with filtering
- [x] Complete checkout flow
- [x] Midtrans payment integration
- [x] KYC upload with Cloudinary
- [x] Order management system
- [x] Order tracking page
- [x] Payment failed page with retry option
- [x] Order success page with KYC form
- [x] Payment window (2 hours) with auto-expire

**Admin System**

- [x] Admin dashboard with auth protection
- [x] Order management APIs and UI
- [x] KYC approval/rejection with auto-approval
- [x] Product CRUD operations
- [x] Audit logging
- [x] QR Scanner for outlet staff
- [x] Admin order detail page
- [x] Admin KYC detail page

**Email & Notifications**

- [x] Order confirmation email
- [x] KYC approved email with QR
- [x] Pickup reminder email (cron-based)
- [x] Follow-up review email (cron-based)

**Security**

- [x] better-auth integration
- [x] Session management
- [x] Midtrans webhook verification (SHA512)
- [x] Cloudinary signed URLs
- [x] Rate limiting (checkout: 3/hr, payment: 3/hr, upload: 5/hr, admin login: 5/15min)
- [x] Token-based order access (30-day JWT)
- [x] Cron endpoint authentication (CRON_SECRET)

**PWA**

- [x] next-pwa configuration with runtime caching
- [x] Web app manifest (manifest.json)
- [x] PWA icons (192x192, 512x512, apple-touch-icon)
- [x] Theme color and viewport meta tags
- [x] Offline caching for Cloudinary images, fonts, QR codes

**Cron Jobs**

- [x] `/api/cron/expire-orders` - Auto-expire unpaid orders (every 5 min)
- [x] `/api/cron/pickup-reminders` - Send pickup reminder 24h before arrival (every hour)
- [x] `/api/cron/follow-up-emails` - Send follow-up email 3 days after completion (every hour)
- [x] `vercel.json` cron configuration

**Testing**

- [x] Playwright E2E testing framework (21 tests passing)
- [x] Homepage tests (3 tests)
- [x] Products page tests (4 tests)
- [x] Checkout flow tests (4 tests)
- [x] Order tracking tests (3 tests)
- [x] Admin auth tests (4 tests)
- [x] Mobile responsiveness tests (3 tests)

**Database**

- [x] All 7 core tables (profiles, products, orders, kycDocuments, reviews, adminLogs, refundPolicies)
- [x] better-auth tables (user, session, account)
- [x] Migration scripts
- [x] Seed script with admin user and sample products

**Build & Deployment**

- [x] Clean production build (0 warnings, 0 errors)
- [x] 35 routes generated
- [x] TypeScript strict mode
- [x] `.env.example` template for production
- [x] Vercel cron configuration
- [x] PWA ready for deployment

### Build Status

- **Status**: ✅ All builds passing (0 warnings, 0 errors)
- **Pages**: 35 routes generated
- **TypeScript**: Strict mode enabled
- **E2E Tests**: 21/21 passing (Playwright)
- **PWA**: Fully configured with manifest and icons

---

## 11. Project Structure

**⚠️ CRITICAL: All app routes MUST be in `src/app/`, NOT in root `app/` folder**

```
/Users/badekwong/webopencode/badekshop/           # Project root
├── src/                                          # Source code
│   ├── app/                                      # Next.js App Router (ALL ROUTES HERE)
│   │   ├── (admin)/                             # Admin routes group
│   │   │   └── admin/
│   │   │       ├── layout.tsx                   # Admin layout with auth
│   │   │       ├── page.tsx                     # Admin dashboard
│   │   │       ├── login/                       # Admin login page
│   │   │       ├── orders/page.tsx              # Order management
│   │   │       ├── orders/[id]/page.tsx         # Order detail
│   │   │       ├── kyc/page.tsx                 # KYC management
│   │   │       ├── kyc/[id]/page.tsx            # KYC detail
│   │   │       ├── products/page.tsx            # Product management
│   │   │       └── kyc-scanner/page.tsx         # QR scanner
│   │   ├── api/                                 # API routes
│   │   │   ├── admin/
│   │   │   │   ├── kyc/                         # Admin KYC API
│   │   │   │   ├── logs/route.ts                # Admin logs API
│   │   │   │   ├── orders/                      # Admin orders API
│   │   │   │   └── products/                    # Admin products API
│   │   │   ├── auth/[...all]/route.ts           # better-auth handler
│   │   │   ├── email/
│   │   │   │   ├── follow-up/                   # Follow-up email API
│   │   │   │   ├── kyc-approved/                # KYC approved email API
│   │   │   │   ├── order-confirmation/          # Order confirmation email API
│   │   │   │   └── pickup-reminder/             # Pickup reminder email API
│   │   │   ├── kyc/upload/route.ts              # KYC upload API
│   │   │   ├── orders/route.ts                  # Create order API
│   │   │   ├── orders/[id]/payment/             # Payment API
│   │   │   ├── products/
│   │   │   │   ├── route.ts                     # Product list API
│   │   │   │   └── [id]/                        # Product detail API
│   │   │   └── reviews/route.ts                 # Reviews API
│   │   ├── checkout/                            # Checkout flow
│   │   │   ├── page.tsx
│   │   │   ├── checkout-content.tsx
│   │   │   └── page-wrapper.tsx
│   │   ├── kyc/page.tsx                         # KYC upload page
│   │   ├── order/[id]/                          # Order detail page
│   │   ├── order-success/page.tsx               # Order success page
│   │   ├── products/page.tsx                    # Product catalog
│   │   ├── track-order/page.tsx                 # Order tracking
│   │   ├── layout.tsx                           # Root layout
│   │   ├── page.tsx                             # Homepage (landing)
│   │   └── globals.css                          # Global styles
│   ├── components/
│   │   ├── landing/                             # Landing page components
│   │   │   ├── AsyncProductShowcase.tsx
│   │   │   ├── CTASection.tsx
│   │   │   ├── FAQSection.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── LandingFooter.tsx
│   │   │   ├── LandingHeader.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductShowcase.tsx
│   │   │   ├── Testimonials.tsx
│   │   │   ├── TrustBadges.tsx
│   │   │   └── WhatsAppWidget.tsx
│   │   ├── shop/                                # Customer components
│   │   │   └── CategoryTabs.tsx
│   │   ├── admin/                               # Admin components
│   │   │   ├── data-table.tsx
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── stat-card.tsx
│   │   │   └── status-badge.tsx
│   │   ├── order/                               # Order components
│   │   │   ├── KycUploadSection.tsx
│   │   │   ├── OrderStatusTracker.tsx
│   │   │   └── QRCodeDisplay.tsx
│   │   ├── reviews/                             # Review components
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── ReviewForm.tsx
│   │   │   └── ReviewList.tsx
│   │   └── ui/                                  # shadcn/ui components (22 components)
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts                         # Database connection
│   │   │   └── schema.ts                        # Drizzle schema
│   │   ├── auth.ts                              # better-auth config
│   │   ├── auth-utils.ts                        # Auth utilities
│   │   ├── cloudinary.ts                        # File upload handlers
│   │   ├── currency.ts                          # Currency formatting
│   │   ├── email.ts                             # Resend templates
│   │   ├── kyc-validation.ts                    # KYC validation logic
│   │   ├── midtrans.ts                          # Payment integration
│   │   ├── rate-limit.ts                        # Rate limiting
│   │   ├── token.ts                             # JWT token management
│   │   ├── workflows.ts                         # Business logic workflows
│   │   └── utils.ts                             # Utilities (cn, etc.)
│   ├── middleware.ts                            # Next.js middleware
│   └── types/                                   # Shared TypeScript types
│       ├── country-list.d.ts
│       ├── index.ts
│       └── midtrans.d.ts
├── drizzle/                                      # Database migrations
│   └── 0000_gray_namora.sql
├── scripts/                                      # Database scripts
│   ├── add-features-column.ts
│   ├── check-reviews.ts
│   ├── check-tables.ts
│   ├── create-tables.ts
│   ├── drop-and-recreate.ts
│   └── seed.ts
├── tests/                                        # Test files
│   ├── database/                                # Database tests
│   ├── integration/                             # Integration tests
│   ├── global-setup.ts
│   └── setup.ts
├── public/                                       # Static assets
│   └── images/
├── middleware.ts                                 # Next.js root middleware
├── next.config.js                                # Next.js config
├── drizzle.config.ts                             # Drizzle configuration
├── tsconfig.json                                 # TypeScript config
├── postcss.config.js                             # PostCSS config
├── eslint.config.js                              # ESLint config
├── vitest.config.ts                              # Vitest config
├── vite.config.ts                                # Vite config
├── components.json                               # shadcn/ui config
└── package.json                                  # Dependencies
```

### ⚠️ Critical Rules

1. **ALL routes MUST be in `src/app/`** - Never create routes in root `app/` folder
2. **Route groups use parentheses**: `(admin)` - for organization without affecting URL. Customer routes are NOT wrapped in a group
3. **Dynamic routes use brackets**: `[id]`, `[...all]` - for dynamic segments
4. **API routes are in `src/app/api/`** - not in root `api/` folder
5. **Middleware exists at two levels** - `middleware.ts` in both project root and `src/`

### Common Issues & Solutions

**Issue: 404 on homepage or routes not working**

- **Cause**: Duplicate `app/` folder in project root conflicting with `src/app/`
- **Solution**: Ensure ALL routes are in `src/app/`, delete any `app/` folder in project root
- **Verification**: Run `ls -la app/` should return "No such file or directory"

**Issue: Build shows only `/_not-found` route**

- **Cause**: Next.js detecting wrong app directory
- **Solution**:
  1. Delete `.next/` cache folder
  2. Ensure no `app/` folder exists in root
  3. Verify `src/app/page.tsx` exists
  4. Rebuild with `npm run build`

**Issue: TypeScript errors on Link href**

- **Cause**: typedRoutes configuration with dynamic routes
- **Solution**: Use `as any` type assertion for dynamic hrefs:
  ```tsx
  <Link href={`/order/${id}` as any}>View</Link>
  ```

---

## 12. Environment Variables

Required environment variables in `.env.local`:

```bash
# Database
DATABASE_URL

# Authentication
BETTER_AUTH_SECRET
BETTER_AUTH_URL

# Midtrans Payments
MIDTRANS_SERVER_KEY
MIDTRANS_CLIENT_KEY
MIDTRANS_MODE

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

# Email Service
RESEND_API_KEY

# Application
NEXT_PUBLIC_APP_URL

# Rate Limiting (Optional)
KV_URL
KV_REST_API_URL
KV_REST_API_TOKEN
```

---

## 13. Deployment Notes

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrated with Drizzle
- [ ] Seed data created (admin user, products)
- [ ] Midtrans webhook URL configured
- [ ] Cloudinary folder created
- [ ] Email templates verified
- [ ] Build passes without errors
- [ ] **Verify all routes are in `src/app/`, NOT in root `app/` folder**

### Production Requirements

- Node.js 18+ (LTS recommended)
- PostgreSQL database (Neon recommended)
- Environment variables configured
- HTTPS enabled (required for payments)

### Important Deployment Notes

**Project Structure Verification:**
Before deploying, ensure:

1. All routes are in `src/app/` directory
2. No conflicting `app/` folder exists in project root
3. Build output shows all expected routes (not just `/_not-found`)
4. Homepage (`/`) returns 200, not 404

**Quick Verification Commands:**

```bash
# Check for conflicting root app folder
ls -la app/ 2>/dev/null || echo "✓ No root app folder"

# Verify src/app/page.tsx exists
ls -la src/app/page.tsx

# Build and check routes
npm run build 2>&1 | grep -E "Route|/"
```

**Common Deployment Issue:**
If homepage shows 404 after deployment:

- Check if root `app/` folder was accidentally created
- Ensure `src/app/page.tsx` is present
- Rebuild after clearing `.next/` cache

---

## Related Documentation

- **Flow Diagrams**: See [FLOW_DIAGRAM.md](./FLOW_DIAGRAM.md)
- **Code Style Guide**: See [AGENTS.md](./AGENTS.md)

---

_Last Updated: April 2026_
_Version: 1.0_
