import { useEffect, useState } from 'react';
import { Trophy, Sparkles, X } from 'lucide-react';

interface Achievement {
  id: string;
  badge: string;
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const rarityColors = {
  common: {
    gradient: 'from-gray-500 to-gray-600',
    border: 'border-gray-500',
    glow: 'shadow-gray-500/50',
    text: 'text-gray-400',
  },
  rare: {
    gradient: 'from-blue-500 to-cyan-500',
    border: 'border-cyan-500',
    glow: 'shadow-cyan-500/50',
    text: 'text-cyan-400',
  },
  epic: {
    gradient: 'from-purple-500 to-pink-500',
    border: 'border-purple-500',
    glow: 'shadow-purple-500/50',
    text: 'text-purple-400',
  },
  legendary: {
    gradient: 'from-yellow-500 to-orange-500',
    border: 'border-yellow-500',
    glow: 'shadow-yellow-500/50',
    text: 'text-yellow-400',
  },
};

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      
      // Generate confetti particles
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);

      // Auto dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievement]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!achievement) return null;

  const colors = rarityColors[achievement.rarity];

  return (
    <>
      {/* Confetti Effect */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="fixed pointer-events-none z-[100]"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
          }}
        >
          <Sparkles
            className={`w-4 h-4 ${colors.text} animate-ping`}
            style={{ animationDuration: '1s' }}
          />
        </div>
      ))}

      {/* Achievement Toast */}
      <div
        className={`fixed top-20 left-1/2 -translate-x-1/2 z-[99] transition-all duration-500 ${
          isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-95'
        }`}
      >
        <div
          className={`bg-gradient-to-r ${colors.gradient} p-1 rounded-2xl shadow-2xl ${colors.glow} animate-pulse-slow`}
        >
          <div className="bg-gray-900 rounded-2xl p-6 min-w-[400px]">
            <div className="flex items-start gap-4">
              {/* Badge Icon */}
              <div className={`relative animate-bounce-slow`}>
                <div className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} blur-xl opacity-50 rounded-full`} />
                <span className="text-6xl relative z-10 block animate-spin-slow">{achievement.badge}</span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Trophy className={`w-5 h-5 ${colors.text}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                      {achievement.rarity} Achievement
                    </span>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-2xl font-bold text-white mb-1">{achievement.title}</h3>
                <p className="text-white/70 text-sm">{achievement.description}</p>

                {/* Progress indicator */}
                <div className="mt-4 h-1 bg-black/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${colors.gradient} animate-progress`}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        @keyframes progress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .animate-progress {
          animation: progress 5s linear;
        }
      `}</style>
    </>
  );
}
