import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { bannersQuery, gamesQuery } from "@/lib/store";

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

  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  const active = banners.length ? banners[slide % banners.length] : undefined;
  const bannerGame = games.find((g) => g.id === active?.game_id);

  return (
    <PageShell>
      <nav className="mt-5 flex items-center justify-between px-4 sm:px-6">
        <h1 className="font-display text-base font-semibold sm:text-xl">Instant game top-ups</h1>
        <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-cyan">
          Live
        </span>
      </nav>

      <section className="mt-4 px-4 sm:px-6">
        <div className="glass-panel overflow-hidden rounded-3xl p-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted sm:aspect-[21/8]">
            {active?.image_url ? (
              <img
                src={active.image_url}
                alt={active.title}
                width={1600}
                height={640}
                className="absolute inset-0 size-full object-cover"
              />
            ) : null}
            {active?.badge ? (
              <div className="absolute left-3 top-3 rounded-full bg-rose/90 px-2.5 py-1 text-[10px] font-semibold text-ink">
                {active.badge}
              </div>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[oklch(0.17_0.048_268/0.9)] to-transparent p-4 pt-12 sm:p-6 sm:pt-20">
              <p className="font-display text-lg font-semibold leading-tight text-[oklch(0.95_0.02_272)] sm:text-2xl">
                {active?.title ?? "Loading"}
              </p>
              <p className="text-xs text-[oklch(0.95_0.02_272/0.65)] sm:text-sm">
                {active?.subtitle ?? ""}
              </p>
              {bannerGame ? (
                <Link
                  to="/topup/$slug"
                  params={{ slug: bannerGame.slug }}
                  className="brand-gradient mt-3 inline-block rounded-xl px-6 py-2.5 text-center font-display text-sm font-semibold text-ink"
                >
                  Top Up
                </Link>
              ) : null}
            </div>
          </div>
        </div>
        {banners.length > 1 ? (
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
        ) : null}
      </section>

      <section className="mt-6 px-4 sm:px-6">
        <h2 className="mb-3 font-display text-sm font-medium text-subtle sm:text-base">
          Choose a game
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {games.map((game) => (
            <Link
              key={game.id}
              to="/topup/$slug"
              params={{ slug: game.slug }}
              className="glass-panel rounded-2xl p-3 transition hover:border-violet/50"
            >
              {game.cover_url ? (
                <img
                  src={game.cover_url}
                  alt={game.name}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ) : (
                <div className="aspect-square w-full rounded-xl bg-muted" />
              )}
              <p className="mt-2.5 font-display text-sm font-medium">{game.name}</p>
              <p className="text-[11px] text-faint">{game.category}</p>
            </Link>
          ))}
        </div>
        {games.length === 0 ? (
          <p className="text-sm text-faint">Games are being added — check back soon.</p>
        ) : null}
        <p className="mt-4 text-center text-[11px] text-faint">
          Instant delivery · Secured payments
        </p>
      </section>
    </PageShell>
  );
}
