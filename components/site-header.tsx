"use client";

import {
  BadgePlus,
  ScanLine,
  ShieldCheck,
  Siren,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet-button";
import { MONAD_MAINNET_ID, monadMainnet } from "@/lib/monad";

const navigation = [
  { href: "/", label: "Verify", icon: ScanLine },
  { href: "/register", label: "Register", icon: BadgePlus },
  { href: "/report", label: "Report", icon: Siren },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" || pathname.startsWith("/verify") : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink/5 glass">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="PharmChain home">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-mint shadow-[0_8px_22px_rgba(16,44,42,0.2)] transition group-hover:-rotate-3 group-hover:scale-105">
              <ShieldCheck className="h-5 w-5" strokeWidth={2.3} />
            </span>
            <span className="font-display text-lg font-extrabold tracking-[-0.04em] text-ink">
              Pharm<span className="text-teal">Chain</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                    active
                      ? "bg-ink text-white shadow-sm"
                      : "text-ink/60 hover:bg-ink/5 hover:text-ink",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-700/10 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 lg:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {monadMainnet.name}
              <span className="font-mono text-[10px] opacity-60">#{MONAD_MAINNET_ID}</span>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      <nav
        className="safe-bottom fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 rounded-2xl border border-white/70 bg-ink/95 p-1.5 text-white shadow-lift backdrop-blur-xl md:hidden"
        aria-label="Mobile navigation"
      >
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition",
                active ? "bg-white/12 text-mint" : "text-white/55 hover:text-white",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
