import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Aurora } from "@/components/Aurora";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const credsSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(72),
});

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Recharge" },
      { name: "description", content: "Sign in to buy game top-ups and track your orders." },
      { property: "og:title", content: "Sign in — Recharge" },
      { property: "og:description", content: "Sign in to buy game top-ups and track your orders." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function submit() {
    const parsed = credsSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Check your email to confirm your account");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/", replace: true });
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 font-body">
      <Aurora />
      <div className="glass-panel relative z-10 w-full max-w-sm rounded-3xl p-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="brand-gradient grid size-9 place-items-center rounded-xl font-display font-bold text-ink">
            R
          </div>
          <div>
            <p className="font-display text-base font-semibold leading-none">Recharge</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-faint">
              Instant Top-Up
            </p>
          </div>
        </Link>

        <h1 className="mt-6 font-display text-xl font-semibold">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-xs text-faint">
          Sign in to top up games and follow your orders.
        </p>

        <div className="mt-5 space-y-2.5">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="glass-panel w-full rounded-2xl px-3.5 py-3 text-sm outline-none placeholder:text-faint focus:border-violet/50"
          />
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="glass-panel w-full rounded-2xl px-3.5 py-3 text-sm outline-none placeholder:text-faint focus:border-violet/50"
          />
        </div>

        <button
          onClick={submit}
          disabled={busy}
          className="brand-gradient mt-3 w-full rounded-2xl py-3.5 font-display text-sm font-semibold text-ink disabled:opacity-50"
        >
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>

        <button
          onClick={google}
          className="glass-panel mt-2.5 w-full rounded-2xl py-3.5 font-display text-sm font-medium"
        >
          Continue with Google
        </button>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-[11px] text-subtle"
        >
          {mode === "signin"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
