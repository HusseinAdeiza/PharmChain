"use client";

import { type FormEvent, useState } from "react";
import {
  CircleAlert,
  ClipboardCheck,
  ExternalLink,
  FileWarning,
  LoaderCircle,
  PackageX,
  ShieldAlert,
  Siren,
} from "lucide-react";
import { Button, cn } from "@/components/ui/button";
import { FieldLabel, Input, Select, Textarea } from "@/components/ui/field";
import {
  ActionRequirements,
  ActionTransactionStatus,
} from "@/components/registry-action-status";
import { isRegistryConfigured, registryAddress } from "@/lib/contracts";
import { monadAddressUrl, monadTransactionUrl } from "@/lib/monad";
import { isValidNafdacNumber } from "@/lib/nafdac";
import { useRegistryAction } from "@/lib/use-registry-action";

type ReportMode = "recall" | "counterfeit" | "validation";

type ReportDraft = {
  batchId: string;
  reason: string;
  nafdacNumber: string;
  details: string;
  reportId: string;
  validation: "uphold" | "dismiss";
};

const emptyDraft: ReportDraft = {
  batchId: "",
  reason: "",
  nafdacNumber: "",
  details: "",
  reportId: "",
  validation: "uphold",
};

const tabs: Array<{
  id: ReportMode;
  label: string;
  description: string;
  icon: typeof Siren;
}> = [
  {
    id: "recall",
    label: "Recall",
    description: "Flag a batch",
    icon: PackageX,
  },
  {
    id: "counterfeit",
    label: "Counterfeit",
    description: "Report a product",
    icon: FileWarning,
  },
  {
    id: "validation",
    label: "Validate",
    description: "Review a report",
    icon: ClipboardCheck,
  },
];

function positiveId(value: string) {
  return /^\d+$/.test(value.trim()) && BigInt(value.trim()) > 0n;
}

const confirmedStamp: Record<ReportMode, string> = {
  recall: "Recalled",
  counterfeit: "Reported",
  validation: "Validated",
};

