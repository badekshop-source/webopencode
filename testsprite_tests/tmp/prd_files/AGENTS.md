# AGENTS.md

Guidelines for AI coding assistants working on badekshop - e-commerce platform for Bali tourists selling eSIM and SIM cards. When you need to search docs, use Context7.

- "STRICT: Jangan pernah membaca atau memindahkan file biner/media (images/videos/PDF)."
- "Hanya fokus pada file teks (.ts, .tsx, .css, .json, .md)."
- "Jika butuh referensi aset, cukup tanyakan nama filenya saja, jangan baca isinya."
- "Gunakan 'context7' hanya untuk memindai struktur (ls), bukan membaca isi file > 50KB kecuali diminta."

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.0+ (strict mode)
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Auth**: better-auth
- **Payments**: Midtrans (VISA, Mastercard, JCB, AMEX, UnionPay)
- **Storage**: Cloudinary (passport uploads)
- **Email**: Resend
- **Validation**: Zod
- **PWA**: next-pwa

## Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:3000

# Build & Deploy
npm run build            # Production build
npm start               # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run typecheck       # TypeScript type checking

# Database (Drizzle)
npx drizzle-kit generate    # Generate migrations
npx drizzle-kit push         # Push schema to Neon
npx drizzle-kit studio       # Open Drizzle Studio

# Testing (if configured)
npm run test            # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test -- Button  # Run single test file
```

## Code Style

### Project Conventions

- **One-Product-One-Order**: No cart system, direct checkout per product
- **Language**: English only (i18n ready for future)
- **Strict TypeScript**: Enable all strict flags

### Imports

- Use `@/` path alias for all internal imports
- Group order: 1) React/Next, 2) External libs, 3) Internal, 4) Types
- Use double quotes for imports

### Naming Conventions

- **Components**: PascalCase (e.g., `ProductCard.tsx`, `KycUploader.tsx`)
- **Functions**: camelCase (e.g., `calculateRefund()`, `sendQrCode()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_KYC_ATTEMPTS = 3`)
- **Types/Interfaces**: PascalCase (e.g., `OrderStatus`, `KycStatus`)
- **Database columns**: snake_case (e.g., `passport_url`, `kyc_attempts`)
- **API routes**: kebab-case folders, camelCase handlers

### TypeScript

- Always use strict mode - define return types for exported functions
- Use `interface` for object shapes, `type` for unions
- Prefer Drizzle's `$inferSelect` and `$inferInsert` for DB types
- Use Zod schemas for API validation and form inputs

### Components

- Use `"use client"` only when needed (forms, interactive elements)
- Destructure props with defaults
- Use `cn()` utility for Tailwind class merging
- Props interface: `{ComponentName}Props`

### API Routes

- Export `GET`, `POST`, `PUT`, `DELETE` async functions
- Return structure: `{ success: boolean, data?: any, error?: string }`
- Use Zod for input validation
- Implement rate limiting (5 uploads/hour, 3 checkouts/hour)

### Error Handling

- Wrap API handlers in try/catch with context logging
- Return appropriate HTTP codes: 400 validation, 401 auth, 429 rate limit, 500 server
- Use early returns for validation failures
- Never expose sensitive error details to client

### Database (Drizzle)

- Define schema in `lib/db/schema.ts`
- Use appropriate indexes for query optimization
- Include relations for table associations
- Track all admin actions in audit log table

### Cloudinary Integration

- Use signed URLs with 10-minute expiry for passport access
- Auto-delete passport images after 30 days post-order
- Validate file type (image only) and size (< 5MB)

### Styling (Tailwind v4)

- Use shadcn/ui base components
- Support dark mode with `dark:` modifier
- Mobile-first responsive design (PWA requirement)
- Brand colors via CSS variables

### Business Logic Rules

- **Payment Window**: 2 hours from order creation
- **KYC Auto-Approval**: Clear photos approved instantly; 3 attempts max
- **KYC Status**: `pending` → `auto_approved` (clear) | `under_review` (3 fail) | `rejected`
- **Reviews**: Only approved customers can review, 4-5 stars auto-approved
- **Refund**: `refund_amount = final_amount - admin_fee`

### Security

- Validate all user inputs with Zod
- Use better-auth session validation for protected routes
- Rate limit: Upload 5/hour, Checkout 3/hour, Admin login 5/15min
- Never commit secrets to repository

## Environment Variables

Required in `.env.local`:

```
# Database
DATABASE_URL=postgresql://...

# Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000

# Midtrans
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...
MIDTRANS_MODE=sandbox

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Email
RESEND_API_KEY=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

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

### ⚠️ Common Issues & Solutions

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

## Order Status Flow

```
Pending → Paid → Processing → (Auto-Approved / Under Review / Rejected / Expired) → Completed/Cancelled
```

### KYC Status Transitions

| Status         | Description                         | Next State                        |
| -------------- | ----------------------------------- | --------------------------------- |
| `pending`      | Initial state, waiting for upload   | `auto_approved` (clear photo)     |
| `retry_1`      | First failed attempt, prompt retry  | `retry_2` or `auto_approved`      |
| `retry_2`      | Second failed attempt, prompt retry | `under_review` or `auto_approved` |
| `under_review` | 3 failed attempts, manual check     | `approved` or `rejected`          |
| `approved`     | Photo accepted, send QR code        | `completed`                       |
| `rejected`     | Photo rejected, trigger refund      | `cancelled`                       |

### User Education Messages

- **Retry 1**: "Oops! The photo seems a bit blurry. Please try again in a brighter area to speed up your activation."
- **Retry 2**: "The photo is still unclear, but don't worry! Your order is still being processed. Our team will manually verify your photo now."

## Complete User Purchase Flow

```
1. BROWSE PRODUCTS
   User visits website, views available SIM packages
   ↓
2. SELECT PACKAGE
   User chooses eSIM or Physical SIM package
   ↓
3. ORDER FORM
   Fill personal info & pickup details
   ↓
4. PAYMENT (MIDTRANS)
   Redirect to Midtrans, complete payment
   ↓
5a. PAYMENT FAILED
   Show error, allow retry
   ↓
5b. PAYMENT SUCCESS
   → 6. KYC DOCUMENTS FORM
      Upload passport photo & IMEI number
      ↓
      7. SUCCESS SUBMISSION
         Display QR Code for pickup
         Send email confirmation
         ↓
         8. ARRIVAL AT OUTLET
            User shows QR Code
            Staff verifies identity manually
            Hands over SIM card
            ↓
             9. ORDER COMPLETED
                Send follow-up email
```

### Key Implementation Notes:

- **KYC Process**: Happens AFTER payment completion (not before) to improve conversion rates
- **IMEI Requirement**: All orders require IMEI number (15 digits) for eSIM/SIM verification
- **Email Workflows**: Automated order confirmation, KYC approval, pickup reminder, and follow-up emails
- **Admin Features**: Complete dashboard with order, KYC, and product management
- **Security**: CSP headers for external image loading, enhanced authentication
- **Database**: IMEI field added, token-based access, improved KYC status management

## Special Notes

### Project Structure Warnings ⚠️

**NEVER create files in these locations:**

- ❌ `app/` (root folder) - Next.js will use this instead of `src/app/`
- ❌ `app/api/` (root folder) - Will conflict with `src/app/api/`
- ❌ `app/page.tsx` (root folder) - Will conflict with `src/app/page.tsx`
- ❌ `app/layout.tsx` (root folder) - Will conflict with `src/app/layout.tsx`

**ALWAYS use these locations:**

- ✅ `src/app/` - All Next.js App Router routes
- ✅ `src/app/api/` - All API routes
- ✅ `src/app/page.tsx` - Homepage
- ✅ `src/app/layout.tsx` - Root layout
- ✅ `src/components/` - All React components
- ✅ `src/lib/` - All utility functions and configurations

### Troubleshooting Guide

**If 404 errors occur on homepage:**

1. Check if `app/` folder exists in project root
2. If exists, move contents to `src/app/` and delete root `app/`
3. Clear `.next/` cache: `rm -rf .next`
4. Restart dev server: `npm run dev`

**If build only generates `/_not-found`:**

1. Verify `src/app/page.tsx` exists
2. Verify no root `app/` folder exists
3. Clear cache and rebuild

### Business Rules

- **No Cart System**: Direct checkout per product
- **KYC Mandatory**: Passport upload required after payment (not before)
- **Auto-Approval**: Clear photos approved instantly; max 3 auto-attempts
- **Pickup Location**: badekshop store at Ngurah Rai Airport (eSIM & SIM Card)
- **QR Code**: Sent via email after KYC approval for airport activation
- **Auto-Refund**: Configurable for expired/rejected/cancelled orders
