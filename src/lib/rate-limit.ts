// src/lib/rate-limit.ts

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory rate limiter store
const rateLimitStore = new Map<string, RateLimitRecord>();

// In-memory rate limiter function
function checkInMemoryRateLimit(key: string, maxAttempts: number, windowMs: number): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: maxAttempts - 1, reset: now + windowMs };
  }

  if (record.count >= maxAttempts) {
    return { success: false, remaining: 0, reset: record.resetTime };
  }

  record.count++;
  return { success: true, remaining: maxAttempts - record.count, reset: record.resetTime };
}

// Rate limit configurations
const RATE_LIMITS = {
  upload: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },       // 5 attempts/hour
  checkout: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },     // 3 attempts/hour
  adminLogin: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },   // 5 attempts/15min
} as const;

// Check rate limit using in-memory (default) or Upstash (if configured)
export async function checkRateLimit(
  type: keyof typeof RATE_LIMITS,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const { maxAttempts, windowMs } = RATE_LIMITS[type];
  const key = `rate_limit:${type}:${identifier}`;

  // Try Upstash if environment variables are set
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const response = await fetch(kvUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${kvToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: 'INCR',
          args: [key],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.result || 1;

        // Set expiry on first access
        if (count === 1) {
          await fetch(kvUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${kvToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              command: 'EXPIRE',
              args: [key, Math.floor(windowMs / 1000)],
            }),
          });
        }

        const resetTime = Date.now() + windowMs;
        const remaining = Math.max(0, maxAttempts - count);

        return {
          success: count <= maxAttempts,
          remaining,
          reset: resetTime,
        };
      }
    } catch (error) {
      console.warn('Upstash rate limit failed, falling back to in-memory:', error);
    }
  }

  // Fallback to in-memory rate limiting
  return checkInMemoryRateLimit(key, maxAttempts, windowMs);
}

// Convenience functions for specific rate limits
export const rateLimit = {
  upload: (identifier: string) => checkRateLimit('upload', identifier),
  checkout: (identifier: string) => checkRateLimit('checkout', identifier),
  adminLogin: (identifier: string) => checkRateLimit('adminLogin', identifier),
};

// Clean up expired records from in-memory store (call periodically in dev)
export function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}
