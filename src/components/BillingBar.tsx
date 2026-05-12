import { BillingType } from '@/types/dashboard';

export function BillingBar({ item }: { item: BillingType }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-slate-600">{item.label}</span>
        <span className="font-black text-slate-900">{item.percent}%</span>
      </div>
      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
        <div
          className={`${item.color} h-full rounded-full transition-all duration-700`}
          style={{ width: `${item.percent}%` }}
        />
      </div>
    </div>
  );
}
