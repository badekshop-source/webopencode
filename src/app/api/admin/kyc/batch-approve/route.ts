// src/app/api/admin/kyc/batch-approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, kycDocuments, adminLogs } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { unauthorizedResponse } from "@/lib/auth-utils";
import { auth } from "@/lib/auth";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { sendKycApprovedEmail } from "@/lib/email";
import logger from "@/lib/logger";

const batchApproveSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
});

type KycOrderResult = {
  order: typeof orders.$inferSelect;
  kycDoc: typeof kycDocuments.$inferSelect | null;
};

async function getAdminUser(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return null;
    }

    const userProfile = await db
      .select({
        id: profiles.id,
        role: profiles.role,
      })
      .from(profiles)
      .where(eq(profiles.email, session.user.email))
      .limit(1);

    if (userProfile.length === 0 || userProfile[0].role !== "admin") {
      return null;
    }

    return {
      id: userProfile[0].id,
      email: session.user.email,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const adminUser = await getAdminUser(request);
  if (!adminUser) {
    return unauthorizedResponse();
  }

  if (!db) {
    return NextResponse.json({ error: "Database not connected" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { orderIds, action, notes } = batchApproveSchema.parse(body);

    const newKycStatus = action === "approve" ? "approved" : "rejected";
    const newOrderStatus = action === "approve" ? "processing" : "rejected";

    // Fetch orders with pending KYC
    const ordersToUpdate = await db
      .select({
        order: orders,
        kycDoc: kycDocuments,
      })
      .from(orders)
      .leftJoin(kycDocuments, eq(orders.id, kycDocuments.orderId))
      .where(inArray(orders.id, orderIds));

    // Filter only orders that can be approved/rejected
    const validOrders = ordersToUpdate.filter(
      (item: KycOrderResult) =>
        item.order.kycStatus === "under_review" ||
        item.order.kycStatus === "pending" ||
        item.order.kycStatus === "retry_1" ||
        item.order.kycStatus === "retry_2"
    );

    if (validOrders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid orders to update",
        },
        { status: 400 }
      );
    }

    const validOrderIds = validOrders.map((item: KycOrderResult) => item.order.id);
    const now = new Date();

    // Update orders
    await db
      .update(orders)
      .set({
        kycStatus: newKycStatus,
        orderStatus: newOrderStatus,
        updatedAt: now,
      })
      .where(inArray(orders.id, validOrderIds));

    // Update KYC documents
    await db
      .update(kycDocuments)
      .set({
        verificationStatus: newKycStatus,
        verifiedBy: adminUser.id,
        verificationNotes: notes || (action === "approve" ? "Batch approved" : "Batch rejected"),
        updatedAt: now,
      })
      .where(inArray(kycDocuments.orderId, validOrderIds));

    // Log admin actions
    const logEntries = validOrderIds.map((orderId: string) => ({
      adminId: adminUser.id,
      action: action === "approve" ? "approve_kyc_batch" : "reject_kyc_batch",
      targetId: orderId,
      targetType: "order" as const,
      details: { notes, batchCount: validOrderIds.length },
      createdAt: now,
    }));

    await db.insert(adminLogs).values(logEntries);

    // Send emails for approved orders
    if (action === "approve") {
      for (const item of validOrders) {
        try {
          if (item.order.customerEmail && item.order.qrCodeData && item.order.accessToken) {
            await sendKycApprovedEmail({
              to: item.order.customerEmail,
              orderNumber: item.order.orderNumber,
              productName: "SIM/eSIM",
              qrCodeUrl: item.order.qrCodeData,
              activationOutlet: item.order.activationOutlet || "Ngurah Rai Airport",
              token: item.order.accessToken,
              orderId: item.order.id,
            });
          }
        } catch (emailError) {
          logger.error(`Failed to send email for order ${item.order.orderNumber}`, emailError);
        }
      }
    }

    logger.info(`${action === "approve" ? "Approved" : "Rejected"} ${validOrderIds.length} KYC records`, {
      adminId: adminUser.id,
      orderIds: validOrderIds,
      action,
    });

    return NextResponse.json({
      success: true,
      data: {
        processed: validOrderIds.length,
        skipped: orderIds.length - validOrderIds.length,
        action,
      },
    });
  } catch (error) {
    logger.error("Batch KYC approval failed", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process batch request",
      },
      { status: 500 }
    );
  }
}