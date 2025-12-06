import { Shield, RefreshCw, ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { useTick } from '../contexts/TickContext';

interface HeaderProps {
  onSelectToken: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Header({ onSelectToken, onRefresh, isRefreshing }: HeaderProps) {
  const { currentTick, error } = useTick();
  const networkStatus = !error; // Connected if no error

  return (
    <header className="border-b border-white/10 bg-[#0B0F16]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-[1600px]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00F5FF] to-[#9B5CFF] flex items-center justify-center">
              <Shield className="w-7 h-7 text-[#0B0F16]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-white">Nostromo Guardian</h1>
                {currentTick > 0 && (
                  <span className="px-2 py-1 bg-[#00F5FF]/10 border border-[#00F5FF]/20 rounded text-xs text-[#00F5FF]">
                    Tick {currentTick.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-white/60 text-sm">Real-time analytics for Qubic ecosystem tokens</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onSelectToken}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all flex items-center gap-2"
            >
              <span>Select Token</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>

            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
              {networkStatus ? (
                <>
                  <Wifi className="w-4 h-4 text-[#00F5FF]" />
                  <span className="text-sm">Network Status</span>
                  <div className="w-2 h-2 rounded-full bg-[#00F5FF] animate-pulse shadow-[0_0_8px_rgba(0,245,255,0.6)]" />
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Network Status</span>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
