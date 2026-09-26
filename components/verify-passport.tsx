"use client";

import { type FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Boxes,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ExternalLink,
  Factory,
  Fingerprint,
  History,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePublicClient, useReadContract } from "wagmi";
import { ConfigurationNotice } from "@/components/configuration-notice";
import { PassportQr } from "@/components/passport-qr";
import { TransactionEventExplorer } from "@/components/transaction-event-explorer";
import { Button, buttonStyles, cn } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import {
  DRUG_REGISTRY_ABI,
  isRegistryConfigured,
  manufacturerCredentialAddress,
  parseBatchPageResult,
  parseCounterfeitReportPageResult,
  parseDrugPassportResult,
  passportVerificationState,
  registryAddress,
  type Batch,
  type CounterfeitReport,
  type Passport,
  type PassportVerificationState,
} from "@/lib/contracts";
import { errorMessage } from "@/lib/errors";
import { formatTimestamp, shortAddress } from "@/lib/format";
import { MONAD_MAINNET_ID, monadAddressUrl } from "@/lib/monad";
import { nafdacFromInput, passportPath } from "@/lib/nafdac";

const zeroAddress = "0x0000000000000000000000000000000000000000";
const pageSize = 100n;
const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));

type EvidenceEntry = {
  keccak256: string;
  ipfsUrl: string;
  filename: string;
};

type GreenBookProduct = {
  id: number | null;
  nrn: string;
  name: string;
  ingredient: string | null;
  form: string | null;
  route: string | null;
  strength: string | null;
  applicant: string | null;
  manufacturer: string | null;
  status: string | null;
  approvalDate: string | null;
  expiryDate: string | null;
  sourceUrl: string;
};

type GreenBookLookup = {
  nrn: string;
  products: GreenBookProduct[];
  source: string;
  sourceUrl: string;
  checkedAt: string;
};

