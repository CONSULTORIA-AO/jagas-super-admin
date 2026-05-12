import { VendorStatus } from '@/types/aprovar';

const STATUS_MAP: Record<
  VendorStatus,
  { label: string; classes: string; dot: string }
> = {
  pendente: {
    label: 'Pendente',
    classes: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
  },
  em_revisao: {
    label: 'Em Revisão',
    classes: 'bg-orange-50 text-orange-700 border border-orange-200',
    dot: 'bg-orange-500',
  },
  aprovado: {
    label: 'Aprovado',
    classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500',
  },
  reprovado: {
    label: 'Reprovado',
    classes: 'bg-red-50 text-red-600 border border-red-200',
    dot: 'bg-red-500',
  },
};

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  const s = STATUS_MAP[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.classes}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === 'pendente' ? 'animate-pulse' : ''}`}
      />
      {s.label}
    </span>
  );
}
