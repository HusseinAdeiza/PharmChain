"use client";

import { Check, CircleCheck, ExternalLink, Wallet } from "lucide-react";
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
        <div className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-ink/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-teal shadow-sm">
              <Wallet className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold">Wallet connection required</p>
              <p className="mt-0.5 text-xs leading-5 text-ink/55">
                Use an injected browser wallet to sign this on-chain action.
              </p>
            </div>
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
      {isRegistryConfigured && action.needsMonad ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-coral/20 bg-coral/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold">Wrong network</p>
            <p className="mt-0.5 text-xs leading-5 text-ink/55">
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
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
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

  return (
    <div
      className={`rounded-2xl border p-4 ${
        action.isConfirmed
          ? "border-emerald-200 bg-emerald-50"
          : action.error
            ? "border-red-200 bg-red-50"
            : "border-teal/15 bg-teal/5"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="flex gap-3">
        {action.isConfirmed ? (
          <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
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
          <p className="mt-1 break-words text-xs leading-5 text-ink/60">
            {action.error ??
              (action.transactionHash
                ? `Transaction ${action.transactionHash}`
                : "Your wallet must approve this request before it is sent.")}
          </p>
          {action.transactionHash ? (
            <a
              href={monadTransactionUrl(action.transactionHash)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-teal hover:text-ink"
            >
              View transaction on MonadScan
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
          {action.error && action.isConnected ? (
            <button
              type="button"
              onClick={action.clear}
              className="mt-3 text-xs font-bold text-ink underline decoration-ink/25 underline-offset-4"
            >
              Clear error and try again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
