import React from "react";
import { AGENTS } from "./agentRoster";

export { AGENTS, AGENT_KEYS, SECRETARY, buildRosterSummary } from "./agentRoster";

export default function AgentCard({ agentKey, isActive, onClick }) {
  const agent = AGENTS[agentKey];
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-200 text-left ${
        isActive ? agent.activeColor + " border-transparent shadow-md" : agent.color + " hover:shadow-sm"
      }`}
    >
      <span className="text-2xl">{agent.emoji}</span>
      <div className="min-w-0">
        <p className={`text-xs font-bold tracking-wide ${isActive ? "text-white/70" : "text-muted-foreground"}`}>
          {agent.short}
        </p>
        <p className={`text-sm font-semibold truncate ${isActive ? "text-white" : ""}`}>{agent.name}</p>
      </div>
    </button>
  );
}