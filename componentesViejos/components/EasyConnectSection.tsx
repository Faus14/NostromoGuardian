import { Zap, Bell, TrendingUp, Users, ArrowRight } from 'lucide-react';

const automations = [
  {
    icon: TrendingUp,
    title: 'Alert on Whale Sell',
    description: 'Get notified when large wallets sell tokens'
  },
  {
    icon: Users,
    title: 'Alert on New Holder',
    description: 'Track new addresses joining the ecosystem'
  },
  {
    icon: Bell,
    title: 'Volume Spike Trigger',
    description: 'Detect unusual trading volume patterns'
  }
];

const integrations = [
  { name: 'Make', color: '#8B5CF6' },
  { name: 'Zapier', color: '#FF6A00' },
  { name: 'n8n', color: '#EA4B71' }
];

export function EasyConnectSection() {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
      <div className="mb-6">
        <h3 className="text-white mb-1 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#9B5CFF]" />
          EasyConnect Integration
        </h3>
        <p className="text-white/60 text-sm">Set up automated alerts and workflows</p>
      </div>

      <div className="space-y-3 mb-6">
        {automations.map((auto, index) => {
          const Icon = auto.icon;
          return (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/8 hover:border-[#9B5CFF]/30 transition-all group cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#9B5CFF]/10 rounded-lg flex items-center justify-center border border-[#9B5CFF]/20">
                  <Icon className="w-5 h-5 text-[#9B5CFF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm mb-1">{auto.title}</p>
                  <p className="text-white/60 text-xs">{auto.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-[#9B5CFF] group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          );
        })}
      </div>

      <button className="w-full bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF] text-[#0B0F16] py-3 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 group">
        <Zap className="w-5 h-5" />
        <span>Create Automation</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>

      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="text-white/60 text-sm mb-3">Compatible with:</p>
        <div className="flex gap-3">
          {integrations.map((integration, index) => (
            <div
              key={index}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center hover:bg-white/8 transition-all"
            >
              <p className="text-white text-sm">{integration.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
