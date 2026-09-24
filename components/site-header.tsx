"use client";

import {
  BadgePlus,
  ScanLine,
  Siren,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/button";
import { Logo } from "@/components/logo";
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
      <header className="sticky top-0 z-40">
        <div className="border-b border-white/5 bg-black/60 backdrop-blur-xl">
          <div className="mx-auto flex h-8 max-w-7xl items-center justify-between gap-4 px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] sm:px-6 lg:px-8">
            <p className="flex items-center gap-2 truncate text-muted">
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full rounded-full bg-electric motion-safe:animate-status-pulse" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-electric" />
              </span>
              <span className="truncate">On-chain passports · public verification</span>
            </p>
            <p className="hidden shrink-0 items-center gap-3 text-muted sm:flex">
              <span>{monadMainnet.name}</span>
              <span className="text-electric">CHAIN {MONAD_MAINNET_ID}</span>
              <span className="hidden text-muted/70 lg:inline">MONAD ONLY · NO SIMULATION</span>
            </p>
          </div>
        </div>

        <div className="border-b border-white/10 bg-black/55 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="group flex items-center gap-3" aria-label="PharmChain home">
              <Logo className="h-9 w-9 shrink-0 text-electric transition-transform motion-safe:group-hover:scale-105" />
              <span className="font-display text-lg font-bold uppercase leading-none tracking-[0.02em] text-frost">
                Pharm<span className="text-electric">Chain</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
              {navigation.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center border-b-4 px-4 font-mono text-xs font-bold uppercase tracking-[0.14em] transition-colors",
                      active
                        ? "nav-underline-active border-transparent text-electric"
                        : "border-transparent text-muted hover:text-frost",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      <nav
        className="safe-bottom fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 rounded-2xl border border-white/10 bg-black/70 p-1.5 text-muted shadow-glow backdrop-blur-xl md:hidden"
        aria-label="Mobile navigation"
      >
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl border font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-colors",
                active
                  ? "border-electric/50 bg-electric/10 text-electric shadow-glow-cyan"
                  : "border-transparent hover:text-frost",
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
