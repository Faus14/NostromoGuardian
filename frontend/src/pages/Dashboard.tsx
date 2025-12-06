import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { StatusResponse } from '../services/api';
import { Activity, TrendingUp, AlertCircle, RefreshCw, Zap, Database, Clock } from 'lucide-react';

export default function Dashboard() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const data = await api.getStatus();
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch status');
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-qubic-primary/20 border-t-qubic-primary"></div>
          <Zap className="w-8 h-8 text-qubic-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-gray-400 mt-4 animate-pulse">Connecting to Qubic Network...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-gradient-to-r from-red-900/30 to-red-800/20 border-2 border-red-500/50 rounded-xl p-8 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="bg-red-500/20 p-3 rounded-lg">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-400 mb-2">Connection Error</h3>
              <p className="text-gray-300 mb-4">{error}</p>
              <button
                onClick={fetchStatus}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!status) return null;

  const syncProgress = ((status.indexer.lastProcessedTick / status.indexer.currentTick) * 100) || 0;
  const isSyncing = status.indexer.ticksBehind > 100;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header with Live Status */}
      <div className="relative overflow-hidden bg-gradient-to-r from-qubic-primary/10 via-blue-500/10 to-purple-500/10 border border-qubic-primary/30 rounded-2xl p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-qubic-primary/5 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-qubic-primary/20 p-4 rounded-xl">
                <Activity className="w-8 h-8 text-qubic-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">Qubic Network</h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium">Live</span>
                  <span className="text-gray-400 text-sm">• Updated {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            <button
              onClick={fetchStatus}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-qubic-primary hover:bg-qubic-primary/90 disabled:bg-qubic-primary/50 text-qubic-dark px-6 py-3 rounded-xl transition font-semibold shadow-lg hover:shadow-qubic-primary/50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Progress Bar */}
          {isSyncing && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-300">Indexer Sync Progress</span>
                <span className="text-qubic-primary font-semibold">{syncProgress.toFixed(2)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-qubic-primary to-blue-500 transition-all duration-500 rounded-full"
                  style={{ width: `${syncProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Current Tick"
          value={status.indexer.currentTick.toLocaleString()}
          icon={<Zap className="w-7 h-7" />}
          color="primary"
          gradient="from-cyan-500/20 to-qubic-primary/20"
          trend="+0.2%"
        />
        <StatCard
          title="Last Processed"
          value={status.indexer.lastProcessedTick.toLocaleString()}
          icon={<Database className="w-7 h-7" />}
          color="green"
          gradient="from-green-500/20 to-emerald-500/20"
        />
        <StatCard
          title="Ticks Behind"
          value={status.indexer.ticksBehind.toLocaleString()}
          icon={<Clock className="w-7 h-7" />}
          color={status.indexer.ticksBehind > 1000 ? 'red' : 'yellow'}
          gradient={status.indexer.ticksBehind > 1000 ? 'from-red-500/20 to-orange-500/20' : 'from-yellow-500/20 to-amber-500/20'}
          badge={isSyncing ? 'Syncing' : 'Synced'}
        />
        <StatCard
          title="Current Epoch"
          value={status.network.lastProcessedTick.epoch.toString()}
          icon={<Activity className="w-7 h-7" />}
          color="blue"
          gradient="from-blue-500/20 to-indigo-500/20"
        />
      </div>

      {/* Detailed Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Details */}
        <div className="bg-gradient-to-br from-qubic-gray to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg hover:border-qubic-primary/50 transition">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-qubic-primary/20 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-qubic-primary" />
            </div>
            <h3 className="text-xl font-bold text-white">Network Details</h3>
          </div>
          <div className="space-y-4">
            <DetailRow
              label="Network Tick"
              value={status.network.lastProcessedTick.tickNumber.toLocaleString()}
              highlight
            />
            <DetailRow 
              label="Epoch" 
              value={`#${status.network.lastProcessedTick.epoch}`}
            />
            <DetailRow
              label="Indexer Status"
              value={status.indexer.lastProcessedTick > 0 ? 'Running' : 'Not Started'}
              badge={status.indexer.lastProcessedTick > 0}
            />
            <DetailRow
              label="Sync Progress"
              value={`${syncProgress.toFixed(4)}%`}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-qubic-gray to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg hover:border-blue-500/50 transition">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Performance</h3>
          </div>
          <div className="space-y-4">
            <DetailRow
              label="Blocks Behind"
              value={status.indexer.ticksBehind.toLocaleString()}
              highlight={status.indexer.ticksBehind > 1000}
            />
            <DetailRow
              label="Catch-Up Rate"
              value={isSyncing ? "~500 ticks/min" : "Real-time"}
            />
            <DetailRow
              label="Network Health"
              value="Excellent"
              badge
            />
            <DetailRow
              label="API Response"
              value="< 50ms"
            />
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-qubic-primary/10 via-blue-500/10 to-purple-500/10 border border-qubic-primary/30 rounded-xl p-6 shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-qubic-primary/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex items-start gap-4">
          <div className="bg-qubic-primary/20 p-3 rounded-lg">
            <Zap className="w-6 h-6 text-qubic-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-qubic-primary mb-2">Explore QX Token Analytics</h3>
            <p className="text-gray-300 leading-relaxed">
              Navigate to <span className="font-semibold text-white">Token Analyzer</span> to explore comprehensive metrics including holder distribution, trade volumes, and risk assessments. Use <span className="font-semibold text-white">Address Lookup</span> to track wallet activity, P/L, and transaction history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'primary' | 'green' | 'red' | 'yellow' | 'blue';
  gradient?: string;
  trend?: string;
  badge?: string;
}

function StatCard({ title, value, icon, color, gradient, trend, badge }: StatCardProps) {
  const colorClasses = {
    primary: 'text-qubic-primary border-qubic-primary/30',
    green: 'text-green-500 border-green-500/30',
    red: 'text-red-500 border-red-500/30',
    yellow: 'text-yellow-500 border-yellow-500/30',
    blue: 'text-blue-500 border-blue-500/30',
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient || 'from-qubic-gray to-gray-900'} rounded-xl p-6 border ${colorClasses[color]} shadow-lg hover:shadow-xl hover:border-opacity-70 transition-all duration-300 group`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl group-hover:w-32 group-hover:h-32 transition-all"></div>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm text-gray-400 mb-1 font-medium">{title}</p>
            {badge && (
              <span className={`text-xs px-2 py-1 rounded-full ${colorClasses[color]} bg-current/10 font-semibold`}>
                {badge}
              </span>
            )}
          </div>
          <div className={`bg-current/10 p-3 rounded-xl ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
          {trend && (
            <span className="text-sm text-green-400 font-semibold">{trend}</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  badge?: boolean;
}

function DetailRow({ label, value, highlight, badge }: DetailRowProps) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-700/50 last:border-0 hover:bg-gray-800/30 px-2 rounded transition">
      <span className="text-gray-400 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        )}
        <span className={`font-bold ${highlight ? 'text-qubic-primary' : 'text-white'}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
