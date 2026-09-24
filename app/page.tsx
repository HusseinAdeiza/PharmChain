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

const capabilities = [
  {
    number: "A",
    icon: Box,
    title: "Batch provenance",
    description:
      "Registration links a medicine identity to an authorized manufacturer credential, printed batch, expiry date, and evidence commitment.",
  },
  {
    number: "B",
    icon: BadgeCheck,
    title: "Portable passport",
    description:
      "The QR destination can be opened without an account. The underlying credential cannot be sold or transferred.",
  },
  {
    number: "C",
    icon: ShieldAlert,
    title: "Safety signals",
    description:
      "Recall and counterfeit reports are separate signals with their own on-chain context.",
  },
  {
    number: "D",
    icon: Fingerprint,
    title: "Clear provenance",
    description:
      "Read operations and transaction results link to the public Monad Mainnet explorer.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-24 lg:pt-28">
          <p className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-electric">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-electric motion-safe:animate-status-pulse" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-electric" />
            </span>
            Monad Mainnet · Chain 143
          </p>
          <h1 className="mt-8 font-display text-6xl font-bold leading-[0.95] tracking-[-0.03em] sm:text-7xl lg:text-[5.5rem]">
            <span className="text-electric-gradient block">Scan a drug.</span>
            <span className="mt-1 block text-frost">Know if it&apos;s real.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-balance text-lg leading-8 text-muted sm:text-xl">
            Check a medicine&apos;s on-chain passport, review recall and counterfeit
            signals, and give patients a credential they can inspect for themselves.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#scanner" className={buttonStyles("primary", "lg")}>
              Scan a passport
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/register" className={buttonStyles("outline", "lg")}>
              Register a batch
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/80">
            <span className="inline-flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-electric" /> Non-transferable ERC-721 credential
            </span>
            <span className="inline-flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-electric" /> Public read verification
            </span>
          </div>
        </div>

        <div id="scanner" className="mx-auto max-w-3xl scroll-mt-32 px-4 pb-20 sm:px-6 lg:px-8">
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(50%_50%_at_50%_45%,rgba(31,182,255,0.16),transparent_70%)] blur-2xl"
              aria-hidden="true"
            />
            <ProductScanner />
            <div className="reflection-glow" aria-hidden="true" />
          </div>
          <div className="mt-2">
            <ConfigurationNotice compact />
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-frost sm:text-5xl">
              How to verify
            </h2>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Procedure 01–03
            </p>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const span = index === 1 ? "lg:col-span-4 lg:mt-10" : "lg:col-span-4";
              return (
                <article
                  key={step.number}
                  className={`glass rounded-3xl p-6 transition-[box-shadow,transform] duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-glow-cyan sm:p-7 ${span}`}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="head-glow font-display text-4xl font-extrabold leading-none text-electric">
                      {step.number}
                    </span>
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-electric">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-bold uppercase leading-tight tracking-[-0.01em] text-frost">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-gold">
                Built for trust
              </p>
              <h2 className="mt-5 text-balance font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-frost sm:text-5xl">
                A passport is evidence, not a substitute for care.
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-muted">
                PharmChain makes registry activity inspectable. It does not diagnose,
                replace a regulator, or guarantee that packaging has not been tampered
                with after manufacture.
              </p>
              <Link href="/report" className={buttonStyles("secondary", "md", "mt-8")}>
                <ShieldAlert className="h-4 w-4" />
                Report a safety concern
              </Link>
            </div>

            <div className="divide-y divide-white/5">
              {capabilities.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.number}
                    className="group grid grid-cols-[auto_1fr] gap-5 py-6 transition-[padding] duration-200 motion-safe:hover:pl-2 sm:gap-6 sm:py-7"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-electric/30 bg-electric/10 text-electric transition-shadow group-hover:shadow-glow-cyan">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                          Entry {item.number}
                        </span>
                        <h3 className="font-display text-lg font-bold uppercase leading-tight tracking-[-0.01em] text-frost">
                          {item.title}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
          <div className="glass rounded-3xl p-7 sm:p-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
              <div className="border-l border-electric/50 pl-6">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-electric">
                  Network transparency
                </p>
                <h2 className="mt-4 max-w-2xl font-display text-3xl font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-frost sm:text-4xl">
                  Inspect the configured contract before you rely on a result.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
                  PharmChain supports Monad Mainnet only. The explorer link below points
                  to the address supplied through deployment configuration.
                </p>
              </div>
              <div className="flex flex-col items-start gap-4">
                {isRegistryConfigured && registryAddress ? (
                  <a
                    href={monadAddressUrl(registryAddress)}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonStyles("secondary", "lg")}
                  >
                    View registry
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <span
                    className={buttonStyles("outline", "lg", "cursor-not-allowed border-white/10 text-muted/60")}
                  >
                    Registry address required
                  </span>
                )}
                <a
                  href={MONAD_EXPLORER_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted underline decoration-white/10 decoration-1 underline-offset-4 transition-colors hover:text-electric hover:decoration-electric"
                >
                  Open MonadScan
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
