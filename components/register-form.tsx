"use client";

import { type FormEvent, useState } from "react";
import {
  ArrowRight,
  BadgePlus,
  CalendarDays,
  Fingerprint,
  IdCard,
  Info,
  LoaderCircle,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Button, buttonStyles } from "@/components/ui/button";
import { FieldLabel, Input } from "@/components/ui/field";
import {
  ActionRequirements,
  ActionTransactionStatus,
} from "@/components/registry-action-status";
import {
  isRegistryConfigured,
  manufacturerCredentialAddress,
  registryAddress,
} from "@/lib/contracts";
import { monadAddressUrl, monadTransactionUrl } from "@/lib/monad";
import { nafdacFromInput, passportPath } from "@/lib/nafdac";
import { useRegistryAction } from "@/lib/use-registry-action";

type RegistrationDraft = {
  manufacturerId: string;
  nafdacNumber: string;
  batchNumber: string;
  drugName: string;
  expiryDate: string;
  evidenceHash: string;
};

const emptyDraft: RegistrationDraft = {
  manufacturerId: "",
  nafdacNumber: "",
  batchNumber: "",
  drugName: "",
  expiryDate: "",
  evidenceHash: "",
};

const textEncoder = new TextEncoder();

function isPositiveId(value: string) {
  return /^\d+$/.test(value.trim()) && BigInt(value.trim()) > 0n;
}

function validateRegistryText(label: string, value: string) {
  const byteLength = textEncoder.encode(value).length;
  if (byteLength === 0 || byteLength > 512) {
    return `${label} must contain between 1 and 512 UTF-8 bytes.`;
  }
  return undefined;
}

