import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { taskApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

type Status = "all" | "pending" | "in_progress" | "completed";
type Priority = "all" | "low" | "medium" | "high";
type Sort = "due_date" | "priority" | "status" | "created_at";

const SORT_BY_MAP: Record<Sort, string> = {
  created_at: "createdAt",
  due_date: "dueDate",
  priority: "priority",
  status: "status",
};

const PAGE = 10;

const TaskList = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<Status>("all");
  const [priority, setPriority] = useState<Priority>("all");
  const [sort, setSort] = useState<Sort>("created_at");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    
    (async () => {
      try {
        setLoading(true);
        const params: any = {
          page,
          limit: PAGE,
          sortBy: SORT_BY_MAP[sort],
          sortOrder: sort === "created_at" ? "desc" : "asc",
        };
        if (status !== "all") params.status = status;
        if (priority !== "all") params.priority = priority;
        
        const { data, count: c } = await taskApi.getAll(token, params);
        setTasks(data ?? []);
        setCount(c ?? 0);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, priority, sort, page, token]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE));

  return (
    <DashboardLayout>
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-base">
        <div>
          <div className="text-[10px] font-mono text-text-dim tracking-[0.2em] uppercase">Operations</div>
          <h1 className="font-mono text-base text-text-bright tracking-tight">Active Matrix</h1>
        </div>
        <Button
          onClick={() => navigate("/tasks/new")}
          className="font-mono text-[10px] uppercase tracking-widest h-8 rounded-none bg-text-bright text-surface-base hover:bg-text-bright/90"
        >
          <Plus className="w-3 h-3 mr-1" /> New Directive
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-border bg-surface-panel">
        <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
          Filter
        </span>
        <Select value={status} onValueChange={(v) => { setStatus(v as Status); setPage(1); }}>
          <SelectTrigger className="w-36 h-8 rounded-none bg-surface-raised border-border-crisp font-mono text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            <SelectItem value="pending">Queued</SelectItem>
            <SelectItem value="in_progress">Running</SelectItem>
            <SelectItem value="completed">Complete</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => { setPriority(v as Priority); setPage(1); }}>
          <SelectTrigger className="w-36 h-8 rounded-none bg-surface-raised border-border-crisp font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest ml-auto">
          Sort
        </span>
        <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
          <SelectTrigger className="w-40 h-8 rounded-none bg-surface-raised border-border-crisp font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Newest</SelectItem>
            <SelectItem value="due_date">Due date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[100px_140px_minmax(0,1fr)_120px_140px] border-b border-border-crisp bg-surface-raised px-6 py-2.5 text-[10px] font-mono text-text-muted uppercase tracking-[0.2em]">
            <div>Ident</div>
            <div>State</div>
            <div>Directive</div>
            <div>Priority</div>
            <div className="text-right">Due</div>
          </div>
          {loading ? (
            <div className="p-12 text-center font-mono text-xs text-text-dim uppercase tracking-widest">
              Loading...
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs text-text-dim uppercase tracking-widest">
              No directives match current filters
            </div>
          ) : (
            tasks.map((t) => (
              <div
                key={t._id}
                onClick={() => navigate(`/tasks/${t._id}`)}
                className="grid grid-cols-[100px_140px_minmax(0,1fr)_120px_140px] border-b border-border hover:bg-surface-raised/50 px-6 py-4 items-center cursor-pointer transition-colors group"
              >
                <div className="font-mono text-xs text-text-dim group-hover:text-text-muted">
                  KN-{t._id.slice(0, 4).toUpperCase()}
                </div>
                <StatusBadge status={t.status} />
                <div className="pr-6 truncate">
                  <div className="text-sm font-medium text-text-bright truncate">{t.title}</div>
                  {t.description && (
                    <div className="font-mono text-[10px] text-text-dim mt-1 truncate">
                      {t.description}
                    </div>
                  )}
                </div>
                <PriorityBadge priority={t.priority} />
                <div className="font-mono text-xs text-text-muted text-right tabular-nums">
                  {t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : "—"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface-base">
        <div className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
          {count} directives · page {page} / {totalPages}
        </div>
        <div className="flex gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="border border-border-crisp p-1.5 disabled:opacity-30 hover:bg-surface-raised"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border border-border-crisp p-1.5 disabled:opacity-30 hover:bg-surface-raised"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TaskList;
