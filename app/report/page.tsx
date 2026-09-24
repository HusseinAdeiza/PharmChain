import type { Metadata } from "next";
import { Siren } from "lucide-react";
import { ReportForm } from "@/components/report-form";

export const metadata: Metadata = {
  title: "Report a medicine concern",
  description:
    "Submit a batch recall, counterfeit report, or validation decision to the configured DrugRegistry on Monad Mainnet.",
};

export default function ReportPage() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-20">
        <div className="border-l border-danger/60 pl-5 sm:pl-6">
          <p className="flex w-fit items-center gap-2 rounded-full border border-danger/50 bg-danger/10 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-danger shadow-glow-red">
            <Siren className="h-4 w-4" />
            Form PC-4 · On-chain safety reporting
          </p>
          <h1 className="mt-4 font-display text-5xl font-extrabold uppercase leading-[0.92] tracking-[-0.02em] text-frost sm:text-6xl">
            Report what should not be ignored
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            Record a batch recall, submit details for a suspected counterfeit, or use an
            authorized validator action. Every write is a real wallet transaction on
            Monad Mainnet.
          </p>
        </div>

        <div className="mt-12">
          <ReportForm />
        </div>
      </div>
    </section>
  );
}
