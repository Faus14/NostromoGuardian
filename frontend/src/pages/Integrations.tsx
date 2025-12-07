import { Code, Zap, Bell, TrendingUp, ExternalLink } from 'lucide-react';

export default function Integrations() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-qubic-dark via-gray-900 to-black p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <Zap className="w-10 h-10 text-yellow-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              EasyConnect Integration
            </h1>
          </div>
          <p className="text-white/70 text-lg">
            Connect Nostromo Guardian to Make, Zapier, n8n and more - no code required
          </p>
        </div>

        {/* EasyConnect Compatible Badge */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Zap className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">✨ EasyConnect Compatible</h2>
              <p className="text-white/70">
                Nostromo Guardian provides real-time blockchain events through EasyConnect's no-code platform
              </p>
            </div>
            <a
              href="https://easy-academy.super.site/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition flex items-center gap-2"
            >
              Get Started <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Available Events */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Available Endpoints</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-qubic-gray to-gray-900 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <Bell className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Recent Events</h3>
              </div>
              <p className="text-white/60 text-sm mb-3">Real-time token trades</p>
              <div className="bg-black/30 p-2 rounded font-mono text-xs text-cyan-400">
                /api/v1/events/recent
              </div>
            </div>

            <div className="bg-gradient-to-br from-qubic-gray to-gray-900 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-bold text-white">Whale Alerts</h3>
              </div>
              <p className="text-white/60 text-sm mb-3">Large trades from whales</p>
              <div className="bg-black/30 p-2 rounded font-mono text-xs text-red-400">
                /api/v1/events/whale-alerts
              </div>
            </div>

            <div className="bg-gradient-to-br from-qubic-gray to-gray-900 rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🏆</span>
                <h3 className="text-lg font-bold text-white">Top Traders</h3>
              </div>
              <p className="text-white/60 text-sm mb-3">Leaderboard with gamification</p>
              <div className="bg-black/30 p-2 rounded font-mono text-xs text-purple-400">
                /api/v1/leaderboard/traders
              </div>
            </div>

            <div className="bg-gradient-to-br from-qubic-gray to-gray-900 rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🎯</span>
                <h3 className="text-lg font-bold text-white">Whale Hunters</h3>
              </div>
              <p className="text-white/60 text-sm mb-3">Alpha traders who bought first</p>
              <div className="bg-black/30 p-2 rounded font-mono text-xs text-purple-400">
                /api/v1/leaderboard/whale-hunters
              </div>
            </div>

            <div className="bg-gradient-to-br from-qubic-gray to-gray-900 rounded-xl p-6 border border-green-500/30">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🎁</span>
                <h3 className="text-lg font-bold text-white">Airdrop Eligible</h3>
              </div>
              <p className="text-white/60 text-sm mb-3">Auto-filter eligible addresses</p>
              <div className="bg-black/30 p-2 rounded font-mono text-xs text-green-400">
                /api/v1/airdrops/eligible
              </div>
            </div>

            <div className="bg-gradient-to-br from-qubic-gray to-gray-900 rounded-xl p-6 border border-green-500/30">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">💎</span>
                <h3 className="text-lg font-bold text-white">Diamond Hands</h3>
              </div>
              <p className="text-white/60 text-sm mb-3">Holders who never sold</p>
              <div className="bg-black/30 p-2 rounded font-mono text-xs text-green-400">
                /api/v1/airdrops/diamond-hands
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-gradient-to-br from-qubic-gray to-gray-900 rounded-xl p-8 border border-gray-700 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Code className="w-6 h-6 text-qubic-primary" />
            <h3 className="text-2xl font-bold text-white">Quick Start</h3>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">1️⃣ Add Nostromo as a Source in EasyConnect</h4>
              <p className="text-white/70 mb-3">Use this URL as your data source:</p>
              <div className="bg-black/30 p-4 rounded-lg font-mono text-sm text-cyan-400 break-all">
                {window.location.origin}/api/v1/events/recent
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-2">2️⃣ Configure Filters (Optional)</h4>
              <p className="text-white/70 mb-3">Add query parameters to filter events:</p>
              <div className="bg-black/30 p-4 rounded-lg space-y-2">
                <div className="text-sm">
                  <span className="text-yellow-400 font-mono">?token=QMINE</span>
                  <span className="text-white/50 ml-3">→ Only QMINE trades</span>
                </div>
                <div className="text-sm">
                  <span className="text-yellow-400 font-mono">?address=ABC...</span>
                  <span className="text-white/50 ml-3">→ Specific wallet activity</span>
                </div>
                <div className="text-sm">
                  <span className="text-yellow-400 font-mono">?min_amount=1000000000</span>
                  <span className="text-white/50 ml-3">→ Minimum trade size</span>
                </div>
                <div className="text-sm">
                  <span className="text-yellow-400 font-mono">?whales_only=true</span>
                  <span className="text-white/50 ml-3">→ Only whale trades</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-2">3️⃣ Connect to Your Automation</h4>
              <p className="text-white/70 mb-3">Send events to:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center">
                  <span className="text-purple-400 font-semibold">Make</span>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center">
                  <span className="text-orange-400 font-semibold">Zapier</span>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                  <span className="text-red-400 font-semibold">n8n</span>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
                  <span className="text-blue-400 font-semibold">Telegram</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="bg-gradient-to-br from-qubic-gray to-gray-900 rounded-xl p-8 border border-gray-700 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">💡 Real-World Use Cases</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/30 rounded-lg p-6">
              <div className="text-3xl mb-3">🏆</div>
              <h4 className="text-lg font-bold text-white mb-2">Discord Leaderboard Bot</h4>
              <p className="text-white/60 text-sm mb-3">
                Post daily top traders to your Discord server. Automatically reward winners with roles or tokens.
              </p>
              <div className="text-xs text-cyan-400 font-mono">/leaderboard/traders → Discord Webhook</div>
            </div>

            <div className="bg-black/30 rounded-lg p-6">
              <div className="text-3xl mb-3">🐋</div>
              <h4 className="text-lg font-bold text-white mb-2">Whale Alert Telegram</h4>
              <p className="text-white/60 text-sm mb-3">
                Instant Telegram notifications when whales make moves. Never miss alpha again.
              </p>
              <div className="text-xs text-red-400 font-mono">/events/whale-alerts → Telegram Bot</div>
            </div>

            <div className="bg-black/30 rounded-lg p-6">
              <div className="text-3xl mb-3">🎁</div>
              <h4 className="text-lg font-bold text-white mb-2">Auto Airdrops</h4>
              <p className="text-white/60 text-sm mb-3">
                Automatically reward diamond hands or top traders. Filter by criteria and send tokens via Make.
              </p>
              <div className="text-xs text-green-400 font-mono">/airdrops/diamond-hands → Make → Wallet</div>
            </div>

            <div className="bg-black/30 rounded-lg p-6">
              <div className="text-3xl mb-3">📊</div>
              <h4 className="text-lg font-bold text-white mb-2">Analytics Sync</h4>
              <p className="text-white/60 text-sm mb-3">
                Sync whale hunter data to Google Sheets or Notion. Build custom dashboards with live data.
              </p>
              <div className="text-xs text-purple-400 font-mono">/leaderboard/whale-hunters → Sheets</div>
            </div>
          </div>
        </div>

        {/* Example Response */}
        <div className="bg-gradient-to-br from-qubic-gray to-gray-900 rounded-xl p-8 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Example Event Response</h3>
          <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-sm">
            <code className="text-cyan-400">{`{
  "success": true,
  "data": {
    "events": [
      {
        "event_id": "abc123...",
        "event_type": "token_purchase",
        "timestamp": "2025-12-07T10:30:00Z",
        "tick": 38850100,
        "token": {
          "name": "QMINE",
          "issuer": "LAIBMCDAEAGF..."
        },
        "trade": {
          "trader_address": "XYZABC123...",
          "amount": "5000000000",
          "price": "100000000",
          "total_value": "500000000000",
          "price_per_unit": "0.02"
        },
        "metadata": {
          "is_whale": true,
          "trader_balance": "50000000000",
          "trader_percentage": "8.50"
        }
      }
    ],
    "count": 1
  }
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
