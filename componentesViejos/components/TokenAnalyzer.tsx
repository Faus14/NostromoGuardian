import { Activity, TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { getTokenTradingHistory, TokenTradeEvent } from '../services/qubic';

interface TokenStats {
  totalBuys: number;
  totalSells: number;
  totalVolume: bigint;
  buyVolume: bigint;
  sellVolume: bigint;
}

export function TokenAnalyzer() {
  const [contractIndex, setContractIndex] = useState<string>('5'); // Default QX contract
  const [trades, setTrades] = useState<TokenTradeEvent[]>([]);
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const analyzeTrades = useCallback((tradeList: TokenTradeEvent[]) => {
    const buys = tradeList.filter(t => t.type === 'buy');
    const sells = tradeList.filter(t => t.type === 'sell');
    
    const buyVolume = buys.reduce((sum, t) => sum + t.amount, 0n);
    const sellVolume = sells.reduce((sum, t) => sum + t.amount, 0n);
    
    return {
      totalBuys: buys.length,
      totalSells: sells.length,
      totalVolume: buyVolume + sellVolume,
      buyVolume,
      sellVolume,
    };
  }, []);

  const fetchTrades = useCallback(async () => {
    if (!contractIndex || isNaN(Number(contractIndex))) return;
    
    setLoading(true);
    try {
      // Fetch last 20 ticks of activity (more = slower due to rate limiting)
      const history = await getTokenTradingHistory(Number(contractIndex), 20);
      console.log(`Fetched ${history.length} trades`);
      setTrades(history);
      setStats(analyzeTrades(history));
    } catch (e) {
      console.error('Failed to fetch token trades:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [contractIndex, analyzeTrades]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrades();
  };

  useEffect(() => {
    // DON'T auto-fetch on mount - wait for user to click "Analyze"
    // This prevents rate limiting on initial page load
    
    // Auto-refresh every 5 minutes (if data exists)
    const interval = setInterval(() => {
      if (trades.length > 0) {
        fetchTrades();
      }
    }, 300000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [fetchTrades, trades.length]);

  return (
    <div className="space-y-6">
      {/* Header with Contract Selector */}
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Token Analytics</h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-purple-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-white/80 text-sm">Contract Index:</label>
          <input
            type="number"
            value={contractIndex}
            onChange={(e) => setContractIndex(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-400 w-32"
            placeholder="e.g., 5"
          />
          <button
            onClick={fetchTrades}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all disabled:opacity-50"
          >
            Analyze
          </button>
        </div>
        
        <p className="text-white/60 text-xs mt-3">
          🎯 Analyzes blockchain transactions from Qubic testnet network<br/>
          📊 Shows QU transfers and network activity<br/>
          ⚡ Click "Analyze" to see data
        </p>
      </div>

      {/* Stats Cards */}
      {stats && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Trades */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-white/60 text-sm">Total Trades</span>
            </div>
            <p className="text-2xl font-bold text-white">{trades.length}</p>
            <p className="text-white/40 text-xs mt-1">Last 20 ticks</p>
          </div>

          {/* Buys */}
          <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-xl p-4 hover:border-green-500/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-white/60 text-sm">Buys</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.totalBuys}</p>
            <p className="text-white/40 text-xs mt-1">
              {stats.buyVolume > 0n ? `${(Number(stats.buyVolume) / 1e9).toFixed(2)} QU` : '0 QU'}
            </p>
          </div>

          {/* Sells */}
          <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl p-4 hover:border-red-500/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-white/60 text-sm">Sells</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.totalSells}</p>
            <p className="text-white/40 text-xs mt-1">
              {stats.sellVolume > 0n ? `${(Number(stats.sellVolume) / 1e9).toFixed(2)} QU` : '0 QU'}
            </p>
          </div>

          {/* Total Volume */}
          <div className="bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-purple-400" />
              <span className="text-white/60 text-sm">Volume</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">
              {(Number(stats.totalVolume) / 1e9).toFixed(0)}
            </p>
            <p className="text-white/40 text-xs mt-1">QU Total</p>
          </div>
        </div>
      )}

      {/* Recent Trades Table */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          Recent Trades (Event-Based)
        </h3>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-white/60">Analyzing contract events...</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-white/60">
            <Activity className="w-12 h-12 mb-2 opacity-50" />
            <p>No trades found for this contract</p>
            <p className="text-xs mt-1">Try a different contract index</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/60 text-sm pb-3 px-2">Type</th>
                  <th className="text-left text-white/60 text-sm pb-3 px-2">From</th>
                  <th className="text-left text-white/60 text-sm pb-3 px-2">To</th>
                  <th className="text-right text-white/60 text-sm pb-3 px-2">Amount (QU)</th>
                  <th className="text-right text-white/60 text-sm pb-3 px-2">Tick</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 20).map((trade, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        trade.type === 'buy' 
                          ? 'bg-green-500/20 text-green-400' 
                          : trade.type === 'sell'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {trade.type === 'buy' && <TrendingUp className="w-3 h-3" />}
                        {trade.type === 'sell' && <TrendingDown className="w-3 h-3" />}
                        {trade.type === 'transfer' && <Activity className="w-3 h-3" />}
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-white/80 text-sm font-mono">
                      {trade.from.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-2 text-white/80 text-sm font-mono">
                      {trade.to.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-2 text-right text-white font-medium">
                      {(Number(trade.amount) / 1e9).toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right text-white/60 text-sm">
                      {trade.tick.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
