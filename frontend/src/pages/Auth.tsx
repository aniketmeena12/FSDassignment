import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 chars").max(72),
  full_name: z.string().trim().max(100).optional(),
});

const Auth = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      email,
      password,
      full_name: mode === "register" ? fullName : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
        toast.success("Uplink secured");
      } else {
        await signUp(email, password, fullName || email);
        toast.success("Operator registered");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-base p-6">
      <div className="w-full max-w-sm border border-border bg-surface-panel">
        <div className="px-6 py-5 border-b border-border">
          <div className="text-[10px] font-mono text-text-dim tracking-[0.2em] uppercase mb-1">
            Access Terminal
          </div>
          <div className="text-lg font-mono text-text-bright tracking-tight">
            KINETIC::CORE
          </div>
        </div>
        <div className="grid grid-cols-2 border-b border-border font-mono text-[10px] uppercase tracking-widest">
          <button
            onClick={() => setMode("login")}
            className={`py-3 transition-colors ${
              mode === "login"
                ? "bg-surface-raised text-text-bright"
                : "text-text-muted hover:text-text-bright"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("register")}
            className={`py-3 transition-colors ${
              mode === "register"
                ? "bg-surface-raised text-text-bright"
                : "text-text-muted hover:text-text-bright"
            }`}
          >
            Register
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                Operator Name
              </Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-surface-raised border-border-crisp font-mono text-sm rounded-none"
                placeholder="Jane Doe"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Email
            </Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-surface-raised border-border-crisp font-mono text-sm rounded-none"
              placeholder="operator@core.io"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
              Passphrase
            </Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-surface-raised border-border-crisp font-mono text-sm rounded-none"
              placeholder="••••••"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full font-mono text-[10px] uppercase tracking-widest h-10 rounded-none bg-text-bright text-surface-base hover:bg-text-bright/90"
          >
            {loading ? "Processing..." : mode === "login" ? "Authenticate" : "Initialize Account"}
          </Button>
          {mode === "register" && (
            <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest text-center">
              First operator becomes admin
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Auth;
