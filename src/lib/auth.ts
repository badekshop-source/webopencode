// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "./db";
import { pgTable, text, uuid, timestamp, boolean } from "drizzle-orm/pg-core";

// Better-auth required tables
const user = pgTable("user", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => user.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => user.id),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// In-memory rate limiter for admin login
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

function checkLoginRateLimit(ip: string): { success: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    return { success: false, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: maxAttempts - record.count };
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET || "fallback-dev-secret-change-in-production",
  rateLimit: {
    enabled: true,
    window: 15 * 60, // 15 minutes
    max: 5, // 5 attempts per window
  },
});

// Export rate limiter for use in middleware or other routes
export { checkLoginRateLimit };