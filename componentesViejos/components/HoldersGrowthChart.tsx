import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useEffect, useState } from 'react';
import { getTokenHolderAnalytics } from '../services/qubic';

interface HolderDataPoint {
  date: string;
  tick: number;
  holders: number;
}

export function HoldersGrowthChart() {
  const [data, setData] = useState<HolderDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch multiple snapshots over time
        const ranges = [5000, 4000, 3000, 2000, 1500, 1000, 500];
        const snapshots = await Promise.all(
          ranges.map(async (range) => {
            const analytics = await getTokenHolderAnalytics('CFB', 'QXMRTKAIIGLUREPIQPCMHCKWSIPDTUYFCFNYXQLTECSUJVYEMMDELBMDOEYB', range);
            return {
              date: `${range} ticks ago`,
              tick: range,
              holders: analytics.totalHolders
            };
          })
        );
        
        setData(snapshots.reverse());
      } catch (error) {
        console.error('Failed to fetch holder growth:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 120000); // Every 2 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-white/60">Loading holder growth...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white mb-1">Holders Growth</h3>
          <p className="text-white/60 text-sm">
            🔴 Live data from Qubic RPC
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF]" />
            <span className="text-sm text-white/60">Holders</span>
          </div>
        </div>
      </div>

      <div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="holdersGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00F5FF" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#9B5CFF" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#9B5CFF" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00F5FF" />
                <stop offset="100%" stopColor="#9B5CFF" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="date" 
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
            />
            <Area 
              type="monotone" 
              dataKey="holders" 
              stroke="url(#lineGradient)" 
              strokeWidth={3}
              fill="url(#holdersGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