function RegistrationSuccess({
  nafdacNumber,
  transactionHash,
  onReset,
}: {
  nafdacNumber: string;
  transactionHash?: `0x${string}`;
  onReset: () => void;
}) {
  const transactionUrl = monadTransactionUrl(transactionHash);
  return (
    <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5" role="status">
      <div className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800">
          <PackageCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-extrabold tracking-[-0.03em]">
            Batch attestation confirmed
          </h2>
          <p className="mt-1 text-sm leading-6 text-emerald-950/65">
            The DrugRegistry transaction succeeded on Monad Mainnet. Inspect the
            receipt for BatchAttested and open the passport to read the stored batch.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={passportPath(nafdacNumber)}
              className={buttonStyles("primary", "md")}
            >
              View passport
              <ArrowRight className="h-4 w-4" />
            </Link>
            {transactionUrl ? (
              <a
                href={transactionUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-300 bg-white px-5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
              >
                View transaction
              </a>
            ) : null}
            <Button variant="outline" onClick={onReset}>
              Register another
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisterForm() {
  const action = useRegistryAction();
  const [draft, setDraft] = useState<RegistrationDraft>(emptyDraft);
  const [formError, setFormError] = useState<string>();
  const [submittedNafdac, setSubmittedNafdac] = useState<string>();

  const update = (field: keyof RegistrationDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFormError(undefined);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const manufacturerId = draft.manufacturerId.trim();
    const nafdacNumber = nafdacFromInput(draft.nafdacNumber) ?? draft.nafdacNumber.trim();
    const batchNumber = draft.batchNumber.trim();
    const drugName = draft.drugName.trim();
    const evidenceHash = draft.evidenceHash.trim();

    if (!isPositiveId(manufacturerId)) {
      setFormError("Manufacturer credential token ID must be a positive whole number.");
      return;
    }
    const nafdacError = validateRegistryText("NAFDAC number", nafdacNumber);
    if (nafdacError) {
      setFormError(nafdacError);
      return;
    }
    const batchError = validateRegistryText("Batch number", batchNumber);
    if (batchError) {
      setFormError(batchError);
      return;
    }
    const drugError = validateRegistryText("Medicine name", drugName);
    if (drugError) {
      setFormError(drugError);
      return;
    }
    if (!draft.expiryDate) {
      setFormError("Choose the medicine expiry date.");
      return;
    }
    const expiryTime = new Date(`${draft.expiryDate}T00:00:00Z`).getTime();
    if (!Number.isFinite(expiryTime)) {
      setFormError("Choose a valid expiry date.");
      return;
    }
    const expiryDate = BigInt(Math.floor(expiryTime / 1000));
    if (expiryDate <= 0n) {
      setFormError("Choose a valid expiry date.");
      return;
    }
    if (!/^0x[0-9a-fA-F]{64}$/.test(evidenceHash) || /^0x0{64}$/i.test(evidenceHash)) {
      setFormError("Evidence hash must be a non-zero bytes32 value: 0x followed by 64 hexadecimal characters.");
      return;
    }

    setFormError(undefined);
    setSubmittedNafdac(nafdacNumber);
    await action.submit({
      functionName: "attestBatch",
      args: [
        BigInt(manufacturerId),
        nafdacNumber,
        batchNumber,
        drugName,
        expiryDate,
        evidenceHash as `0x${string}`,
      ],
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
      <form
        onSubmit={(event) => void submit(event)}
        className="rounded-[2rem] border border-ink/8 bg-white p-5 shadow-card sm:p-7"
        noValidate
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/5 pb-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-teal">
              Attestation details
            </p>
            <h2 className="mt-2 font-display text-2xl font-black tracking-[-0.04em]">
              Attest a medicine batch
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink/55">
              The connected wallet calls the exact
              <code className="mx-1 rounded-md bg-ink/5 px-1.5 py-0.5 font-mono text-xs">
                attestBatch
              </code>
              function. The registry assigns the batch ID after authorization succeeds.
            </p>
          </div>
          <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mint text-ink sm:grid">
            <BadgePlus className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-5 flex gap-3 rounded-2xl border border-amber-300/50 bg-amber-50 p-4 text-sm leading-6 text-amber-950/75">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p>
            Manufacturer credentials are soulbound ERC-721 tokens. Credential minting is
            owner-only and available in the separate owner flow above; otherwise request
            an existing token ID and connect the wallet that owns it.
          </p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="manufacturer-id">Credential token ID</FieldLabel>
            <div className="relative">
              <IdCard className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
              <Input
                id="manufacturer-id"
                inputMode="numeric"
                value={draft.manufacturerId}
                onChange={(event) => update("manufacturerId", event.target.value)}
                placeholder="Existing token ID"
                className="pl-11 font-mono"
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="nafdac-number">NAFDAC number</FieldLabel>
            <div className="relative">
              <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
              <Input
                id="nafdac-number"
                value={draft.nafdacNumber}
                onChange={(event) => update("nafdacNumber", event.target.value)}
                placeholder="Product registration number"
                className="pl-11"
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="batch-number">Batch number</FieldLabel>
            <div className="relative">
              <PackageCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
              <Input
                id="batch-number"
                value={draft.batchNumber}
                onChange={(event) => update("batchNumber", event.target.value)}
                placeholder="Printed manufacturer batch"
                className="pl-11"
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="drug-name">Medicine name</FieldLabel>
            <div className="relative">
              <PackageCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
              <Input
                id="drug-name"
                value={draft.drugName}
                onChange={(event) => update("drugName", event.target.value)}
                placeholder="Product name and strength"
                className="pl-11"
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="expiry-date">Expiry date</FieldLabel>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
              <Input
                id="expiry-date"
                type="date"
                value={draft.expiryDate}
                onChange={(event) => update("expiryDate", event.target.value)}
                className="pl-11"
              />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="evidence-hash">Evidence hash</FieldLabel>
            <div className="relative">
              <Fingerprint className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
              <Input
                id="evidence-hash"
                value={draft.evidenceHash}
                onChange={(event) => update("evidenceHash", event.target.value)}
                placeholder="0x + 64 hex characters"
                className="pl-11 font-mono text-xs"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-3 rounded-2xl border border-teal/10 bg-teal/5 p-4 text-sm leading-6 text-ink/60">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
          <p>
            The evidence hash commits to records outside this transaction. PharmChain
            does not upload files or claim that a hash proves their contents are genuine.
          </p>
        </div>

        {formError ? (
          <p className="mt-5 rounded-2xl bg-red-50 p-3 text-sm text-red-800" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="mt-6 border-t border-ink/5 pt-6">
          <ActionRequirements action={action} />
          <ActionTransactionStatus action={action} />

          {action.isConfirmed && submittedNafdac ? (
            <RegistrationSuccess
              nafdacNumber={submittedNafdac}
              transactionHash={action.transactionHash}
              onReset={() => {
                setDraft(emptyDraft);
                setSubmittedNafdac(undefined);
                setFormError(undefined);
                action.clear();
              }}
            />
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="mt-5 w-full"
            disabled={!canSubmit}
          >
            {action.isWriting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <BadgePlus className="h-4 w-4" />
            )}
            {action.isWriting
              ? "Confirm in wallet"
              : action.isConfirming
                ? "Confirming on Monad"
                : "Attest batch on Monad"}
          </Button>
          {!isRegistryConfigured ? (
            <p className="mt-2 text-center text-xs text-ink/45">
              A valid registry address is required before this action can be sent.
            </p>
          ) : !action.isConnected ? (
            <p className="mt-2 text-center text-xs text-ink/45">
              Connect the injected wallet shown above to continue.
            </p>
          ) : action.needsMonad ? (
            <p className="mt-2 text-center text-xs text-ink/45">
              Switch to Monad Mainnet to continue.
            </p>
          ) : null}
        </div>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className="rounded-3xl bg-ink p-6 text-white shadow-card">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-mint">
            <IdCard className="h-5 w-5" />
          </span>
          <h2 className="mt-5 font-display text-lg font-extrabold tracking-[-0.03em]">
            Existing credential required
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/58">
            DrugRegistry checks that the credential is active and that its manufacturer
            wallet equals the transaction sender. Use the owner flow above to issue a new
            credential or enter an existing token ID.
          </p>
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mint/70">
              Public credential context
            </p>
            <p className="mt-2 break-all font-mono text-xs leading-5 text-white/55">
              {manufacturerCredentialAddress ??
                "NEXT_PUBLIC_MANUFACTURER_CREDENTIAL_ADDRESS is not set"}
            </p>
            {manufacturerCredentialAddress ? (
              <a
                href={monadAddressUrl(manufacturerCredentialAddress)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-mint hover:text-white"
              >
                Inspect credential contract
              </a>
            ) : null}
          </div>
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
              Inspect on MonadScan
            </a>
          ) : null}
          <div className="mt-4 border-t border-ink/5 pt-4 text-xs leading-5 text-ink/45">
            <LockKeyhole className="mr-1.5 inline h-3.5 w-3.5 text-teal" />
            The credential address is the public write target for the owner mint flow.
            The registry&apos;s immutable credential contract controls batch authorization.
          </div>
        </div>
      </aside>
    </div>
  );
}
