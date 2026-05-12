import { WeeklyData } from '@/types/dashboard';

export function BarChart({
  data,
  mode,
}: {
  data: WeeklyData[];
  mode: 'receita' | 'volume';
}) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="h-56 flex flex-col justify-between">
      <div className="flex-1 flex items-end gap-2 sm:gap-3 relative px-2">
        {data.map((bar, i) => {
          const pct = Math.round((bar.value / max) * 100);
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              {bar.isToday && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {mode === 'receita'
                    ? `${bar.value}k AOA`
                    : `${bar.value * 10} un.`}
                </div>
              )}
              <div
                className={`w-full rounded-t-lg transition-all duration-500 cursor-pointer
                  ${
                    bar.isToday
                      ? 'bg-orange-500 shadow-lg shadow-orange-200 hover:bg-orange-600'
                      : 'bg-orange-100 hover:bg-orange-300'
                  }`}
                style={{ height: `${pct}%`, minHeight: '8px' }}
                title={bar.label}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-4 px-2">
        {data.map((bar, i) => (
          <span
            key={i}
            className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex-1 text-center
              ${bar.isToday ? 'text-orange-500' : 'text-slate-400'}`}
          >
            <span className="hidden sm:inline">{bar.label}</span>
            <span className="sm:hidden">
              {bar.isToday ? 'Hoje' : `S${i + 1}`}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
