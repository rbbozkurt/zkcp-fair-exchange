import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, arbitrum } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const config = getDefaultConfig({
  appName: 'ZKCP',
  projectId: projectId,
  chains: [mainnet, polygon, arbitrum],
  ssr: false,
});

const queryClient = new QueryClient();

const AppWagmiProvider = ({ children }: { children: React.ReactNode }) => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>{children}</RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default AppWagmiProvider;
