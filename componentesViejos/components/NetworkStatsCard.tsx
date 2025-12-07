import { Zap, BarChart3, Activity, RefreshCw, Users, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTick } from '../contexts/TickContext';
import { getNetworkStats } from '../services/qubic';

export function NetworkStatsCard() {
  const { currentTick, epoch, lastUpdate, error, isLoading, refresh } = useTick();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [networkStats, setNetworkStats] = useState<any>(null);

  // Fetch real network stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const stats = await getNetworkStats();
        setNetworkStats(stats);
      } catch (error) {
        console.error('Failed to fetch network stats:', error);
      }
    }
    
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const calculateQubicAge = (tick: number): string => {
    const seconds = tick;
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    // Also refresh network stats
    try {
      const stats = await getNetworkStats();
      setNetworkStats(stats);
    } catch (error) {
      console.error('Failed to refresh network stats:', error);
    }
    setIsRefreshing(false);
  };

  const stats = currentTick > 0 ? {
    currentTick,
    epoch,
    tickDuration: networkStats?.avgBlockTime || 12,
    qubicAge: calculateQubicAge(currentTick),
    totalTransactions: networkStats?.totalTransactions24h || 0,
    activeAddresses: networkStats?.activeAddresses24h || 0,
    totalValue: networkStats?.totalValue24h || '0'
  } : null;

  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:border-white/30 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#00F5FF]" />
          <h3 className="text-white font-semibold">Blockchain Status</h3>
          {!error && stats && <span className="text-xs text-green-400 font-medium">● LIVE</span>}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
          title="Refresh stats"
        >
          <RefreshCw className={`w-4 h-4 text-[#00F5FF] ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading && !stats ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-white/60">Loading blockchain data...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-48 text-red-400">
          <p className="text-red-400 mb-2">{error}</p>
          <button 
            onClick={handleRefresh}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded transition-all"
          >
            Retry
          </button>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-4">
          {/* Current Tick */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/8 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[#00F5FF]" />
              <p className="text-white/60 text-sm">Current Tick</p>
            </div>
            <p className="text-white text-lg font-bold">{stats.currentTick.toLocaleString()}</p>
            <p className="text-white/40 text-xs mt-1">Block number</p>
          </div>

          {/* Epoch */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/8 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-[#9B5CFF]" />
              <p className="text-white/60 text-sm">Epoch</p>
            </div>
            <p className="text-white text-lg font-bold">{stats.epoch}</p>
            <p className="text-white/40 text-xs mt-1">Network cycle</p>
          </div>

          {/* Tick Duration */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/8 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green-400" />
              <p className="text-white/60 text-sm">Tick Duration</p>
            </div>
            <p className="text-white text-lg font-bold">~{stats.tickDuration}s</p>
            <p className="text-white/40 text-xs mt-1">Avg block time</p>
          </div>

          {/* Active Addresses */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/8 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-400" />
              <p className="text-white/60 text-sm">Active Addresses</p>
            </div>
            <p className="text-white text-lg font-bold">{stats.activeAddresses.toLocaleString()}</p>
            <p className="text-white/40 text-xs mt-1">Last 24h</p>
          </div>

          {/* Total Transactions */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/8 transition-all col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              <p className="text-white/60 text-sm">Transactions (24h)</p>
            </div>
            <p className="text-white text-lg font-bold">{stats.totalTransactions.toLocaleString()} txs</p>
            <p className="text-white/40 text-xs mt-1">
              Volume: {(Number(stats.totalValue) / 1000).toLocaleString()} QU
            </p>
          </div>
        </div>
      ) : null}

      {stats && !error && lastUpdate && (
        <div className="mt-4 text-xs text-white/40 text-center border-t border-white/10 pt-4">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
