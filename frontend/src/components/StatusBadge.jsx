import React, { useState } from "react";

const statusMap = {
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  confirmed: { color: "bg-green-600 text-white", label: "Confirmed" },
  rejected: { color: "bg-red-600 text-white", label: "Rejected" },
};

export default function StatusBadge({ status, reason }) {
  const [showReason, setShowReason] = useState(false);
  const info = statusMap[status] || statusMap["pending"];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${info.color} cursor-pointer relative`}
      onClick={() => status === "rejected" && setShowReason(v => !v)}
      title={status === "rejected" && reason ? "Click to view reason" : info.label}
    >
      {info.label}
      {status === "rejected" && showReason && reason && (
        <span className="absolute left-1/2 top-full mt-2 w-64 -translate-x-1/2 bg-white text-red-700 border border-red-300 rounded shadow-lg p-2 z-10 whitespace-pre-line">
          {reason}
        </span>
      )}
    </span>
  );
}
