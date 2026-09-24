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
    <div className="mt-6 rounded-3xl border border-teal/40 bg-teal/5 p-5 shadow-glow-teal" role="status">
      <div className="flex flex-col gap-4 sm:flex-row">
        <span className="grid h-20 w-40 shrink-0 place-items-center rounded-2xl border-2 border-teal/60 bg-black/40 font-display text-2xl font-extrabold uppercase text-teal motion-safe:animate-stamp-in">
          Attested
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold uppercase leading-tight tracking-[-0.01em] text-frost">
            Batch attestation confirmed
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">
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
                className={buttonStyles("outline", "md")}
              >
                View transaction
              </a>
            ) : null}
            <Button variant="ghost" onClick={onReset}>
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
        className="glass rounded-3xl p-5 sm:p-7"
        noValidate
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-electric">
              Step 01 · Attestation details
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase leading-none tracking-[-0.02em] text-frost">
              Attest a medicine batch
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              The connected wallet calls the exact
              <code className="mx-1 rounded-md border border-white/15 bg-black/40 px-1.5 py-0.5 font-mono text-xs text-electric">
                attestBatch
              </code>
              function. The registry assigns the batch ID after authorization succeeds.
            </p>
          </div>
          <span
            className="hidden h-12 w-12 shrink-0 place-items-center rounded-xl border border-electric/40 bg-electric/10 text-electric shadow-glow-cyan sm:grid"
            aria-hidden="true"
          >
            <BadgePlus className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-5 flex gap-3 rounded-2xl border border-gold/40 bg-gold/5 p-4 text-sm leading-6 text-muted">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <p>
            Manufacturer credentials are soulbound ERC-721 tokens. Credential minting is
            owner-only and available in the separate owner flow above; otherwise request
            an existing token ID and connect the wallet that owns it.
          </p>
        </div>

        <div className="mt-6 grid gap-x-6 gap-y-6 border-l border-white/10 pl-4 sm:pl-6 lg:grid-cols-2">
          <div>
            <FieldLabel htmlFor="manufacturer-id">1a · Credential token ID</FieldLabel>
            <div className="relative">
              <IdCard className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
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
            <FieldLabel htmlFor="nafdac-number">1b · NAFDAC number</FieldLabel>
            <div className="relative">
              <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
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
            <FieldLabel htmlFor="batch-number">1c · Batch number</FieldLabel>
            <div className="relative">
              <PackageCheck className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
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
            <FieldLabel htmlFor="drug-name">1d · Medicine name</FieldLabel>
            <div className="relative">
              <PackageCheck className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
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
            <FieldLabel htmlFor="expiry-date">1e · Expiry date</FieldLabel>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                id="expiry-date"
                type="date"
                value={draft.expiryDate}
                onChange={(event) => update("expiryDate", event.target.value)}
                className="pl-11 [color-scheme:dark]"
              />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="evidence-hash">1f · Evidence hash</FieldLabel>
            <div className="relative">
              <Fingerprint className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
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

        <div className="mt-5 flex gap-3 rounded-2xl border-l-2 border-l-teal/60 bg-teal/5 p-4 text-sm leading-6 text-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
          <p>
            The evidence hash commits to records outside this transaction. PharmChain
            does not upload files or claim that a hash proves their contents are genuine.
          </p>
        </div>

        {formError ? (
          <p className="mt-5 rounded-2xl border border-danger/40 bg-danger/10 p-3 font-mono text-sm text-frost shadow-glow-red" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="mt-6 border-t border-white/10 pt-6">
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
            <p className="mt-2 text-center font-mono text-xs text-muted">
              A valid registry address is required before this action can be sent.
            </p>
          ) : !action.isConnected ? (
            <p className="mt-2 text-center font-mono text-xs text-muted">
              Connect the injected wallet shown above to continue.
            </p>
          ) : action.needsMonad ? (
            <p className="mt-2 text-center font-mono text-xs text-muted">
              Switch to Monad Mainnet to continue.
            </p>
          ) : null}
        </div>
      </form>

      <aside className="space-y-5 lg:sticky lg:top-28">
        <div className="glass rounded-3xl p-6">
          <span
            className="grid h-11 w-11 place-items-center rounded-xl border border-electric/40 bg-electric/10 text-electric shadow-glow-cyan"
            aria-hidden="true"
          >
            <IdCard className="h-5 w-5" />
          </span>
          <h2 className="mt-5 font-display text-xl font-bold uppercase leading-tight tracking-[-0.01em] text-frost">
            Existing credential required
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            DrugRegistry checks that the credential is active and that its manufacturer
            wallet equals the transaction sender. Use the owner flow above to issue a new
            credential or enter an existing token ID.
          </p>
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-electric/80">
              Public credential context
            </p>
            <p className="mt-2 break-all font-mono text-xs leading-5 text-muted">
              {manufacturerCredentialAddress ??
                "NEXT_PUBLIC_MANUFACTURER_CREDENTIAL_ADDRESS is not set"}
            </p>
            {manufacturerCredentialAddress ? (
              <a
                href={monadAddressUrl(manufacturerCredentialAddress)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-electric underline decoration-electric/40 decoration-1 underline-offset-4 transition-colors hover:text-frost hover:decoration-frost"
              >
                Inspect credential contract
              </a>
            ) : null}
          </div>
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
              Inspect on MonadScan
            </a>
          ) : null}
          <div className="mt-4 border-t border-white/10 pt-4 font-mono text-xs leading-5 text-muted">
            <LockKeyhole className="mr-1.5 inline h-3.5 w-3.5 text-electric" />
            The credential address is the public write target for the owner mint flow.
            The registry&apos;s immutable credential contract controls batch authorization.
          </div>
        </div>
      </aside>
    </div>
  );
}
