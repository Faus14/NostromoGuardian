import { Activity, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Trade {
  id: number | string;
  tradeType: 'BUY' | 'SELL';
  trader: string;
  amount: string;
  pricePerUnit: string;
  tick: number;
  timestamp?: string;
}

interface LiveActivityFeedProps {
  trades: Trade[];
  tokenName: string;
}

export function LiveActivityFeed({ trades, tokenName }: LiveActivityFeedProps) {
  const [highlightedTrades, setHighlightedTrades] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    // Highlight new trades for 3 seconds
    const newTradeIds = new Set(trades.slice(0, 3).map(t => t.id));
    setHighlightedTrades(newTradeIds);
    
    const timeout = setTimeout(() => {
      setHighlightedTrades(new Set());
    }, 3000);

    return () => clearTimeout(timeout);
  }, [trades]);

  const recentTrades = trades.slice(0, 5);

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-white">Live Activity</h4>
            <p className="text-white/50 text-sm">{tokenName} Recent Trades</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs font-semibold">LIVE</span>
        </div>
      </div>

      <div className="space-y-2">
        {recentTrades.map((trade) => {
          const isHighlighted = highlightedTrades.has(trade.id);
          const isBuy = trade.tradeType === 'BUY';
          
          return (
            <div
              key={trade.id}
              className={`relative p-4 rounded-xl border transition-all duration-300 ${
                isHighlighted
                  ? isBuy
                    ? 'bg-green-500/20 border-green-500/50 scale-105'
                    : 'bg-red-500/20 border-red-500/50 scale-105'
                  : 'bg-white/5 border-white/10 hover:bg-white/8'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    isBuy ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {isBuy ? (
                      <ArrowUpRight className="w-4 h-4 text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold text-sm ${
                        isBuy ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.tradeType}
                      </span>
                      <span className="text-white/50 text-xs">•</span>
                      <span className="text-white/70 text-xs font-mono truncate">
                        {trade.trader.slice(0, 12)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-white/50">
                        Amount: <span className="text-white font-semibold">{trade.amount}</span>
                      </span>
                      <span className="text-white/50">•</span>
                      <span className="text-white/50">
                        Price: <span className="text-cyan-400 font-mono">{parseFloat(trade.pricePerUnit).toFixed(4)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-white/40 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Tick {trade.tick.toLocaleString()}
                  </span>
                </div>
              </div>

              {isHighlighted && (
                <div className="absolute inset-0 rounded-xl pointer-events-none">
                  <div className={`absolute inset-0 rounded-xl animate-ping ${
                    isBuy ? 'bg-green-500/30' : 'bg-red-500/30'
                  }`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {recentTrades.length === 0 && (
        <div className="text-center py-8 text-white/40">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>No recent activity</p>
        </div>
      )}
    </div>
  );
}
