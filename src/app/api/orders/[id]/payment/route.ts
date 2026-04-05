// src/app/api/orders/[id]/payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { snap } from "@/lib/midtrans";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;

  try {
    // Check rate limit (3 checkout attempts per hour per order)
    const rateLimitResult = await rateLimit.checkout(orderId);
    if (!rateLimitResult.success) {
      const minutesLeft = Math.ceil((rateLimitResult.reset - Date.now()) / 60000);
      return NextResponse.json(
        { success: false, error: `Too many payment attempts. Please try again in ${minutesLeft} minutes.` },
        { status: 429 }
      );
    }

    // Fetch order details
    const orderResult = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerEmail: orders.customerEmail,
        fullName: orders.fullName,
        total: orders.total,
        orderStatus: orders.orderStatus,
        paymentStatus: orders.paymentStatus,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderResult.length) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const order = orderResult[0];

    // Check if order already paid
    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        { success: false, error: "Order already paid" },
        { status: 400 }
      );
    }

    // Check if order has expired
    if (order.orderStatus === "expired") {
      return NextResponse.json(
        { success: false, error: "Order has expired" },
        { status: 400 }
      );
    }

    // Prepare transaction details for Midtrans
    const transactionDetails = {
      order_id: order.orderNumber,
      gross_amount: Math.round(order.total), // Amount in IDR cents (ensure it's a whole number)
    };

    const customerDetails = {
      first_name: order.fullName.split(" ")[0],
      last_name: order.fullName.split(" ").slice(1).join(" "),
      email: order.customerEmail,
    };

    const creditCard = {
      secure: true, // Use 3D Secure
    };

    const finishUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/order-success?id=${orderId}`;
    const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment-failed?order=${orderId}`;

    // Create transaction token
    const transaction = {
      transaction_details: transactionDetails,
      customer_details: customerDetails,
      credit_card: creditCard,
      callbacks: {
        finish: finishUrl,
        error: errorUrl,
      },
    };

    // Call Midtrans Snap API
    const transactionToken = await snap.createTransaction(transaction);

    // Return redirect URL to client
    return NextResponse.json({
      success: true,
      redirect_url: transactionToken.redirect_url,
      token: transactionToken.token_id,
    });
  } catch (error) {
    console.error("Error creating Midtrans transaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}