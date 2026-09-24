import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  Box,
  ExternalLink,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { ProductScanner } from "@/components/product-scanner";
import { ConfigurationNotice } from "@/components/configuration-notice";
import { buttonStyles } from "@/components/ui/button";
import { isRegistryConfigured, registryAddress } from "@/lib/contracts";
import { monadAddressUrl, MONAD_EXPLORER_URL } from "@/lib/monad";

export const metadata: Metadata = {
  title: "Verify medicine",
  description:
    "Scan a PharmChain QR passport or enter a NAFDAC number to check medicine credentials on Monad Mainnet.",
};

const steps = [
  {
    number: "01",
    title: "Scan or enter",
    description:
      "Use a device camera to open a passport QR URL, or type the NAFDAC registration number directly.",
    icon: ScanLine,
  },
  {
    number: "02",
    title: "Check the record",
    description:
      "Read the returned batch, manufacturer, credential, recall, and counterfeit status from the registry.",
    icon: FileCheck2,
  },
  {
    number: "03",
    title: "Decide with context",
    description:
      "Use the on-chain record as one input alongside packaging, expiry date, and regulator guidance.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden pb-16 pt-12 sm:pt-16 lg:pb-24 lg:pt-20">
        <div className="grid-fade pointer-events-none absolute inset-0 -z-10" />
        <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-mint/45 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal/15 bg-white/75 px-3 py-2 text-xs font-bold text-teal shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              PUBLIC VERIFICATION · MONAD MAINNET
            </div>
            <h1 className="mt-7 max-w-3xl text-balance font-display text-5xl font-black leading-[0.98] tracking-[-0.06em] text-ink sm:text-6xl lg:text-7xl">
              Scan a drug.{" "}
              <span className="relative text-teal">
                Know if it&apos;s real.
                <svg
                  className="absolute -bottom-2 left-0 h-3 w-full text-mint"
                  viewBox="0 0 300 12"
                  fill="none"
                  aria-hidden="true"
                  preserveAspectRatio="none"
                >
                  <path d="M3 8.5C76 2.5 213 2.5 297 7" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-balance text-lg leading-8 text-ink/62 sm:text-xl">
              Check a medicine&apos;s on-chain passport, review recall and counterfeit
              signals, and give patients a credential they can inspect for themselves.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#scanner" className={buttonStyles("primary", "lg")}>
                Scan a passport
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/register" className={buttonStyles("outline", "lg")}>
                Register a batch
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-ink/50">
              <span className="inline-flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-teal" /> Non-transferable ERC-721 credential
              </span>
              <span className="inline-flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-teal" /> Public read verification
              </span>
            </div>
          </div>

          <div id="scanner" className="scroll-mt-28">
            <ProductScanner />
            <div className="mt-4">
              <ConfigurationNotice compact />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/5 bg-white/60">
        <div className="mx-auto grid max-w-7xl divide-y divide-ink/5 px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.number} className="py-8 md:px-7 md:first:pl-0 md:last:pr-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-teal">{step.number}</span>
                  <Icon className="h-5 w-5 text-ink/25" />
                </div>
                <h2 className="mt-5 font-display text-lg font-extrabold tracking-[-0.03em]">
                  {step.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink/55">{step.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-teal">
                Built for trust
              </p>
              <h2 className="mt-4 text-balance font-display text-3xl font-black tracking-[-0.045em] sm:text-4xl">
                A passport is evidence, not a substitute for care.
              </h2>
              <p className="mt-5 text-base leading-7 text-ink/58">
                PharmChain makes registry activity inspectable. It does not diagnose,
                replace a regulator, or guarantee that packaging has not been tampered
                with after manufacture.
              </p>
              <Link href="/report" className={buttonStyles("outline", "md", "mt-7")}>
                <ShieldAlert className="h-4 w-4" />
                Report a safety concern
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-3xl border border-ink/8 bg-white p-6 shadow-card sm:translate-y-5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-mint">
                  <Box className="h-5 w-5" />
                </span>
                <h3 className="mt-6 font-display text-lg font-extrabold">Batch provenance</h3>
                <p className="mt-2 text-sm leading-6 text-ink/55">
                  Registration links a medicine identity to an authorized manufacturer
                  credential, printed batch, expiry date, and evidence commitment.
                </p>
              </article>
              <article className="rounded-3xl border border-ink/8 bg-ink p-6 text-white shadow-card">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-mint">
                  <BadgeCheck className="h-5 w-5" />
                </span>
                <h3 className="mt-6 font-display text-lg font-extrabold">Portable passport</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  The QR destination can be opened without an account. The underlying
                  credential cannot be sold or transferred.
                </p>
              </article>
              <article className="rounded-3xl border border-ink/8 bg-[#fff8ec] p-6 shadow-card sm:translate-y-5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-800">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <h3 className="mt-6 font-display text-lg font-extrabold">Safety signals</h3>
                <p className="mt-2 text-sm leading-6 text-ink/55">
                  Recall and counterfeit reports are separate signals with their own
                  on-chain context.
                </p>
              </article>
              <article className="rounded-3xl border border-ink/8 bg-white p-6 shadow-card">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal/10 text-teal">
                  <Fingerprint className="h-5 w-5" />
                </span>
                <h3 className="mt-6 font-display text-lg font-extrabold">Clear provenance</h3>
                <p className="mt-2 text-sm leading-6 text-ink/55">
                  Read operations and transaction results link to the public Monad
                  Mainnet explorer.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-14">
            <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-teal/40 blur-3xl" />
            <div className="relative">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-mint">
                Network transparency
              </p>
              <h2 className="mt-3 max-w-2xl font-display text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">
                Inspect the configured contract before you rely on a result.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                PharmChain supports Monad Mainnet only. The explorer link below points
                to the address supplied through deployment configuration.
              </p>
            </div>
            {isRegistryConfigured && registryAddress ? (
              <a
                href={monadAddressUrl(registryAddress)}
                target="_blank"
                rel="noreferrer"
                className={buttonStyles("secondary", "lg", "relative mt-7 shrink-0 lg:mt-0")}
              >
                View registry
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <span className={buttonStyles("outline", "lg", "mt-7 cursor-not-allowed border-white/20 bg-white/5 text-white/45 opacity-100 lg:mt-0")}>
                Registry address required
              </span>
            )}
            <a
              href={MONAD_EXPLORER_URL}
              target="_blank"
              rel="noreferrer"
              className="relative mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/45 hover:text-white lg:absolute lg:bottom-5 lg:right-14 lg:mt-0"
            >
              Open MonadScan
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
