import { Info } from 'lucide-react';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  icon: LucideIcon;
  color: 'cyan' | 'violet' | 'yellow' | 'green' | 'red' | 'blue';
  tooltip?: string;
}

const colorClasses = {
  cyan: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
    glow: 'hover:shadow-cyan-500/20'
  },
  violet: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
    glow: 'hover:shadow-violet-500/20'
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/20',
    glow: 'hover:shadow-yellow-500/20'
  },
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/20',
    glow: 'hover:shadow-green-500/20'
  },
  red: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
    glow: 'hover:shadow-red-500/20'
  },
  blue: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    glow: 'hover:shadow-blue-500/20'
  }
};

export function MetricCard({ title, value, subtitle, change, icon: Icon, color, tooltip }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colors = colorClasses[color];

  return (
    <div className={`relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border ${colors.border} rounded-xl p-6 hover:bg-white/8 transition-all duration-300 group ${colors.glow} hover:shadow-xl`}>
      {/* Tooltip */}
      {showTooltip && tooltip && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/20 rounded-lg px-4 py-2 text-sm whitespace-nowrap z-10 shadow-2xl animate-fadeIn">
          <p className="text-white/90">{tooltip}</p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-white/20 rotate-45" />
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center ${colors.border} border transition-transform group-hover:scale-110`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        {tooltip && (
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Info className="w-4 h-4 text-white/40 hover:text-white/70 transition-colors" />
          </button>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-white/50 text-xs font-medium uppercase tracking-wider">{title}</p>
        <p className="text-white text-3xl font-bold tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-white/40 text-sm mt-1">{subtitle}</p>
        )}
        {change && (
          <p className={`text-sm font-semibold mt-2 ${change.startsWith('+') ? 'text-green-400' : change.startsWith('-') ? 'text-red-400' : 'text-white/50'}`}>
            {change}
          </p>
        )}
      </div>
    </div>
  );
}
