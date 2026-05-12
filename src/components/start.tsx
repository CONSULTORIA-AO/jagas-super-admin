export function StatCard({
  icon,
  iconBg,
  iconText,
  label,
  value,
  growth,
  urgent,
}: {
  icon: string;
  iconBg: string;
  iconText: string;
  label: string;
  value: string | number;
  growth?: number;
  urgent?: boolean;
}) {
  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex justify-between items-center">
        <div
          className={`size-10 rounded-xl ${iconBg} flex items-center justify-center ${iconText}`}
        >
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        {urgent ? (
          <span className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">
              priority_high
            </span>{' '}
            Urgente
          </span>
        ) : growth !== undefined ? (
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${growth >= 0 ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}
          >
            <span className="material-symbols-outlined text-[12px]">
              {growth >= 0 ? 'trending_up' : 'trending_down'}
            </span>
            {growth >= 0 ? '+' : ''}
            {growth}%
          </span>
        ) : null}
      </div>
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {label}
        </span>
        <div className="text-2xl font-black text-slate-900 mt-1">{value}</div>
      </div>
    </div>
  );
}
