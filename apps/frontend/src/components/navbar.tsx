'use client';

import { ConnectWalletButton } from './connect-wallet-button';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-b from-gray-900 via-gray-900/95 to-gray-900/80 border-b border-gray-800/50 backdrop-blur-sm px-6 py-4 z-50">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Snow Rail
          </div>
          <div className="text-xs text-gray-500 px-3 py-1 bg-gray-800/50 rounded-full border border-gray-700">
            X402
          </div>
        </div>
        <ConnectWalletButton />
      </div>
    </nav>
  );
}
