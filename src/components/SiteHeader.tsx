import { Link, useNavigate } from "@tanstack/react-router";
import { Moon, Sun, ShieldCheck, LogOut, LogIn } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="relative z-10 flex items-center justify-between px-5 pt-5">
      <Link to="/" className="flex items-center gap-2">
        <div className="brand-gradient grid size-9 place-items-center rounded-xl font-display font-bold text-ink">
          R
        </div>
        <div>
          <p className="font-display text-base font-semibold leading-none tracking-tight">Recharge</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-faint">Instant Top-Up</p>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {isAdmin ? (
          <Link
            to="/admin"
            className="glass-panel grid size-10 place-items-center rounded-xl text-cyan"
            aria-label="Admin panel"
          >
            <ShieldCheck className="size-4" />
          </Link>
        ) : null}
        {user ? (
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="glass-panel grid size-10 place-items-center rounded-xl text-subtle"
          >
            <LogOut className="size-4" />
          </button>
        ) : (
          <Link
            to="/auth"
            aria-label="Sign in"
            className="glass-panel grid size-10 place-items-center rounded-xl text-subtle"
          >
            <LogIn className="size-4" />
          </Link>
        )}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="glass-panel grid size-10 place-items-center rounded-xl text-subtle"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { isAdmin } = useAuth();
  return (
    <footer className="relative z-10 mt-6 mb-6 flex items-center justify-between px-5">
      <p className="text-[11px] text-faint">© 2026 Recharge</p>
      <div className="flex gap-3">
        <Link to="/orders" className="text-[11px] text-subtle">
          Orders
        </Link>
        <Link to={isAdmin ? "/admin" : "/auth"} className="text-[11px] text-subtle">
          Admin
        </Link>
      </div>
    </footer>
  );
}
