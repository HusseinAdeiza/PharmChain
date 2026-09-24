import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[65vh] max-w-3xl items-center px-4 py-20 text-center sm:px-6">
      <div className="w-full">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-mint text-ink">
          <SearchX className="h-7 w-7" />
        </span>
        <p className="mt-7 font-mono text-xs font-bold uppercase tracking-[0.2em] text-teal">404</p>
        <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.05em]">Page not found</h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-ink/55">
          The requested page or passport route does not exist in this PharmChain frontend.
        </p>
        <Link href="/" className={buttonStyles("primary", "lg", "mt-8")}>
          <ArrowLeft className="h-4 w-4" />
          Return to verification
        </Link>
      </div>
    </section>
  );
}
