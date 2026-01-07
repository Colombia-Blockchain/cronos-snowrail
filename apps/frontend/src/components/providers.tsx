'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, AvatarComponent } from '@rainbow-me/rainbowkit';
import { config } from '../../wagmi.config';
import { ToastProvider } from '@/components/ui';
import '@rainbow-me/rainbowkit/styles.css';
import '../styles/rainbowkit-overrides.css';

const queryClient = new QueryClient();

// Custom avatar component to replace emoji
const CustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(59, 130, 246, 0.4)',
        fontSize: `${size / 2}px`,
        fontWeight: 'bold',
        color: 'white',
      }}
    >
      {address.slice(0, 2).toUpperCase()}
    </div>
  );
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme()}
          avatar={CustomAvatar}
        >
          <ToastProvider>
            {children}
          </ToastProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
