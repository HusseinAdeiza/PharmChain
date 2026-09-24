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

function AddressValue({ address }: { address: `0x${string}` }) {
  if (address === zeroAddress) {
    return <span className="text-ink/45">Not set</span>;
  }
  return (
    <a
      href={monadAddressUrl(address)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 font-mono text-xs text-teal hover:text-ink"
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
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink/40">
        <Icon className="h-3.5 w-3.5 text-teal" />
        {label}
      </p>
      <div className="mt-1.5 break-words text-sm font-semibold text-ink">{children}</div>
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

function ResultStatePanel({ state }: { state: PassportVerificationState }) {
  const content = resultStateContent[state];
  const counterfeit = state === "counterfeit";
  const recalled = state === "recalled";
  const review = state === "review";
  const Icon = counterfeit ? ShieldAlert : recalled ? ShieldAlert : review ? Clock3 : CheckCircle2;

  return (
    <section
      className={cn(
        "rounded-3xl border p-5 sm:p-6",
        counterfeit
          ? "border-coral/25 bg-coral/5"
          : recalled
            ? "border-coral/25 bg-coral/5"
            : review
              ? "border-amber-300/60 bg-amber-50"
              : "border-emerald-200 bg-emerald-50",
      )}
    >
      <div className="flex gap-3">
        <span
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
            counterfeit
              ? "bg-coral/10 text-coral"
              : recalled
                ? "bg-coral/10 text-coral"
                : review
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800",
          )}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-display text-xl font-black tracking-[-0.04em]">
            {content.title}
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-ink/60">
            {content.description}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {(["verified", "recalled", "counterfeit", "review"] as const).map((item) => {
          const ItemIcon =
            item === "verified"
              ? CheckCircle2
              : item === "recalled"
                ? ShieldAlert
                : item === "counterfeit"
                  ? ShieldAlert
                  : Clock3;
          return (
            <div
              key={item}
              className={cn(
                "flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-bold",
                item === state
                  ? "border-ink bg-ink text-white"
                  : "border-ink/8 bg-white/65 text-ink/45",
              )}
            >
              <ItemIcon className="h-4 w-4" />
              {resultStateContent[item].label}
              {item === state ? <span className="ml-auto">Current</span> : null}
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
  return (
    <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {[
        ["Batches", passport.batchCount],
        ["Recalled", passport.recalledCount],
        ["Reports", passport.counterfeitReportCount],
        ["Pending", passport.pendingReportCount],
        ["Validated counterfeit", passport.validatedCounterfeitCount],
        ["Batch IDs returned", BigInt(batchIds.length)],
        ["Report IDs returned", BigInt(reportIds.length)],
      ].map(([label, value]) => (
        <div key={String(label)} className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink/40">
            {String(label)}
          </p>
          <p className="mt-1 font-display text-2xl font-black tracking-[-0.04em]">
            {String(value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function BatchCard({ batch, evidence }: { batch: Batch; evidence?: EvidenceEntry }) {
  const expired = batch.expiryDate <= currentTimestamp;
  return (
    <article className="overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-card">
      <div className="flex flex-col gap-3 border-b border-ink/5 bg-[#f4fbf7] p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-mint px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-ink">
              Batch #{batch.batchId.toString()}
            </span>
            {batch.recalled ? (
              <span className="rounded-full bg-coral/10 px-2.5 py-1 text-[11px] font-bold text-coral">
                Recalled
              </span>
            ) : expired ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                Expired
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                Not recalled
              </span>
            )}
          </div>
          <h3 className="mt-3 font-display text-xl font-black tracking-[-0.04em]">
            {batch.drugName || "Unnamed medicine"}
          </h3>
          <p className="mt-1 text-sm text-ink/50">Batch {batch.batchNumber || "Not returned"}</p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-mint">
          <Boxes className="h-5 w-5" />
        </span>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
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
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-teal hover:text-ink"
              >
                View pinned evidence ({evidence.filename})
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </DataPoint>
        </div>
      </div>

      {batch.recalled ? (
        <div className="border-t border-coral/15 bg-coral/5 p-5">
          <h4 className="flex items-center gap-2 text-sm font-extrabold text-coral">
            <ShieldAlert className="h-4 w-4" />
            Recall reason
          </h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink/65">
            {batch.recallReason || "No reason returned"}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink/45">
            <span>
              Recalled by <AddressValue address={batch.recalledBy} />
            </span>
            <span>{formatTimestamp(batch.recalledAt)}</span>
          </div>
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
    ? "bg-amber-100 text-amber-800"
    : report.isCounterfeit
      ? "bg-coral/10 text-coral"
      : "bg-emerald-100 text-emerald-800";

  return (
    <article className="rounded-3xl border border-ink/8 bg-white p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs font-bold text-teal">Report #{report.reportId.toString()}</p>
          <h3 className="mt-2 font-display text-lg font-black tracking-[-0.03em]">
            {report.nafdacNumber || "NAFDAC key not returned"}
          </h3>
        </div>
        <span className={cn("w-fit rounded-full px-3 py-1.5 text-xs font-bold", stateClass)}>
          {state}
        </span>
      </div>
      <div className="mt-4 rounded-2xl bg-ink/[0.035] p-4 text-sm leading-6 text-ink/65">
        <p className="whitespace-pre-wrap break-words">{report.details || "No details returned"}</p>
      </div>
      <div className="mt-4 grid gap-4 text-xs text-ink/50 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-bold uppercase tracking-[0.08em]">Reporter</p>
          <p className="mt-1"><AddressValue address={report.reporter} /></p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-[0.08em]">Reported</p>
          <p className="mt-1 text-ink/65">{formatTimestamp(report.reportedAt)}</p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-[0.08em]">Validator</p>
          <p className="mt-1"><AddressValue address={report.validator} /></p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-[0.08em]">Validated</p>
          <p className="mt-1 text-ink/65">{formatTimestamp(report.validatedAt)}</p>
        </div>
      </div>
    </article>
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
    <div className="mt-8 space-y-6">
      <ResultStatePanel state={verificationState} />

      <section className="rounded-3xl border border-ink/8 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-mint px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-ink">
                Public passport
              </span>
              <span className="rounded-full border border-emerald-700/10 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                Monad Mainnet · chain 143
              </span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-black tracking-[-0.05em]">
              {passport.nafdacNumber || requestedNafdacNumber}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/55">
              Counts come from getDrugPassport. Full batch and report records are loaded
              from every getBatchPage and getCounterfeitReportPage response.
            </p>
          </div>
          <PassportQr nafdacNumber={requestedNafdacNumber} />
        </div>
        <div className="mt-6">
          <PassportSummary passport={passport} batchIds={batchIds} reportIds={reportIds} />
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-teal">Batch records</p>
            <h2 className="mt-1 font-display text-2xl font-black tracking-[-0.04em]">
              All registered batches
            </h2>
          </div>
          <p className="text-xs font-semibold text-ink/45">
            Loaded {batches.length} of {passport.batchCount.toString()}
          </p>
        </div>
        {batches.length ? (
          <div className="space-y-4">
            {batches.map((batch) => (
              <BatchCard
                key={batch.batchId.toString()}
                batch={batch}
                evidence={evidenceByHash[batch.evidenceHash.toLowerCase()]}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-ink/15 bg-white/60 p-8 text-center text-sm text-ink/50">
            This passport has no registered batches.
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-teal">Report records</p>
            <h2 className="mt-1 font-display text-2xl font-black tracking-[-0.04em]">
              Counterfeit report history
            </h2>
          </div>
          <p className="text-xs font-semibold text-ink/45">
            Loaded {reports.length} of {passport.counterfeitReportCount.toString()}
          </p>
        </div>
        {reports.length ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <ReportCard key={report.reportId.toString()} report={report} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-ink/15 bg-white/60 p-8 text-center text-sm text-ink/50">
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
        <div className="rounded-3xl border border-ink/8 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-base font-extrabold">
            <History className="h-4 w-4 text-teal" />
            Transaction context
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/55">
            Registry structs store actor addresses and timestamps, not transaction
            hashes. The bounded event section resolves hashes only from logs actually
            returned by Monad Mainnet.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
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
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-teal/15 bg-white px-3 py-2 text-xs font-bold text-teal shadow-sm">
          <ShieldCheck className="h-4 w-4" />
          PUBLIC PASSPORT LOOKUP
        </span>
        <h1 className="mt-5 text-balance font-display text-4xl font-black tracking-[-0.05em] sm:text-5xl">
          Check a medicine passport
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink/55">
          Read the configured DrugRegistry on Monad Mainnet. This checks registry records
          and signals; it does not prove that a physical package is genuine or safe.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 rounded-3xl border border-ink/8 bg-white p-4 shadow-card sm:flex-row sm:p-5"
        noValidate
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
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
      {formError ? <p className="mt-3 text-center text-sm text-red-700">{formError}</p> : null}

      <div className="mt-5">
        <ConfigurationNotice />
      </div>

      {isLoading ? (
        <div className="mt-8 grid min-h-80 place-items-center rounded-[2rem] border border-ink/8 bg-white text-center shadow-card">
          <div>
            <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-teal" />
            <p className="mt-4 text-sm font-semibold text-ink/60">
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
        <div className="mt-8 rounded-3xl border border-ink/8 bg-white p-7 text-center shadow-card">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink/5 text-ink/35">
            <Search className="h-6 w-6" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-extrabold tracking-[-0.04em]">
            No passport found
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink/55">
            The configured contract returned no batch or report for {initialNafdacNumber}.
            A valid NAFDAC number does not imply an on-chain PharmChain passport.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="outline" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh result
            </Button>
            <Link href="/register" className={buttonStyles("primary", "md")}>
              Register a batch
            </Link>
          </div>
        </div>
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

      <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
        <Link href="/" className={buttonStyles("ghost", "sm")}>
          Scan another QR
        </Link>
        <span className="hidden h-1 w-1 rounded-full bg-ink/20 sm:block" />
        <Link href="/report" className={buttonStyles("ghost", "sm")}>
          Report a safety concern
        </Link>
      </div>
    </div>
  );
}

function ReadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-950" role="alert">
      <div className="flex gap-3">
        <CircleAlert className="h-5 w-5 shrink-0 text-red-700" />
        <div>
          <h2 className="font-bold">The registry records could not be read</h2>
          <p className="mt-1 text-sm leading-6 text-red-900/70">{message}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 border-red-200 bg-white"
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
