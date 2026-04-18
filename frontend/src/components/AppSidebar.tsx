import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, ListChecks, Users, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const navCls = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 text-sm font-medium border flex justify-between items-center transition-colors ${
    isActive
      ? "bg-surface-raised text-text-bright border-crisp"
      : "text-text-muted hover:text-text-bright hover:bg-surface-panel border-transparent"
  }`;

export const AppSidebar = () => {
  const { user, role, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <aside className="w-64 border-r border-border bg-surface-base flex flex-col shrink-0 h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-border">
        <div className="text-[10px] font-mono text-text-dim tracking-[0.2em] uppercase mb-1">
          System ID
        </div>
        <div className="text-lg font-mono text-text-bright font-medium tracking-tight">
          KINETIC::CORE
        </div>
      </div>

      <nav className="p-4 flex flex-col gap-1">
        <div className="text-[10px] font-mono text-text-dim uppercase tracking-widest px-2 mb-2">
          Operations
        </div>
        <NavLink to="/" end className={navCls}>
          <span className="flex items-center gap-2">
            <LayoutGrid className="w-3.5 h-3.5" /> Dashboard
          </span>
          <span className="text-[10px] font-mono text-text-dim">[D]</span>
        </NavLink>
        <NavLink to="/tasks" className={navCls}>
          <span className="flex items-center gap-2">
            <ListChecks className="w-3.5 h-3.5" /> Active Matrix
          </span>
          <span className="text-[10px] font-mono text-text-dim">[A]</span>
        </NavLink>
        {isAdmin && (
          <NavLink to="/users" className={navCls}>
            <span className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Operators
            </span>
            <span className="text-[10px] font-mono text-text-dim">[O]</span>
          </NavLink>
        )}
      </nav>

      <div className="p-4">
        <Button
          onClick={() => navigate("/tasks/new")}
          className="w-full font-mono text-[10px] uppercase tracking-widest h-8 rounded-none bg-text-bright text-surface-base hover:bg-text-bright/90"
        >
          <Plus className="w-3 h-3 mr-1" /> New Directive
        </Button>
      </div>

      <div className="mt-auto p-5 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-status-done"></div>
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
            Uplink Secured
          </span>
        </div>
        <div className="text-xs text-text-bright truncate">{user?.email}</div>
        <div className="text-[10px] font-mono text-text-dim uppercase tracking-widest mt-0.5">
          {role ?? "—"}
        </div>
        <button
          onClick={handleSignOut}
          className="mt-3 text-[10px] font-mono text-text-muted hover:text-text-bright uppercase tracking-widest flex items-center gap-1 transition-colors"
        >
          <LogOut className="w-3 h-3" /> Disconnect
        </button>
      </div>
    </aside>
  );
};
