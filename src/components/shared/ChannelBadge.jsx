import React from "react";
import { CHANNELS } from "./constants";

export default function ChannelBadge({ channel }) {
  const c = CHANNELS[channel] || CHANNELS.other;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}