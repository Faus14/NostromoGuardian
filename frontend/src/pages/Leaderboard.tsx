import { useState, useEffect } from 'react';
import { Trophy, Target, Flame, TrendingUp, Award, Crown, Star, Zap } from 'lucide-react';
import { BadgeShowcase } from '../components/BadgeShowcase';
import { AchievementToast } from '../components/AchievementToast';

interface Achievement {
  id: string;
  badge: string;
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

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
  const [activeTab, setActiveTab] = useState<'traders' | 'hunters' | 'badges'>('traders');
  const [selectedTrader, setSelectedTrader] = useState<LeaderboardEntry | null>(null);
  const [traderTrades, setTraderTrades] = useState<any[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [achievement, setAchievement] = useState<Achievement | null>(null);

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

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/50';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50';
    if (rank === 3) return 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-orange-600/50';
    return 'border-gray-700';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400 animate-pulse" />;
    if (rank === 2) return <Award className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Star className="w-5 h-5 text-orange-500" />;
    return null;
  };

  const getTitleColor = (title: string) => {
    if (title.includes('Diamond')) return 'text-cyan-400';
    if (title.includes('Gold')) return 'text-yellow-400';
    if (title.includes('Whale')) return 'text-purple-400';
    return 'text-green-400';
  };

  const openTraderProfile = async (trader: LeaderboardEntry) => {
    setSelectedTrader(trader);
    setLoadingTrades(true);
    
    // Simulate achievement unlock (in real app, would come from backend)
    if (Math.random() > 0.7) {
      const achievements: Achievement[] = [
        { id: 'profile-viewer', badge: '👀', title: 'Profile Viewer', description: 'You viewed 10 trader profiles!', rarity: 'common' },
        { id: 'whale-watcher', badge: '🐋', title: 'Whale Watcher', description: 'You found a whale trader!', rarity: 'rare' },
        { id: 'top-hunter', badge: '🎯', title: 'Top Hunter', description: 'You discovered a top-ranked hunter!', rarity: 'epic' },
        { id: 'legendary-scout', badge: '⭐', title: 'Legendary Scout', description: 'You unlocked a legendary achievement!', rarity: 'legendary' },
      ];
      const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)];
      setAchievement(randomAchievement);
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => setAchievement(null), 5000);
    }
    
    try {
      const response = await fetch(`http://localhost:3000/api/v1/addresses/${trader.address}/trades?limit=50`);
      const data = await response.json();
      if (data.success) {
        setTraderTrades(data.data);
      }
    } catch (error) {
      console.error('Failed to load trader trades:', error);
    } finally {
      setLoadingTrades(false);
    }
  };

  const closeProfile = () => {
    setSelectedTrader(null);
    setTraderTrades([]);
  };

  const getBadgeProgress = (trader: LeaderboardEntry) => {
    const volume = parseFloat(trader.stats.total_volume);
    const trades = trader.stats.trade_count;
    
    // Define thresholds for next badge
    const badges = [
      { name: 'Bronze Trader', volumeMin: 0, tradesMin: 0, emoji: '🥉', level: 1 },
      { name: 'Silver Trader', volumeMin: 1e9, tradesMin: 10, emoji: '🥈', level: 2 },
      { name: 'Gold Trader', volumeMin: 10e9, tradesMin: 50, emoji: '🥇', level: 3 },
      { name: 'Diamond Trader', volumeMin: 100e9, tradesMin: 100, emoji: '💎', level: 4 },
      { name: 'Whale Master', volumeMin: 500e9, tradesMin: 200, emoji: '🐋', level: 5 },
    ];
    
    const currentBadge = [...badges].reverse().find(b => volume >= b.volumeMin && trades >= b.tradesMin) || badges[0];
    const nextBadge = badges[currentBadge.level] || null;
    
    if (!nextBadge) {
      return { current: currentBadge, next: null, progress: 100 };
    }
    
    const volumeProgress = Math.min((volume / nextBadge.volumeMin) * 100, 100);
    const tradesProgress = Math.min((trades / nextBadge.tradesMin) * 100, 100);
    const progress = Math.min(volumeProgress, tradesProgress);
    
    return { current: currentBadge, next: nextBadge, progress: Math.round(progress) };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-qubic-dark via-gray-900 to-black p-8">
      {/* Achievement Toast */}
      {achievement && (
        <AchievementToast
          achievement={achievement}
          onClose={() => setAchievement(null)}
        />
      )}
      
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
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'badges'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Award className="w-5 h-5" />
            Badge Gallery
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
                      {traders.map((trader, index) => (
                        <tr 
                          key={trader.address} 
                          onClick={() => openTraderProfile(trader)}
                          className={`hover:bg-white/10 transition-all duration-300 group ${getRankStyle(trader.rank)} border-l-4 animate-fadeIn cursor-pointer`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <span className="text-3xl group-hover:scale-110 transition-transform duration-300 inline-block">{trader.badge}</span>
                                {trader.rank <= 3 && (
                                  <div className="absolute -top-1 -right-1">
                                    {getRankIcon(trader.rank)}
                                  </div>
                                )}
                              </div>
                              <span className={`text-white font-bold text-lg ${trader.rank <= 3 ? 'text-xl' : ''}`}>#{trader.rank}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2">
                              <span className="text-white/90 font-mono text-sm group-hover:text-cyan-400 transition-colors">
                                {truncateAddress(trader.address)}
                              </span>
                              {trader.portfolio.is_whale && (
                                <span className="text-2xl group-hover:scale-125 transition-transform duration-300">🐋</span>
                              )}
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <span className={`font-bold ${getTitleColor(trader.title)} text-sm group-hover:text-base transition-all`}>{trader.title}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <div className="text-white font-bold text-lg">{trader.stats.trade_count}</div>
                            <div className="text-xs text-white/50">
                              <span className="text-green-400">{trader.stats.buy_count}B</span> / <span className="text-red-400">{trader.stats.sell_count}S</span>
                            </div>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <span className="text-white font-bold text-lg bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/30">
                              {formatVolume(trader.stats.total_volume)}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <span className="text-white/80 font-medium">{formatVolume(trader.stats.avg_trade_size)}</span>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <span className="text-green-400 font-bold text-lg bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/30">
                              {formatVolume(trader.stats.biggest_trade)}
                            </span>
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
                  {whaleHunters.map((hunter, index) => (
                    <div
                      key={hunter.address}
                      className={`bg-gradient-to-br from-qubic-gray to-gray-900 rounded-xl p-6 border hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 transform hover:scale-105 cursor-pointer animate-fadeIn group ${getRankStyle(hunter.rank)}`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <span className="text-4xl group-hover:scale-110 transition-transform duration-300 inline-block">{hunter.badge}</span>
                            {hunter.rank <= 3 && (
                              <div className="absolute -top-1 -right-1">
                                {getRankIcon(hunter.rank)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-white font-bold text-xl">#{hunter.rank}</div>
                            <div className="text-purple-400 text-sm font-bold flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {hunter.title}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-white/80 font-mono text-sm mb-4 break-all bg-black/30 px-3 py-2 rounded-lg border border-white/5">
                        {truncateAddress(hunter.address)}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/50 rounded-lg p-3 border border-purple-500/20 hover:border-purple-500/50 transition">
                          <div className="text-purple-400 text-xs mb-1 font-semibold uppercase">Tokens Hunted</div>
                          <div className="text-white font-bold text-2xl">{hunter.stats.tokens_hunted}</div>
                        </div>
                        <div className="bg-black/50 rounded-lg p-3 border border-pink-500/20 hover:border-pink-500/50 transition">
                          <div className="text-pink-400 text-xs mb-1 font-semibold uppercase">Early Positions</div>
                          <div className="text-white font-bold text-2xl">{hunter.stats.early_positions}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Badge Showcase Tab */}
            {activeTab === 'badges' && (
              <BadgeShowcase
                unlockedBadgeIds={['bronze', 'silver', 'early-bird', 'degen']}
                badgeProgress={{
                  gold: 65,
                  diamond: 30,
                  whale: 10,
                  hunter: 45,
                  'volume-king': 22,
                  hodler: 80,
                  sniper: 55,
                  community: 15,
                }}
              />
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

      {/* Trader Profile Modal */}
      {selectedTrader && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={closeProfile}>
          <div 
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-cyan-500/30 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-black border-b border-white/10 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="text-6xl">{selectedTrader.badge}</span>
                  {selectedTrader.rank <= 3 && (
                    <div className="absolute -top-2 -right-2">
                      {getRankIcon(selectedTrader.rank)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-white">Rank #{selectedTrader.rank}</h2>
                    {selectedTrader.portfolio.is_whale && <span className="text-3xl">🐋</span>}
                  </div>
                  <div className={`text-xl font-bold ${getTitleColor(selectedTrader.title)}`}>{selectedTrader.title}</div>
                  <div className="text-white/60 font-mono text-sm mt-1">{selectedTrader.address}</div>
                </div>
              </div>
              <button
                onClick={closeProfile}
                className="text-white/60 hover:text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4">
                  <div className="text-cyan-400 text-xs font-semibold uppercase mb-1">Total Trades</div>
                  <div className="text-white text-3xl font-bold">{selectedTrader.stats.trade_count}</div>
                  <div className="text-white/50 text-xs mt-1">
                    <span className="text-green-400">{selectedTrader.stats.buy_count}B</span> / <span className="text-red-400">{selectedTrader.stats.sell_count}S</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="text-green-400 text-xs font-semibold uppercase mb-1">Total Volume</div>
                  <div className="text-white text-3xl font-bold">{formatVolume(selectedTrader.stats.total_volume)}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
                  <div className="text-purple-400 text-xs font-semibold uppercase mb-1">Avg Trade</div>
                  <div className="text-white text-2xl font-bold">{formatVolume(selectedTrader.stats.avg_trade_size)}</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="text-yellow-400 text-xs font-semibold uppercase mb-1">Biggest Trade</div>
                  <div className="text-white text-2xl font-bold">{formatVolume(selectedTrader.stats.biggest_trade)}</div>
                </div>
              </div>

              {/* Badge Progress */}
              <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-violet-400" />
                    <h3 className="text-xl font-bold text-white">Badge Progress</h3>
                  </div>
                </div>
                <div className="space-y-3">
                  {(() => {
                    const { current, next, progress } = getBadgeProgress(selectedTrader);
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{current.emoji}</span>
                            <span className="text-white font-semibold">{current.name}</span>
                          </div>
                          {next && (
                            <div className="flex items-center gap-2">
                              <span className="text-white/50 text-sm">Next:</span>
                              <span className="text-xl">{next.emoji}</span>
                              <span className="text-white/70 text-sm">{next.name}</span>
                            </div>
                          )}
                        </div>
                        {next && (
                          <>
                            <div className="relative h-3 bg-black/50 rounded-full overflow-hidden">
                              <div 
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="text-white/60 text-sm text-right">{progress}% Complete</div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Recent Trades */}
              <div className="bg-black/30 border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Recent Trades
                </h3>
                {loadingTrades ? (
                  <div className="text-center py-8 text-white/50">Loading trades...</div>
                ) : traderTrades.length === 0 ? (
                  <div className="text-center py-8 text-white/50">No trades found</div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {traderTrades.slice(0, 20).map((trade: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition border border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`px-2 py-1 rounded text-xs font-bold ${
                            trade.tradeType === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {trade.tradeType}
                          </div>
                          <div>
                            <div className="text-white font-medium">{trade.tokenName}</div>
                            <div className="text-white/50 text-xs">{new Date(trade.timestamp).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">{formatVolume(trade.amount)}</div>
                          <div className="text-white/60 text-xs">{formatVolume(trade.totalValue)} total</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
