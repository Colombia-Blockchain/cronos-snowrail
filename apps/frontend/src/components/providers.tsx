'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, AvatarComponent } from '@rainbow-me/rainbowkit';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { config } from '../../wagmi.config';
import '@rainbow-me/rainbowkit/styles.css';
import '../styles/rainbowkit-overrides.css';

const queryClient = new QueryClient();

const CustomAvatar: AvatarComponent = ({ address, size }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(6, 182, 212, 0.4)',
        fontSize: `${size / 2.5}px`,
        fontWeight: 'bold',
        color: 'white',
        textTransform: 'uppercase',
      }}
    >
      {address.slice(2, 4)}
    </div>
  );
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: '#06b6d4',
              accentColorForeground: 'white',
              borderRadius: 'medium',
              fontStack: 'system',
              overlayBlur: 'small',
            })}
            avatar={CustomAvatar}
          >
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'hsl(222.2 84% 4.9%)',
                  border: '1px solid hsl(217.2 32.6% 17.5%)',
                  color: 'hsl(210 40% 98%)',
                },
              }}
            />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
