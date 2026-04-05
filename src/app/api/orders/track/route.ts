// src/app/api/orders/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, products } from '@/lib/db/schema';
import { eq, or, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 500 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const orderNumber = searchParams.get('orderNumber');
    const email = searchParams.get('email');
    const id = searchParams.get('id');

    if (!orderNumber && !email && !id) {
      return NextResponse.json({ success: false, error: 'Order number, email, or ID is required' }, { status: 400 });
    }

    const conditions = [];
    if (orderNumber) conditions.push(eq(orders.orderNumber, orderNumber));
    if (email) conditions.push(eq(orders.customerEmail, email.toLowerCase()));
    if (id) conditions.push(eq(orders.id, id));

    const result = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        fullName: orders.fullName,
        customerEmail: orders.customerEmail,
        orderStatus: orders.orderStatus,
        paymentStatus: orders.paymentStatus,
        kycStatus: orders.kycStatus,
        total: orders.total,
        productId: orders.productId,
        createdAt: orders.createdAt,
        productName: products.name,
        productCategory: products.category,
        productDuration: products.duration,
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .where(or(...conditions))
      .orderBy(orders.createdAt)
      .limit(10);

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, orders: result });
  } catch (error) {
    console.error('Error tracking order:', error);
    return NextResponse.json({ success: false, error: 'Failed to track order' }, { status: 500 });
  }
}
