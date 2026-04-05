import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, products } from '@/lib/db/schema';
import { eq, and, lte, gt, isNull } from 'drizzle-orm';
import { sendPickupReminderEmail } from '@/lib/email';

/**
 * Cron job to send pickup reminder emails 24h before arrival
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
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find orders where:
    // - KYC is approved/auto_approved
    // - Arrival date is within next 24 hours
    // - Pickup reminder has NOT been sent yet
    // - Order is not cancelled/expired
    const upcomingOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerEmail: orders.customerEmail,
        arrivalDate: orders.arrivalDate,
        flightNumber: orders.flightNumber,
        activationOutlet: orders.activationOutlet,
        pickupReminderSent: orders.pickupReminderSent,
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .where(
        and(
          eq(orders.kycStatus, 'auto_approved'),
          gt(orders.arrivalDate, now),
          lte(orders.arrivalDate, tomorrow),
          eq(orders.pickupReminderSent, false),
          eq(orders.orderStatus, 'processing'),
        )
      );

    if (upcomingOrders.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No reminders to send' });
    }

    let sentCount = 0;
    const sentOrders = [];

    for (const order of upcomingOrders) {
      try {
        const productResult = await db
          .select({ name: products.name })
          .from(products)
          .leftJoin(orders, eq(products.id, orders.productId))
          .where(eq(orders.id, order.id))
          .limit(1);

        await sendPickupReminderEmail({
          to: order.customerEmail,
          orderNumber: order.orderNumber,
          productName: productResult[0]?.name || 'Product',
          arrivalDate: order.arrivalDate,
          flightNumber: order.flightNumber,
          activationOutlet: order.activationOutlet,
        });

        // Mark reminder as sent
        await db
          .update(orders)
          .set({
            pickupReminderSent: true,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        sentCount++;
        sentOrders.push(order.orderNumber);

        console.log(`Pickup reminder sent for order ${order.orderNumber}`);
      } catch (error) {
        console.error(`Error sending pickup reminder for order ${order.orderNumber}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      orderNumbers: sentOrders,
    });
  } catch (error) {
    console.error('Error processing pickup reminders:', error);
    return NextResponse.json({ success: false, error: 'Failed to process pickup reminders' }, { status: 500 });
  }
}
