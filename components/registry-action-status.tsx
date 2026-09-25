"use client";

import { Check, ExternalLink, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfigurationNotice } from "@/components/configuration-notice";
import { isRegistryConfigured } from "@/lib/contracts";
import { shortAddress } from "@/lib/format";
import { monadTransactionUrl } from "@/lib/monad";
import type { useRegistryAction } from "@/lib/use-registry-action";

type RegistryAction = ReturnType<typeof useRegistryAction>;

export function ActionRequirements({ action }: { action: RegistryAction }) {
  return (
    <div className="space-y-3">
      <ConfigurationNotice />
      {isRegistryConfigured && !action.isConnected ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-electric/40 bg-electric/10 text-electric">
              <Wallet className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-frost">Wallet connection required</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Use an injected browser wallet to sign this on-chain action.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={action.connectWallet}
            disabled={action.isConnecting}
          >
            {action.isConnecting ? "Opening…" : "Choose wallet"}
          </Button>
        </div>
      ) : null}
      {isRegistryConfigured && action.needsMonad ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-danger/40 bg-danger/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-danger">Wrong network</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              This registry is expected on Monad Mainnet only.
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
      {isRegistryConfigured &&
      action.isConnected &&
      !action.needsMonad &&
      action.accountAddress ? (
        <div className="flex items-center gap-2 rounded-2xl border-l-2 border-l-teal/70 bg-teal/5 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-teal">
          <Check className="h-4 w-4" />
          Connected to Monad Mainnet as {shortAddress(action.accountAddress)}
        </div>
      ) : null}
    </div>
  );
}

export function ActionTransactionStatus({ action }: { action: RegistryAction }) {
  if (!action.error && !action.transactionHash && !action.isWriting) {
    return null;
  }

  const confirmed = action.isConfirmed && !action.error;

  return (
    <div
      className={`rounded-2xl border p-4 ${
        confirmed
          ? "border-teal/40 bg-teal/5 shadow-glow-teal"
          : action.error
            ? "border-danger/40 bg-danger/10 shadow-glow-red"
            : "border-white/10 bg-black/30"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex gap-3">
        {confirmed ? (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-teal/60 bg-black/40 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-teal motion-safe:animate-stamp-in">
            Stmp
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-frost">
            {action.error
              ? "Transaction was not completed"
              : action.isWriting
                ? "Confirm the request in your wallet"
                : action.isConfirming
                  ? "Waiting for Monad confirmation"
                  : action.isConfirmed
                    ? "Confirmed on Monad Mainnet"
                    : "Transaction submitted"}
          </p>
          <p className="mt-1 break-words font-mono text-xs leading-5 text-muted">
            {action.error ?? (action.transactionHash
              ? `Transaction ${action.transactionHash}`
              : "Your wallet must approve this request before it is sent.")}
          </p>
          {action.transactionHash ? (
            <a
              href={monadTransactionUrl(action.transactionHash)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-electric underline decoration-electric/40 decoration-1 underline-offset-4 transition-colors hover:text-frost hover:decoration-frost"
            >
              View transaction on MonadScan
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
          {action.error && action.isConnected ? (
            <button
              type="button"
              onClick={action.clear}
              className="mt-3 font-mono text-xs font-bold uppercase tracking-[0.1em] text-frost underline decoration-white/30 decoration-1 underline-offset-4"
            >
              Clear error and try again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
