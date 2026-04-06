"use client";

// src/components/admin/kyc-client-page.tsx
import { useState, useCallback } from "react";
import { KYCBatchActions } from "./kyc-batch-actions";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import Link from "next/link";

interface KYCRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  kycStatus: string;
  kycAttempts: number;
  passportUrl: string | null;
  imeiNumber: string | null;
  updatedAt: string;
}

interface KYCClientPageProps {
  initialData: KYCRow[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  auto_approved: "bg-green-100 text-green-800",
  retry_1: "bg-orange-100 text-orange-800",
  retry_2: "bg-orange-100 text-orange-800",
  under_review: "bg-purple-100 text-purple-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  auto_approved: "Auto Approved",
  retry_1: "Retry 1",
  retry_2: "Retry 2",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
};

export function KYCClientPage({ initialData }: KYCClientPageProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<KYCRow[]>(initialData);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    const selectableIds = rows
      .filter(
        (row) =>
          row.kycStatus === "under_review" ||
          row.kycStatus === "pending" ||
          row.kycStatus === "retry_1" ||
          row.kycStatus === "retry_2"
      )
      .map((row) => row.id);

    setSelectedIds((prev) => {
      const allSelected = selectableIds.every((id) => prev.has(id));
      if (allSelected) {
        return new Set();
      }
      return new Set(selectableIds);
    });
  }, [rows]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={toggleAll}
                    checked={
                      rows.length > 0 &&
                      rows
                        .filter(
                          (r) =>
                            r.kycStatus === "under_review" ||
                            r.kycStatus === "pending" ||
                            r.kycStatus === "retry_1" ||
                            r.kycStatus === "retry_2"
                        )
                        .every((r) => selectedIds.has(r.id))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Passport
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IMEI
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No KYC records found
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedIds.has(row.id) ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        disabled={
                          row.kycStatus !== "under_review" &&
                          row.kycStatus !== "pending" &&
                          row.kycStatus !== "retry_1" &&
                          row.kycStatus !== "retry_2"
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{row.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{row.customerName}</p>
                        <p className="text-xs text-gray-500">{row.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {row.passportUrl ? (
                        <a
                          href={row.passportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">Not uploaded</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm">{row.imeiNumber || "N/A"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          STATUS_COLORS[row.kycStatus] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {STATUS_LABELS[row.kycStatus] || row.kycStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          row.kycAttempts >= 3 ? "text-red-600 font-medium" : "text-gray-600"
                        }
                      >
                        {row.kycAttempts} / 3
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-500 text-sm">{row.updatedAt}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/kyc/${row.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        {row.kycStatus === "under_review" ? "Review" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <KYCBatchActions
        selectedIds={Array.from(selectedIds)}
        onSuccess={handleSuccess}
        onClear={clearSelection}
      />
    </>
  );
}