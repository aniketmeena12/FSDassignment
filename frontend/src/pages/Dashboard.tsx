import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";

interface Stat { total: number; running: number; blocked: number; done: number; }

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stat>({ total: 0, running: 0, blocked: 0, done: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date, created_at")
        .order("created_at", { ascending: false });
      const all = data ?? [];
      setStats({
        total: all.length,
        running: all.filter((t) => t.status === "in_progress").length,
        blocked: all.filter((t) => t.status === "blocked").length,
        done: all.filter((t) => t.status === "done").length,
      });
      setRecent(all.slice(0, 6));
      setLoading(false);
    })();
  }, [user]);

  return (
    <DashboardLayout>
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-base">
        <div>
          <div className="text-[10px] font-mono text-text-dim tracking-[0.2em] uppercase">Telemetry</div>
          <h1 className="font-mono text-base text-text-bright tracking-tight">Dashboard / Overview</h1>
        </div>
        <div className="font-mono text-[10px] text-text-muted uppercase tracking-widest tabular-nums">
          {new Date().toISOString().slice(0, 19).replace("T", " ")}
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-border bg-surface-base">
        {[
          { label: "Total Directives", value: stats.total, color: "text-text-bright" },
          { label: "Running Threads", value: stats.running, color: "text-status-run" },
          { label: "Blocked Gates", value: stats.blocked, color: "text-status-halt" },
          { label: "Completed", value: stats.done, color: "text-status-done" },
        ].map((s, i) => (
          <div key={s.label} className={`p-6 ${i < 3 ? "border-r border-border" : ""}`}>
            <div className="text-[10px] font-mono text-text-dim tracking-[0.15em] uppercase mb-2">
              {s.label}
            </div>
            <div className={`text-3xl font-mono tabular-nums tracking-tight ${s.color}`}>
              {String(s.value).padStart(2, "0")}
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 border-b border-border bg-surface-panel">
        <div className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
          Recent Activity
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="p-12 text-center font-mono text-xs text-text-dim uppercase tracking-widest">
            Loading telemetry...
          </div>
        ) : recent.length === 0 ? (
          <div className="p-12 text-center">
            <div className="font-mono text-xs text-text-dim uppercase tracking-widest mb-4">
              No directives yet
            </div>
            <button
              onClick={() => navigate("/tasks/new")}
              className="font-mono text-[10px] uppercase tracking-widest text-text-bright border border-border-crisp px-4 py-2 hover:bg-surface-raised transition-colors"
            >
              + Create First Directive
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((t) => (
              <div
                key={t.id}
                onClick={() => navigate(`/tasks/${t.id}`)}
                className="grid grid-cols-[100px_minmax(0,1fr)_140px_140px] px-6 py-4 items-center hover:bg-surface-raised/40 cursor-pointer transition-colors"
              >
                <div className="font-mono text-xs text-text-dim">
                  KN-{t.id.slice(0, 4).toUpperCase()}
                </div>
                <div className="text-sm font-medium text-text-bright truncate pr-4">
                  {t.title}
                </div>
                <PriorityBadge priority={t.priority} />
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
