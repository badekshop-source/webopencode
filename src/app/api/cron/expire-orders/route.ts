// src/app/api/cron/expire-orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, adminLogs } from '@/lib/db/schema';
import { eq, lt, and } from 'drizzle-orm';

/**
 * Cron job to expire unpaid orders past their payment window
 * Triggered by Vercel Cron or manually via API
 */
export async function GET(request: NextRequest) {
  // Verify cron secret if provided
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== 'Bearer ' + cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 500 });
  }

  try {
    const now = new Date();

    // Find orders past their payment window that are still pending
    const expiredOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        expiresAt: orders.expiresAt,
      })
      .from(orders)
      .where(
        and(
          eq(orders.paymentStatus, 'pending'),
          lt(orders.expiresAt, now),
        )
      );

    if (expiredOrders.length === 0) {
      return NextResponse.json({ success: true, expired: 0, message: 'No orders to expire' });
    }

    // Update ALL expired orders
    const orderIds = expiredOrders.map((o: { id: string }) => o.id);
    
    await db
      .update(orders)
      .set({
        orderStatus: 'expired',
        updatedAt: new Date(),
      })
      .where(eq(orders.paymentStatus, 'pending'));

    // Log the action
    await db.insert(adminLogs).values({
      adminId: '00000000-0000-0000-0000-000000000000', // System admin
      action: 'expire_orders',
      targetId: orderIds.join(','),
      targetType: 'order',
      details: {
        count: expiredOrders.length,
        orderNumbers: expiredOrders.map((o: { orderNumber: string }) => o.orderNumber),
      },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      expired: expiredOrders.length,
      orderNumbers: expiredOrders.map((o: { orderNumber: string }) => o.orderNumber),
    });
  } catch (error) {
    console.error('Error expiring orders:', error);
    return NextResponse.json({ success: false, error: 'Failed to expire orders' }, { status: 500 });
  }
}
