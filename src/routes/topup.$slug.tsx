import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Aurora } from "@/components/Aurora";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { gamesQuery, money, packsQuery } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({ pack: z.string().optional() });

export const Route = createFileRoute("/topup/$slug")({
  validateSearch: searchSchema,
  head: ({ params }) => {
    const name = params.slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return {
      meta: [
        { title: `Top up ${name} — Recharge` },
        {
          name: "description",
          content: `Buy ${name} in-game currency with instant delivery and secure payments.`,
        },
        { property: "og:title", content: `Top up ${name} — Recharge` },
        {
          property: "og:description",
          content: `Buy ${name} in-game currency with instant delivery.`,
        },
      ],
    };
  },
  component: TopUpPage,
});

function TopUpPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: games = [] } = useQuery(gamesQuery());
  const game = games.find((g) => g.slug === slug);
  const { data: packs = [] } = useQuery({
    ...packsQuery(game?.id),
    enabled: Boolean(game?.id),
  });

  const [selected, setSelected] = useState<string | null>(search.pack ?? null);
  const [playerRef, setPlayerRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selected && packs.length) {
      setSelected(packs.find((p) => p.is_popular)?.id ?? packs[0].id);
    }
  }, [packs, selected]);

  const pack = packs.find((p) => p.id === selected);

  async function checkout() {
    if (!game || !pack) return;
    if (!playerRef.trim()) {
      toast.error(`Enter your ${game.id_label}`);
      return;
    }
    if (!user) {
      toast.error("Sign in to complete your top-up");
      navigate({ to: "/auth" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      game_id: game.id,
      package_id: pack.id,
      player_ref: playerRef.trim(),
      amount: pack.price,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not place your order");
      return;
    }
    toast.success("Order placed — delivery in progress");
    navigate({ to: "/orders" });
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden font-body">
      <Aurora />
      <SiteHeader />

      <div className="relative z-10 mt-5 px-5">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] text-subtle">
          <ArrowLeft className="size-3.5" /> Back to store
        </Link>
      </div>

      {game ? (
        <>
          <section className="relative z-10 mt-3 px-5">
            <div className="glass-panel flex items-center gap-3 rounded-3xl p-3">
              {game.cover_url ? (
                <img
                  src={game.cover_url}
                  alt={game.name}
                  width={512}
                  height={512}
                  className="size-16 rounded-2xl object-cover"
                />
              ) : (
                <div className="size-16 rounded-2xl bg-muted" />
              )}
              <div>
                <p className="font-display text-lg font-semibold leading-tight">{game.name}</p>
                <p className="text-[11px] text-faint">
                  {game.category} · {game.currency_label}
                </p>
              </div>
            </div>
          </section>

          <section className="relative z-10 mt-5 px-5">
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-faint">
              {game.id_label}
            </label>
            <input
              value={playerRef}
              onChange={(e) => setPlayerRef(e.target.value.slice(0, 40))}
              placeholder={`Enter your ${game.id_label}`}
              className="glass-panel w-full rounded-2xl px-3.5 py-3 text-sm outline-none placeholder:text-faint focus:border-violet/50"
            />
          </section>

          <section className="relative z-10 mt-4 px-5">
            <p className="mb-2.5 font-display text-sm font-medium text-subtle">
              Choose a recharge pack
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {packs.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={
                    p.id === selected
                      ? "rounded-2xl border border-violet/60 bg-gradient-to-br from-violet/30 to-cyan/30 p-3 text-left"
                      : "glass-panel rounded-2xl p-3 text-left"
                  }
                >
                  <p className="text-xs text-faint">{p.label}</p>
                  <p className="font-display text-base font-semibold">{money(p.price)}</p>
                  {p.bonus_text ? (
                    <p className="text-[10px] font-medium text-lime">{p.bonus_text}</p>
                  ) : null}
                </button>
              ))}
            </div>
            {packs.length === 0 ? (
              <p className="text-xs text-faint">No recharge packs yet for this game.</p>
            ) : null}
          </section>

          <section className="relative z-10 mt-5 px-5">
            <div className="glass-panel rounded-3xl p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-subtle">{pack?.label ?? "Select a pack"}</span>
                <span className="font-display font-semibold">
                  {pack ? money(pack.price) : "—"}
                </span>
              </div>
              <button
                onClick={checkout}
                disabled={submitting || !pack}
                className="brand-gradient mt-4 w-full rounded-2xl py-3.5 font-display text-sm font-semibold text-ink disabled:opacity-50"
              >
                {submitting ? "Placing order…" : "Continue to checkout"}
              </button>
              <p className="mt-2 text-center text-[10px] text-faint">
                Instant delivery · Secured payments
              </p>
            </div>
          </section>
        </>
      ) : (
        <p className="relative z-10 mt-8 px-5 text-sm text-subtle">Loading game…</p>
      )}

      <SiteFooter />
    </div>
  );
}
