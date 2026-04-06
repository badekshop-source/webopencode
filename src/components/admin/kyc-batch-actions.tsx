"use client";

// src/components/admin/kyc-batch-actions.tsx
import { useState, useCallback } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface BatchActionsProps {
  selectedIds: string[];
  onSuccess: () => void;
  onClear: () => void;
}

export function KYCBatchActions({ selectedIds, onSuccess, onClear }: BatchActionsProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleBatchAction = useCallback(
    async (action: "approve" | "reject") => {
      const setLoading = action === "approve" ? setIsApproving : setIsRejecting;
      setLoading(true);

      try {
        const response = await fetch("/api/admin/kyc/batch-approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderIds: selectedIds,
            action,
            notes: action === "approve" ? "Batch approved" : "Batch rejected",
          }),
        });

        const data = await response.json();

        if (data.success) {
          alert(`Successfully ${action === "approve" ? "approved" : "rejected"} ${data.data.processed} KYC records`);
          if (data.data.skipped > 0) {
            alert(`${data.data.skipped} records were skipped (invalid status)`);
          }
          onClear();
          onSuccess();
        } else {
          alert(data.error || "Failed to process batch request");
        }
      } catch {
        alert("An error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [selectedIds, onSuccess, onClear]
  );

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex items-center gap-4 z-50">
      <span className="text-sm font-medium text-gray-700">
        {selectedIds.length} selected
      </span>
      <div className="h-6 w-px bg-gray-200" />
      <button
        onClick={() => handleBatchAction("approve")}
        disabled={isApproving || isRejecting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isApproving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        Approve All
      </button>
      <button
        onClick={() => handleBatchAction("reject")}
        disabled={isApproving || isRejecting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isRejecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        Reject All
      </button>
      <button
        onClick={onClear}
        className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}