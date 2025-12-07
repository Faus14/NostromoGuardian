import { Activity } from 'lucide-react';
import { useMemo } from 'react';

const hours = ['00h', '04h', '08h', '12h', '16h', '20h'];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Generate mock activity data fallback
const generateMockData = () => {
  const data: number[][] = [];
  for (let day = 0; day < days.length; day++) {
    const dayData: number[] = [];
    for (let hour = 0; hour < hours.length; hour++) {
      const isWeekday = day < 5;
      const isBusinessHours = hour >= 2 && hour <= 4;
      const baseActivity = isWeekday && isBusinessHours ? 60 : 20;
      const randomness = Math.random() * 40;
      dayData.push(Math.floor(baseActivity + randomness));
    }
    data.push(dayData);
  }
  return data;
};

const getColorIntensity = (value: number) => {
  if (value < 25) return 'bg-[#00F5FF]/10';
  if (value < 50) return 'bg-[#00F5FF]/30';
  if (value < 75) return 'bg-[#00F5FF]/60';
  return 'bg-[#00F5FF]/90';
};

export function TokenFlowHeatmap() {
  // Mock data only - no RPC calls (backend aggregation not available)
  const heatmapData = useMemo(() => generateMockData(), []);

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white mb-1 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#9B5CFF]" />
            Token Flow Heatmap
          </h3>
          <p className="text-white/60 text-sm">
            📊 Mock data (backend aggregation required)
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/60">Low</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded bg-[#00F5FF]/10" />
            <div className="w-4 h-4 rounded bg-[#00F5FF]/30" />
            <div className="w-4 h-4 rounded bg-[#00F5FF]/60" />
            <div className="w-4 h-4 rounded bg-[#00F5FF]/90" />
          </div>
          <span className="text-white/60">High</span>
        </div>
      </div>

      <div>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex mb-2">
              <div className="w-12" />
              {hours.map((hour) => (
                <div key={hour} className="flex-1 text-center text-white/60 text-sm min-w-[60px]">
                  {hour}
                </div>
              ))}
            </div>

            {days.map((day, dayIndex) => (
              <div key={day} className="flex mb-2">
                <div className="w-12 text-white/60 text-sm flex items-center">
                  {day}
                </div>
                {heatmapData[dayIndex]?.map((value, hourIndex) => (
                  <div
                    key={`${dayIndex}-${hourIndex}`}
                    className="flex-1 min-w-[60px] px-1"
                  >
                    <div
                      className={`h-10 rounded ${getColorIntensity(value)} hover:ring-2 hover:ring-[#00F5FF] transition-all cursor-pointer flex items-center justify-center group relative`}
                    >
                      <span className="text-white/0 group-hover:text-white/80 text-xs transition-all">
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
