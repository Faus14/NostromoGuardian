import { useState, useEffect } from 'react';
import { api, type TokenListItem } from '../services/api';
import type { TokenAnalytics } from '../services/api';
import { Search, TrendingUp, TrendingDown, Users, Activity, Shield, Zap } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';

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

    // Extract issuer and name from selected token
    const token = tokenList.find(t => `${t.name}-${t.issuer}` === selectedToken);
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.getTokenAnalytics(token.issuer, token.name);
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
              <option key={`${token.name}-${token.issuer}`} value={`${token.name}-${token.issuer}`}>
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

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="Total Holders" value={analytics.metrics.holders.total.toString()} icon={<Users />} />
            <MetricCard title="Whales" value={analytics.metrics.holders.whales.toString()} icon={<TrendingUp />} />
            <MetricCard title="24h Trades" value={analytics.metrics.activity.totalTrades.toString()} icon={<Activity />} />
            <MetricCard
              title="Volume 24h"
              value={`${(parseInt(analytics.metrics.volume.last24h) / 1e9).toFixed(2)} QU`}
              icon={<TrendingUp />}
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

          {/* Recent Trades */}
          <div className="bg-qubic-gray rounded-lg p-6 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4">Recent Trades</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-600">
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Trader</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2">Tick</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentTrades.slice(0, 10).map((trade) => (
                    <tr key={trade.id} className="border-b border-gray-700">
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            trade.tradeType === 'BUY' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {trade.tradeType}
                        </span>
                      </td>
                      <td className="py-2 text-gray-300">{trade.trader.slice(0, 12)}...</td>
                      <td className="py-2 text-white">{(parseInt(trade.amount) / 1e9).toFixed(2)}</td>
                      <td className="py-2 text-white">{parseFloat(trade.pricePerUnit).toFixed(6)}</td>
                      <td className="py-2 text-gray-400">{trade.tick.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Holders */}
          <div className="bg-qubic-gray rounded-lg p-6 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4">Top Holders</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-600">
                    <th className="pb-2">Rank</th>
                    <th className="pb-2">Address</th>
                    <th className="pb-2">Balance</th>
                    <th className="pb-2">%</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topHolders.slice(0, 10).map((holder, idx) => (
                    <tr key={holder.address} className="border-b border-gray-700">
                      <td className="py-2 text-white font-semibold">#{idx + 1}</td>
                      <td className="py-2 text-gray-300">{holder.address.slice(0, 16)}...</td>
                      <td className="py-2 text-white">{(parseInt(holder.balance) / 1e9).toFixed(2)}</td>
                      <td className="py-2 text-qubic-primary">{holder.percentage.toFixed(2)}%</td>
                      <td className="py-2">
                        {holder.isWhale && <span className="px-2 py-1 bg-purple-500/20 text-purple-500 rounded text-xs font-semibold">WHALE</span>}
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
    <div className="bg-qubic-gray rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white">{title}</h4>
        {icon}
      </div>
      <div className={`text-5xl font-bold ${getColor()} mb-4`}>{score.toFixed(1)}</div>
      <div className="space-y-2">
        {Object.entries(factors)
          .filter(([key]) => key !== 'total')
          .map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className="text-white font-semibold">{(value as number).toFixed(1)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

function MetricCard({ title, value, icon }: MetricCardProps) {
  return (
    <div className="bg-qubic-gray rounded-lg p-4 border border-gray-700">
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        {icon}
        <span className="text-sm">{title}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
