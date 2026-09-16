import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Game = {
  id: string;
  name: string;
  slug: string;
  category: string;
  cover_url: string | null;
  currency_label: string;
  id_label: string;
  is_active: boolean;
  sort_order: number;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  image_url: string | null;
  game_id: string | null;
  is_active: boolean;
  sort_order: number;
};

export type Pack = {
  id: string;
  game_id: string;
  label: string;
  amount: number;
  price: number;
  bonus_text: string | null;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
};

export const gamesQuery = (opts?: { includeInactive?: boolean }) =>
  queryOptions({
    queryKey: ["games", opts?.includeInactive ?? false],
    queryFn: async (): Promise<Game[]> => {
      let q = supabase.from("games").select("*").order("sort_order");
      if (!opts?.includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Game[];
    },
  });

export const bannersQuery = (opts?: { includeInactive?: boolean }) =>
  queryOptions({
    queryKey: ["banners", opts?.includeInactive ?? false],
    queryFn: async (): Promise<Banner[]> => {
      let q = supabase.from("banners").select("*").order("sort_order");
      if (!opts?.includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
  });

export const packsQuery = (gameId?: string, opts?: { includeInactive?: boolean }) =>
  queryOptions({
    queryKey: ["packages", gameId ?? "all", opts?.includeInactive ?? false],
    queryFn: async (): Promise<Pack[]> => {
      let q = supabase.from("packages").select("*").order("sort_order");
      if (gameId) q = q.eq("game_id", gameId);
      if (!opts?.includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((p) => ({ ...p, price: Number(p.price) })) as Pack[];
    },
  });

export const ordersQuery = (scope: "mine" | "all", userId?: string) =>
  queryOptions({
    queryKey: ["orders", scope, userId ?? "anon"],
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select("id, player_ref, amount, status, created_at, game_id, package_id")
        .order("created_at", { ascending: false })
        .limit(100);
      if (scope === "mine" && userId) q = q.eq("user_id", userId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

export const money = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
