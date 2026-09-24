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
    <section className="relative overflow-hidden py-10 sm:py-14 lg:py-16">
      <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]" />
      <div className="pointer-events-none absolute -right-24 top-20 -z-10 h-72 w-72 rounded-full bg-coral/10 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-coral/20 bg-white px-3 py-2 text-xs font-bold text-coral shadow-sm">
            <Siren className="h-4 w-4" />
            ON-CHAIN SAFETY REPORTING
          </span>
          <h1 className="mt-5 text-balance font-display text-4xl font-black tracking-[-0.05em] sm:text-5xl">
            Report what should not be ignored
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink/55">
            Record a batch recall, submit details for a suspected counterfeit, or use an
            authorized validator action. Every write is a real wallet transaction on
            Monad Mainnet.
          </p>
        </div>

        <div className="mt-10">
          <ReportForm />
        </div>
      </div>
    </section>
  );
}
