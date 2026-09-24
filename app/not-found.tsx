import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[65vh] max-w-3xl items-center px-4 py-20 sm:px-6">
      <div className="w-full">
        <span className="mx-auto grid h-20 w-48 -rotate-3 place-items-center rounded-2xl border-2 border-white/25 bg-white/5 font-display text-3xl font-extrabold uppercase text-frost/70 shadow-glow-sm motion-safe:animate-stamp-in">
          Not found
        </span>
        <p className="head-glow mt-8 text-center font-mono text-xs font-bold uppercase tracking-[0.24em] text-electric">404</p>
        <h1 className="mt-3 text-center font-display text-4xl font-extrabold uppercase leading-none tracking-[-0.02em] text-frost">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-center text-base leading-7 text-muted">
          The requested page or passport route does not exist in this PharmChain frontend.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/" className={buttonStyles("primary", "lg")}>
            <ArrowLeft className="h-4 w-4" />
            Return to verification
          </Link>
        </div>
        <SearchX className="mx-auto mt-10 h-6 w-6 text-muted/50" aria-hidden="true" />
      </div>
    </section>
  );
}
