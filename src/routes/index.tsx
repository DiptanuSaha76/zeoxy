import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Aurora } from "@/components/Aurora";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { bannersQuery, gamesQuery, money, packsQuery } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Recharge — Instant Game Top-Up Store" },
      {
        name: "description",
        content:
          "Top up gems, chips and crystals for your favourite games. Instant delivery, secure payments.",
      },
      { property: "og:title", content: "Recharge — Instant Game Top-Up Store" },
      {
        property: "og:description",
        content: "Top up gems, chips and crystals for your favourite games in seconds.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: banners = [] } = useQuery(bannersQuery());
  const { data: games = [] } = useQuery(gamesQuery());
  const featured = games[0];
  const { data: packs = [] } = useQuery({
    ...packsQuery(featured?.id),
    enabled: Boolean(featured?.id),
  });

  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  const active = banners[slide % Math.max(banners.length, 1)];
  const bannerGame = games.find((g) => g.id === active?.game_id);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden font-body">
      <Aurora />
      <SiteHeader />

      <nav className="relative z-10 mt-5 flex items-center justify-between px-5">
        <p className="font-display text-sm font-medium text-subtle">Instant game top-ups</p>
        <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-cyan">
          Live
        </span>
      </nav>

      <section className="relative z-10 mt-4 px-5">
        <div className="glass-panel overflow-hidden rounded-3xl p-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
            {active?.image_url ? (
              <img
                src={active.image_url}
                alt={active.title}
                width={1024}
                height={640}
                className="absolute inset-0 size-full object-cover"
              />
            ) : null}
            {active?.badge ? (
              <div className="absolute left-3 top-3 rounded-full bg-rose/90 px-2.5 py-1 text-[10px] font-semibold text-ink">
                {active.badge}
              </div>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[oklch(0.17_0.048_268/0.9)] to-transparent p-4 pt-12">
              <p className="font-display text-lg font-semibold leading-tight text-[oklch(0.95_0.02_272)]">
                {active?.title ?? "Loading"}
              </p>
              <p className="text-xs text-[oklch(0.95_0.02_272/0.65)]">{active?.subtitle ?? ""}</p>
              <div className="mt-3 flex gap-2">
                {bannerGame ? (
                  <Link
                    to="/topup/$slug"
                    params={{ slug: bannerGame.slug }}
                    className="brand-gradient flex-1 rounded-xl py-2.5 text-center font-display text-sm font-semibold text-ink"
                  >
                    Top Up
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-center gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setSlide(i)}
              aria-label={`Show ${b.title}`}
              className={
                i === slide % banners.length
                  ? "h-1.5 w-6 rounded-full bg-cyan"
                  : "h-1.5 w-1.5 rounded-full bg-faint"
              }
            />
          ))}
        </div>
      </section>

      <div className="relative z-10 mt-5 flex gap-3 overflow-x-auto px-5 pb-1">
        {games.map((game) => (
          <Link
            key={game.id}
            to="/topup/$slug"
            params={{ slug: game.slug }}
            className="glass-panel w-44 shrink-0 rounded-2xl p-3"
          >
            {game.cover_url ? (
              <img
                src={game.cover_url}
                alt={game.name}
                loading="lazy"
                width={512}
                height={512}
                className="size-16 rounded-xl object-cover"
              />
            ) : (
              <div className="size-16 rounded-xl bg-muted" />
            )}
            <p className="mt-2.5 font-display text-sm font-medium">{game.name}</p>
            <p className="text-[11px] text-faint">{game.category}</p>
          </Link>
        ))}
      </div>

      {featured ? (
        <section className="relative z-10 mt-5 px-5">
          <p className="mb-2.5 font-display text-sm font-medium text-subtle">
            Top up {featured.name}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {packs.slice(0, 4).map((pack) => (
              <Link
                key={pack.id}
                to="/topup/$slug"
                params={{ slug: featured.slug }}
                search={{ pack: pack.id }}
                className={
                  pack.is_popular
                    ? "rounded-2xl border border-violet/40 bg-gradient-to-br from-violet/25 to-cyan/25 p-3"
                    : "glass-panel rounded-2xl p-3"
                }
              >
                <p className="text-xs text-faint">{pack.label}</p>
                <p className="font-display text-base font-semibold">{money(pack.price)}</p>
                {pack.bonus_text ? (
                  <p className="text-[10px] font-medium text-lime">{pack.bonus_text}</p>
                ) : null}
              </Link>
            ))}
          </div>
          <Link
            to="/topup/$slug"
            params={{ slug: featured.slug }}
            className="brand-gradient mt-3 block w-full rounded-2xl py-3.5 text-center font-display text-sm font-semibold text-ink"
          >
            Continue to checkout
          </Link>
          <p className="mt-2 text-center text-[10px] text-faint">
            Instant delivery · Secured payments
          </p>
        </section>
      ) : null}

      <SiteFooter />
    </div>
  );
}
