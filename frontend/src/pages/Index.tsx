import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    // Redirect based on auth state
    if (user) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-base">
      <div className="text-center">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <p className="mt-4 font-mono text-xs text-text-dim uppercase tracking-widest">
          Redirecting...
        </p>
      </div>
    </div>
  );
};

export default Index;
