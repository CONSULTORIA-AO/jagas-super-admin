import { STATUS_MAP } from '@/constants/dashboard';
import { Order } from '@/types/dashboard';
import { formatCurrency } from '@/utils/format';

export function OrderRow({ order }: { order: Order }) {
  const status = STATUS_MAP[order.status];
  return (
    <tr className="hover:bg-orange-50/30 transition-colors group">
      <td className="px-4 sm:px-6 py-4">
        <span className="text-sm font-bold text-slate-800">{order.code}</span>
        <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">
          {order.date}
        </p>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2">
          <div
            className={`size-7 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-black text-orange-600 flex-shrink-0`}
          >
            {order.customer.initials}
          </div>
          <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
            {order.customer.name}
          </span>
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${status.classes}`}
        >
          {status.label}
        </span>
      </td>
      <td className="px-4 sm:px-6 py-4 text-right">
        <span className="text-sm font-black text-slate-900 whitespace-nowrap">
          {formatCurrency(order.total)}
        </span>
      </td>
    </tr>
  );
}
