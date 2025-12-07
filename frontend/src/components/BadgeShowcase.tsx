import { Lock, Unlock, TrendingUp } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  requirement: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  progress?: number;
}

const allBadges: Omit<Badge, 'unlocked' | 'progress'>[] = [
  {
    id: 'bronze',
    name: 'Bronze Trader',
    emoji: '🥉',
    description: 'Complete your first 10 trades',
    requirement: '10 trades',
    rarity: 'common',
  },
  {
    id: 'silver',
    name: 'Silver Trader',
    emoji: '🥈',
    description: 'Reach 1B volume traded',
    requirement: '1B volume',
    rarity: 'common',
  },
  {
    id: 'gold',
    name: 'Gold Trader',
    emoji: '🥇',
    description: 'Reach 10B volume traded',
    requirement: '10B volume + 50 trades',
    rarity: 'rare',
  },
  {
    id: 'diamond',
    name: 'Diamond Hands',
    emoji: '💎',
    description: 'Hold a token for 90+ days without selling',
    requirement: 'Never sold a token for 90 days',
    rarity: 'epic',
  },
  {
    id: 'whale',
    name: 'Whale Master',
    emoji: '🐋',
    description: 'Own 10%+ of any token supply',
    requirement: '10%+ supply concentration',
    rarity: 'legendary',
  },
  {
    id: 'hunter',
    name: 'Alpha Hunter',
    emoji: '🎯',
    description: 'Buy a token before a whale does',
    requirement: 'Buy before whale',
    rarity: 'epic',
  },
  {
    id: 'volume-king',
    name: 'Volume King',
    emoji: '👑',
    description: 'Reach 100B total volume',
    requirement: '100B volume',
    rarity: 'legendary',
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    emoji: '🐦',
    description: 'Be in the first 10 buyers of a token',
    requirement: 'Top 10 first buyers',
    rarity: 'rare',
  },
  {
    id: 'hodler',
    name: 'Diamond Hodler',
    emoji: '💪',
    description: 'Hold 5+ tokens for 30 days',
    requirement: '5 tokens held 30+ days',
    rarity: 'epic',
  },
  {
    id: 'degen',
    name: 'Degen Trader',
    emoji: '🔥',
    description: 'Complete 200+ trades',
    requirement: '200 trades',
    rarity: 'rare',
  },
  {
    id: 'sniper',
    name: 'Sniper',
    emoji: '🎯',
    description: '10+ profitable trades in a row',
    requirement: '10 consecutive green trades',
    rarity: 'legendary',
  },
  {
    id: 'community',
    name: 'Community Leader',
    emoji: '🌟',
    description: 'Refer 10 traders',
    requirement: '10 referrals',
    rarity: 'epic',
  },
];

const rarityStyles = {
  common: {
    gradient: 'from-gray-600 to-gray-700',
    border: 'border-gray-600/50',
    glow: 'group-hover:shadow-gray-500/30',
    text: 'text-gray-400',
    bg: 'bg-gray-500/10',
  },
  rare: {
    gradient: 'from-blue-600 to-cyan-600',
    border: 'border-cyan-600/50',
    glow: 'group-hover:shadow-cyan-500/30',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  epic: {
    gradient: 'from-purple-600 to-pink-600',
    border: 'border-purple-600/50',
    glow: 'group-hover:shadow-purple-500/30',
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  legendary: {
    gradient: 'from-yellow-600 to-orange-600',
    border: 'border-yellow-600/50',
    glow: 'group-hover:shadow-yellow-500/30',
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
};

interface BadgeShowcaseProps {
  unlockedBadgeIds?: string[];
  badgeProgress?: Record<string, number>;
}

export function BadgeShowcase({ unlockedBadgeIds = [], badgeProgress = {} }: BadgeShowcaseProps) {
  const badges: Badge[] = allBadges.map((badge) => ({
    ...badge,
    unlocked: unlockedBadgeIds.includes(badge.id),
    progress: badgeProgress[badge.id],
  }));

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Badge Collection</h2>
            <p className="text-white/70">Unlock achievements by trading, holding, and exploring Qubic</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-white">{unlockedCount}/{totalCount}</div>
            <div className="text-white/60 text-sm">Badges Unlocked</div>
            <div className="mt-2 h-2 w-32 bg-black/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-1000"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {badges.map((badge) => {
          const styles = rarityStyles[badge.rarity];
          const isUnlocked = badge.unlocked;

          return (
            <div
              key={badge.id}
              className={`group relative bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 border-2 ${styles.border} transition-all duration-300 ${styles.glow} hover:scale-105 ${
                isUnlocked ? 'opacity-100' : 'opacity-50'
              }`}
            >
              {/* Rarity badge */}
              <div className={`absolute top-3 right-3 px-2 py-1 ${styles.bg} rounded-full`}>
                <span className={`text-xs font-bold uppercase ${styles.text}`}>{badge.rarity}</span>
              </div>

              {/* Lock/Unlock indicator */}
              <div className="absolute top-3 left-3">
                {isUnlocked ? (
                  <Unlock className={`w-5 h-5 ${styles.text}`} />
                ) : (
                  <Lock className="w-5 h-5 text-white/30" />
                )}
              </div>

              {/* Badge Icon */}
              <div className="flex justify-center mb-4 mt-6">
                <div className="relative">
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-full" />
                  )}
                  <span
                    className={`text-6xl transition-all duration-300 ${
                      isUnlocked ? 'grayscale-0 group-hover:scale-110' : 'grayscale'
                    }`}
                  >
                    {badge.emoji}
                  </span>
                </div>
              </div>

              {/* Badge Info */}
              <div className="space-y-2">
                <h3 className={`text-lg font-bold ${isUnlocked ? 'text-white' : 'text-white/50'}`}>
                  {badge.name}
                </h3>
                <p className={`text-sm ${isUnlocked ? 'text-white/70' : 'text-white/40'}`}>
                  {badge.description}
                </p>

                {/* Requirement */}
                <div className={`flex items-center gap-2 text-xs ${styles.text} font-semibold`}>
                  <TrendingUp className="w-3 h-3" />
                  {badge.requirement}
                </div>

                {/* Progress Bar (if not unlocked) */}
                {!isUnlocked && badge.progress !== undefined && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/50">Progress</span>
                      <span className={styles.text}>{badge.progress}%</span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${styles.gradient} transition-all duration-500`}
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Unlocked indicator */}
                {isUnlocked && (
                  <div className={`mt-3 px-3 py-2 ${styles.bg} rounded-lg border ${styles.border}`}>
                    <span className={`text-xs font-bold ${styles.text}`}>✓ UNLOCKED</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
