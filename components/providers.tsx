"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { WagmiProvider } from "wagmi";
import { monadMainnet } from "@/lib/monad";

const config = createConfig({
  chains: [monadMainnet],
  connectors: [injected()],
  multiInjectedProviderDiscovery: false,
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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
