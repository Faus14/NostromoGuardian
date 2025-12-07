import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

interface AddressLinkProps {
  address: string;
  truncate?: number;
  className?: string;
}

/**
 * Renders a clickable address that routes to the Address Lookup page
 * with the address prefilled via querystring.
 */
export function AddressLink({ address, truncate = 12, className = '' }: AddressLinkProps) {
  const short =
    address.length > truncate ? `${address.slice(0, truncate)}...` : address;

  return (
    <Link
      to={`/address?address=${encodeURIComponent(address)}`}
      className={`inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-mono transition-colors group ${className}`}
      title={`View details for ${address}`}
    >
      <span>{short}</span>
      <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
