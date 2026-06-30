import React from "react";
import { CHANNELS } from "./constants";
import { useChannels } from "./useChannels";

export default function ChannelBadge({ channel }) {
  const { channels } = useChannels();
  const found = channels.find((c) => c.key === channel);
  const c = found || CHANNELS[channel] || { label: channel || "기타", ...CHANNELS.other };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}