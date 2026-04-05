// src/lib/workflows.ts
import { db } from '@/lib/db';
import { orders, products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendOrderConfirmationEmail, sendKycApprovedEmail, sendPickupReminderEmail, sendFollowUpEmail } from '@/lib/email';
import { generateOrderToken } from '@/lib/token';

// Send order confirmation email after order creation
export async function sendOrderConfirmation(orderId: string): Promise<boolean> {
  try {
    const orderResult = await db
      .select({
        order: orders,
        product: products,
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderResult.length) {
      console.error(`Order ${orderId} not found for confirmation email`);
      return false;
    }

    const { order, product } = orderResult[0];

    // Generate a token for this order
    const token = generateOrderToken(order.id, order.customerEmail, order.orderNumber);

    const emailSent = await sendOrderConfirmationEmail({
      to: order.customerEmail,
      orderNumber: order.orderNumber,
      productName: product?.name || 'Product',
      token,
      orderId: order.id
    });

    return emailSent;
  } catch (error) {
    console.error('Error in sendOrderConfirmation workflow:', error);
    return false;
  }
}

// Send KYC approved email after verification
export async function sendKycApprovedNotification(orderId: string): Promise<boolean> {
  try {
    const orderResult = await db
      .select({
        order: orders,
        product: products,
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderResult.length) {
      console.error(`Order ${orderId} not found for KYC approved email`);
      return false;
    }

    const { order, product } = orderResult[0];

    // Generate QR code URL for the order
    const qrCodeData = `badekshop:${order.orderNumber}:${order.id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData)}`;

    // Generate a token for this order
    const token = generateOrderToken(order.id, order.customerEmail, order.orderNumber);

    const emailSent = await sendKycApprovedEmail({
      to: order.customerEmail,
      orderNumber: order.orderNumber,
      productName: product?.name || 'Product',
      qrCodeUrl,
      activationOutlet: order.activationOutlet,
      token,
      orderId: order.id
    });

    return emailSent;
  } catch (error) {
    console.error('Error in sendKycApprovedNotification workflow:', error);
    return false;
  }
}

// Pickup reminder is now handled by /api/cron/pickup-reminders cron job
// This function is kept for backward compatibility but does nothing
export async function schedulePickupReminder(orderId: string): Promise<boolean> {
  try {
    const orderResult = await db
      .select({
        order: orders,
        product: products,
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderResult.length) {
      console.error(`Order ${orderId} not found for pickup reminder`);
      return false;
    }

    const { order, product } = orderResult[0];

    const arrivalTime = new Date(order.arrivalDate).getTime();
    const currentTime = Date.now();
    const timeUntilArrival = arrivalTime - currentTime;
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (timeUntilArrival <= twentyFourHours) {
      await sendPickupReminderEmail({
        to: order.customerEmail,
        orderNumber: order.orderNumber,
        productName: product?.name || 'Product',
        arrivalDate: order.arrivalDate,
        flightNumber: order.flightNumber,
        activationOutlet: order.activationOutlet,
      });
      console.log(`Pickup reminder email sent immediately for order ${order.id}`);
    } else {
      console.log(`Pickup reminder will be sent by cron job for order ${order.id}`);
    }

    return true;
  } catch (error) {
    console.error('Error scheduling pickup reminder:', error);
    return false;
  }
}

// Follow-up email is now handled by /api/cron/follow-up-emails cron job
// This function is kept for backward compatibility but does nothing
export async function scheduleFollowUpEmail(orderId: string): Promise<boolean> {
  try {
    const orderResult = await db
      .select({
        order: orders,
        product: products,
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderResult.length) {
      console.error(`Order ${orderId} not found for follow-up email`);
      return false;
    }

    const { order, product } = orderResult[0];

    const token = generateOrderToken(order.id, order.customerEmail, order.orderNumber);
    const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL}/order/${order.id}/review?token=${token}`;

    console.log(`Follow-up email will be sent by cron job for order ${order.id}`);
    return true;
  } catch (error) {
    console.error('Error scheduling follow-up email:', error);
    return false;
  }
}

// Process order status updates to trigger appropriate emails
export async function processOrderStatusUpdate(orderId: string, newStatus: string, oldStatus: string): Promise<void> {
  try {
    // Send order confirmation when status changes to 'paid' (payment successful)
    if (newStatus === 'paid' && oldStatus !== 'paid') {
      await sendOrderConfirmation(orderId);
    }
    
    // Send KYC approved email when status changes to 'approved' or 'auto_approved'
    if ((newStatus === 'approved' || newStatus === 'auto_approved') && oldStatus !== 'approved' && oldStatus !== 'auto_approved') {
      // Update order with QR code data
      const qrCodeData = `badekshop:${orderId}`;
      
      await db.update(orders)
        .set({
          qrCodeData,
          orderStatus: newStatus === 'auto_approved' ? 'processing' : 'completed',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));
      
      await sendKycApprovedNotification(orderId);
    }
    
    // Handle under_review status - notify admin for manual review
    if (newStatus === 'under_review' && oldStatus !== 'under_review') {
      console.log(`Order ${orderId} requires manual KYC review`);
    }
    
    // Schedule pickup reminder when status changes to 'approved' or 'auto_approved'
    if ((newStatus === 'approved' || newStatus === 'auto_approved') && oldStatus !== 'approved' && oldStatus !== 'auto_approved') {
      await schedulePickupReminder(orderId);
    }
    
    // Schedule follow-up email when order is completed
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      await scheduleFollowUpEmail(orderId);
    }
  } catch (error) {
    console.error('Error processing order status update:', error);
  }
}