import { TrendingDown, TrendingUp, Droplet, AlertTriangle, Fish, Wallet, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getRecentAlerts } from '../services/qubic';

interface AlertEvent {
  id: number;
  type: 'whale_sell' | 'whale_buy' | 'new_wallet' | 'large_tx';
  message: string;
  impact: 'High' | 'Medium' | 'Low';
  timestamp: string;
  amount?: number;
}

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'High': return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'Medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'Low': return 'text-green-500 bg-green-500/10 border-green-500/20';
    default: return 'text-white/60 bg-white/5 border-white/10';
  }
};

const getEventIconColor = (color: string) => {
  switch (color) {
    case 'red': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'yellow': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'green': return 'bg-green-500/10 text-green-500 border-green-500/20';
    default: return 'bg-white/10 text-white border-white/20';
  }
};

const getEventIcon = (type: string) => {
  switch (type) {
    case 'whale_sell': return TrendingDown;
    case 'whale_buy': return TrendingUp;
    case 'new_wallet': return Wallet;
    case 'large_tx': return Fish;
    default: return AlertTriangle;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case 'whale_sell': return 'red';
    case 'whale_buy': return 'green';
    case 'new_wallet': return 'green';
    default: return 'yellow';
  }
};

export function WhaleAlertsFeed() {
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const alerts = await getRecentAlerts(5, 1000); // Last 5 ticks, threshold 1000 QU
      if (alerts && alerts.length > 0) {
        setEvents(alerts);
      } else {
        // No alerts in this tick range
        setEvents([]);
      }
    } catch (e) {
      console.error('Failed to fetch alerts:', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch data');
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  useEffect(() => {
    fetchAlerts();
    // Refresh every ~12 seconds (one tick)
    const interval = setInterval(fetchAlerts, 12000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-white mb-1 flex items-center gap-2">
            Whale Alerts & Risk Events
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
              title="Refresh alerts"
            >
              <RefreshCw className={`w-4 h-4 text-[#9B5CFF] ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </h3>
        </div>
        <p className="text-white/60 text-sm">
          {error 
            ? '⚠️ Error loading data from RPC' 
            : 'Live feed from Qubic RPC (last 5 ticks)'}
        </p>
      </div>

      {loading ? (
        <div className="h-[500px] flex items-center justify-center">
          <p className="text-white/60">Loading alerts...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="h-[500px] flex items-center justify-center">
          <p className="text-white/60">No significant activity detected</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {events.map((event) => {
            const Icon = getEventIcon(event.type);
            const color = getEventColor(event.type);
            return (
              <div
                key={event.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/8 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getEventIconColor(color)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm mb-2">{event.message}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded border ${getImpactColor(event.impact)}`}>
                        {event.impact} impact
                      </span>
                      <span className="text-white/40 text-xs">{event.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
