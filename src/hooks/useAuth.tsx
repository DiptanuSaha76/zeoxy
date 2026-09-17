import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const user: User | null = session?.user ?? null;
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      setRoleLoading(false);
      return;
    }
    let cancelled = false;
    setRoleLoading(true);
    void (async () => {
      await supabase.rpc("ensure_profile");
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancelled) {
        setIsAdmin(Boolean(data));
        setRoleLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { session, user, isAdmin, loading, roleLoading, ready: !loading && !roleLoading };
}
