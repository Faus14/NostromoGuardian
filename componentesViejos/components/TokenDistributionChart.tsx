import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useEffect, useState } from 'react';
import { getTokenHolderAnalytics } from '../services/qubic';

interface DistributionData {
  name: string;
  value: number;
  color: string;
  walletCount: number;
}

export function TokenDistributionChart() {
  const [data, setData] = useState<DistributionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const analytics = await getTokenHolderAnalytics('CFB', 'QXMRTKAIIGLUREPIQPCMHCKWSIPDTUYFCFNYXQLTECSUJVYEMMDELBMDOEYB', 1000);
        
        setData([
          { name: 'Whales (>5%)', value: analytics.concentration.top1, color: '#ef4444', walletCount: analytics.holderDistribution.whales },
          { name: 'Large (1-5%)', value: analytics.concentration.top5 - analytics.concentration.top1, color: '#f59e0b', walletCount: analytics.holderDistribution.large },
          { name: 'Medium (0.1-1%)', value: analytics.concentration.top10 - analytics.concentration.top5, color: '#9B5CFF', walletCount: analytics.holderDistribution.medium },
          { name: 'Small (<0.1%)', value: 100 - analytics.concentration.top10, color: '#00F5FF', walletCount: analytics.holderDistribution.small }
        ]);
      } catch (error) {
        console.error('Failed to fetch token distribution:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-white/60">Loading distribution...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
      <div className="mb-6">
        <h3 className="text-white mb-1">Token Distribution</h3>
        <p className="text-white/60 text-sm">
          🔴 Live data from Qubic RPC
        </p>
      </div>

      <div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1f2e', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => `${value.toFixed(2)}%`}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-3 mt-6">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm truncate">{item.name}</p>
                <p className="text-white text-sm">{item.value.toFixed(1)}% ({item.walletCount} wallets)</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
