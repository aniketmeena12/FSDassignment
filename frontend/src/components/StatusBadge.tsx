type Status = "todo" | "in_progress" | "blocked" | "done";
type Priority = "low" | "medium" | "high" | "critical";

const statusMap: Record<Status, { label: string; dot: string; text: string }> = {
  todo: { label: "Queued", dot: "bg-text-muted", text: "text-text-muted" },
  in_progress: { label: "Running", dot: "bg-status-run", text: "text-text-bright" },
  blocked: { label: "Halted", dot: "bg-status-halt", text: "text-text-muted" },
  done: { label: "Complete", dot: "bg-status-done", text: "text-text-dim" },
};

const priorityMap: Record<Priority, { label: string; cls: string }> = {
  low: { label: "Low", cls: "border-border-crisp text-text-muted" },
  medium: { label: "Med", cls: "border-border-crisp text-text-bright" },
  high: { label: "High", cls: "border-status-run text-status-run" },
  critical: { label: "Critical", cls: "bg-status-halt border-status-halt text-text-bright" },
};

export const StatusBadge = ({ status }: { status: Status }) => {
  const s = statusMap[status];
  return (
    <div className="flex items-center gap-2">
      <div className={`w-1.5 h-1.5 ${s.dot}`}></div>
      <span className={`font-mono text-[10px] uppercase tracking-widest ${s.text}`}>
        {s.label}
      </span>
    </div>
  );
};

export const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const p = priorityMap[priority];
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 border uppercase tracking-wider font-mono font-semibold ${p.cls}`}
    >
      {p.label}
    </span>
  );
};
