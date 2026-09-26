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
import { TranslatedText } from "@/components/translated-text";
import { ConfigurationNotice } from "@/components/configuration-notice";
import { buttonStyles } from "@/components/ui/button";
import { isRegistryConfigured, manufacturerCredentialAddress, registryAddress } from "@/lib/contracts";
import { monadAddressUrl, MONAD_EXPLORER_URL } from "@/lib/monad";

export const metadata: Metadata = {
  title: "Verify medicine",
  description:
    "Scan a medicine passport, check jurisdiction-aware product records, and inspect on-chain batch signals on Monad Mainnet.",
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
    title: "Product is not batch",
    description:
      "A NAFDAC number identifies a product record. PharmChain keeps the printed batch, expiry, and evidence commitment beside it.",
  },
  {
    number: "B",
    icon: BadgeCheck,
    title: "Credential bound to a wallet",
    description:
      "A soulbound ERC-721 credential ties the attestation to an active manufacturer wallet that cannot be silently resold.",
  },
  {
    number: "C",
    icon: ShieldAlert,
    title: "Recall stays specific",
    description:
      "The demo shows a recall on historical batch DC.319 instead of treating every product with the same ingredient as unsafe.",
  },
  {
    number: "D",
    icon: Fingerprint,
    title: "Every write is inspectable",
    description:
      "Attestation, recall, and counterfeit decisions resolve to public transaction links on Monad Mainnet.",
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
            <TranslatedText messageKey="hero_eyebrow" />
          </p>
          <h1 className="mt-8 font-display text-6xl font-bold leading-[0.95] tracking-[-0.03em] sm:text-7xl lg:text-[5.5rem]">
            <TranslatedText className="text-electric-gradient block" messageKey="hero_title_one" />
            <TranslatedText className="mt-1 block text-frost" messageKey="hero_title_two" />
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-balance text-lg leading-8 text-muted sm:text-xl">
            <TranslatedText messageKey="hero_body" />
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/verify/A4-0201" className={buttonStyles("primary", "lg")}>
              <TranslatedText messageKey="hero_primary" />
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#scanner" className={buttonStyles("outline", "lg")}>
              <TranslatedText messageKey="hero_secondary" />
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/80">
            <span className="inline-flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-electric" /> No account for public reads
            </span>
            <span className="inline-flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-electric" /> Monad Mainnet · chain 143
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

      <section className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-gold">
                Proof, not promises
              </p>
              <h2 className="mt-2 max-w-3xl font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-frost sm:text-5xl">
                A real registry you can inspect before you decide.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted lg:text-right">
              These are seeded demonstration records on Monad Mainnet. They are product
              evidence, not customer testimonials or clinical outcome claims.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-5">
            {[
              ["5", "credentials"],
              ["16", "attested batches"],
              ["1", "historical recall"],
              ["1", "validated counterfeit flag"],
              ["4", "pinned evidence PDFs"],
            ].map(([value, label]) => (
              <div key={label} className="bg-black/50 p-4 sm:p-5">
                <p className="font-display text-4xl font-extrabold leading-none text-electric">{value}</p>
                <p className="mt-2 font-mono text-[10px] font-bold uppercase leading-4 tracking-[0.12em] text-muted">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="glass rounded-3xl p-5 sm:p-6">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-electric">
                Open the actual records
              </p>
              <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
                <Link href="/verify/A4-0201" className="group flex items-center justify-between gap-4 py-4">
                  <span>
                    <span className="block font-mono text-xs font-bold uppercase tracking-[0.1em] text-frost">A4-0201 · historical recall</span>
                    <span className="mt-1 block text-xs leading-5 text-muted">Batch DC.319 · expired · recall reason</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-electric" />
                </Link>
                <Link href="/verify/A11-100025" className="group flex items-center justify-between gap-4 py-4">
                  <span>
                    <span className="block font-mono text-xs font-bold uppercase tracking-[0.1em] text-frost">A11-100025 · counterfeit signal</span>
                    <span className="mt-1 block text-xs leading-5 text-muted">Two tablet batches · validated report</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-electric" />
                </Link>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted">Read the same contract-backed pages a buyer, pharmacist, or investigator would inspect.</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/30 p-5 sm:p-6">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                Technical surface
              </p>
              <dl className="mt-5 space-y-4 text-xs">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="font-mono uppercase tracking-[0.1em] text-muted">Registry</dt>
                  <dd className="text-right font-mono text-electric">
                    {registryAddress ? <a href={monadAddressUrl(registryAddress)} target="_blank" rel="noreferrer" className="underline decoration-electric/30 underline-offset-4">{registryAddress.slice(0, 10)}…{registryAddress.slice(-6)}</a> : "configured at runtime"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="font-mono uppercase tracking-[0.1em] text-muted">Credential</dt>
                  <dd className="text-right font-mono text-electric">
                    {manufacturerCredentialAddress ? <a href={monadAddressUrl(manufacturerCredentialAddress)} target="_blank" rel="noreferrer" className="underline decoration-electric/30 underline-offset-4">{manufacturerCredentialAddress.slice(0, 10)}…{manufacturerCredentialAddress.slice(-6)}</a> : "configured at runtime"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="font-mono uppercase tracking-[0.1em] text-muted">Read path</dt>
                  <dd className="text-right font-mono text-frost">getDrugPassport + getBatchPage</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="font-mono uppercase tracking-[0.1em] text-muted">Evidence</dt>
                  <dd className="text-right font-mono text-electric"><a href="/seed-evidence.json" className="underline decoration-electric/30 underline-offset-4">Pinned manifest</a></dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-electric">
                The verification protocol
              </p>
              <h2 className="mt-2 font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-frost sm:text-5xl">
                Three checks. One decision.
              </h2>
            </div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Public read · no account
            </p>
          </div>
          <div className="mt-8 border-y border-white/10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.number}
                  className="group grid grid-cols-[auto_1fr] gap-5 border-b border-white/10 py-7 last:border-b-0 sm:grid-cols-[5rem_3rem_1fr_auto] sm:items-center sm:gap-6"
                >
                  <span className="font-display text-4xl font-extrabold leading-none text-electric">
                    {step.number}
                  </span>
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-electric transition-colors group-hover:border-electric/40 group-hover:bg-electric/10">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold uppercase leading-tight tracking-[-0.01em] text-frost">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{step.description}</p>
                  </div>
                  <span className="col-start-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted/70 sm:col-start-auto">
                    Field {String(index + 1).padStart(2, "0")}
                  </span>
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
                Why it exists
              </p>
              <h2 className="mt-5 text-balance font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-frost sm:text-5xl">
                The number on the pack is not enough.
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-muted">
                A copied NAFDAC number cannot tell you which batch is in your hand, who
                attested it, or whether that batch was recalled. PharmChain adds those
                checks without pretending the registry replaces a regulator or a clinician.
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
