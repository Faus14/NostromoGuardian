import { Shield, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTick } from '../contexts/TickContext';

export function ChainHealthMonitor() {
  const { currentTick, epoch, error, lastUpdate, refresh } = useTick();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const chainData = currentTick > 0 ? {
    tick: currentTick,
    epoch,
    isHealthy: !error,
    lastChecked: lastUpdate || new Date()
  } : null;

  return (
    <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/30 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Blockchain Integrity</h3>
          {!error && chainData && <span className="text-xs text-blue-400 font-medium">✓ VERIFIED</span>}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
          title="Verify chain"
        >
          <RefreshCw className={`w-4 h-4 text-blue-400 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!chainData ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-white/60">Verifying blockchain...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-40 text-red-400">
          <p className="text-red-400 mb-2 text-sm">{error}</p>
          <button 
            onClick={handleRefresh}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded transition-all"
          >
            Retry
          </button>
        </div>
      ) : chainData ? (
        <div className="grid grid-cols-2 gap-4">
          {/* Current Tick */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/8 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <p className="text-white/60 text-sm">Current Tick</p>
            </div>
            <p className="text-white text-lg font-bold">{chainData.tick.toLocaleString()}</p>
            <p className="text-white/40 text-xs mt-1">Latest block</p>
          </div>

          {/* Epoch */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/8 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <p className="text-white/60 text-sm">Epoch</p>
            </div>
            <p className="text-white text-lg font-bold">{chainData.epoch}</p>
            <p className="text-white/40 text-xs mt-1">Network cycle</p>
          </div>

          {/* Health Status - Full Width */}
          <div className="col-span-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-semibold">Status: HEALTHY</p>
                  <p className="text-white/40 text-xs mt-1">Blockchain is operating normally</p>
                </div>
              </div>
              <span className="text-xs bg-green-500/20 px-3 py-1 rounded text-green-400 font-medium">✓ Verified</span>
            </div>
          </div>
        </div>
      ) : null}

      {chainData && !error && (
        <div className="mt-4 text-xs text-white/40 text-center border-t border-white/10 pt-4">
          Last checked: {chainData.lastChecked.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
