import { LucideIcon, Info } from 'lucide-react';
import { useState } from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  icon: LucideIcon;
  color: 'cyan' | 'violet' | 'yellow' | 'green';
  tooltip: string;
}

const colorClasses = {
  cyan: {
    bg: 'bg-[#00F5FF]/10',
    text: 'text-[#00F5FF]',
    border: 'border-[#00F5FF]/20'
  },
  violet: {
    bg: 'bg-[#9B5CFF]/10',
    text: 'text-[#9B5CFF]',
    border: 'border-[#9B5CFF]/20'
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    border: 'border-yellow-500/20'
  },
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    border: 'border-green-500/20'
  }
};

export function MetricCard({ title, value, subtitle, change, icon: Icon, color, tooltip }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colors = colorClasses[color];

  return (
    <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/8 transition-all group">
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#1a1f2e] border border-white/20 rounded-lg px-3 py-2 text-sm whitespace-nowrap z-10 shadow-xl">
          {tooltip}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1f2e] border-r border-b border-white/20 rotate-45" />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center ${colors.border} border`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Info className="w-4 h-4 text-white/40 hover:text-white/60" />
        </button>
      </div>

      <div className="space-y-1">
        <p className="text-white/60 text-sm">{title}</p>
        <p className="text-white text-2xl">{value}</p>
        {subtitle && (
          <p className="text-white/40 text-sm">{subtitle}</p>
        )}
        {change && (
          <p className={`text-sm ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
            {change}
          </p>
        )}
      </div>
    </div>
  );
}
