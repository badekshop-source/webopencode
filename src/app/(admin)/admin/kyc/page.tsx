// src/app/(admin)/admin/kyc/page.tsx
import { db } from "@/lib/db";
import { orders, kycDocuments, profiles } from "@/lib/db/schema";
import { eq, desc, and, ilike, count, or } from "drizzle-orm";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { KYCClientPage } from "@/components/admin/kyc-client-page";

const KYC_STATUSES = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "auto_approved", label: "Auto Approved" },
  { value: "retry_1", label: "Retry 1" },
  { value: "retry_2", label: "Retry 2" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default async function AdminKycPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  if (!db) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-medium">Database Connection Error</p>
        <p className="text-sm mt-1">Please check your environment variables.</p>
      </div>
    );
  }

  const { search, status } = await searchParams;

  const whereClauses = [];
  if (search) {
    whereClauses.push(
      or(
        ilike(orders.orderNumber, `%${search}%`),
        ilike(orders.fullName, `%${search}%`),
        ilike(orders.customerEmail, `%${search}%`)
      )
    );
  }
  if (status) {
    whereClauses.push(eq(orders.kycStatus, status));
  }

  const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;

  const [kycList, totalResult] = await Promise.all([
    db
      .select({
        order: orders,
        kycDoc: kycDocuments,
        customer: profiles,
      })
      .from(orders)
      .leftJoin(kycDocuments, eq(orders.id, kycDocuments.orderId))
      .leftJoin(profiles, eq(orders.userId, profiles.id))
      .where(where)
      .orderBy(desc(orders.updatedAt))
      .limit(100),
    db.select({ count: count() }).from(orders).where(where),
  ]);

  type KYCListResult = {
    order: typeof orders.$inferSelect;
    kycDoc: typeof kycDocuments.$inferSelect | null;
    customer: typeof profiles.$inferSelect | null;
  };

  const typedKycList = kycList as KYCListResult[];
  const totalKYC = totalResult[0]?.count ?? 0;

  const tableData = typedKycList.map(({ order }) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.fullName,
    customerEmail: order.customerEmail,
    kycStatus: order.kycStatus ?? "pending",
    kycAttempts: order.kycAttempts ?? 0,
    passportUrl: order.passportUrl,
    imeiNumber: order.imeiNumber,
    updatedAt: order.updatedAt?.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) ?? "N/A",
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalKYC} record{totalKYC !== 1 ? "s" : ""} • Select multiple records to batch approve/reject
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search by order #, name, or email..."
              defaultValue={search}
              className="pl-9 bg-gray-50 border-gray-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              name="status"
              defaultValue={status}
              className="h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {KYC_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Client-side table with batch actions */}
      <KYCClientPage initialData={tableData} />
    </div>
  );
}