import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const redirect = `${location.pathname}${location.searchStr}`;

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth", search: { redirect }, replace: true });
    }
  }, [loading, user, navigate, redirect]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <p className="text-sm text-faint">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <PageShell width="wide">
      <Outlet />
    </PageShell>
  );
}
