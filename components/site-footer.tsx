import { ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { MONAD_EXPLORER_URL } from "@/lib/monad";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/5 bg-white/55">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] md:items-end lg:px-8">
        <div>
          <div className="flex items-center gap-2 font-display font-extrabold tracking-[-0.03em]">
            <ShieldCheck className="h-5 w-5 text-teal" />
            PharmChain
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink/55">
            Public medicine verification anchored to Monad Mainnet. Always confirm
            the connected registry deployment before submitting a transaction.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-ink/60">
          <Link className="hover:text-ink" href="/">
            Verify
          </Link>
          <Link className="hover:text-ink" href="/register">
            Register
          </Link>
          <Link className="hover:text-ink" href="/report">
            Report
          </Link>
          <a
            className="inline-flex items-center gap-1.5 hover:text-ink"
            href={MONAD_EXPLORER_URL}
            target="_blank"
            rel="noreferrer"
          >
            MonadScan
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
