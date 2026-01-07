'use client';

const EXPLORER_URL = 'https://explorer.cronos.org/testnet';

interface TxLinkProps {
  hash: string;
  label?: string;
  className?: string;
}

interface AddressLinkProps {
  address: string;
  label?: string;
  className?: string;
}

/**
 * Link to a transaction on Cronos explorer
 */
export function TxLink({ hash, label, className = '' }: TxLinkProps) {
  const shortHash = `${hash.slice(0, 10)}...${hash.slice(-8)}`;

  return (
    <a
      href={`${EXPLORER_URL}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-blue-400 hover:text-blue-300 font-mono inline-flex items-center gap-1 ${className}`}
    >
      {label || shortHash}
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

/**
 * Link to an address on Cronos explorer
 */
export function AddressLink({ address, label, className = '' }: AddressLinkProps) {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <a
      href={`${EXPLORER_URL}/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-blue-400 hover:text-blue-300 font-mono inline-flex items-center gap-1 ${className}`}
    >
      {label || shortAddress}
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

/**
 * Get explorer URL (useful for external use)
 */
export function getExplorerUrl(): string {
  return EXPLORER_URL;
}
