"use client";

import { type FormEvent, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CircleAlert,
  ExternalLink,
  IdCard,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { getAddress, isAddress } from "viem";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input } from "@/components/ui/field";
import {
  credentialConfiguration,
  manufacturerCredentialAddress,
} from "@/lib/contracts";
import { shortAddress } from "@/lib/format";
import { monadAddressUrl, monadTransactionUrl } from "@/lib/monad";
import { useManufacturerCredentialMint } from "@/lib/use-manufacturer-credential-mint";

const zeroAddress = "0x0000000000000000000000000000000000000000";
const textEncoder = new TextEncoder();

type CredentialDraft = {
  manufacturer: string;
  manufacturerName: string;
  nafdacRegistrationNumber: string;
  manufacturingAddress: string;
};

const emptyDraft: CredentialDraft = {
  manufacturer: "",
  manufacturerName: "",
  nafdacRegistrationNumber: "",
  manufacturingAddress: "",
};

function validateText(label: string, value: string) {
  const byteLength = textEncoder.encode(value).length;
  if (byteLength === 0 || byteLength > 256) {
    return `${label} must contain between 1 and 256 UTF-8 bytes.`;
  }
  return undefined;
}

function OwnerAddress({ address }: { address?: `0x${string}` }) {
  if (!address) {
    return <span className="text-muted">Not returned</span>;
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

export function ManufacturerCredentialForm() {
  const action = useManufacturerCredentialMint();
  const [draft, setDraft] = useState<CredentialDraft>(emptyDraft);
  const [formError, setFormError] = useState<string>();

  const update = (field: keyof CredentialDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFormError(undefined);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const manufacturer = draft.manufacturer.trim();
    const manufacturerName = draft.manufacturerName.trim();
    const nafdacRegistrationNumber = draft.nafdacRegistrationNumber.trim();
    const manufacturingAddress = draft.manufacturingAddress.trim();

    if (!isAddress(manufacturer) || manufacturer.toLowerCase() === zeroAddress) {
      setFormError("Manufacturer must be a valid non-zero EVM address.");
      return;
    }
    const nameError = validateText("Manufacturer name", manufacturerName);
    if (nameError) {
      setFormError(nameError);
      return;
    }
    const registrationError = validateText(
      "NAFDAC registration number",
      nafdacRegistrationNumber,
    );
    if (registrationError) {
      setFormError(registrationError);
      return;
    }
    const addressError = validateText("Manufacturing address", manufacturingAddress);
    if (addressError) {
      setFormError(addressError);
      return;
    }

    setFormError(undefined);
    await action.submit({
      manufacturer: getAddress(manufacturer),
      manufacturerName,
      nafdacRegistrationNumber,
      manufacturingAddress,
    });
  };

  const transactionUrl = monadTransactionUrl(action.transactionHash);
  const configurationReady = credentialConfiguration === "ready";

  return (
    <div id="mint-credential" className="scroll-mt-32">
      <div className="glass overflow-hidden rounded-3xl">
        <div className="flex flex-col gap-4 border-b border-white/10 bg-black/50 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-electric/50 bg-electric/10 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-electric shadow-glow-cyan">
                Owner-only flow
              </span>
              <span className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                ManufacturerCredential
              </span>
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold uppercase leading-none tracking-[-0.02em] text-frost">
              Mint a manufacturer credential
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              The configured contract&apos;s owner can issue one active, soulbound ERC-721
              credential to a manufacturer wallet. The UI verifies ownership on-chain
              before enabling minting.
            </p>
          </div>
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-electric/40 bg-electric/10 text-electric shadow-glow-cyan"
            aria-hidden="true"
          >
            <IdCard className="h-6 w-6" />
          </span>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_19rem] lg:items-start">
          <form onSubmit={(event) => void submit(event)} noValidate>
            {!configurationReady ? (
              <div className="mb-5 rounded-2xl border border-gold/40 bg-gold/5 p-4" role="status">
                <div className="flex gap-3">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <div>
                    <p className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-gold">
                      {credentialConfiguration === "invalid"
                        ? "Credential address is invalid"
                        : "Credential deployment not configured"}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-muted">
                      Set a verified Monad Mainnet address in{" "}
                      <code className="rounded-md border border-white/15 bg-black/40 px-1.5 py-0.5 font-mono text-xs text-electric">
                        NEXT_PUBLIC_MANUFACTURER_CREDENTIAL_ADDRESS
                      </code>
                      , then restart the app. No address or mint will be simulated.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-x-6 gap-y-6 border-l border-white/10 pl-4 sm:pl-6 lg:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="credential-manufacturer">1a · Manufacturer wallet</FieldLabel>
                <div className="relative">
                  <Wallet className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    id="credential-manufacturer"
                    value={draft.manufacturer}
                    onChange={(event) => update("manufacturer", event.target.value)}
                    placeholder="0x EVM address"
                    className="pl-11 font-mono text-xs"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="credential-manufacturer-name">1b · Manufacturer name</FieldLabel>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    id="credential-manufacturer-name"
                    value={draft.manufacturerName}
                    onChange={(event) => update("manufacturerName", event.target.value)}
                    placeholder="Registered legal name"
                    className="pl-11"
                    autoComplete="organization"
                  />
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="credential-nafdac">1c · NAFDAC registration number</FieldLabel>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    id="credential-nafdac"
                    value={draft.nafdacRegistrationNumber}
                    onChange={(event) => update("nafdacRegistrationNumber", event.target.value)}
                    placeholder="Manufacturer registration"
                    className="pl-11"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="credential-address">1d · Manufacturing address</FieldLabel>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    id="credential-address"
                    value={draft.manufacturingAddress}
                    onChange={(event) => update("manufacturingAddress", event.target.value)}
                    placeholder="Facility address"
                    className="pl-11"
                    autoComplete="street-address"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-3 rounded-2xl border-l-2 border-l-teal/60 bg-teal/5 p-4 text-sm leading-6 text-muted">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              <p>
                The credential is soulbound. Transfers and approvals revert, and revoking
                it burns the token and removes the manufacturer&apos;s registry eligibility.
              </p>
            </div>

            {formError ? (
              <p className="mt-5 rounded-2xl border border-danger/40 bg-danger/10 p-3 font-mono text-sm text-frost shadow-glow-red" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="mt-6 space-y-3">
              {configurationReady && !action.isConnected ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-frost">Connect the owner wallet</p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      The app compares the connected account with the contract&apos;s owner().
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={action.connectWallet}
                    disabled={action.isConnecting || !action.hasInjectedConnector}
                  >
                    {action.isConnecting ? "Connecting…" : "Connect wallet"}
                  </Button>
                </div>
              ) : null}

              {configurationReady && action.needsMonad ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-danger/40 bg-danger/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-danger">Monad Mainnet required</p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      Credential minting never switches to a test network.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={action.switchToMonad}
                    disabled={action.isSwitching}
                  >
                    {action.isSwitching ? "Switching…" : "Switch to Monad"}
                  </Button>
                </div>
              ) : null}

              {configurationReady &&
              (action.ownerReadLoading || action.pausedReadLoading) ? (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-xs text-muted">
                  <LoaderCircle className="h-4 w-4 animate-spin text-electric" />
                  Reading credential owner and pause state…
                </div>
              ) : null}

              {configurationReady &&
              (action.ownerReadFailed || action.pausedReadFailed) ? (
                <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 font-mono text-sm text-frost shadow-glow-red" role="alert">
                  <p className="font-bold uppercase tracking-[0.12em] text-danger">Credential contract state could not be read</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={action.refetchContractState}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry contract read
                  </Button>
                </div>
              ) : null}

              {configurationReady && action.isConnected && !action.isOwner && !action.ownerReadLoading ? (
                <div className="rounded-2xl border border-gold/40 bg-gold/5 p-4">
                  <p className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-gold">Connected wallet is not the owner</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    mint is onlyOwner. Contract owner: <OwnerAddress address={action.ownerAddress} />
                  </p>
                </div>
              ) : null}

              {configurationReady && action.isOwner ? (
                <div className="flex items-center gap-2 rounded-2xl border-l-2 border-l-teal/70 bg-teal/5 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-teal">
                  <BadgeCheck className="h-4 w-4" />
                  Connected wallet matches the on-chain contract owner
                </div>
              ) : null}

              {action.isPaused ? (
                <div className="rounded-2xl border border-gold/40 bg-gold/5 p-4 font-mono text-sm text-muted">
                  Credential minting is paused by the contract. An owner must unpause it
                  before another mint can succeed.
                </div>
              ) : null}
            </div>

            {action.error || action.transactionHash || action.isWriting ? (
              <div
                className={`mt-5 rounded-2xl border p-4 ${
                  action.error
                    ? "border-danger/40 bg-danger/10 text-frost shadow-glow-red"
                    : action.mintedTokenId
                      ? "border-teal/40 bg-teal/5 text-frost shadow-glow-teal"
                      : "border-white/10 bg-black/30 text-frost"
                }`}
                role="status"
                aria-live="polite"
              >
                <p className="font-mono text-xs font-bold uppercase tracking-[0.12em]">
                  {action.error
                    ? "Credential mint was not completed"
                    : action.isWriting
                      ? "Confirm the mint in your wallet"
                      : action.isConfirming
                        ? "Waiting for Monad confirmation"
                        : action.mintedTokenId
                          ? "CredentialMinted confirmed"
                          : action.isConfirmed
                            ? "Receipt confirmed without a decoded CredentialMinted event"
                            : "Mint transaction submitted"}
                </p>
                {action.error ? (
                  <p className="mt-1 break-words font-mono text-xs leading-5 text-frost/80">
                    {action.error}
                  </p>
                ) : null}
                {action.mintedTokenId ? (
                  <p className="mt-2 font-mono text-sm font-bold text-teal">
                    Token ID {action.mintedTokenId.toString()}
                  </p>
                ) : null}
                {transactionUrl ? (
                  <a
                    href={transactionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-electric underline decoration-electric/40 decoration-1 underline-offset-4 transition-colors hover:text-frost hover:decoration-frost"
                  >
                    View actual transaction on MonadScan
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
                {action.error ? (
                  <button
                    type="button"
                    onClick={action.clear}
                    className="mt-3 font-mono text-xs font-bold uppercase tracking-[0.1em] text-frost underline decoration-white/30 decoration-1 underline-offset-4"
                  >
                    Clear error and try again
                  </button>
                ) : null}
              </div>
            ) : null}

            {action.isConfirmed ? (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setDraft(emptyDraft);
                  setFormError(undefined);
                  action.clear();
                }}
              >
                Start another credential
              </Button>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="mt-5 w-full"
              disabled={!action.canSubmit}
            >
              {action.isWriting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <IdCard className="h-4 w-4" />
              )}
              {action.isWriting
                ? "Confirm in wallet"
                : action.isConfirming
                  ? "Confirming on Monad"
                  : "Mint credential on Monad"}
            </Button>
            <p className="mt-2 text-center font-mono text-xs leading-5 text-muted">
              {!configurationReady
                ? "Configure a verified credential contract to enable minting."
                : !action.isConnected
                  ? "Connect the owner wallet to continue."
                  : action.needsMonad
                    ? "Switch to Monad Mainnet to continue."
                    : action.ownerReadLoading || action.pausedReadLoading
                      ? "Wait for the on-chain owner and pause checks."
                      : !action.isOwner
                        ? "Only the contract owner can submit this transaction."
                        : action.isPaused
                          ? "The credential contract is paused."
                          : "Your wallet will request approval and real MON for gas."}
            </p>
          </form>

          <aside className="space-y-5">
            <div className="corner-marks corner-marks-soft glass rounded-3xl p-5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                Contract owner
              </p>
              <div className="mt-2">
                <OwnerAddress address={action.ownerAddress} />
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">
                Read directly from owner() on the configured contract. A connected wallet
                alone is not treated as owner.
              </p>
            </div>

            <div className="corner-marks corner-marks-soft glass rounded-3xl p-5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                Credential contract
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
                  Inspect on MonadScan
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
