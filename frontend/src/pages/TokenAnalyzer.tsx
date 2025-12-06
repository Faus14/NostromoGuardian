import { useState, useEffect } from 'react';
import { api, type TokenListItem } from '../services/api';
import type { TokenAnalytics } from '../services/api';
import { Search, TrendingUp, TrendingDown, Users, Activity, Shield, Zap, BarChart3 } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { MetricCard } from '../components/MetricCard';
import { RiskAlerts } from '../components/RiskAlerts';
import { MarketSentiment } from '../components/MarketSentiment';
import { LiveActivityFeed } from '../components/LiveActivityFeed';
import { AddressLink } from '../components/AddressLink';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title);

export default function TokenAnalyzer() {
  const [selectedToken, setSelectedToken] = useState('');
  const [tokenList, setTokenList] = useState<TokenListItem[]>([]);
  const [analytics, setAnalytics] = useState<TokenAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load token list on mount
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const tokens = await api.getTokenList();
        setTokenList(Array.isArray(tokens) ? tokens : []);
      } catch (err) {
        console.error('Failed to load tokens:', err);
        setTokenList([]);
      }
    };
    loadTokens();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToken) return;

    // Parse token from serialized format: "issuer|||name"
    const [issuer, name] = selectedToken.split('|||');
    if (!issuer || !name) {
      setError('Invalid token selection. Please refresh and try again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await api.getTokenAnalytics(issuer, name);
      setAnalytics(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch analytics';
      
      // Show helpful message if it's a database/indexer issue
      if (errorMessage.includes('no data') || errorMessage.includes('not found') || err.response?.status === 500) {
        setError(`No data available yet for this token. The indexer is still syncing blockchain data. Try again later or check the Dashboard for sync progress.`);
      } else {
        setError(errorMessage);
      }
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-qubic-primary/10 border border-purple-500/30 rounded-2xl p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-purple-500/20 p-4 rounded-xl">
            <Activity className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">Token Analyzer</h1>
            <p className="text-gray-400">Advanced on-chain analytics for the Qubic ecosystem</p>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-gradient-to-br from-qubic-gray to-gray-900 rounded-xl p-8 border border-gray-700 shadow-lg">
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-qubic-primary" />
            Select Token
          </label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="w-full px-4 py-3 bg-qubic-dark/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-qubic-primary focus:border-transparent transition"
          >
            <option value="">Choose a token...</option>
            {Array.isArray(tokenList) && tokenList.map((token) => (
              <option 
                key={`${token.issuer}-${token.name}`} 
                value={`${token.issuer}|||${token.name}`}
              >
                {token.name} ({token.tradeCount} trades)
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading || !selectedToken}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-qubic-primary to-blue-500 text-white px-6 py-4 rounded-xl hover:shadow-lg hover:shadow-qubic-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
        >
          <Search className="w-5 h-5" />
          {loading ? (
            <>
              <span className="animate-pulse">Analyzing</span>
              <span className="animate-spin">⚡</span>
            </>
          ) : (
            'Analyze Token'
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-800/20 border-2 border-yellow-500/50 rounded-xl p-6 shadow-lg animate-fadeIn">
          <div className="flex items-start gap-4">
            <div className="bg-yellow-500/20 p-3 rounded-lg flex-shrink-0">
              <Activity className="w-7 h-7 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-yellow-400 font-bold mb-2 text-lg">No Data Available</h3>
              <p className="text-gray-300 mb-4 leading-relaxed">{error}</p>
              <div className="bg-qubic-dark/50 rounded-lg p-4 border border-yellow-500/20">
                <p className="text-sm text-gray-400">
                  💡 <span className="font-semibold text-yellow-400">Tip:</span> The indexer needs to sync blockchain data before analytics are available. 
                  Check the <a href="/" className="text-qubic-primary hover:underline font-semibold">Dashboard</a> to see the current sync progress.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Results */}
      {analytics && (
        <div className="space-y-6">
          {/* Token Info */}
          <div className="bg-qubic-gray rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              {analytics.token.name} <span className="text-gray-500 text-sm">by {analytics.token.issuer.slice(0, 12)}...</span>
            </h3>
          </div>

          {/* Risk Alerts - NEW KILLER FEATURE */}
          <RiskAlerts analytics={analytics} />

          {/* Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScoreCard
              title="Risk Score"
              score={analytics.metrics.scores.riskScore}
              icon={<Shield className="w-8 h-8" />}
              factors={analytics.riskFactors}
              type="risk"
            />
            <ScoreCard
              title="Growth Score"
              score={analytics.metrics.scores.growthScore}
              icon={<Zap className="w-8 h-8" />}
              factors={analytics.growthFactors}
              type="growth"
            />
          </div>

          {/* Key Metrics - Professional Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              title="Total Holders" 
              value={analytics.metrics.holders.total.toString()} 
              icon={Users}
              color="cyan"
              tooltip="Total number of unique addresses holding this token"
              subtitle={`Top 10 hold ${analytics.metrics.holders.top10Percentage.toFixed(1)}%`}
            />
            <MetricCard 
              title="Whales Detected" 
              value={analytics.metrics.holders.whales.toString()} 
              icon={TrendingUp}
              color="violet"
              tooltip="Addresses holding >5% of total supply"
              subtitle={analytics.metrics.holders.whales > 0 ? "High concentration" : "Well distributed"}
            />
            <MetricCard 
              title="24h Trades" 
              value={analytics.metrics.activity.totalTrades.toString()} 
              icon={Activity}
              color="green"
              tooltip="Total trades in the last 24 hours"
              subtitle={`${analytics.metrics.activity.buyCount} buys / ${analytics.metrics.activity.sellCount} sells`}
            />
            <MetricCard
              title="Volume 24h"
              value={`${(parseInt(analytics.metrics.volume.last24h) / 1e9).toFixed(2)} QU`}
              icon={BarChart3}
              color="yellow"
              tooltip="Trading volume in the last 24 hours"
              change={`7d: ${(parseInt(analytics.metrics.volume.last7d) / 1e9).toFixed(2)} QU`}
            />
          </div>

          {/* Market Sentiment & Live Activity - NEW KILLER FEATURES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MarketSentiment 
              buyCount={analytics.metrics.activity.buyCount}
              sellCount={analytics.metrics.activity.sellCount}
              volume24h={analytics.metrics.volume.last24h}
            />
            <LiveActivityFeed 
              trades={analytics.recentTrades}
              tokenName={analytics.token.name}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Holder Distribution */}
            <div className="bg-qubic-gray rounded-lg p-6 border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Holder Distribution</h4>
              <Pie
                data={{
                  labels: ['Top 10', 'Top 50', 'Others'],
                  datasets: [
                    {
                      data: [
                        analytics.metrics.holders.top10Percentage,
                        analytics.metrics.holders.top50Percentage - analytics.metrics.holders.top10Percentage,
                        100 - analytics.metrics.holders.top50Percentage,
                      ],
                      backgroundColor: ['#00D4FF', '#0099CC', '#006699'],
                    },
                  ],
                }}
              />
            </div>

            {/* Buy vs Sell */}
            <div className="bg-qubic-gray rounded-lg p-6 border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Trading Activity</h4>
              <Bar
                data={{
                  labels: ['Buys', 'Sells'],
                  datasets: [
                    {
                      label: 'Count',
                      data: [analytics.metrics.activity.buyCount, analytics.metrics.activity.sellCount],
                      backgroundColor: ['#10B981', '#EF4444'],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                  },
                }}
              />
            </div>
          </div>

          {/* Recent Trades - Enhanced Table */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">Recent Trades</h4>
              <span className="text-sm text-white/50">Last {analytics.recentTrades.length} transactions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-white/50 text-xs uppercase tracking-wider border-b border-white/10">
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Trader</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Price</th>
                    <th className="pb-3 font-semibold">Tick</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {analytics.recentTrades.slice(0, 10).map((trade) => (
                    <tr key={trade.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                            trade.tradeType === 'BUY' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {trade.tradeType}
                        </span>
                      </td>
                      <td className="py-3 text-white/70 font-mono text-sm">
                        <AddressLink address={trade.trader} truncate={16} />
                      </td>
                      <td className="py-3 text-white font-semibold">{trade.amount} tokens</td>
                      <td className="py-3 text-cyan-400 font-mono">{parseFloat(trade.pricePerUnit).toFixed(6)}</td>
                      <td className="py-3 text-white/40 text-sm">{trade.tick.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Holders - Enhanced Table */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">Top Holders</h4>
              <span className="text-sm text-white/50">{analytics.metrics.holders.whales} whales detected</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-white/50 text-xs uppercase tracking-wider border-b border-white/10">
                    <th className="pb-3 font-semibold">Rank</th>
                    <th className="pb-3 font-semibold">Address</th>
                    <th className="pb-3 font-semibold">Balance</th>
                    <th className="pb-3 font-semibold">Share</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {analytics.topHolders.slice(0, 10).map((holder, idx) => (
                    <tr key={holder.address} className="hover:bg-white/5 transition-colors">
                      <td className="py-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 text-white font-bold text-sm">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 text-white/70 font-mono text-sm">
                        <AddressLink address={holder.address} truncate={20} />
                      </td>
                      <td className="py-3 text-white font-semibold">{holder.balance} tokens</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden max-w-[100px]">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              style={{ width: `${Math.min(Number(holder.percentage), 100)}%` }}
                            />
                          </div>
                          <span className="text-purple-400 font-bold text-sm min-w-[3.5rem]">
                            {Number(holder.percentage).toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        {holder.isWhale && (
                          <span className="inline-flex items-center px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-bold">
                            🐋 WHALE
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ScoreCardProps {
  title: string;
  score: number;
  icon: React.ReactNode;
  factors: any;
  type: 'risk' | 'growth';
}

function ScoreCard({ title, score, icon, factors, type }: ScoreCardProps) {
  const getColor = () => {
    if (type === 'risk') {
      if (score >= 80) return 'text-green-500';
      if (score >= 60) return 'text-yellow-500';
      return 'text-red-500';
    } else {
      if (score >= 80) return 'text-green-500';
      if (score >= 60) return 'text-blue-500';
      return 'text-gray-500';
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 group overflow-hidden">
      {/* Animated background glow */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${type === 'risk' ? 'bg-gradient-to-br from-red-500 to-yellow-500' : 'bg-gradient-to-br from-green-500 to-blue-500'}`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-bold text-white tracking-tight">{title}</h4>
          <div className={`p-3 rounded-xl ${type === 'risk' ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
            {icon}
          </div>
        </div>
        
        <div className={`text-6xl font-black ${getColor()} mb-6 tracking-tighter`}>
          {score.toFixed(1)}
          <span className="text-2xl text-white/40 ml-2">/100</span>
        </div>
        
        <div className="space-y-3 pt-4 border-t border-white/10">
          {Object.entries(factors)
            .filter(([key]) => key !== 'total')
            .map(([key, value]) => (
              <div key={key} className="flex items-center justify-between group/item">
                <span className="text-white/60 text-sm capitalize group-hover/item:text-white/80 transition-colors">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${type === 'risk' ? 'bg-gradient-to-r from-red-500 to-yellow-500' : 'bg-gradient-to-r from-green-500 to-blue-500'} rounded-full transition-all`}
                      style={{ width: `${(value as number)}%` }}
                    />
                  </div>
                  <span className="text-white font-bold text-sm min-w-[3rem] text-right">
                    {(value as number).toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}


