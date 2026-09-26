"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { WagmiProvider } from "wagmi";
import { monadMainnet } from "@/lib/monad";
import { LanguageProvider } from "@/components/language-provider";
import { WalletSelectionProvider } from "@/components/wallet-selection";

const config = createConfig({
  chains: [monadMainnet],
  connectors: [injected()],
  multiInjectedProviderDiscovery: true,
  ssr: true,
  transports: {
    [monadMainnet.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <WalletSelectionProvider>{children}</WalletSelectionProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
