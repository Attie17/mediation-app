import React from "react";

export default function StatusCell({ confirmed }) {
  return confirmed ? (
    <span className="inline-flex items-center text-green-600 font-semibold">
      <span className="mr-1" aria-hidden="true">✅</span>
      <span>Confirmed</span>
      <span className="sr-only">Confirmed</span>
    </span>
  ) : (
    <span className="inline-flex items-center text-yellow-600 font-semibold">
      <span className="mr-1" aria-hidden="true">⏳</span>
      <span>Pending</span>
      <span className="sr-only">Pending</span>
    </span>
  );
}
