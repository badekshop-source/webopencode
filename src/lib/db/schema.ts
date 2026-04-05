// src/lib/db/schema.ts
import { pgTable, serial, text, integer, timestamp, boolean, uuid, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Users/Profiles table
export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  name: text("name"),
  phone: text("phone"),
  address: text("address"),
  role: text("role").default("customer"), // 'customer' or 'admin'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Products table (eSIM/SIM Cards)
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'esim' or 'sim_card'
  duration: integer("duration"), // in days for eSIM
  size: text("size"), // 'nano', 'micro', 'standard' for SIM cards
  price: integer("price").notNull(), // in cents
  discountPercentage: integer("discount_percentage").default(0),
  discountStart: timestamp("discount_start"),
  discountEnd: timestamp("discount_end"),
  stock: integer("stock").default(0),
  isActive: boolean("is_active").default(true),
  features: json("features").$type<string[]>(), // Array of features
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  userId: uuid("user_id").references(() => profiles.id),
  fullName: text("full_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  nationality: text("nationality").notNull(),
  arrivalDate: timestamp("arrival_date").notNull(),
  flightNumber: text("flight_number").notNull(),
  productId: uuid("product_id").references(() => products.id),
  quantity: integer("quantity").default(1),
  subtotal: integer("subtotal").notNull(), // in cents
  discount: integer("discount").default(0), // in cents
  tax: integer("tax").default(0), // in cents
  total: integer("total").notNull(), // in cents
  paymentMethod: text("payment_method"), // 'credit_card', etc.
  paymentStatus: text("payment_status").default("pending"), // 'pending', 'paid', 'failed', 'refunded'
  paymentGatewayId: text("payment_gateway_id"), // Midtrans transaction ID
  orderStatus: text("order_status").default("pending"), // 'pending', 'paid', 'processing', 'approved', 'rejected', 'expired', 'cancelled', 'completed'
  kycStatus: text("kyc_status").default("pending"), // 'pending', 'auto_approved', 'retry_1', 'retry_2', 'under_review', 'approved', 'rejected'
  kycAttempts: integer("kyc_attempts").default(0), // Track number of KYC attempts
  imeiNumber: text("imei_number"), // IMEI for eSIM/SIM verification (15 digits)
  accessToken: text("access_token").notNull(), // JWT token for order access
  tokenExpiresAt: timestamp("token_expires_at"), // 30 days from order creation
  qrCodeData: text("qr_code_data"), // eSIM activation code or SIM pickup info
  passportPublicId: text("passport_public_id"), // Cloudinary public ID
  passportUrl: text("passport_url"), // Cloudinary URL
  refundAmount: integer("refund_amount"), // in cents
  refundReason: text("refund_reason"),
  refundStatus: text("refund_status"), // 'none', 'requested', 'processed'
  activationOutlet: text("activation_outlet").default("Ngurah Rai Airport"),
  notes: text("notes"),
  expiresAt: timestamp("expires_at"), // 2 hour payment window
  pickupReminderSent: boolean("pickup_reminder_sent").default(false), // Track if reminder was sent
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// KYC Documents table (linked to orders)
export const kycDocuments = pgTable("kyc_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  passportPublicId: text("passport_public_id").notNull(), // Cloudinary public ID
  documentType: text("document_type").default("passport"), // Currently only passport
  verificationStatus: text("verification_status").default("pending"), // Matches order.kycStatus
  verifiedBy: uuid("verified_by").references(() => profiles.id), // Admin who verified
  verificationNotes: text("verification_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reviews table (testimonials)
export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").notNull(),
  country: text("country").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  tripType: text("trip_type").notNull(), // 'business', 'leisure', 'family', 'solo'
  tripDuration: text("trip_duration").notNull(), // '1-3', '4-7', '8-14', '15+' days
  reviewText: text("review_text").notNull(),
  isApproved: boolean("is_approved").default(false), // Auto-approved for 4-5 stars
  reviewedAt: timestamp("reviewed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Admin activity log
export const adminLogs = pgTable("admin_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminId: uuid("admin_id").notNull().references(() => profiles.id),
  action: text("action").notNull(), // 'approve_kyc', 'reject_kyc', 'process_refund', etc.
  targetId: text("target_id"), // ID of the record affected
  targetType: text("target_type"), // 'order', 'kyc_document', etc.
  details: json("details"), // Additional details about the action
  ip: text("ip"), // IP address of admin
  userAgent: text("user_agent"), // Browser info
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Refund policies table
export const refundPolicies = pgTable("refund_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // 'auto_refund_on_expiry', 'auto_refund_on_rejection', etc.
  description: text("description"),
  isEnabled: boolean("is_enabled").default(true),
  adminFeeType: text("admin_fee_type").default("percentage"), // 'percentage' or 'fixed'
  adminFeeValue: integer("admin_fee_value").default(0), // percentage or fixed amount in cents
  autoRefundOnExpiry: boolean("auto_refund_on_expiry").default(false),
  autoRefundOnRejection: boolean("auto_refund_on_rejection").default(false),
  autoRefundOnCancellation: boolean("auto_refund_on_cancellation").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});