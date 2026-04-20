import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { DashboardLayout } from "@/components/DashboardLayout";
import { taskApi, userApi, Task, User } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().trim().min(1, "Title required").max(200),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(["pending", "in_progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
});

const TaskEditor = () => {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [profiles, setProfiles] = useState<User[]>([]);
  const [form, setForm] = useState<{
    title: string;
    description: string;
    status: "pending" | "in_progress" | "completed";
    priority: "low" | "medium" | "high";
    dueDate: string;
    assignedTo: string;
  }>({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    dueDate: "",
    assignedTo: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    
    (async () => {
      try {
        const { data: users } = await userApi.getAll(token);
        setProfiles(users ?? []);
      } catch (error) {
        console.error("Failed to load users:", error);
      }
    })();

    if (!isNew) {
      (async () => {
        try {
          const task = await taskApi.getById(id!, token);
          setForm({
            title: task.title,
            description: task.description ?? "",
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
            assignedTo: task.assignedTo?._id ?? "",
          });
        } catch (error) {
          console.error("Failed to load task:", error);
        }
      })();
    }
  }, [id, isNew, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!user || !token) return;
    setLoading(true);
    const payload: any = {
      title: form.title,
      status: form.status,
      priority: form.priority,
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...(form.dueDate ? { dueDate: form.dueDate } : {}),
      ...(form.assignedTo ? { assignedTo: form.assignedTo } : {}),
    };

    try {
      if (isNew) {
        const result = await taskApi.create(payload, token);
        toast.success("Directive created");
        navigate(`/tasks/${result._id}`);
      } else {
        await taskApi.update(id!, payload, token);
        toast.success("Directive updated");
        navigate(`/tasks/${id}`);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-base">
        <div>
          <div className="text-[10px] font-mono text-text-dim tracking-[0.2em] uppercase">
            Operations
          </div>
          <h1 className="font-mono text-base text-text-bright tracking-tight">
            {isNew ? "New Directive" : "Edit Directive"}
          </h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-6 max-w-3xl space-y-5">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
            Title
          </Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-surface-raised border-border-crisp font-mono text-sm rounded-none"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
            Parameters
          </Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="bg-surface-raised border-border-crisp font-mono text-sm rounded-none min-h-[120px]"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Status
            </Label>
            <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
              <SelectTrigger className="bg-surface-raised border-border-crisp font-mono text-sm rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Queued</SelectItem>
                <SelectItem value="in_progress">Running</SelectItem>
                <SelectItem value="completed">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Priority
            </Label>
            <Select value={form.priority} onValueChange={(v: any) => setForm({ ...form, priority: v })}>
              <SelectTrigger className="bg-surface-raised border-border-crisp font-mono text-sm rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Due Date
            </Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="bg-surface-raised border-border-crisp font-mono text-sm rounded-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Assigned Operator
            </Label>
            <Select
              value={form.assignedTo || "unassigned"}
              onValueChange={(v) => setForm({ ...form, assignedTo: v === "unassigned" ? "" : v })}
            >
              <SelectTrigger className="bg-surface-raised border-border-crisp font-mono text-sm rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name || p.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="font-mono text-[10px] uppercase tracking-widest h-9 rounded-none bg-text-bright text-surface-base hover:bg-text-bright/90"
          >
            {loading ? "Saving..." : isNew ? "Create Directive" : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="font-mono text-[10px] uppercase tracking-widest h-9 rounded-none border-border-crisp bg-transparent text-text-muted hover:bg-surface-raised hover:text-text-bright"
          >
            Cancel
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default TaskEditor;
