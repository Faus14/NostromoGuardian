import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import type { Trade, Holder } from '../services/api';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';

export default function AddressLookup() {
  const [address, setAddress] = useState('');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [holdings, setHoldings] = useState<Holder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchParams] = useSearchParams();

  const fetchAddressData = useCallback(
    async (addr: string) => {
      if (!addr) return;

      try {
        setLoading(true);
        setError(null);
        setHasSearched(true);
        const [tradesData, holdingsData] = await Promise.all([
          api.getAddressTrades(addr),
          api.getAddressHoldings(addr),
        ]);
        setTrades(tradesData);
        setHoldings(holdingsData);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to fetch address data');
        setTrades([]);
        setHoldings([]);
        setHasSearched(true);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    fetchAddressData(address);
  };

  const paramAddress = searchParams.get('address') || '';

  useEffect(() => {
    if (paramAddress) {
      setAddress(paramAddress);
      fetchAddressData(paramAddress);
    }
    // Only re-run when the query value itself changes
  }, [paramAddress, fetchAddressData]);

  const totalBought = trades
    .filter((t) => t.tradeType === 'BUY')
    .reduce((sum, t) => sum + parseInt(t.totalValue), 0);
  const totalSold = trades
    .filter((t) => t.tradeType === 'SELL')
    .reduce((sum, t) => sum + parseInt(t.totalValue), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-3xl font-bold text-white">Address Lookup</h2>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-qubic-gray rounded-lg p-6 border border-gray-700">
        <label className="block text-sm font-medium text-gray-300 mb-2">Qubic Address</label>
        <div className="flex gap-4">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="AAAAAAAAAAA..."
            className="flex-1 px-4 py-2 bg-qubic-dark border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-qubic-primary"
          />
          <button
            type="submit"
            disabled={loading || !address}
            className="flex items-center gap-2 bg-qubic-primary text-qubic-dark px-6 py-2 rounded-lg hover:bg-qubic-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            <Search className="w-5 h-5" />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Empty state after search */}
      {hasSearched && !error && trades.length === 0 && holdings.length === 0 && (
        <div className="bg-qubic-gray rounded-lg p-6 border border-gray-700 text-center text-gray-300">
          No activity found for this address yet.
        </div>
      )}

      {/* Results */}
      {(trades.length > 0 || holdings.length > 0) && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-qubic-gray rounded-lg p-6 border border-gray-700">
              <div className="flex items-center gap-2 text-green-500 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm">Total Bought</span>
              </div>
              <div className="text-2xl font-bold text-white">{(totalBought / 1e9).toFixed(2)} QU</div>
            </div>
            <div className="bg-qubic-gray rounded-lg p-6 border border-gray-700">
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <TrendingDown className="w-5 h-5" />
                <span className="text-sm">Total Sold</span>
              </div>
              <div className="text-2xl font-bold text-white">{(totalSold / 1e9).toFixed(2)} QU</div>
            </div>
            <div className="bg-qubic-gray rounded-lg p-6 border border-gray-700">
              <div className="flex items-center gap-2 text-qubic-primary mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm">Net P/L</span>
              </div>
              <div className={`text-2xl font-bold ${totalBought - totalSold > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {((totalBought - totalSold) / 1e9).toFixed(2)} QU
              </div>
            </div>
          </div>

          {/* Holdings */}
          {holdings.length > 0 && (
            <div className="bg-qubic-gray rounded-lg p-6 border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Holdings ({holdings.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-600">
                      <th className="pb-2">Token</th>
                      <th className="pb-2">Balance</th>
                      <th className="pb-2">%</th>
                      <th className="pb-2">Buy Count</th>
                      <th className="pb-2">Sell Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding) => (
                      <tr key={`${holding.tokenIssuer}-${holding.tokenName}`} className="border-b border-gray-700">
                        <td className="py-2 text-white font-semibold">{holding.tokenName}</td>
                        <td className="py-2 text-white">{(parseInt(holding.balance) / 1e9).toFixed(2)}</td>
                        <td className="py-2 text-qubic-primary">{Number(holding.percentage).toFixed(2)}%</td>
                        <td className="py-2 text-green-500">{holding.buyCount}</td>
                        <td className="py-2 text-red-500">{holding.sellCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trade History */}
          {trades.length > 0 && (
            <div className="bg-qubic-gray rounded-lg p-6 border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Trade History ({trades.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-600">
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Token</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Price</th>
                      <th className="pb-2">Total Value</th>
                      <th className="pb-2">Tick</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.slice(0, 50).map((trade) => (
                      <tr key={trade.id} className="border-b border-gray-700">
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              trade.tradeType === 'BUY' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                            }`}
                          >
                            {trade.tradeType}
                          </span>
                        </td>
                        <td className="py-2 text-white">{trade.tokenName}</td>
                        <td className="py-2 text-white">{(parseInt(trade.amount) / 1e9).toFixed(2)}</td>
                        <td className="py-2 text-white">{parseFloat(trade.pricePerUnit).toFixed(6)}</td>
                        <td className="py-2 text-white">{(parseInt(trade.totalValue) / 1e9).toFixed(2)} QU</td>
                        <td className="py-2 text-gray-400">{trade.tick.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
