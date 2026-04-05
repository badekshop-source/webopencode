import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, products } from '@/lib/db/schema';
import { eq, and, lte, gt } from 'drizzle-orm';
import { sendFollowUpEmail } from '@/lib/email';
import { generateOrderToken } from '@/lib/token';

/**
 * Cron job to send follow-up review emails 3 days after order completion
 * Triggered by Vercel Cron or manually via API
 */
export async function GET(request: NextRequest) {
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
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find orders that:
    // - Were completed between 3-7 days ago
    // - Have KYC approved
    // - Don't have a review yet
    const completedOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerEmail: orders.customerEmail,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(
        and(
          eq(orders.orderStatus, 'completed'),
          gt(orders.updatedAt, sevenDaysAgo),
          lte(orders.updatedAt, threeDaysAgo),
        )
      );

    if (completedOrders.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No follow-up emails to send' });
    }

    let sentCount = 0;
    const sentOrders = [];

    for (const order of completedOrders) {
      try {
        const productResult = await db
          .select({ name: products.name })
          .from(orders)
          .leftJoin(products, eq(orders.productId, products.id))
          .where(eq(orders.id, order.id))
          .limit(1);

        const token = generateOrderToken(order.id, order.customerEmail, order.orderNumber);
        const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL}/order/${order.id}/review?token=${token}`;

        await sendFollowUpEmail({
          to: order.customerEmail,
          orderNumber: order.orderNumber,
          productName: productResult[0]?.name || 'Product',
          reviewLink,
        });

        sentCount++;
        sentOrders.push(order.orderNumber);

        console.log(`Follow-up email sent for order ${order.orderNumber}`);
      } catch (error) {
        console.error(`Error sending follow-up email for order ${order.orderNumber}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      orderNumbers: sentOrders,
    });
  } catch (error) {
    console.error('Error processing follow-up emails:', error);
    return NextResponse.json({ success: false, error: 'Failed to process follow-up emails' }, { status: 500 });
  }
}
