import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Fish, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getWhaleActivity } from '../services/qubic';

interface WhaleData {
  wallet: string;
  buys: number;
  sells: number;
  net: number;
}

export function WhaleActivityChart() {
  const [data, setData] = useState<WhaleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWhaleData = async () => {
    setLoading(true);
    setError(null);
    try {
      const whales = await getWhaleActivity(10); // Last 10 ticks
      if (whales && whales.length > 0) {
        // Transform data for chart
        const chartData = whales.map((whale) => ({
          wallet: whale.wallet,
          buys: whale.buys > 0 ? whale.buys : 0,
          sells: whale.sells > 0 ? -whale.sells : 0,
          net: whale.net
        }));
        setData(chartData);
      } else {
        // No whale activity in this tick range
        setData([]);
      }
    } catch (e) {
      console.error('Failed to fetch whale activity:', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchWhaleData();
  };

  useEffect(() => {
    fetchWhaleData();
    // Refresh every ~12 seconds (one tick)
    const interval = setInterval(fetchWhaleData, 12000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Fish className="w-5 h-5 text-[#00F5FF]" />
            <h3 className="text-white">Whale Activity</h3>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="ml-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 text-[#00F5FF] ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-white/60 text-sm">
            {error 
              ? '⚠️ Error loading data from RPC' 
              : 'Large wallet movements (last 10 ticks from Qubic RPC)'}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#00F5FF]" />
            <span className="text-white/60">Net Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-white/60">Net Negative</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-white/60">Loading whale data...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-white/60">No whale activity detected</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="wallet" 
              stroke="rgba(255,255,255,0.4)"
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.4)"
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1f2e', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toLocaleString()} QU`, '']}
            />
            <Bar dataKey="net" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.net >= 0 ? '#00F5FF' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
