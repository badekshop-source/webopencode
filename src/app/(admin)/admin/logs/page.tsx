// src/app/(admin)/admin/logs/page.tsx
import { db } from "@/lib/db";
import { adminLogs, profiles } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { FileText, User, Package } from "lucide-react";
import Link from "next/link";

const actionColors: Record<string, string> = {
  approve_kyc: "bg-green-100 text-green-700",
  reject_kyc: "bg-red-100 text-red-700",
  update_order_status: "bg-blue-100 text-blue-700",
  process_refund: "bg-orange-100 text-orange-700",
  create_product: "bg-purple-100 text-purple-700",
  update_product: "bg-yellow-100 text-yellow-700",
  delete_product: "bg-gray-100 text-gray-700",
};

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const actionFilter = params.action || "";
  const limit = 20;
  const offset = (page - 1) * limit;

  if (!db) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-medium">Database Connection Error</p>
        <p className="text-sm mt-1">Please check your environment variables.</p>
      </div>
    );
  }

  const whereClause = actionFilter ? undefined : undefined;
  
  const [logsResult, countResult] = await Promise.all([
    db
      .select({
        log: adminLogs,
        admin: profiles,
      })
      .from(adminLogs)
      .leftJoin(profiles, eq(adminLogs.adminId, profiles.id))
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(adminLogs),
  ]);

  const totalLogs = countResult[0]?.count ?? 0;
  const totalPages = Math.ceil(totalLogs / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">{totalLogs} total actions</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <form className="flex gap-2 flex-1 max-w-sm">
          <input
            type="text"
            name="action"
            defaultValue={actionFilter}
            placeholder="Filter by action..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      <DataTable
        headers={[
          { key: "date", label: "Date" },
          { key: "admin", label: "Admin" },
          { key: "action", label: "Action" },
          { key: "target", label: "Target" },
          { key: "details", label: "Details" },
        ]}
        rows={logsResult.map(({ log, admin }: { log: typeof adminLogs.$inferSelect; admin: typeof profiles.$inferSelect | null }) => ({
          id: log.id,
          cells: {
            date: (
              <span className="text-sm text-gray-600 whitespace-nowrap">
                {formatDate(log.createdAt)}
              </span>
            ),
            admin: (
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm font-medium">{admin?.name || "Unknown"}</span>
              </div>
            ),
            action: (
              <Badge className={actionColors[log.action] || "bg-gray-100 text-gray-700"}>
                {log.action.replace(/_/g, " ")}
              </Badge>
            ),
            target: (
              <div className="flex items-center gap-2">
                {log.targetType === "order" && <Package className="w-3.5 h-3.5 text-gray-400" />}
                {log.targetType === "kyc_document" && <FileText className="w-3.5 h-3.5 text-gray-400" />}
                <span className="text-sm text-gray-600 font-mono truncate max-w-[120px]">
                  {log.targetId?.slice(0, 8)}...
                </span>
              </div>
            ),
            details: (
              <span className="text-sm text-gray-500 truncate max-w-[200px] block">
                {log.details ? JSON.stringify(log.details).slice(0, 50) + "..." : "-"}
              </span>
            ),
          },
        }))}
        emptyMessage="No audit logs found"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {offset + 1}-{Math.min(offset + limit, totalLogs)} of {totalLogs}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/logs?page=${page - 1}${actionFilter ? `&action=${actionFilter}` : ""}`}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/logs?page=${page + 1}${actionFilter ? `&action=${actionFilter}` : ""}`}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
