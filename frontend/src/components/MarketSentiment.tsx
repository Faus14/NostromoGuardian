import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketSentimentProps {
  buyCount: number;
  sellCount: number;
  volume24h: string;
}

export function MarketSentiment({ buyCount, sellCount, volume24h }: MarketSentimentProps) {
  const total = buyCount + sellCount;
  const buyPercentage = total > 0 ? (buyCount / total) * 100 : 50;
  const sellPercentage = total > 0 ? (sellCount / total) * 100 : 50;
  
  const sentiment = buyPercentage > 60 ? 'Bullish' : buyPercentage < 40 ? 'Bearish' : 'Neutral';
  const sentimentColor = buyPercentage > 60 ? 'text-green-400' : buyPercentage < 40 ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-bold text-white">Market Sentiment</h4>
        <span className={`text-2xl font-black ${sentimentColor}`}>
          {sentiment}
        </span>
      </div>

      {/* Buy/Sell Pressure Bar */}
      <div className="relative h-12 bg-white/5 rounded-full overflow-hidden mb-6">
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000 flex items-center justify-start px-4"
          style={{ width: `${buyPercentage}%` }}
        >
          {buyPercentage > 20 && (
            <span className="text-white font-bold text-sm flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {buyPercentage.toFixed(0)}%
            </span>
          )}
        </div>
        <div 
          className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 to-red-400 transition-all duration-1000 flex items-center justify-end px-4"
          style={{ width: `${sellPercentage}%` }}
        >
          {sellPercentage > 20 && (
            <span className="text-white font-bold text-sm flex items-center gap-1">
              {sellPercentage.toFixed(0)}%
              <TrendingDown className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-white/50 text-xs mb-1">BUY ORDERS</p>
          <p className="text-green-400 text-2xl font-bold">{buyCount}</p>
        </div>
        <div className="text-center">
          <p className="text-white/50 text-xs mb-1">24H VOLUME</p>
          <p className="text-white text-lg font-bold">{(parseInt(volume24h) / 1e9).toFixed(2)} QU</p>
        </div>
        <div className="text-center">
          <p className="text-white/50 text-xs mb-1">SELL ORDERS</p>
          <p className="text-red-400 text-2xl font-bold">{sellCount}</p>
        </div>
      </div>

      {/* Market Pressure Indicator */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50">Market Pressure:</span>
          <span className={`font-bold ${sentimentColor}`}>
            {buyPercentage > sellPercentage ? 'Buy' : 'Sell'} Dominated ({Math.abs(buyPercentage - sellPercentage).toFixed(1)}% difference)
          </span>
        </div>
      </div>
    </div>
  );
}