function AddressValue({ address }: { address: `0x${string}` }) {
  if (address === zeroAddress) {
    return <span className="text-muted">Not set</span>;
  }
  return (
    <a
      href={monadAddressUrl(address)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 font-mono text-xs text-electric underline decoration-electric/40 decoration-1 underline-offset-4 transition-colors hover:text-frost hover:decoration-frost"
    >
      {shortAddress(address)}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function DataPoint({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Boxes;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
        <Icon className="h-3.5 w-3.5 text-electric" />
        {label}
      </p>
      <div className="mt-1.5 break-words text-sm font-semibold text-frost">{children}</div>
    </div>
  );
}

const resultStateContent: Record<
  PassportVerificationState,
  { label: string; title: string; description: string }
> = {
  verified: {
    label: "VERIFIED",
    title: "Verified on-chain record",
    description:
      "The returned registry record has no recall, validated counterfeit, pending report, or expired batch signal.",
  },
  recalled: {
    label: "RECALLED",
    title: "RECALLED — do not use",
    description:
      "At least one returned batch is marked recalled. Stop using the affected batch and follow regulator and supplier guidance.",
  },
  counterfeit: {
    label: "COUNTERFEIT DETECTED",
    title: "COUNTERFEIT DETECTED",
    description:
      "The owner validated a counterfeit report for this NAFDAC key. Treat the result as a stop signal and report through official channels.",
  },
  review: {
    label: "REVIEW",
    title: "Review required",
    description:
      "The passport has a pending counterfeit report or at least one returned batch is past its recorded expiry.",
  },
};

const resultStateStamp: Record<PassportVerificationState, string> = {
  verified: "border-electric/50 text-electric shadow-glow-cyan",
  recalled: "border-danger/60 text-danger shadow-glow-red",
  counterfeit: "border-danger/60 text-danger shadow-glow-red",
  review: "border-gold/60 text-gold shadow-glow-gold",
};

const resultStateBanner: Record<PassportVerificationState, string> = {
  verified: "border-electric/30 bg-electric/5",
  recalled: "border-danger/40 bg-danger/5",
  counterfeit: "border-danger/40 bg-danger/5",
  review: "border-gold/40 bg-gold/5",
};

const resultStateStampWord: Record<PassportVerificationState, string> = {
  verified: "Verified",
  recalled: "Recalled",
  counterfeit: "Counterfeit",
  review: "Review",
};

function ResultStatePanel({ state }: { state: PassportVerificationState }) {
  const content = resultStateContent[state];
  const counterfeit = state === "counterfeit";
  const recalled = state === "recalled";
  const review = state === "review";
  const Icon = counterfeit ? ShieldAlert : recalled ? ShieldAlert : review ? Clock3 : CheckCircle2;

  return (
    <section className={cn("glass rounded-3xl p-5 sm:p-7", resultStateBanner[state])}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          className={cn(
            "grid h-24 w-44 shrink-0 place-items-center rounded-2xl border bg-black/40 motion-safe:animate-stamp-in",
            resultStateStamp[state],
          )}
          role="img"
          aria-label={`Result state: ${content.label}`}
        >
          <span className="font-display text-2xl font-extrabold uppercase leading-none tracking-[0.02em]">
            {resultStateStampWord[state]}
          </span>
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            <Icon className="h-4 w-4" />
            Result state
          </p>
          <h2 className="mt-1 font-display text-2xl font-extrabold uppercase leading-tight tracking-[-0.01em] text-frost sm:text-3xl">
            {content.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            {content.description}
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-2 border-t border-white/10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
        {(["verified", "recalled", "counterfeit", "review"] as const).map((item) => {
          const itemActive = item === state;
          return (
            <div
              key={item}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em]",
                itemActive
                  ? "border-electric/50 bg-black/60 text-electric shadow-glow-cyan"
                  : "border-white/10 bg-black/20 text-muted",
              )}
            >
              {resultStateContent[item].label}
              {itemActive ? <span className="ml-auto text-electric">●</span> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PassportSummary({
  passport,
  batchIds,
  reportIds,
}: {
  passport: Passport;
  batchIds: bigint[];
  reportIds: bigint[];
}) {
  const entries: Array<[string, bigint]> = [
    ["Batches", passport.batchCount],
    ["Recalled", passport.recalledCount],
    ["Reports", passport.counterfeitReportCount],
    ["Pending", passport.pendingReportCount],
    ["Validated counterfeit", passport.validatedCounterfeitCount],
    ["Batch IDs returned", BigInt(batchIds.length)],
    ["Report IDs returned", BigInt(reportIds.length)],
  ];
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4 lg:grid-cols-7">
      {entries.map(([label, value]) => (
        <div key={label} className="bg-panel p-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            {label}
          </p>
          <p className="mt-1.5 font-display text-3xl font-extrabold leading-none text-frost">
            {value.toString()}
          </p>
        </div>
      ))}
    </div>
  );
}

function BatchStatusChip({ batch }: { batch: Batch }) {
  const expired = batch.expiryDate <= currentTimestamp;
  if (batch.recalled) {
    return (
      <span className="rounded-md border border-danger/60 bg-danger/15 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-danger shadow-glow-red">
        Recalled
      </span>
    );
  }
  if (expired) {
    return (
      <span className="rounded-md border border-gold/60 bg-gold/15 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-gold">
        Expired
      </span>
    );
  }
  return (
    <span className="rounded-md border border-teal/50 bg-teal/10 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-teal">
      Not recalled
    </span>
  );
}

function BatchCard({ batch, evidence }: { batch: Batch; evidence?: EvidenceEntry }) {
  const expired = batch.expiryDate <= currentTimestamp;
  return (
    <article className="glass overflow-hidden rounded-3xl">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-black/30 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-md border border-electric/40 bg-electric/10 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-electric">
              Batch #{batch.batchId.toString()}
            </span>
            <BatchStatusChip batch={batch} />
          </div>
          <h3 className="mt-3 font-display text-2xl font-extrabold uppercase leading-tight tracking-[-0.01em] text-frost">
            {batch.drugName || "Unnamed medicine"}
          </h3>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.1em] text-muted">
            Batch {batch.batchNumber || "Not returned"}
          </p>
        </div>
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-electric/40 bg-electric/10 text-electric shadow-glow-cyan"
          aria-hidden="true"
        >
          <Boxes className="h-5 w-5" />
        </span>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
        <DataPoint icon={ShieldCheck} label="NAFDAC key">
          {batch.nafdacNumber || "Not returned"}
        </DataPoint>
        <DataPoint icon={CalendarDays} label="Expiry">
          {formatTimestamp(batch.expiryDate)}
        </DataPoint>
        <DataPoint icon={Fingerprint} label="Credential token ID">
          <span className="font-mono">{batch.manufacturerId.toString()}</span>
        </DataPoint>
        <DataPoint icon={Factory} label="Manufacturer wallet">
          <AddressValue address={batch.manufacturer} />
        </DataPoint>
        <DataPoint icon={History} label="Attested by">
          <AddressValue address={batch.attestedBy} />
        </DataPoint>
        <DataPoint icon={CalendarDays} label="Attested at">
          {formatTimestamp(batch.attestedAt)}
        </DataPoint>
        <div className="sm:col-span-2 lg:col-span-3">
          <DataPoint icon={Fingerprint} label="Evidence hash">
            <span className="break-all font-mono text-xs">{batch.evidenceHash}</span>
            {evidence ? (
              <a
                href={evidence.ipfsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-electric underline decoration-electric/40 decoration-1 underline-offset-4 transition-colors hover:text-frost hover:decoration-frost"
              >
                View pinned evidence ({evidence.filename})
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </DataPoint>
        </div>
      </div>

      {batch.recalled ? (
        <div className="border-t border-danger/40 bg-danger/5 p-5 sm:p-6">
          <h4 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-danger">
            <ShieldAlert className="h-4 w-4" />
            Recall reason
          </h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-frost/80">
            {batch.recallReason || "No reason returned"}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-muted">
            <span>
              Recalled by <AddressValue address={batch.recalledBy} />
            </span>
            <span>{formatTimestamp(batch.recalledAt)}</span>
          </div>
        </div>
      ) : null}

      {expired && !batch.recalled ? (
        <div className="border-t border-gold/40 bg-gold/5 p-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-gold sm:p-6">
          Batch is past its recorded expiry date.
        </div>
      ) : null}
    </article>
  );
}

function ReportCard({ report }: { report: CounterfeitReport }) {
  const state = !report.validated
    ? "Pending owner validation"
    : report.isCounterfeit
      ? "Validated counterfeit"
      : "Validated as not counterfeit";
  const stateClass = !report.validated
    ? "border-gold/60 bg-gold/15 text-gold shadow-glow-gold"
    : report.isCounterfeit
      ? "border-danger/60 bg-danger/15 text-danger shadow-glow-red"
      : "border-teal/50 bg-teal/10 text-teal";

  return (
    <article className="glass overflow-hidden rounded-3xl">
      <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-electric">
            Report #{report.reportId.toString()}
          </p>
          <h3 className="mt-2 font-display text-xl font-bold uppercase leading-tight tracking-[-0.01em] text-frost">
            {report.nafdacNumber || "NAFDAC key not returned"}
          </h3>
        </div>
        <span className={cn("w-fit rounded-lg border px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em]", stateClass)}>
          {state}
        </span>
      </div>
      <div className="border-l-2 border-white/10 bg-black/30 p-4 text-sm leading-6 text-frost/80 sm:p-5">
        <p className="whitespace-pre-wrap break-words">{report.details || "No details returned"}</p>
      </div>
      <div className="grid gap-4 p-5 font-mono text-xs text-muted sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
        <div>
          <p className="font-bold uppercase tracking-[0.14em] text-muted">Reporter</p>
          <p className="mt-1"><AddressValue address={report.reporter} /></p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-[0.14em] text-muted">Reported</p>
          <p className="mt-1">{formatTimestamp(report.reportedAt)}</p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-[0.14em] text-muted">Validator</p>
          <p className="mt-1"><AddressValue address={report.validator} /></p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-[0.14em] text-muted">Validated</p>
          <p className="mt-1">{formatTimestamp(report.validatedAt)}</p>
        </div>
      </div>
    </article>
  );
}

function ProductLookupFallback({
  error,
  isLoading,
  lookup,
  nrn,
  onRetry,
}: {
  error: boolean;
  isLoading: boolean;
  lookup?: GreenBookLookup;
  nrn: string;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <section className="glass mt-8 rounded-3xl border border-electric/30 p-6 sm:p-8">
        <div className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.12em] text-electric">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Checking the official NAFDAC Green Book
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">Looking for an official product record for {nrn}.</p>
      </section>
    );
  }
  if (error) {
    return (
      <section className="glass mt-8 rounded-3xl border border-amber/40 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <div>
            <h2 className="font-display text-2xl font-extrabold uppercase text-frost">Official lookup unavailable</h2>
            <p className="mt-2 text-sm leading-6 text-muted">The on-chain registry has no passport for {nrn}, and the NAFDAC Green Book lookup could not be completed.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
              <RefreshCw className="h-4 w-4" />
              Retry official lookup
            </Button>
          </div>
        </div>
      </section>
    );
  }
  if (!lookup || lookup.products.length === 0) {
    return (
      <section className="glass mt-8 rounded-3xl border border-white/10 p-6 text-center sm:p-8">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-white/15 text-muted">
          <Search className="h-5 w-5" />
        </span>
        <h2 className="mt-4 font-display text-2xl font-extrabold uppercase text-frost">No official product match</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">No NAFDAC Green Book product matched {nrn} at lookup time. Check the number, or report a suspected product concern.</p>
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Retry lookup
          </Button>
          <Link href="/report" className={buttonStyles("secondary", "sm")}>
            Report a concern
          </Link>
        </div>
      </section>
    );
  }
  return (
    <section className="glass mt-8 rounded-3xl border border-gold/45 p-5 sm:p-7">
      <div className="flex flex-col gap-4 border-b border-gold/20 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Product found · not yet on-chain</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold uppercase leading-none text-frost">Official product record</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">NAFDAC Green Book returned a product for {nrn}, but PharmChain has no on-chain batch passport for it yet. This is product information, not a PharmChain verification.</p>
        </div>
        <span className="w-fit border border-gold/50 bg-gold/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-gold">Not verified on-chain</span>
      </div>
      <div className="mt-5 space-y-3">
        {lookup.products.map((product) => (
          <article key={`${product.id ?? product.nrn}-${product.name}`} className="border border-white/10 bg-black/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-electric">{product.nrn}</p>
                <h3 className="mt-2 font-display text-xl font-extrabold uppercase text-frost">{product.name}</h3>
              </div>
              {product.status ? <span className="w-fit border border-teal/40 bg-teal/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-teal">{product.status}</span> : null}
            </div>
            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
              {[
                ["Applicant", product.applicant],
                ["Form / route", [product.form, product.route].filter(Boolean).join(" · ")],
                ["Strength", product.strength],
                ["Green Book expiry", product.expiryDate],
              ].map(([label, value]) => value ? <div key={String(label)}><dt className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{label}</dt><dd className="mt-1 text-frost">{value}</dd></div> : null)}
            </dl>
            <a href={product.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-electric underline decoration-electric/30 underline-offset-4">
              Open official Green Book record
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </article>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-xs leading-5 text-muted">To make this product verifiable here, a verified manufacturer must attest a batch and its evidence.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className={buttonStyles("secondary", "sm")}>Register a batch</Link>
          <Link href="/report" className={buttonStyles("outline", "sm")}>Report a concern</Link>
        </div>
      </div>
    </section>
  );
}

function PassportResult({
  passport,
  batchIds,
  reportIds,
  batches,
  reports,
  requestedNafdacNumber,
  refreshVersion,
  evidenceByHash,
}: {
  passport: Passport;
  batchIds: bigint[];
  reportIds: bigint[];
  batches: Batch[];
  reports: CounterfeitReport[];
  requestedNafdacNumber: string;
  refreshVersion: number;
  evidenceByHash: Record<string, EvidenceEntry>;
}) {
  const verificationState = passportVerificationState(passport, batches, reports, currentTimestamp);
  const registryUrl = monadAddressUrl(registryAddress);
  const credentialUrl = monadAddressUrl(manufacturerCredentialAddress);

  return (
    <div className="mt-8 space-y-8">
      <ResultStatePanel state={verificationState} />

      <section className="glass rounded-3xl p-5 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-electric/40 bg-electric/10 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-electric">
                Public passport
              </span>
              <span className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                Monad Mainnet · chain 143
              </span>
            </div>
            <h1 className="mt-4 break-all font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-frost">
              {passport.nafdacNumber || requestedNafdacNumber}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Counts come from getDrugPassport. Full batch and report records are loaded
              from every getBatchPage and getCounterfeitReportPage response.
            </p>
          </div>
          <div className="shrink-0 lg:w-72">
            <PassportQr nafdacNumber={requestedNafdacNumber} />
          </div>
        </div>
        <div className="mt-6">
          <PassportSummary passport={passport} batchIds={batchIds} reportIds={reportIds} />
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-2 border-b border-white/10 pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-electric">Section 02</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold uppercase leading-none tracking-[-0.02em] text-frost">
              All registered batches
            </h2>
          </div>
          <p className="font-mono text-xs font-semibold text-muted">
            Loaded {batches.length} of {passport.batchCount.toString()}
          </p>
        </div>
        {batches.length ? (
          <div className="mt-5 space-y-5">
            {batches.map((batch) => (
              <BatchCard
                key={batch.batchId.toString()}
                batch={batch}
                evidence={evidenceByHash[batch.evidenceHash.toLowerCase()]}
              />
            ))}
          </div>
        ) : (
          <div className="glass mt-5 rounded-3xl border-dashed p-8 text-center font-mono text-sm text-muted">
            This passport has no registered batches.
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-col gap-2 border-b border-white/10 pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-electric">Section 03</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold uppercase leading-none tracking-[-0.02em] text-frost">
              Counterfeit report history
            </h2>
          </div>
          <p className="font-mono text-xs font-semibold text-muted">
            Loaded {reports.length} of {passport.counterfeitReportCount.toString()}
          </p>
        </div>
        {reports.length ? (
          <div className="mt-5 space-y-5">
            {reports.map((report) => (
              <ReportCard key={report.reportId.toString()} report={report} />
            ))}
          </div>
        ) : (
          <div className="glass mt-5 rounded-3xl border-dashed p-8 text-center font-mono text-sm text-muted">
            No counterfeit report is stored for this key.
          </div>
        )}
      </section>

      <TransactionEventExplorer
        nafdacNumber={requestedNafdacNumber}
        batches={batches}
        reports={reports}
        refreshVersion={refreshVersion}
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="glass rounded-3xl border-l-2 border-l-electric/60 p-5">
          <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-frost">
            <History className="h-4 w-4 text-electric" />
            Transaction context
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Registry structs store actor addresses and timestamps, not transaction
            hashes. The bounded event section resolves hashes only from logs actually
            returned by Monad Mainnet.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col">
          {registryUrl ? (
            <a href={registryUrl} target="_blank" rel="noreferrer" className={buttonStyles("outline", "md")}>
              DrugRegistry
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
          {credentialUrl ? (
            <a href={credentialUrl} target="_blank" rel="noreferrer" className={buttonStyles("outline", "md")}>
              Credential contract
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export function VerifyPassport({ initialNafdacNumber }: { initialNafdacNumber: string }) {
  const router = useRouter();
  const publicClient = usePublicClient({ chainId: MONAD_MAINNET_ID });
  const [input, setInput] = useState(initialNafdacNumber);
  const [formError, setFormError] = useState<string>();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const passportQuery = useReadContract({
    address: registryAddress,
    abi: DRUG_REGISTRY_ABI,
    functionName: "getDrugPassport",
    args: [initialNafdacNumber],
    query: {
      enabled: isRegistryConfigured && Boolean(initialNafdacNumber),
    },
  });
  const passportResult = parseDrugPassportResult(passportQuery.data);
  const passport = passportResult?.passport;
  const evidenceQuery = useQuery<Record<string, EvidenceEntry>>({
    queryKey: ["seed-evidence-manifest"],
    queryFn: async () => {
      const response = await fetch("/seed-evidence.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Evidence manifest could not be loaded.");
      const payload = (await response.json()) as { evidence?: EvidenceEntry[] };
      if (!Array.isArray(payload.evidence)) throw new Error("Evidence manifest is invalid.");
      return Object.fromEntries(
        payload.evidence.map((entry) => [entry.keccak256.toLowerCase(), entry]),
      );
    },
    staleTime: Infinity,
  });
  const evidenceByHash = evidenceQuery.data ?? {};
  const pagesQuery = useQuery({
    queryKey: [
      "drug-registry-passport-pages",
      registryAddress,
      initialNafdacNumber,
      refreshVersion,
    ],
    enabled:
      isRegistryConfigured &&
      Boolean(publicClient) &&
      Boolean(passport?.exists),
    queryFn: async () => {
      const address = registryAddress;
      const client = publicClient;
      if (!address || !client) {
        throw new Error("Monad public client is unavailable.");
      }

      const readBatches = async () => {
        const records: Batch[] = [];
        let offset = 0n;
        while (true) {
          const response = await client.readContract({
            address,
            abi: DRUG_REGISTRY_ABI,
            functionName: "getBatchPage",
            args: [initialNafdacNumber, offset, pageSize],
          });
          const result = parseBatchPageResult(response);
          records.push(...result.page);
          if (
            result.nextOffset === 0n ||
            result.nextOffset <= offset ||
            result.page.length === 0
          ) {
            return records;
          }
          offset = result.nextOffset;
        }
      };

      const readReports = async () => {
        const records: CounterfeitReport[] = [];
        let offset = 0n;
        while (true) {
          const response = await client.readContract({
            address,
            abi: DRUG_REGISTRY_ABI,
            functionName: "getCounterfeitReportPage",
            args: [initialNafdacNumber, offset, pageSize],
          });
          const result = parseCounterfeitReportPageResult(response);
          records.push(...result.page);
          if (
            result.nextOffset === 0n ||
            result.nextOffset <= offset ||
            result.page.length === 0
          ) {
            return records;
          }
          offset = result.nextOffset;
        }
      };

      const [loadedBatches, loadedReports] = await Promise.all([
        readBatches(),
        readReports(),
      ]);
      return { batches: loadedBatches, reports: loadedReports };
    },
    staleTime: 30_000,
  });

  const productLookup = useQuery<GreenBookLookup>({
    queryKey: ["greenbook-product-lookup", initialNafdacNumber],
    enabled:
      isRegistryConfigured &&
      passportQuery.isSuccess &&
      !passport?.exists &&
      Boolean(initialNafdacNumber),
    queryFn: async () => {
      const response = await fetch(
        `/api/products/lookup?nrn=${encodeURIComponent(initialNafdacNumber)}`,
      );
      if (!response.ok) {
        throw new Error("The official product lookup could not be completed.");
      }
      return (await response.json()) as GreenBookLookup;
    },
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nafdacNumber = nafdacFromInput(input);
    if (!nafdacNumber) {
      setFormError("Enter a valid NAFDAC registry key or PharmChain passport URL.");
      return;
    }
    setFormError(undefined);
    router.push(passportPath(nafdacNumber));
  };

  const refresh = () => {
    setRefreshVersion((current) => current + 1);
    void passportQuery.refetch();
    if (productLookup.isFetched) {
      void productLookup.refetch();
    }
  };

  const isLoading =
    isRegistryConfigured &&
    (passportQuery.isLoading ||
      (Boolean(passport?.exists) && pagesQuery.isPending));
  const readFailed = isRegistryConfigured && passportQuery.isError;
  const pagesFailed = Boolean(passport?.exists) && pagesQuery.isError;
  const noPassport = isRegistryConfigured && passportQuery.isSuccess && !passport?.exists;
  const batches = pagesQuery.data?.batches ?? [];
  const reports = pagesQuery.data?.reports ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="border-l border-electric/60 pl-5 sm:pl-6">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-electric">
          Form PC-2 · Public passport lookup
        </p>
        <h1 className="mt-3 font-display text-5xl font-extrabold uppercase leading-[0.92] tracking-[-0.02em] text-frost sm:text-6xl">
          Check a medicine passport
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
          Read the configured DrugRegistry on Monad Mainnet. This checks registry records
          and signals; it does not prove that a physical package is genuine or safe.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="glass mx-auto mt-8 flex max-w-3xl flex-col gap-3 rounded-3xl p-4 sm:flex-row sm:p-5"
        noValidate
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            aria-label="NAFDAC number"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Enter NAFDAC registry key"
            className="pl-11"
            autoComplete="off"
          />
        </div>
        <Button type="submit" size="lg">
          Check passport
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      {formError ? (
        <p className="mx-auto mt-3 max-w-3xl rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-sm text-frost" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="mx-auto mt-5 max-w-3xl">
        <ConfigurationNotice />
      </div>

      {isLoading ? (
        <div className="glass mt-8 grid min-h-80 place-items-center rounded-3xl text-center">
          <div>
            <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-electric" />
            <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Loading passport and all result pages…
            </p>
          </div>
        </div>
      ) : null}

      {readFailed ? (
        <ReadError
          message={errorMessage(passportQuery.error)}
          onRetry={() => void passportQuery.refetch()}
        />
      ) : null}

      {pagesFailed ? (
        <ReadError
          message={errorMessage(pagesQuery.error)}
          onRetry={() => void pagesQuery.refetch()}
        />
      ) : null}

      {noPassport ? (
        <ProductLookupFallback
          error={productLookup.isError}
          isLoading={productLookup.isPending}
          lookup={productLookup.data}
          nrn={initialNafdacNumber}
          onRetry={() => void productLookup.refetch()}
        />
      ) : null}

      {passport?.exists && pagesQuery.isSuccess ? (
        <PassportResult
          passport={passport}
          batchIds={passportResult?.batchIds ?? []}
          reportIds={passportResult?.reportIds ?? []}
          batches={batches}
          reports={reports}
          requestedNafdacNumber={initialNafdacNumber}
          refreshVersion={refreshVersion}
          evidenceByHash={evidenceByHash}
        />
      ) : null}

      {passport?.exists ? (
        <div className="mt-6 flex justify-end">
          <Button variant="ghost" size="sm" onClick={refresh} disabled={pagesQuery.isFetching}>
            <RefreshCw className={cn("h-4 w-4", pagesQuery.isFetching && "animate-spin")} />
            Refresh all records
          </Button>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col items-center justify-center gap-3 border-t border-white/10 pt-6 text-center font-mono text-xs font-bold uppercase tracking-[0.12em] sm:flex-row">
        <Link href="/" className={buttonStyles("ghost", "sm")}>
          Scan another QR
        </Link>
        <span className="hidden h-1 w-1 rounded-full bg-white/25 sm:block" />
        <Link href="/report" className={buttonStyles("ghost", "sm")}>
          Report a safety concern
        </Link>
      </div>
    </div>
  );
}

function ReadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-8 rounded-3xl border border-danger/40 bg-danger/5 p-6 text-frost shadow-glow-red" role="alert">
      <div className="flex gap-3">
        <CircleAlert className="h-5 w-5 shrink-0 text-danger" />
        <div>
          <h2 className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-danger">
            The registry records could not be read
          </h2>
          <p className="mt-1 break-words font-mono text-xs leading-6 text-muted">{message}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={onRetry}
          >
            <RefreshCw className="h-4 w-4" />
            Try read again
          </Button>
        </div>
      </div>
    </div>
  );
}
