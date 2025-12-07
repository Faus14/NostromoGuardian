import { Droplet, Users, TrendingUp, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getComprehensiveDashboard, ComprehensiveDashboard } from '../services/qubic';

export function ComprehensiveMetrics() {
  const [data, setData] = useState<ComprehensiveDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const dashboard = await getComprehensiveDashboard();
      setData(dashboard);
    } catch (error) {
      console.error('Failed to fetch comprehensive metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/60">Loading comprehensive metrics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">Failed to load metrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">What We Measure</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-[#00F5FF] ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Three Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. LIQUIDITY & VOLUME */}
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Droplet className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Liquidity & Volume</h3>
          </div>

          <div className="space-y-4">
            {/* Pool Liquidity */}
            <div>
              <p className="text-white/60 text-sm mb-1">Pool Liquidity</p>
              <p className="text-white text-2xl font-bold">
                {Number(data.liquidity.poolLiquidity).toLocaleString()} QU
              </p>
            </div>

            {/* Daily Volume */}
            <div>
              <p className="text-white/60 text-sm mb-1">Daily Volume</p>
              <p className="text-white text-2xl font-bold">
                {Number(data.liquidity.volume24h).toLocaleString()} QU
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm font-semibold ${
                  data.liquidity.volumeChange24h > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {data.liquidity.volumeChange24h > 0 ? '+' : ''}
                  {data.liquidity.volumeChange24h}%
                </span>
                <span className="text-white/40 text-xs">vs yesterday</span>
              </div>
            </div>

            {/* Hourly Volume */}
            <div>
              <p className="text-white/60 text-sm mb-1">Hourly Volume</p>
              <p className="text-white text-xl font-bold">
                {Number(data.liquidity.volumeHourly).toLocaleString()} QU
              </p>
            </div>

            {/* Volume Trends */}
            <div>
              <p className="text-white/60 text-sm mb-1">Volume Trend</p>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  data.liquidity.volumeTrend === 'up' ? 'bg-green-500/20 text-green-400' :
                  data.liquidity.volumeTrend === 'down' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {data.liquidity.volumeTrend === 'up' ? '📈 Trending Up' :
                   data.liquidity.volumeTrend === 'down' ? '📉 Trending Down' :
                   '➡️ Stable'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. HOLDER DISTRIBUTION */}
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Holder Distribution</h3>
          </div>

          <div className="space-y-4">
            {/* Total Holders */}
            <div>
              <p className="text-white/60 text-sm mb-1">Total Holders</p>
              <p className="text-white text-2xl font-bold">
                {data.holders.totalHolders.toLocaleString()}
              </p>
            </div>

            {/* Top Holders & Whales */}
            <div>
              <p className="text-white/60 text-sm mb-1">Top Holders & Whales</p>
              <p className="text-white text-2xl font-bold">
                {data.holders.whaleCount} whales
              </p>
              <p className="text-white/60 text-sm mt-1">
                {data.holders.topHolders.length} in top 10
              </p>
            </div>

            {/* Concentration */}
            <div>
              <p className="text-white/60 text-sm mb-1">Concentration</p>
              <div className="flex items-center gap-2">
                <p className="text-white text-xl font-bold">
                  {data.holders.concentration}%
                </p>
                <span className="text-white/60 text-xs">in top 10</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, data.holders.concentration)}%` }}
                />
              </div>
            </div>

            {/* New vs Returning */}
            <div>
              <p className="text-white/60 text-sm mb-1">New vs. Returning Buyers</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold">
                  {data.holders.newVsReturning.newBuyers} new
                </span>
                <span className="text-white font-semibold">
                  {data.holders.newVsReturning.returningBuyers} returning
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${data.holders.newVsReturning.percentage}%` }}
                />
              </div>
              <p className="text-white/60 text-xs mt-1">
                {data.holders.newVsReturning.percentage}% new buyers
              </p>
            </div>
          </div>
        </div>

        {/* 3. ACTIVITY & MOMENTUM */}
        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-cyan-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Activity & Momentum</h3>
          </div>

          <div className="space-y-4">
            {/* Trade Frequency */}
            <div>
              <p className="text-white/60 text-sm mb-1">Trade Frequency</p>
              <p className="text-white text-2xl font-bold">
                {data.activity.tradeFrequency} trades/hr
              </p>
            </div>

            {/* Net Buyers vs Sellers */}
            <div>
              <p className="text-white/60 text-sm mb-1">Net Buyers vs Sellers</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-400 font-semibold">
                  {data.activity.netBuyersVsSellers.buyers} buyers
                </span>
                <span className="text-red-400 font-semibold">
                  {data.activity.netBuyersVsSellers.sellers} sellers
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-white text-lg font-bold">
                  Ratio: {data.activity.netBuyersVsSellers.ratio}
                </p>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  data.activity.netBuyersVsSellers.sentiment === 'bullish' 
                    ? 'bg-green-500/20 text-green-400'
                    : data.activity.netBuyersVsSellers.sentiment === 'bearish'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {data.activity.netBuyersVsSellers.sentiment.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Short-term Momentum */}
            <div>
              <p className="text-white/60 text-sm mb-1">Short-term Momentum</p>
              <div className="flex items-center gap-2 mb-2">
                <p className={`text-2xl font-bold ${
                  data.activity.momentum.shortTerm > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {data.activity.momentum.shortTerm > 0 ? '+' : ''}
                  {data.activity.momentum.shortTerm}%
                </p>
                <span className="text-white/60 text-xs">vs last hour</span>
              </div>
              
              {/* Momentum Strength Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Strength</span>
                  <span className="text-white font-semibold">
                    {data.activity.momentum.strength}/100
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      data.activity.momentum.trend === 'bullish' ? 'bg-green-500' :
                      data.activity.momentum.trend === 'bearish' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}
                    style={{ width: `${data.activity.momentum.strength}%` }}
                  />
                </div>
                <div className={`text-center text-sm font-semibold ${
                  data.activity.momentum.trend === 'bullish' ? 'text-green-400' :
                  data.activity.momentum.trend === 'bearish' ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {data.activity.momentum.trend === 'bullish' ? '🚀 Bullish Momentum' :
                   data.activity.momentum.trend === 'bearish' ? '📉 Bearish Momentum' :
                   '➡️ Neutral'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-white/40 border-t border-white/10 pt-4">
        Last updated: {new Date(data.timestamp).toLocaleString()} | 
        Current Tick: {data.currentTick.toLocaleString()}
      </div>
    </div>
  );
}
