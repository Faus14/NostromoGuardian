import { AlertTriangle, TrendingUp, Shield } from 'lucide-react';

interface RiskAlert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  metric: string;
}

interface RiskAlertsProps {
  analytics: any;
}

export function RiskAlerts({ analytics }: RiskAlertsProps) {
  const alerts: RiskAlert[] = [];
  const metrics = analytics.metrics;

  // Critical: Whale concentration
  if (metrics.holders.top10Percentage > 70) {
    alerts.push({
      type: 'critical',
      message: `Top 10 holders control ${metrics.holders.top10Percentage.toFixed(1)}% of supply`,
      metric: 'Centralization Risk'
    });
  }

  // Warning: Low liquidity
  if (analytics.riskFactors.liquidityDepth < 30) {
    alerts.push({
      type: 'warning',
      message: 'Low liquidity may cause high slippage on large trades',
      metric: 'Liquidity Risk'
    });
  }

  // Critical: Sell pressure
  const sellRatio = metrics.activity.sellCount / (metrics.activity.buyCount + metrics.activity.sellCount);
  if (sellRatio > 0.6) {
    alerts.push({
      type: 'critical',
      message: `${(sellRatio * 100).toFixed(0)}% of recent trades are sells`,
      metric: 'Sell Pressure'
    });
  }

  // Warning: Few holders
  if (metrics.holders.total < 10) {
    alerts.push({
      type: 'warning',
      message: `Only ${metrics.holders.total} holders - very low distribution`,
      metric: 'Distribution Risk'
    });
  }

  // Info: Good growth
  if (analytics.metrics.scores.growthScore > 80) {
    alerts.push({
      type: 'info',
      message: `Strong growth momentum with score of ${analytics.metrics.scores.growthScore.toFixed(0)}`,
      metric: 'Growth Opportunity'
    });
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, idx) => (
        <div
          key={idx}
          className={`relative overflow-hidden rounded-xl p-4 border backdrop-blur-sm transition-all hover:scale-[1.02] ${
            alert.type === 'critical'
              ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
              : alert.type === 'warning'
              ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50'
              : 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              alert.type === 'critical'
                ? 'bg-red-500/20'
                : alert.type === 'warning'
                ? 'bg-yellow-500/20'
                : 'bg-blue-500/20'
            }`}>
              {alert.type === 'critical' ? (
                <AlertTriangle className={`w-5 h-5 text-red-400`} />
              ) : alert.type === 'warning' ? (
                <Shield className={`w-5 h-5 text-yellow-400`} />
              ) : (
                <TrendingUp className={`w-5 h-5 text-blue-400`} />
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-bold mb-1 ${
                alert.type === 'critical'
                  ? 'text-red-400'
                  : alert.type === 'warning'
                  ? 'text-yellow-400'
                  : 'text-blue-400'
              }`}>
                {alert.metric}
              </p>
              <p className="text-white/80 text-sm">{alert.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
