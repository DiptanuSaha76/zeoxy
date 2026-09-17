import type { ReactNode } from "react";
import { Aurora } from "@/components/Aurora";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export function PageShell({
  children,
  width = "wide",
}: {
  children: ReactNode;
  width?: "wide" | "narrow";
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden font-body">
      <Aurora />
      <div
        className={
          width === "narrow"
            ? "relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col"
            : "relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col"
        }
      >
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
