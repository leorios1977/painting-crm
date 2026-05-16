import { useEffect, useState } from 'react';
import { useLiveStats } from '../hooks/useLiveStats';

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current += increment;
      setDisplay(Math.round(current));
      if (step >= steps) {
        setDisplay(value);
        clearInterval(timer);
      }
    }, 1200 / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{display.toLocaleString()}</span>;
}

export function LiveTicker() {
  const { totalClients, totalLeads, isLoading } = useLiveStats();
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(
      () => setPulse(p => !p), 1500
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-950 text-white py-2.5 border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-center gap-6 flex-wrap text-sm">

          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full bg-green-400 transition-opacity duration-700 ${pulse ? 'opacity-100' : 'opacity-30'}`}
            />
            <span className="text-green-400 font-bold text-xs uppercase tracking-widest">
              Live
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span>🏢</span>
            <span className="font-bold text-yellow-400">
              {isLoading ? '—' : (
                <AnimatedNumber value={totalClients} />
              )}
            </span>
            <span className="text-gray-400">
              painting companies joined
            </span>
          </div>

          <span className="text-gray-700 hidden sm:block">|</span>

          <div className="flex items-center gap-1.5">
            <span>📋</span>
            <span className="font-bold text-yellow-400">
              {isLoading ? '—' : (
                <AnimatedNumber value={totalLeads} />
              )}
            </span>
            <span className="text-gray-400">
              leads captured
            </span>
          </div>

          <span className="text-gray-700 hidden sm:block">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-yellow-400 font-semibold">
              ⚡ Founding member spots — limited per market
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
