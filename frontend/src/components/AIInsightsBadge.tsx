import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface AIInsights {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  risk_level: 'low' | 'medium' | 'high';
  insights: string[];
  recommendation: string;
  confidence: number;
}

interface AIInsightsBadgeProps {
  tradeAmount: number;
  tokenName: string;
  sourceAddress: string;
  destAddress: string;
  context?: {
    token_volume_24h?: number;
    token_holders?: number;
    trader_rank?: number;
    trader_trade_count?: number;
  };
}

export default function AIInsightsBadge({ 
  tradeAmount, 
  tokenName, 
  sourceAddress, 
  destAddress,
  context = {}
}: AIInsightsBadgeProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchAIInsights();
  }, [tradeAmount, tokenName]);

  const fetchAIInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/v1/ai/analyze-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trade: {
            amount: tradeAmount,
            token_name: tokenName,
            source_address: sourceAddress,
            dest_address: destAddress,
          },
          context,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setInsights(data.data);
      } else {
        setError('AI analysis unavailable');
      }
    } catch (err) {
      console.error('AI Insights Error:', err);
      setError('AI service offline');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg animate-pulse">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-sm text-purple-300">AI analyzing...</span>
      </div>
    );
  }

  if (error || !insights) {
    return null; // Silent fail - no AI badge shown
  }

  const getSentimentIcon = () => {
    switch (insights.sentiment) {
      case 'bullish':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'bearish':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getSentimentColor = () => {
    switch (insights.sentiment) {
      case 'bullish':
        return 'from-green-500/20 to-emerald-500/10 border-green-500/40';
      case 'bearish':
        return 'from-red-500/20 to-rose-500/10 border-red-500/40';
      default:
        return 'from-yellow-500/20 to-amber-500/10 border-yellow-500/40';
    }
  };

  const getRiskIcon = () => {
    switch (insights.risk_level) {
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'high':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const confidenceColor = insights.confidence >= 0.7 
    ? 'text-green-400' 
    : insights.confidence >= 0.5 
    ? 'text-yellow-400' 
    : 'text-orange-400';

  return (
    <div className={`bg-gradient-to-br ${getSentimentColor()} border rounded-lg p-4 backdrop-blur-sm`}>
      {/* Compact View */}
      <div 
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-white">AI Analysis</span>
              <span className={`text-xs ${confidenceColor} font-medium`}>
                {Math.round(insights.confidence * 100)}% confidence
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                {getSentimentIcon()}
                <span className="text-gray-300 capitalize">{insights.sentiment}</span>
              </span>
              <span className="flex items-center gap-1">
                {getRiskIcon()}
                <span className="text-gray-300 capitalize">{insights.risk_level} risk</span>
              </span>
            </div>
          </div>
        </div>

        <button className="text-gray-400 hover:text-white transition-colors">
          <svg 
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded View */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
          {/* Insights */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Key Insights</h4>
            <ul className="space-y-2">
              {insights.insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendation */}
          <div className="bg-black/20 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">Recommendation</h4>
            <p className="text-sm text-white">{insights.recommendation}</p>
          </div>

          {/* Powered by */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Sparkles className="w-3 h-3" />
            <span>Powered by GPT-4 Turbo</span>
          </div>
        </div>
      )}
    </div>
  );
}
