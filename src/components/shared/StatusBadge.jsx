import React from "react";
import { STATUSES } from "./constants";

export default function StatusBadge({ status }) {
  const s = STATUSES[status] || STATUSES.new;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${s.color}`}>
      {s.label}
    </span>
  );
}