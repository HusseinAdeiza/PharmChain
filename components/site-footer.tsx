import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { TranslatedText } from "@/components/translated-text";
import { MONAD_EXPLORER_URL, monadMainnet } from "@/lib/monad";

const columns: Array<{
  heading: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
}> = [
  {
    heading: "Ledger",
    links: [
      { label: "Verify", href: "/" },
      { label: "Register", href: "/register" },
      { label: "Report", href: "/report" },
    ],
  },
  {
    heading: "Network",
    links: [
      { label: "MonadScan", href: MONAD_EXPLORER_URL, external: true },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:gap-16">
          <div>
            <div className="flex items-center gap-3">
              <Logo className="h-9 w-9 text-electric" />
              <p className="font-display text-xl font-bold uppercase leading-none tracking-[0.02em]">
                Pharm<span className="text-electric">Chain</span>
              </p>
            </div>
            <p className="mt-5 max-w-lg text-sm leading-6 text-muted">
              <TranslatedText messageKey="footer_tagline" />
              <span className="ml-1">·</span>
              {monadMainnet.name}
            </p>
            <p className="mt-4 max-w-lg border-l border-electric/50 pl-4 font-mono text-[11px] leading-5 text-muted/80">
              EVIDENCE, NOT A SUBSTITUTE FOR CARE · NO SIMULATED DATA
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2">
            {columns.map((column) => (
              <div key={column.heading}>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-electric">
                  {column.heading}
                </p>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-muted underline decoration-white/10 decoration-1 underline-offset-4 transition-colors hover:text-electric hover:decoration-electric"
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {link.label}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Link
                          className="inline-flex items-center font-mono text-xs font-semibold uppercase tracking-[0.1em] text-muted underline decoration-white/10 decoration-1 underline-offset-4 transition-colors hover:text-electric hover:decoration-electric"
                          href={link.href}
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted/70 sm:px-6 lg:px-8">
          <p>PharmChain</p>
          <p>Monad Mainnet · chain 143</p>
        </div>
      </div>
    </footer>
  );
}
