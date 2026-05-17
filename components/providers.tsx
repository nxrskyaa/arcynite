"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { WagmiProvider, createConfig, http, injected } from "wagmi";
import { arcTestnet } from "@/lib/arc";

const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected({
      shimDisconnect: true
    })
  ],
  transports: {
    [arcTestnet.id]: http(arcTestnet.rpcUrls.default.http[0])
  },
  ssr: true
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
