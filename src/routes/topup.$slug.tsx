import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell } from "@/components/PageShell";
import {
  activeCoinRateQuery,
  gamesQuery,
  money,
  packsQuery,
  settingsQuery,
  validatePlayerId,
  validateServerId,
} from "@/lib/store";
import { computePricing, customerPrice } from "@/lib/pricing";
import { createOrder } from "@/lib/orders.functions";
import { useAuth } from "@/hooks/useAuth";

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
  const { user, loading } = useAuth();

  const { data: games = [], isLoading: gamesLoading } = useQuery(gamesQuery());
  const { data: settings } = useQuery(settingsQuery());
  const { data: rate } = useQuery(activeCoinRateQuery());
  const placeOrder = useServerFn(createOrder);
  const percent = settings?.discount_percent ?? 0;
  const priceOf = (p: { price: number; smile_coin_cost: number }) =>
    customerPrice(p, rate, percent);
  const listPriceOf = (p: { price: number; smile_coin_cost: number }) =>
    computePricing(p, rate).selling_price;
  const game = games.find((g) => g.slug === slug);
  const { data: packs = [] } = useQuery({
    ...packsQuery(game?.id),
    enabled: Boolean(game?.id),
  });

  const [selected, setSelected] = useState<string | null>(search.pack ?? null);
  const [playerRef, setPlayerRef] = useState("");
  const [playerServer, setPlayerServer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selected && packs.length) {
      setSelected(packs.find((p) => p.is_popular)?.id ?? packs[0]!.id);
    }
  }, [packs, selected]);

  const pack = packs.find((p) => p.id === selected);

  async function checkout() {
    if (!game || !pack || !user) return;
    const idError = validatePlayerId(game, playerRef);
    if (idError) {
      toast.error(idError);
      return;
    }
    const serverError = validateServerId(game, playerServer);
    if (serverError) {
      toast.error(serverError);
      return;
    }
    setSubmitting(true);
    try {
      await placeOrder({
        data: {
          gameId: game.id,
          packageId: pack.id,
          playerRef: playerRef.trim(),
          playerServer: game.requires_server_id ? playerServer.trim() : null,
        },
      });
      toast.success("Order placed — delivery in progress");
      navigate({ to: "/orders" });
    } catch {
      toast.error("Could not place your order");
    }
    setSubmitting(false);
  }

  return (
    <PageShell>
      <div className="mt-5 px-4 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] text-subtle">
          <ArrowLeft className="size-3.5" /> Back to store
        </Link>
      </div>

      {game ? (
        <div className="mt-3 grid gap-5 px-4 sm:px-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="space-y-5">
            <section>
              <div className="glass-panel flex items-center gap-3 rounded-3xl p-3">
                {game.cover_url ? (
                  <img
                    src={game.cover_url}
                    alt={game.name}
                    width={512}
                    height={512}
                    className="size-16 rounded-2xl object-cover sm:size-20"
                  />
                ) : (
                  <div className="size-16 rounded-2xl bg-muted sm:size-20" />
                )}
                <div>
                  <h1 className="font-display text-lg font-semibold leading-tight sm:text-2xl">
                    {game.name}
                  </h1>
                  <p className="text-[11px] text-faint sm:text-xs">
                    {game.category} · {game.currency_label}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <p className="mb-2 font-display text-sm font-medium text-subtle">
                Account verification
              </p>
              <div className="glass-panel grid gap-3 rounded-3xl p-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="player-ref"
                    className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-faint"
                  >
                    {game.id_label}
                  </label>
                  <input
                    id="player-ref"
                    inputMode={game.id_kind === "numeric" ? "numeric" : "text"}
                    value={playerRef}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const next =
                        game.id_kind === "numeric" ? raw.replace(/\D/g, "") : raw;
                      setPlayerRef(next.slice(0, game.id_max_len));
                    }}
                    placeholder={`Enter your ${game.id_label}`}
                    className="w-full rounded-2xl border border-white/10 bg-muted/40 px-3.5 py-3 text-sm outline-none placeholder:text-faint focus:border-violet/50"
                  />
                </div>
                {game.requires_server_id ? (
                  <div>
                    <label
                      htmlFor="player-server"
                      className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-faint"
                    >
                      {game.server_label}
                    </label>
                    <input
                      id="player-server"
                      value={playerServer}
                      onChange={(e) => setPlayerServer(e.target.value.slice(0, 20))}
                      placeholder={`Enter your ${game.server_label}`}
                      className="w-full rounded-2xl border border-white/10 bg-muted/40 px-3.5 py-3 text-sm outline-none placeholder:text-faint focus:border-violet/50"
                    />
                  </div>
                ) : null}
                <p className="text-[11px] text-faint sm:col-span-2">
                  {game.id_help ??
                    `Double-check your ${game.id_label} — top-ups are delivered straight to this account.`}
                </p>
              </div>
            </section>

            <section>
              <p className="mb-2.5 font-display text-sm font-medium text-subtle">
                Choose a recharge pack
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
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
                    <p className="font-display text-base font-semibold">
                      {money(discounted(p.price, percent))}
                    </p>
                    {percent > 0 ? (
                      <p className="text-[10px] text-faint line-through">{money(p.price)}</p>
                    ) : null}
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
          </div>

          <section className="lg:sticky lg:top-5">
            <div className="glass-panel rounded-3xl p-4">
              <p className="font-display text-sm font-medium text-subtle">Order summary</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-subtle">{pack?.label ?? "Select a pack"}</span>
                <span className="font-display font-semibold">
                  {pack ? money(discounted(pack.price, percent)) : "—"}
                </span>
              </div>
              {pack && percent > 0 ? (
                <p className="mt-1 text-[11px] text-lime">
                  {percent}% off applied · was {money(pack.price)}
                </p>
              ) : null}
              {user ? (
                <button
                  onClick={checkout}
                  disabled={submitting || !pack}
                  className="brand-gradient mt-4 w-full rounded-2xl py-3.5 font-display text-sm font-semibold text-ink disabled:opacity-50"
                >
                  {submitting ? "Placing order…" : "Continue to checkout"}
                </button>
              ) : (
                <>
                  <Link
                    to="/auth"
                    search={{ redirect: `/topup/${slug}` }}
                    className="brand-gradient mt-4 block w-full rounded-2xl py-3.5 text-center font-display text-sm font-semibold text-ink"
                    aria-disabled={loading}
                  >
                    Sign in to top up
                  </Link>
                  <p className="mt-2 text-center text-[11px] text-faint">
                    You need an account so we can deliver and track your order.
                  </p>
                </>
              )}
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-faint">
                <ShieldCheck className="size-3.5" /> Instant delivery · Secured payments
              </p>
            </div>
          </section>
        </div>
      ) : (
        <p className="mt-8 px-4 text-sm text-subtle sm:px-6">
          {gamesLoading ? "Loading game…" : "This game is not available right now."}
        </p>
      )}
    </PageShell>
  );
}
