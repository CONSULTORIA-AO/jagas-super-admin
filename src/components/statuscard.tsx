import { STATS } from '@/constants/aprovar';
import { ApprovalStats } from '@/types/aprovar';

export function VendorStatsCards({ stats }: { stats: ApprovalStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      {STATS(stats).map((stat, i) => (
        <div
          key={stat.label}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 flex flex-col gap-3 hover:shadow-md transition-all hover:-translate-y-0.5"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {stat.label}
            </p>
            <div
              className={`size-9 rounded-xl ${stat.iconBg} flex items-center justify-center ${stat.iconColor}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {stat.icon}
              </span>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {stat.value}
          </p>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-bold flex items-center gap-0.5 ${stat.growth >= 0 ? 'text-green-600' : 'text-red-500'}`}
            >
              <span className="material-symbols-outlined text-[13px]">
                {stat.growth >= 0 ? 'trending_up' : 'trending_down'}
              </span>
              {stat.growth >= 0 ? '+' : ''}
              {stat.growth}%
            </span>
            <span className="text-xs text-slate-400">{stat.growthLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
