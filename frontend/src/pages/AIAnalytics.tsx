import { useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, XCircle, Send, Loader } from 'lucide-react';

interface AIInsights {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  risk_level: 'low' | 'medium' | 'high';
  insights: string[];
  recommendation: string;
  confidence: number;
}

interface AIAnnouncement {
  discord_message: string;
  telegram_message: string;
  twitter_post: string;
}

export default function AIAnalytics() {
  const [tradeInsights, setTradeInsights] = useState<AIInsights | null>(null);
  const [announcement, setAnnouncement] = useState<AIAnnouncement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [amount, setAmount] = useState('15000000');
  const [tokenName, setTokenName] = useState('QMINE');
  const [eventType, setEventType] = useState<'whale.buy' | 'whale.sell' | 'volume.spike'>('whale.buy');

  const analyzeTradeWithAI = async () => {
    setLoading(true);
    setError(null);
    setTradeInsights(null);

    try {
      const response = await fetch('/api/v1/ai/analyze-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trade: {
            amount: parseInt(amount),
            token_name: tokenName,
            source_address: 'QUBIC_SOURCE',
            dest_address: 'QUBIC_DEST',
          },
          context: {
            token_volume_24h: 500000000,
            token_holders: 266,
          },
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTradeInsights(data.data);
      } else {
        setError('AI analysis failed');
      }
    } catch (err) {
      setError('AI service unavailable. Check if OPENAI_API_KEY is set.');
    } finally {
      setLoading(false);
    }
  };

  const generateAnnouncement = async () => {
    setLoading(true);
    setError(null);
    setAnnouncement(null);

    try {
      const response = await fetch('/api/v1/ai/generate-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          data: {
            amount: parseInt(amount),
            token_name: tokenName,
            source_address: 'QUBICABC123',
            tick: 15234567,
            usd_value_estimate: 22500,
          },
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAnnouncement(data.data);
      } else {
        setError('Announcement generation failed');
      }
    } catch (err) {
      setError('AI service unavailable. Check if OPENAI_API_KEY is set.');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'bearish':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      default:
        return <Minus className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'high':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'from-green-500/20 to-emerald-500/10 border-green-500/40';
      case 'bearish':
        return 'from-red-500/20 to-rose-500/10 border-red-500/40';
      default:
        return 'from-yellow-500/20 to-amber-500/10 border-yellow-500/40';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold text-white">AI Analytics</h1>
          </div>
          <p className="text-xl text-gray-300">Powered by GPT-4 Turbo</p>
          <div className="mt-4 inline-block px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-full">
            <span className="text-sm text-purple-300">✨ Real-time intelligent insights for blockchain data</span>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Test AI Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount (QU)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="15000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Token Name</label>
              <input
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="QMINE"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as any)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="whale.buy">Whale Buy</option>
                <option value="whale.sell">Whale Sell</option>
                <option value="volume.spike">Volume Spike</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={analyzeTradeWithAI}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
              Analyze Trade
            </button>

            <button
              onClick={generateAnnouncement}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Generate Announcement
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300">
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Trade Insights */}
          {tradeInsights && (
            <div className={`bg-gradient-to-br ${getSentimentColor(tradeInsights.sentiment)} border rounded-2xl p-8 backdrop-blur-sm`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-500/30 rounded-xl">
                  <Sparkles className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">AI Trade Analysis</h3>
                  <p className="text-sm text-gray-300">
                    Confidence: <span className={`font-bold ${tradeInsights.confidence >= 0.7 ? 'text-green-400' : tradeInsights.confidence >= 0.5 ? 'text-yellow-400' : 'text-orange-400'}`}>
                      {Math.round(tradeInsights.confidence * 100)}%
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Sentiment & Risk */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getSentimentIcon(tradeInsights.sentiment)}
                      <span className="text-sm text-gray-300">Sentiment</span>
                    </div>
                    <p className="text-xl font-bold text-white capitalize">{tradeInsights.sentiment}</p>
                  </div>

                  <div className="bg-black/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getRiskIcon(tradeInsights.risk_level)}
                      <span className="text-sm text-gray-300">Risk Level</span>
                    </div>
                    <p className="text-xl font-bold text-white capitalize">{tradeInsights.risk_level}</p>
                  </div>
                </div>

                {/* Insights */}
                <div className="bg-black/20 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-300 uppercase mb-3">Key Insights</h4>
                  <ul className="space-y-2">
                    {tradeInsights.insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span className="text-sm text-white">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendation */}
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-4 border border-purple-500/30">
                  <h4 className="text-sm font-semibold text-purple-300 uppercase mb-2">💡 Recommendation</h4>
                  <p className="text-white font-medium">{tradeInsights.recommendation}</p>
                </div>
              </div>
            </div>
          )}

          {/* AI Generated Announcements */}
          {announcement && (
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-pink-500/30 rounded-xl">
                  <Send className="w-6 h-6 text-pink-300" />
                </div>
                <h3 className="text-2xl font-bold text-white">AI Generated Messages</h3>
              </div>

              <div className="space-y-6">
                {/* Discord */}
                <div className="bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#5865F2] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      D
                    </div>
                    <span className="font-semibold text-white">Discord</span>
                  </div>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{announcement.discord_message}</p>
                </div>

                {/* Telegram */}
                <div className="bg-[#0088cc]/10 border border-[#0088cc]/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#0088cc] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      T
                    </div>
                    <span className="font-semibold text-white">Telegram</span>
                  </div>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{announcement.telegram_message}</p>
                </div>

                {/* Twitter */}
                <div className="bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#1DA1F2] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      𝕏
                    </div>
                    <span className="font-semibold text-white">Twitter</span>
                  </div>
                  <p className="text-sm text-gray-300">{announcement.twitter_post}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Banner */}
        {!tradeInsights && !announcement && !loading && (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
            <p className="text-xl text-gray-400">Enter trade details and click a button to see AI in action</p>
            <p className="text-sm text-gray-500 mt-2">Powered by OpenAI GPT-4 Turbo</p>
          </div>
        )}
      </div>
    </div>
  );
}
