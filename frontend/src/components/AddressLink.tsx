import { Link } from 'react-router-dom';

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
      className={`text-cyan-400 hover:text-cyan-300 font-mono ${className}`}
      title={address}
    >
      {short}
    </Link>
  );
}
