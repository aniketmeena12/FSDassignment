import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { taskApi, Task } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Trash2, Upload, Pencil, ArrowLeft, FileText } from "lucide-react";

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, isAdmin } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!id || !token) return;
    try {
      setLoading(true);
      const t = await taskApi.getById(id, token);
      setTask(t);
      // Documents handling depends on backend response structure
      setDocs(t.documents ?? []);
    } catch (error) {
      console.error("Failed to load task:", error);
      toast.error("Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id, token]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task || !token) return;
    if (file.type !== "application/pdf") {
      toast.error("PDF only");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Max 10MB");
      return;
    }
    if (docs.length >= 3) {
      toast.error("Max 3 documents per task");
      return;
    }
    setUploading(true);
    try {
      await taskApi.uploadDocument(task._id, file, token);
      toast.success("Document uploaded");
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDownload = async (doc: any) => {
    // This depends on how the backend serves documents
    toast.info("Download available from task documents");
  };

  const handleDeleteDoc = async (doc: any) => {
    if (!confirm("Delete this document?")) return;
    if (!token || !task) return;
    try {
      await taskApi.deleteDocument(task._id, doc._id, token);
      toast.success("Removed");
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete document");
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm("Delete directive permanently?")) return;
    if (!task || !token) return;
    try {
      await taskApi.delete(task._id, token);
      toast.success("Deleted");
      navigate("/tasks");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete task");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center font-mono text-xs text-text-dim uppercase tracking-widest">
          Loading directive...
        </div>
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center font-mono text-xs text-text-dim uppercase tracking-widest">
          Directive not found
        </div>
      </DashboardLayout>
    );
  }

  const canEdit = isAdmin || task.createdBy?._id === user?._id || task.assignedTo?._id === user?._id;
  const creator = task.createdBy;
  const assignee = task.assignedTo;

  return (
    <DashboardLayout>
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-base">
        <button
          onClick={() => navigate("/tasks")}
          className="font-mono text-[10px] text-text-muted hover:text-text-bright uppercase tracking-widest flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> Back to matrix
        </button>
        <div className="flex gap-2">
          {canEdit && (
            <Button
              onClick={() => navigate(`/tasks/${task._id}/edit`)}
              variant="outline"
              className="font-mono text-[10px] uppercase tracking-widest h-8 rounded-none border-border-crisp bg-transparent hover:bg-surface-raised"
            >
              <Pencil className="w-3 h-3 mr-1" /> Edit
            </Button>
          )}
          {(isAdmin || task.createdBy?._id === user?._id) && (
            <Button
              onClick={handleDeleteTask}
              variant="outline"
              className="font-mono text-[10px] uppercase tracking-widest h-8 rounded-none border-status-halt bg-transparent text-status-halt hover:bg-status-halt hover:text-text-bright"
            >
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>
          )}
        </div>
      </header>

      <div className="px-6 py-6 border-b border-border bg-surface-base">
        <div className="font-mono text-[10px] text-text-dim tracking-[0.2em] uppercase mb-2">
          KN-{task._id.slice(0, 8).toUpperCase()}
        </div>
        <h1 className="text-2xl text-text-bright font-medium tracking-tight mb-4">
          {task.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border bg-surface-panel">
        {[
          { label: "Created By", value: task.createdBy?.name || task.createdBy?.email || "—" },
          { label: "Assigned To", value: task.assignedTo?.name || task.assignedTo?.email || "Unassigned" },
          {
            label: "Due Date",
            value: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "No deadline",
          },
        ].map((m, i) => (
          <div key={m.label} className={`p-5 ${i < 2 ? "border-r border-border" : ""}`}>
            <div className="text-[10px] font-mono text-text-dim uppercase tracking-widest mb-2">
              {m.label}
            </div>
            <div className="text-sm text-text-bright font-medium truncate">{m.value}</div>
          </div>
        ))}
      </div>

      {task.description && (
        <div className="px-6 py-6 border-b border-border">
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-3">
            Parameters
          </div>
          <div className="text-sm text-text-bright whitespace-pre-wrap leading-relaxed">
            {task.description}
          </div>
        </div>
      )}

      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
            Attachments ({docs.length}/3)
          </div>
          {canEdit && docs.length < 3 && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                onChange={handleUpload}
                className="hidden"
              />
              <Button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="font-mono text-[10px] uppercase tracking-widest h-8 rounded-none bg-text-bright text-surface-base hover:bg-text-bright/90"
              >
                <Upload className="w-3 h-3 mr-1" />
                {uploading ? "Uploading..." : "Attach PDF"}
              </Button>
            </>
          )}
        </div>

        {docs.length === 0 ? (
          <div className="border border-dashed border-border-crisp p-8 text-center font-mono text-xs text-text-dim uppercase tracking-widest">
            No attachments
          </div>
        ) : (
          <div className="border border-border divide-y divide-border">
            {docs.map((d) => (
              <div
                key={d._id}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-raised/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-text-muted shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm text-text-bright truncate">{d.fileName}</div>
                    <div className="font-mono text-[10px] text-text-dim uppercase tracking-widest">
                      {(d.fileSize / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleDownload(d)}
                    className="p-2 text-text-muted hover:text-text-bright hover:bg-surface-raised transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  {(isAdmin || d.uploadedBy?._id === user?._id) && (
                    <button
                      onClick={() => handleDeleteDoc(d)}
                      className="p-2 text-text-muted hover:text-status-halt hover:bg-surface-raised transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TaskDetail;
