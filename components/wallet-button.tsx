"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { LoaderCircle, LogOut, Wallet } from "lucide-react";
import { Button, cn } from "@/components/ui/button";
import { errorMessage } from "@/lib/errors";
import { shortAddress } from "@/lib/format";
import { MONAD_MAINNET_ID } from "@/lib/monad";

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, error: connectError, isPending: isConnecting } =
    useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const needsMonad = isConnected && chainId !== MONAD_MAINNET_ID;

  if (needsMonad) {
    return (
      <Button
        size={compact ? "sm" : "md"}
        variant="danger"
        onClick={() => switchChain({ chainId: MONAD_MAINNET_ID })}
        disabled={isSwitching}
        className={cn(compact && "px-3")}
      >
        {isSwitching ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        Switch to Monad
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="group relative">
        <Button
          size={compact ? "sm" : "md"}
          variant="outline"
          onClick={() => disconnect()}
          aria-label={`Disconnect ${address}`}
          className={cn(compact && "px-3")}
        >
          <span
            className="h-2 w-2 rounded-full bg-teal shadow-[0_0_10px_rgba(18,214,192,0.8)]"
            aria-hidden="true"
          />
          <span className={cn("font-mono", !compact && "hidden sm:inline")}>{shortAddress(address)}</span>
          <LogOut className="h-3.5 w-3.5 opacity-55" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        size={compact ? "sm" : "md"}
        onClick={() => {
          const connector = connectors[0];
          if (connector) {
            connect({ connector });
          }
        }}
        disabled={isConnecting || connectors.length === 0}
        className={cn(compact && "px-3")}
      >
        {isConnecting ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        {connectors.length === 0 ? "No wallet" : compact ? "Connect" : "Connect wallet"}
      </Button>
      {connectError ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-2xl border border-danger/50 bg-panel p-3 text-left font-mono text-xs leading-5 text-frost shadow-glow-red"
          role="alert"
        >
          {errorMessage(connectError)}
        </div>
      ) : null}
    </div>
  );
}
