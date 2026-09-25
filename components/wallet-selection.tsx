"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useConnect, type Connector } from "wagmi";
import { ArrowUpRight, CircleAlert, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { Button, cn } from "@/components/ui/button";
import { errorMessage } from "@/lib/errors";

type WalletSelectionContextValue = {
  closePicker: () => void;
  connectors: readonly Connector[];
  hasConnector: boolean;
  isConnecting: boolean;
  isOpen: boolean;
  openPicker: () => void;
};

const WalletSelectionContext = createContext<WalletSelectionContextValue | null>(null);

export function WalletSelectionProvider({ children }: { children: ReactNode }) {
  const { connectors, connectAsync, error, isPending } = useConnect();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const value: WalletSelectionContextValue = {
    closePicker: () => setIsOpen(false),
    connectors,
    hasConnector: connectors.length > 0,
    isConnecting: isPending,
    isOpen,
    openPicker: () => setIsOpen(true),
  };

  return (
    <WalletSelectionContext.Provider value={value}>
      {children}
      {isOpen ? (
        <WalletSelectionDialog
          connectors={connectors}
          error={error}
          isConnecting={isPending}
          onClose={value.closePicker}
          onSelect={async (connector) => {
            try {
              await connectAsync({ connector });
              setIsOpen(false);
            } catch {
              setIsOpen(true);
            }
          }}
        />
      ) : null}
    </WalletSelectionContext.Provider>
  );
}

export function useWalletSelection() {
  const context = useContext(WalletSelectionContext);
  if (!context) {
    throw new Error("useWalletSelection must be used within WalletSelectionProvider");
  }
  return context;
}

function WalletSelectionDialog({
  connectors,
  error,
  isConnecting,
  onClose,
  onSelect,
}: {
  connectors: readonly Connector[];
  error: unknown;
  isConnecting: boolean;
  onClose: () => void;
  onSelect: (connector: Connector) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-panel shadow-glow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-selector-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-electric">
              Connection gateway
            </p>
            <h2 id="wallet-selector-title" className="mt-1 font-display text-2xl font-bold uppercase tracking-[-0.01em] text-frost">
              Choose a wallet
            </h2>
            <p className="mt-2 max-w-sm text-xs leading-5 text-muted">
              Select the wallet you want to use for this Monad Mainnet session.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close wallet selector" className="px-2">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 p-5 sm:p-6">
          {connectors.length > 0 ? (
            <div className="space-y-2" role="list" aria-label="Available wallets">
              {connectors.map((connector, index) => (
                <button
                  key={`${connector.id}-${index}`}
                  type="button"
                  role="listitem"
                  disabled={isConnecting}
                  onClick={() => onSelect(connector)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-left transition-colors hover:border-electric/50 hover:bg-electric/5 disabled:cursor-wait disabled:opacity-60",
                    isConnecting && "border-electric/40",
                  )}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-electric/30 bg-electric/10 font-mono text-sm font-bold text-electric">
                    {connector.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-xs font-bold uppercase tracking-[0.1em] text-frost">
                      {connector.name}
                    </span>
                    <span className="mt-1 block truncate font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                      {connector.id}
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-electric" />
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-amber/30 bg-amber/5 p-4">
              <div className="flex gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-gold">
                    No wallet detected
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Install an EVM browser wallet such as MetaMask or Rabby, unlock it, then refresh this page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error ? (
            <div className="rounded-2xl border border-danger/40 bg-danger/10 p-3 font-mono text-xs leading-5 text-frost" role="alert">
              {errorMessage(error)}
            </div>
          ) : null}

          <div className="flex items-start gap-3 border-t border-white/10 pt-4 text-[11px] leading-5 text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            <p>PharmChain never stores wallet keys. Your wallet will request approval for every transaction.</p>
          </div>
        </div>

        {isConnecting ? (
          <div className="flex items-center gap-2 border-t border-white/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-electric sm:px-6">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            Waiting for wallet approval
          </div>
        ) : null}
      </section>
    </div>
  );
}
