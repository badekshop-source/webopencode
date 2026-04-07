// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, products } from '@/lib/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { z } from 'zod';
import { generateOrderToken, getTokenExpiryDate } from '@/lib/token';
import { rateLimit } from '@/lib/rate-limit';

// Zod schema for order validation
const orderSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().optional().default(''),
  nationality: z.string().min(1, 'Nationality is required'),
  arrivalDate: z.string().min(1, 'Arrival date is required'),
  flightNumber: z.string().min(1, 'Flight number is required'),
  productId: z.string().uuid('Valid product ID is required'),
  quantity: z.number().positive('Quantity must be positive').default(1),
  subtotal: z.number().nonnegative('Subtotal must be non-negative'),
  discount: z.number().nonnegative().optional().default(0),
  tax: z.number().nonnegative().optional().default(0),
  total: z.number().nonnegative('Total must be non-negative'),
  imeiNumber: z.string().regex(/^\d{15}$/, 'IMEI must be 15 digits').optional(),
  notes: z.string().optional().default(''),
  paymentMethod: z.enum(['visa', 'mastercard', 'jcb', 'amex', 'unionpay']).optional(),
  orderStatus: z.enum(['pending', 'paid', 'processing', 'approved', 'rejected', 'expired', 'cancelled', 'completed']).default('pending'),
  kycStatus: z.enum(['pending', 'auto_approved', 'retry_1', 'retry_2', 'under_review', 'approved', 'rejected']).default('pending'),
  passportPublicId: z.string().optional(),
  passportUrl: z.string().url().optional(),
});

export async function GET() {
  if (!db) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database not connected' 
      }, 
      { status: 500 }
    );
  }
  
  try {
    const ordersList = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
    
    return NextResponse.json({ 
      success: true, 
      orders: ordersList 
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch orders' 
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database not connected' 
      }, 
      { status: 500 }
    );
  }
  
  try {
    // Check rate limit (3 checkout attempts per hour per IP)
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit.checkout(ip);
    if (!rateLimitResult.success) {
      const minutesLeft = Math.ceil((rateLimitResult.reset - Date.now()) / 60000);
      return NextResponse.json(
        { 
          success: false, 
          error: `Too many checkout attempts. Please try again in ${minutesLeft} minutes.` 
        }, 
        { status: 429 }
      );
    }

    const data = await request.json();
    
    // Validate with Zod
    const validatedData = orderSchema.parse(data);

    // Check product stock availability
    const productResult = await db
      .select({ id: products.id, stock: products.stock, name: products.name })
      .from(products)
      .where(eq(products.id, validatedData.productId))
      .limit(1);

    if (!productResult.length) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Product not found' 
        }, 
        { status: 404 }
      );
    }

    const product = productResult[0];

    // Check if product is in stock
    if (product.stock !== null && product.stock <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `${product.name} is currently out of stock. Please try again later.` 
        }, 
        { status: 400 }
      );
    }

    // Convert date strings to Date objects for Drizzle
    const insertData: Record<string, any> = {
      ...validatedData,
      arrivalDate: new Date(validatedData.arrivalDate),
    };

    // Calculate payment expiration time (2 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Insert order first without token to get the ID
    const [tempOrder] = await db
      .insert(orders)
      .values({
        ...insertData,
        orderNumber,
        expiresAt,
        accessToken: '',
        tokenExpiresAt: getTokenExpiryDate(),
      })
      .returning();

    // Generate JWT token for order access
    const accessToken = generateOrderToken(
      tempOrder.id,
      validatedData.customerEmail,
      orderNumber
    );

    // Update order with the generated token
    const [newOrder] = await db
      .update(orders)
      .set({
        accessToken,
      })
      .where(eq(orders.id, tempOrder.id))
      .returning();

    // Decrement product stock after successful order
    if (product.stock !== null) {
      await db
        .update(products)
        .set({
          stock: product.stock - 1,
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id));
    }

    // Trigger order confirmation workflow
    import('@/lib/workflows').then(workflows => {
      workflows.sendOrderConfirmation(newOrder.id).catch(console.error);
    });

    return NextResponse.json({ 
      success: true, 
      order: newOrder 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.issues 
        }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create order' 
      }, 
      { status: 500 }
    );
  }
}