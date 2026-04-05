// src/app/api/admin/orders/[id]/refund/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, adminLogs, refundPolicies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { refundTransaction } from "@/lib/midtrans";

const refundSchema = z.object({
  reason: z.string().min(1, "Refund reason is required"),
  refundAmount: z.number().positive(),
  adminFee: z.number().nonnegative(),
  adminId: z.string().uuid().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const validatedData = refundSchema.parse(body);

    const orderResult = await db
      .select({
        id: orders.id,
        orderStatus: orders.orderStatus,
        paymentStatus: orders.paymentStatus,
        total: orders.total,
        refundStatus: orders.refundStatus,
        paymentGatewayId: orders.paymentGatewayId,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderResult.length) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const order = orderResult[0];

    if (order.paymentStatus !== "paid") {
      return NextResponse.json({ success: false, error: "Cannot refund unpaid order" }, { status: 400 });
    }

    if (order.refundStatus === "processed") {
      return NextResponse.json({ success: false, error: "Refund already processed" }, { status: 400 });
    }

    // Process Midtrans refund if payment gateway ID exists
    let midtransRefundSuccess = false;
    if (order.paymentGatewayId) {
      try {
        await refundTransaction(order.paymentGatewayId, validatedData.refundAmount, validatedData.reason);
        midtransRefundSuccess = true;
      } catch (refundError) {
        console.error("Midtrans refund failed:", refundError);
        // Continue with local refund even if Midtrans fails (sandbox mode)
      }
    }

    // Update order with refund details
    await db
      .update(orders)
      .set({
        refundAmount: validatedData.refundAmount,
        refundReason: validatedData.reason,
        refundStatus: "processed",
        orderStatus: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Log admin action
    if (validatedData.adminId) {
      await db.insert(adminLogs).values({
        adminId: validatedData.adminId,
        action: "process_refund",
        targetId: orderId,
        targetType: "order",
        details: {
          reason: validatedData.reason,
          refundAmount: validatedData.refundAmount,
          adminFee: validatedData.adminFee,
          orderTotal: order.total,
          midtransRefund: midtransRefundSuccess,
        },
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "Refund processed successfully",
        refundAmount: validatedData.refundAmount,
        adminFee: validatedData.adminFee,
        midtransRefund: midtransRefundSuccess,
      },
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid request", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to process refund" }, { status: 500 });
  }
}
