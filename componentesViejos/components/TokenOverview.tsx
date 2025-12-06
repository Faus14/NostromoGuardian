import { Users, TrendingUp, Shield, Droplet, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { useEffect, useState } from 'react';
import { getBalance } from '../services/qubic';
import { useTick } from '../contexts/TickContext';

interface TokenOverviewProps {
  selectedToken: string;
}

export function TokenOverview({ selectedToken }: TokenOverviewProps) {
  const { currentTick } = useTick(); // Use shared tick from context
  const [balance, setBalance] = useState<{ id: string; balance: string; validForTick?: number } | null>(null);
  const demoIdentity = 'QXMRTKAIIGLUREPIQPCMHCKWSIPDTUYFCFNYXQLTECSUJVYEMMDELBMDOEYB';

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balRes = await getBalance(demoIdentity);
        if (balRes?.balance) {
          setBalance({
            id: balRes.balance.id,
            balance: balRes.balance.balance,
            validForTick: balRes.balance.validForTick
          });
        }
      } catch (e) {
        console.warn('balance failed', e);
      }
    };

    fetchBalance();
    // Refresh balance every 60 seconds
    const interval = setInterval(fetchBalance, 60000);
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    {
      title: 'Identity Demo',
      value: balance?.id ? balance.id.substring(0, 12) + '...' : 'Cargando...',
      change: balance?.validForTick ? `Tick: ${balance.validForTick}` : undefined,
      icon: Users,
      color: 'cyan' as const,
      tooltip: 'Example identity from Qubic RPC'
    },
    {
      title: 'Balance QU',
      value: balance?.balance ? (BigInt(balance.balance) / BigInt(1000)).toString() : '0',
      subtitle: 'En unidades de QU',
      icon: TrendingUp,
      color: 'violet' as const,
      tooltip: 'Current balance in Qubic units'
    },
    {
      title: 'Estado RPC',
      value: currentTick > 0 ? 'Conectado ✓' : 'Desconectado ✗',
      subtitle: selectedToken || 'QUBIC-ALPHA',
      icon: AlertTriangle,
      color: currentTick > 0 ? ('green' as const) : ('yellow' as const),
      tooltip: 'Connection status to Qubic RPC endpoint'
    },
    {
      title: 'Endpoint RPC',
      value: 'rpc.qubic.org',
      subtitle: 'Live Tree API v1',
      icon: Droplet,
      color: 'cyan' as const,
      tooltip: 'Active RPC endpoint (read-only)'
    },
    {
      title: 'Datos en Tiempo Real',
      value: '✓ Habilitado',
      change: 'Se actualiza cada tick (~12s)',
      icon: Activity,
      color: 'violet' as const,
      tooltip: 'Real-time data fetching'
    },
    {
      title: 'Seguridad',
      value: 'Public RPC',
      subtitle: 'Sin llaves privadas',
      icon: CheckCircle,
      color: 'green' as const,
      tooltip: 'Read-only, no sensitive data'
    },
    {
      title: 'Próximos Pasos',
      value: 'Ver Transacciones',
      subtitle: 'Y Whale Activity',
      icon: TrendingUp,
      color: 'green' as const,
      tooltip: 'Explore real blockchain data'
    }
  ];

  return (
    <section className="mb-8">
      <h2 className="text-white/80 mb-6">Token Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const { title, value, subtitle, icon, color, tooltip, change } = metric;
          return (
            <MetricCard
              key={index}
              title={title}
              value={value}
              subtitle={subtitle}
              icon={icon}
              color={color}
              tooltip={tooltip}
              change={change}
            />
          );
        })}
      </div>
    </section>
  );
}
