'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectWalletButton } from './connect-wallet-button';

const navLinks = [
  { href: '/dashboard', label: 'Treasury', icon: TreasuryIcon },
  { href: '/dashboard/mixer', label: 'ZK Layer', icon: MixerIcon },
];

function TreasuryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}

function MixerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <div className="relative">
        <div className="absolute inset-0 bg-electric-500/20 blur-md rounded-xl group-hover:bg-electric-400/30 transition-all duration-300"></div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-obsidian-800 to-obsidian-900 border border-white/10 flex items-center justify-center relative shadow-inner-light group-hover:border-electric-500/30 transition-all">
          <svg className="w-5 h-5 text-electric-400 group-hover:text-electric-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-display font-bold text-white tracking-tight leading-none group-hover:text-electric-200 transition-colors">
          Snow Rail
        </span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
          Agentic Treasury
        </span>
      </div>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-obsidian-900/60 backdrop-blur-xl border-b border-white/[0.05] supports-[backdrop-filter]:bg-obsidian-900/40">
        <div className="flex justify-between items-center max-w-[1600px] mx-auto w-full px-6 h-20">
          <div className="flex items-center gap-10">
            <Logo />

            {/* Navigation Links */}
            <div className="hidden sm:flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.04]">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                      transition-all duration-300 relative overflow-hidden group
                      ${isActive
                        ? 'text-white'
                        : 'text-slate-400 hover:text-white'
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-white/[0.08] rounded-lg -z-10" />
                    )}
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-electric-400' : 'text-slate-500 group-hover:text-electric-400'}`} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Network indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-400 tracking-wide">CRONOS TESTNET</span>
            </div>

            <ConnectWalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
