import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { userApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, User as UserIcon } from "lucide-react";

const Users = () => {
  const { user: me, token } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const { data: users } = await userApi.getAll(token);
      setProfiles(users ?? []);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const toggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (userId === me?._id && isCurrentlyAdmin) {
      toast.error("Cannot revoke your own admin");
      return;
    }
    if (!token) return;
    
    try {
      const newRole = isCurrentlyAdmin ? "user" : "admin";
      await userApi.update(userId, { role: newRole }, token);
      toast.success(isCurrentlyAdmin ? "Admin revoked" : "Admin granted");
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update role");
    }
  };

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.email?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-base">
        <div>
          <div className="text-[10px] font-mono text-text-dim tracking-[0.2em] uppercase">
            Personnel
          </div>
          <h1 className="font-mono text-base text-text-bright tracking-tight">Operators</h1>
        </div>
        <Input
          placeholder="Search operators..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 h-8 bg-surface-raised border-border-crisp font-mono text-xs rounded-none"
        />
      </header>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[minmax(0,1fr)_200px_120px_120px] border-b border-border-crisp bg-surface-raised px-6 py-2.5 text-[10px] font-mono text-text-muted uppercase tracking-[0.2em]">
          <div>Operator</div>
          <div>Email</div>
          <div>Role</div>
          <div className="text-right">Action</div>
        </div>
        {loading ? (
          <div className="p-12 text-center font-mono text-xs text-text-dim uppercase tracking-widest">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center font-mono text-xs text-text-dim uppercase tracking-widest">
            No operators
          </div>
        ) : (
          filtered.map((p) => {
            const isAdminUser = p.role === "admin";
            return (
              <div
                key={p._id}
                className="grid grid-cols-[minmax(0,1fr)_200px_120px_120px] border-b border-border px-6 py-4 items-center hover:bg-surface-raised/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-surface-raised border border-border-crisp flex items-center justify-center font-mono text-[10px] text-text-bright shrink-0">
                    {(p.name || p.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-text-bright truncate">
                      {p.name || "—"}
                    </div>
                    <div className="font-mono text-[10px] text-text-dim uppercase tracking-widest">
                      {p._id.slice(0, 8)}
                    </div>
                  </div>
                </div>
                <div className="font-mono text-xs text-text-muted truncate">{p.email}</div>
                <div>
                  {isAdminUser ? (
                    <span className="text-[10px] px-1.5 py-0.5 bg-text-bright text-surface-base font-mono uppercase tracking-wider font-semibold inline-flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 border border-border-crisp text-text-muted font-mono uppercase tracking-wider inline-flex items-center gap-1">
                      <UserIcon className="w-2.5 h-2.5" /> User
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <Button
                    onClick={() => toggleAdmin(p._id, isAdminUser)}
                    variant="outline"
                    size="sm"
                    disabled={p._id === me?._id && isAdminUser}
                    className="font-mono text-[10px] uppercase tracking-widest h-7 rounded-none border-border-crisp bg-transparent text-text-muted hover:bg-surface-raised hover:text-text-bright"
                  >
                    {isAdminUser ? "Revoke" : "Promote"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
};

export default Users;
