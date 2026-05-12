import { SEVERITY_MAP } from '@/constants/dashboard';
import { Alert } from '@/types/dashboard';

export function AlertCard({ alert }: { alert: Alert }) {
  const s = SEVERITY_MAP[alert.severity];
  return (
    <div
      className={`bg-white border border-slate-100 p-4 rounded-2xl shadow-sm ${s.border} transition-colors`}
    >
      <div className="flex gap-3">
        <div
          className={`size-10 rounded-xl ${s.bg} flex-shrink-0 flex items-center justify-center ${s.text}`}
        >
          <span className="material-symbols-outlined text-lg">
            {alert.icon}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800 truncate">
              {alert.title}
            </span>
            {alert.severity === 'critical' && (
              <span className="size-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
            {alert.description}
          </p>
          <span className="text-[10px] mt-2 font-semibold text-slate-400">
            {alert.timeAgo}
          </span>
        </div>
      </div>
    </div>
  );
}
