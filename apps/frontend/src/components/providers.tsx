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
        background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(14, 165, 233, 0.4)',
        fontSize: `${size / 2}px`,
        fontWeight: 'bold',
        color: 'white',
      }}
    >
      {address ? address.slice(2, 4).toUpperCase() : '0x'}
    </div>
  );
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#0ea5e9', // Electric blue
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
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
