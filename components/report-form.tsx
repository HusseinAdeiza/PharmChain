"use client";

import { type FormEvent, useState } from "react";
import {
  BadgeCheck,
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
    <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5" role="status">
      <div className="flex gap-3">
        <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
        <div>
          <h2 className="font-display text-lg font-extrabold tracking-[-0.03em]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-emerald-950/65">{description}</p>
          {explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 hover:text-emerald-700"
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
      <div className="rounded-[2rem] border border-ink/8 bg-white p-4 shadow-card sm:p-7">
        <div className="grid gap-2 sm:grid-cols-3" role="tablist" aria-label="Report action">
          {tabs.map((tab) => {
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
                  "flex min-h-16 items-center gap-3 rounded-2xl border px-4 text-left transition",
                  active
                    ? "border-ink bg-ink text-white shadow-sm"
                    : "border-ink/8 bg-paper text-ink hover:border-teal/25 hover:bg-mint/25",
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                    active ? "bg-white/10 text-mint" : "bg-white text-teal",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-bold">{tab.label}</span>
                  <span className={cn("mt-0.5 block text-[11px]", active ? "text-white/50" : "text-ink/40")}>
                    {tab.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <form onSubmit={(event) => void submit(event)} className="mt-7" noValidate>
          <div className="border-b border-ink/5 pb-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-teal">
              {mode === "recall"
                ? "Batch safety signal"
                : mode === "counterfeit"
                  ? "Product authenticity report"
                  : "Authorized review action"}
            </p>
            <h2 className="mt-2 font-display text-2xl font-black tracking-[-0.04em]">
              {mode === "recall"
                ? "Flag a batch for recall"
                : mode === "counterfeit"
                  ? "Report a suspected counterfeit"
                  : "Validate a counterfeit report"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/55">
              {mode === "recall"
                ? "Submit the exact batch ID and reason. Only the batch manufacturer or DrugRegistry owner can create the recall."
                : mode === "counterfeit"
                  ? "Provide the registry NAFDAC key and specific report details. Do not include personal medical information."
                  : "Only the DrugRegistry owner can validate a report. The call records isCounterfeit as true or false."}
            </p>
          </div>

          <div className="mt-6">
            {mode === "recall" ? (
              <div className="space-y-5">
                <div>
                  <FieldLabel htmlFor="recall-batch-id">Batch ID</FieldLabel>
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
                  <FieldLabel htmlFor="recall-reason">Recall reason</FieldLabel>
                  <Textarea
                    id="recall-reason"
                    value={draft.reason}
                    onChange={(event) => update("reason", event.target.value)}
                    placeholder="Describe the affected batch and safety reason"
                    maxLength={512}
                  />
                  <p className="mt-2 text-right text-[11px] text-ink/35">
                    {draft.reason.length}/512
                  </p>
                </div>
              </div>
            ) : null}

            {mode === "counterfeit" ? (
              <div className="space-y-5">
                <div>
                  <FieldLabel htmlFor="counterfeit-nafdac">NAFDAC number</FieldLabel>
                  <Input
                    id="counterfeit-nafdac"
                    value={draft.nafdacNumber}
                    onChange={(event) => update("nafdacNumber", event.target.value)}
                    placeholder="Suspected product registration number"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="counterfeit-details">Report details</FieldLabel>
                  <Textarea
                    id="counterfeit-details"
                    value={draft.details}
                    onChange={(event) => update("details", event.target.value)}
                    placeholder="Describe the affected batch, source, and observed issue"
                    maxLength={2_048}
                  />
                  <p className="mt-2 text-right text-[11px] text-ink/35">
                    {draft.details.length}/2,048
                  </p>
                </div>
              </div>
            ) : null}

            {mode === "validation" ? (
              <div className="space-y-5">
                <div>
                  <FieldLabel htmlFor="report-id">Counterfeit report ID</FieldLabel>
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
                  <FieldLabel htmlFor="validation-result">Review decision</FieldLabel>
                  <Select
                    id="validation-result"
                    value={draft.validation}
                    onChange={(event) => update("validation", event.target.value)}
                  >
                    <option value="uphold">Uphold report — submit true</option>
                    <option value="dismiss">Dismiss report — submit false</option>
                  </Select>
                </div>
                <div className="flex gap-3 rounded-2xl border border-amber-300/50 bg-amber-50 p-4 text-sm leading-6 text-amber-950/75">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  This button submits a final boolean to the contract. It does not infer a
                  finding from local evidence.
                </div>
              </div>
            ) : null}
          </div>

          {formError ? (
            <p className="mt-5 rounded-2xl bg-red-50 p-3 text-sm text-red-800" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="mt-6 border-t border-ink/5 pt-6">
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
              <p className="mt-3 text-center text-xs text-ink/45">
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

      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className="rounded-3xl border border-coral/15 bg-[#fff6f2] p-6">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-coral/10 text-coral">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <h2 className="mt-5 font-display text-lg font-extrabold tracking-[-0.03em]">
            Safety before speed
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/58">
            If a medicine may be unsafe, stop using it and contact a qualified health
            professional or the relevant regulator. An on-chain report is not medical
            advice.
          </p>
        </div>

        <div className="rounded-3xl border border-ink/8 bg-white p-5 shadow-card">
          <h2 className="text-sm font-extrabold">Registry destination</h2>
          <p className="mt-2 break-all font-mono text-xs leading-5 text-ink/45">
            {registryAddress ?? "NEXT_PUBLIC_DRUG_REGISTRY_ADDRESS is not set"}
          </p>
          {registryAddress ? (
            <a
              href={monadAddressUrl(registryAddress)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-teal hover:text-ink"
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
