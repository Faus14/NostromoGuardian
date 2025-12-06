import { Activity, RefreshCw, ArrowRight } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { getRecentTransactions, Transaction } from '../services/qubic';
import { useTick } from '../contexts/TickContext';

interface TransactionData {
  id: string;
  from: string;
  to: string;
  amount: string;
  tick: number;
  type: string;
}

export function RecentTransactionsTable() {
  const { currentTick } = useTick(); // Use shared tick from context
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      // Fetch recent transactions using the real RPC endpoint
      const allTxs = await getRecentTransactions(20);
      
      // Convert to display format
      const displayTxs: TransactionData[] = allTxs
        .slice(0, 10)
        .map((tx) => ({
          id: tx.txId,
          from: tx.sourceId,
          to: tx.destId,
          amount: `${(Number(tx.amount) / 1000).toLocaleString()} QU`,
          tick: tx.tickNumber,
          type: tx.inputType === 0 ? 'Transfer' : `Type ${tx.inputType}`
        }));
      
      setTransactions(displayTxs);
      setError(null);
    } catch (e) {
      console.error('Failed to fetch transactions:', e);
      if (transactions.length === 0) {
        setError(e instanceof Error ? e.message : 'Failed to fetch transactions');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [transactions.length]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 60000); // Update every 60 seconds
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#00F5FF]" />
          <h3 className="text-white font-semibold">Recent Transactions</h3>
          {!error && <span className="text-xs text-green-400 font-medium">● LIVE</span>}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
          title="Refresh transactions"
        >
          <RefreshCw className={`w-4 h-4 text-[#00F5FF] ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <p className="text-white/60 text-sm mb-4">Last 10 transactions from recent ticks</p>

      {loading && transactions.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-white/60">Loading transactions...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-32 text-red-400">
          <p className="mb-2 text-sm">{error}</p>
          <button 
            onClick={handleRefresh}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded transition-all"
          >
            Retry
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-white/60">No transactions detected</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/60 text-xs uppercase">
                <th className="text-left py-3 px-2">From</th>
                <th className="text-center py-3 px-2"></th>
                <th className="text-left py-3 px-2">To</th>
                <th className="text-right py-3 px-2">Amount</th>
                <th className="text-center py-3 px-2">Tick</th>
                <th className="text-center py-3 px-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr
                  key={idx}
                  className="border-b border-white/5 hover:bg-white/5 transition-all"
                >
                  <td className="py-3 px-2 text-white/80 font-mono text-xs">
                    {tx.from.substring(0, 8)}...{tx.from.substring(tx.from.length - 4)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <ArrowRight className="w-3 h-3 text-white/40 inline" />
                  </td>
                  <td className="py-3 px-2 text-white/80 font-mono text-xs">
                    {tx.to.substring(0, 8)}...{tx.to.substring(tx.to.length - 4)}
                  </td>
                  <td className="py-3 px-2 text-right text-[#00F5FF] font-bold">{tx.amount}</td>
                  <td className="py-3 px-2 text-center text-white/60">{tx.tick}</td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/60">
                      {tx.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-xs text-white/40 flex justify-between border-t border-white/10 pt-4">
        <div>Current Tick: {currentTick}</div>
        <div>Last updated: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
