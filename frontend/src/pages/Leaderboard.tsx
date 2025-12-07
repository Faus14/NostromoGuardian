import { useState, useEffect } from 'react';
import { Trophy, Target, Flame, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  badge: string;
  title: string;
  address: string;
  stats: {
    trade_count: number;
    buy_count: number;
    sell_count: number;
    total_volume: string;
    avg_trade_size: string;
    biggest_trade: string;
  };
  portfolio: {
    is_whale: boolean;
    current_balance: string;
    portfolio_share: string;
  };
}

interface WhaleHunter {
  rank: number;
  badge: string;
  title: string;
  address: string;
  stats: {
    tokens_hunted: number;
    early_positions: number;
    total_early_amount: string;
    first_alpha_move: string;
    last_alpha_move: string;
  };
}

export default function Leaderboard() {
  const [traders, setTraders] = useState<LeaderboardEntry[]>([]);
  const [whaleHunters, setWhaleHunters] = useState<WhaleHunter[]>([]);
  const [period, setPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'traders' | 'hunters'>('traders');

  useEffect(() => {
    loadLeaderboards();
  }, [period]);

  const loadLeaderboards = async () => {
    try {
      setLoading(true);
      
      const [tradersRes, huntersRes] = await Promise.all([
        fetch(`http://localhost:3000/api/v1/leaderboard/traders?period=${period}&limit=50`).then(r => r.json()),
        fetch(`http://localhost:3000/api/v1/leaderboard/whale-hunters?limit=20`).then(r => r.json())
      ]);

      if (tradersRes.success) {
        setTraders(tradersRes.data.leaderboard);
      }
      if (huntersRes.success) {
        setWhaleHunters(huntersRes.data.whale_hunters);
      }
    } catch (error) {
      console.error('Failed to load leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-qubic-dark via-gray-900 to-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-10 h-10 text-yellow-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Community Leaderboard
            </h1>
          </div>
          <p className="text-white/60 text-lg">Top traders, whale hunters, and diamond hands on Qubic</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('traders')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'traders'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Top Traders
          </button>
          <button
            onClick={() => setActiveTab('hunters')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'hunters'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Target className="w-5 h-5" />
            Whale Hunters
          </button>
        </div>

        {/* Period Filter (only for traders) */}
        {activeTab === 'traders' && (
          <div className="flex gap-3 mb-6">
            {(['24h', '7d', '30d', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  period === p
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {p === 'all' ? 'All Time' : p.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
            <p className="text-white/60 mt-4">Loading leaderboard...</p>
          </div>
        ) : (
          <>
            {/* Top Traders Table */}
            {activeTab === 'traders' && (
              <div className="bg-gradient-to-br from-qubic-gray to-gray-900 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-black/30">
                      <tr className="text-white/60 text-sm">
                        <th className="py-4 px-6 text-left">Rank</th>
                        <th className="py-4 px-6 text-left">Trader</th>
                        <th className="py-4 px-6 text-left">Title</th>
                        <th className="py-4 px-6 text-right">Trades</th>
                        <th className="py-4 px-6 text-right">Volume</th>
                        <th className="py-4 px-6 text-right">Avg Trade</th>
                        <th className="py-4 px-6 text-right">Biggest Trade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {traders.map((trader) => (
                        <tr key={trader.address} className="hover:bg-white/5 transition">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{trader.badge}</span>
                              <span className="text-white font-bold">#{trader.rank}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="text-white/80 font-mono text-sm">
                                {truncateAddress(trader.address)}
                              </span>
                              {trader.portfolio.is_whale && (
                                <span className="text-xl">🐋</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-cyan-400 font-semibold">{trader.title}</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="text-white font-semibold">{trader.stats.trade_count}</div>
                            <div className="text-xs text-white/50">
                              {trader.stats.buy_count}B / {trader.stats.sell_count}S
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="text-white font-bold">
                              {formatVolume(trader.stats.total_volume)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right text-white/70">
                            {formatVolume(trader.stats.avg_trade_size)}
                          </td>
                          <td className="py-4 px-6 text-right text-green-400 font-semibold">
                            {formatVolume(trader.stats.biggest_trade)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Whale Hunters Table */}
            {activeTab === 'hunters' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-bold text-white">Alpha Hunters</h3>
                  </div>
                  <p className="text-white/60">
                    Traders who bought <span className="text-purple-400 font-semibold">before whales</span> - the true alphas of Qubic
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {whaleHunters.map((hunter) => (
                    <div
                      key={hunter.address}
                      className="bg-gradient-to-br from-qubic-gray to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{hunter.badge}</span>
                          <div>
                            <div className="text-white font-bold">#{hunter.rank}</div>
                            <div className="text-purple-400 text-sm font-semibold">{hunter.title}</div>
                          </div>
                        </div>
                      </div>

                      <div className="text-white/70 font-mono text-sm mb-4 break-all">
                        {truncateAddress(hunter.address)}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/30 rounded-lg p-3">
                          <div className="text-white/50 text-xs mb-1">Tokens Hunted</div>
                          <div className="text-white font-bold text-lg">{hunter.stats.tokens_hunted}</div>
                        </div>
                        <div className="bg-black/30 rounded-lg p-3">
                          <div className="text-white/50 text-xs mb-1">Early Positions</div>
                          <div className="text-white font-bold text-lg">{hunter.stats.early_positions}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* EasyConnect CTA */}
        <div className="mt-12 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-8">
          <div className="flex items-center gap-4">
            <Flame className="w-12 h-12 text-yellow-400" />
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-2">Automate Community Rewards</h3>
              <p className="text-white/70">
                Connect this leaderboard to Discord, Telegram, or Twitter via EasyConnect. 
                Automatically reward top traders, send daily rankings, and gamify your community.
              </p>
            </div>
            <a
              href="/integrations"
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition"
            >
              Setup Automation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