function ConfirmedReport({
  mode,
  transactionHash,
}: {
  mode: ReportMode;
  transactionHash?: `0x${string}`;
}) {
  const explorerUrl = monadTransactionUrl(transactionHash);
  const title =
    mode === "recall"
      ? "Recall action confirmed"
      : mode === "counterfeit"
        ? "Counterfeit report confirmed"
        : "Validation decision confirmed";
  const description =
    mode === "recall"
      ? "The recall transaction succeeded on Monad Mainnet. Verification can now return the updated batch signal."
      : mode === "counterfeit"
        ? "The counterfeit report transaction succeeded on Monad Mainnet. The registry stores the report details you supplied."
        : "The validation transaction succeeded on Monad Mainnet. The selected finding state was submitted on-chain.";

  return (
    <div className="mt-6 rounded-3xl border border-teal/40 bg-teal/5 p-5 shadow-glow-teal" role="status">
      <div className="flex flex-col gap-4 sm:flex-row">
        <span className="grid h-20 w-40 shrink-0 place-items-center rounded-2xl border-2 border-teal/60 bg-black/40 font-display text-2xl font-extrabold uppercase text-teal motion-safe:animate-stamp-in">
          {confirmedStamp[mode]}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold uppercase leading-tight tracking-[-0.01em] text-frost">{title}</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p>
          {explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-electric underline decoration-electric/40 decoration-1 underline-offset-4 transition-colors hover:text-frost hover:decoration-frost"
            >
              View confirmed transaction
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ReportForm() {
  const action = useRegistryAction();
  const [mode, setMode] = useState<ReportMode>("recall");
  const [draft, setDraft] = useState<ReportDraft>(emptyDraft);
  const [formError, setFormError] = useState<string>();

  const update = (field: keyof ReportDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFormError(undefined);
  };

  const changeMode = (nextMode: ReportMode) => {
    setMode(nextMode);
    setDraft(emptyDraft);
    setFormError(undefined);
    action.clear();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === "recall") {
      if (!positiveId(draft.batchId)) {
        setFormError("Batch ID must be a positive whole number.");
        return;
      }
      const reason = draft.reason.trim();
      const reasonBytes = new TextEncoder().encode(reason).length;
      if (reasonBytes === 0 || reasonBytes > 512) {
        setFormError("Recall reason must contain between 1 and 512 UTF-8 bytes.");
        return;
      }
      await action.submit({
        functionName: "flagRecall",
        args: [BigInt(draft.batchId.trim()), reason],
      });
      return;
    }

    if (mode === "counterfeit") {
      const nafdacNumber = draft.nafdacNumber.trim();
      const details = draft.details.trim();
      if (!isValidNafdacNumber(nafdacNumber)) {
        setFormError("NAFDAC number must match the registry key format.");
        return;
      }
      const detailBytes = new TextEncoder().encode(details).length;
      if (detailBytes === 0 || detailBytes > 2_048) {
        setFormError("Report details must contain between 1 and 2,048 UTF-8 bytes.");
        return;
      }
      await action.submit({
        functionName: "flagCounterfeit",
        args: [nafdacNumber, details],
      });
      return;
    }

    if (!positiveId(draft.reportId)) {
      setFormError("Report ID must be a positive whole number.");
      return;
    }
    await action.submit({
      functionName: "validateCounterfeit",
      args: [BigInt(draft.reportId.trim()), draft.validation === "uphold"],
    });
  };

  const canSubmit =
    isRegistryConfigured &&
    action.isConnected &&
    !action.needsMonad &&
    !action.isWriting &&
    !action.isConfirming &&
    !action.isConfirmed;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="glass rounded-3xl p-4 sm:p-7">
        <div className="grid gap-2 sm:grid-cols-3" role="tablist" aria-label="Report action">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => changeMode(tab.id)}
                className={cn(
                  "flex min-h-16 items-center gap-3 rounded-2xl border px-4 text-left transition-[border-color,box-shadow,background-color,color]",
                  active
                    ? "border-electric/50 bg-electric/10 text-frost shadow-glow-cyan"
                    : "border-white/10 bg-black/30 text-muted hover:border-white/25 hover:text-frost",
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg border",
                    active ? "border-electric/50 bg-black/40 text-electric" : "border-white/10 text-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-mono text-sm font-bold uppercase tracking-[0.08em]">
                    {tab.label}
                  </span>
                  <span className={cn("mt-0.5 block font-mono text-[10px] uppercase tracking-[0.1em]", active ? "text-electric/80" : "text-muted")}>
                    {`0${index + 1} · ${tab.description}`}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <form onSubmit={(event) => void submit(event)} className="mt-7" noValidate>
          <div className="border-b border-white/10 pb-5">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-electric">
              {mode === "recall"
                ? "Signal 01 · Batch safety signal"
                : mode === "counterfeit"
                  ? "Signal 02 · Product authenticity report"
                  : "Signal 03 · Authorized review action"}
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase leading-none tracking-[-0.02em] text-frost">
              {mode === "recall"
                ? "Flag a batch for recall"
                : mode === "counterfeit"
                  ? "Report a suspected counterfeit"
                  : "Validate a counterfeit report"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {mode === "recall"
                ? "Submit the exact batch ID and reason. Only the batch manufacturer or DrugRegistry owner can create the recall."
                : mode === "counterfeit"
                  ? "Provide the registry NAFDAC key and specific report details. Do not include personal medical information."
                  : "Only the DrugRegistry owner can validate a report. The call records isCounterfeit as true or false."}
            </p>
          </div>

          <div className="mt-6">
            {mode === "recall" ? (
              <div className="space-y-5 border-l border-white/10 pl-4 sm:pl-6">
                <div>
                  <FieldLabel htmlFor="recall-batch-id">1a · Batch ID</FieldLabel>
                  <Input
                    id="recall-batch-id"
                    inputMode="numeric"
                    value={draft.batchId}
                    onChange={(event) => update("batchId", event.target.value)}
                    placeholder="Batch identifier"
                    className="font-mono"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="recall-reason">1b · Recall reason</FieldLabel>
                  <Textarea
                    id="recall-reason"
                    value={draft.reason}
                    onChange={(event) => update("reason", event.target.value)}
                    placeholder="Describe the affected batch and safety reason"
                    maxLength={512}
                  />
                  <p className="mt-2 text-right font-mono text-[11px] text-muted">
                    {draft.reason.length}/512
                  </p>
                </div>
              </div>
            ) : null}

            {mode === "counterfeit" ? (
              <div className="space-y-5 border-l border-white/10 pl-4 sm:pl-6">
                <div>
                  <FieldLabel htmlFor="counterfeit-nafdac">2a · NAFDAC number</FieldLabel>
                  <Input
                    id="counterfeit-nafdac"
                    value={draft.nafdacNumber}
                    onChange={(event) => update("nafdacNumber", event.target.value)}
                    placeholder="Suspected product registration number"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="counterfeit-details">2b · Report details</FieldLabel>
                  <Textarea
                    id="counterfeit-details"
                    value={draft.details}
                    onChange={(event) => update("details", event.target.value)}
                    placeholder="Describe the affected batch, source, and observed issue"
                    maxLength={2_048}
                  />
                  <p className="mt-2 text-right font-mono text-[11px] text-muted">
                    {draft.details.length}/2,048
                  </p>
                </div>
              </div>
            ) : null}

            {mode === "validation" ? (
              <div className="space-y-5 border-l border-white/10 pl-4 sm:pl-6">
                <div>
                  <FieldLabel htmlFor="report-id">3a · Counterfeit report ID</FieldLabel>
                  <Input
                    id="report-id"
                    inputMode="numeric"
                    value={draft.reportId}
                    onChange={(event) => update("reportId", event.target.value)}
                    placeholder="Report identifier"
                    className="font-mono"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="validation-result">3b · Review decision</FieldLabel>
                  <Select
                    id="validation-result"
                    value={draft.validation}
                    onChange={(event) => update("validation", event.target.value)}
                  >
                    <option value="uphold">Uphold report — submit true</option>
                    <option value="dismiss">Dismiss report — submit false</option>
                  </Select>
                </div>
                <div className="flex gap-3 rounded-2xl border border-gold/40 bg-gold/5 p-4 text-sm leading-6 text-muted">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  This button submits a final boolean to the contract. It does not infer a
                  finding from local evidence.
                </div>
              </div>
            ) : null}
          </div>

          {formError ? (
            <p className="mt-5 rounded-2xl border border-danger/40 bg-danger/10 p-3 font-mono text-sm text-frost shadow-glow-red" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="mt-6 border-t border-white/10 pt-6">
            <ActionRequirements action={action} />
            <ActionTransactionStatus action={action} />
            {action.isConfirmed ? (
              <ConfirmedReport mode={mode} transactionHash={action.transactionHash} />
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                size="lg"
                variant={mode === "recall" ? "danger" : "primary"}
                className="flex-1"
                disabled={!canSubmit}
              >
                {action.isWriting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : mode === "recall" ? (
                  <PackageX className="h-4 w-4" />
                ) : mode === "counterfeit" ? (
                  <FileWarning className="h-4 w-4" />
                ) : (
                  <ClipboardCheck className="h-4 w-4" />
                )}
                {action.isWriting
                  ? "Confirm in wallet"
                  : action.isConfirming
                    ? "Confirming on Monad"
                    : mode === "recall"
                      ? "Submit recall report"
                      : mode === "counterfeit"
                        ? "Submit counterfeit report"
                        : "Submit validation"}
              </Button>
              {action.isConfirmed ? (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    changeMode(mode);
                  }}
                >
                  Start another action
                </Button>
              ) : null}
            </div>
            {!canSubmit && !action.isConfirmed ? (
              <p className="mt-3 text-center font-mono text-xs text-muted">
                {!isRegistryConfigured
                  ? "Configure a valid DrugRegistry address to enable this action."
                  : !action.isConnected
                    ? "Connect an injected wallet to continue."
                    : action.needsMonad
                      ? "Switch the wallet to Monad Mainnet to continue."
                      : "Wait for the current wallet request or confirmation to finish."}
              </p>
            ) : null}
          </div>
        </form>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-28">
        <div className="corner-marks corner-marks-danger glass rounded-3xl border-danger/30 bg-danger/5 p-6">
          <span
            className="grid h-11 w-11 place-items-center rounded-xl border border-danger/50 bg-black/40 text-danger shadow-glow-red"
            aria-hidden="true"
          >
            <ShieldAlert className="h-5 w-5" />
          </span>
          <h2 className="mt-5 font-display text-xl font-bold uppercase leading-tight tracking-[-0.01em] text-frost">
            Safety before speed
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            If a medicine may be unsafe, stop using it and contact a qualified health
            professional or the relevant regulator. An on-chain report is not medical
            advice.
          </p>
        </div>

        <div className="corner-marks corner-marks-soft glass rounded-3xl p-5">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-frost">Registry destination</h2>
          <p className="mt-2 break-all font-mono text-xs leading-5 text-muted">
            {registryAddress ?? "NEXT_PUBLIC_DRUG_REGISTRY_ADDRESS is not set"}
          </p>
          {registryAddress ? (
            <a
              href={monadAddressUrl(registryAddress)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-electric underline decoration-electric/40 decoration-1 underline-offset-4 transition-colors hover:text-frost hover:decoration-frost"
            >
              Inspect contract on MonadScan
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
