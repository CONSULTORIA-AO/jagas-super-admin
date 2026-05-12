import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Vendor, VendorStatus } from '@/types/aprovar';
import { useVendorApprovalStore } from '@/hooks/aprovar';
import { VendorStatusBadge } from './statusBadget';

const SearchSchema = z.object({ q: z.string() });

const STATUS_FILTERS: { label: string; value: VendorStatus | 'todos' }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Pendentes', value: 'pendente' },
  { label: 'Em Revisão', value: 'em_revisao' },
  { label: 'Aprovados', value: 'aprovado' },
  { label: 'Reprovados', value: 'reprovado' },
];

export function VendorTable() {
  const {
    vendors,
    selectedId,
    search,
    statusFilter,
    page,
    perPage,
    selectVendor,
    setSearch,
    setStatusFilter,
    setPage,
  } = useVendorApprovalStore();

  const { register, watch } = useForm({
    resolver: zodResolver(SearchSchema),
    defaultValues: { q: '' },
  });
  const qVal = watch('q');
  // sync to store on change
  if (qVal !== search) setSearch(qVal);

  // Filter
  const filtered = vendors.filter((v) => {
    const matchStatus = statusFilter === 'todos' || v.status === statusFilter;
    const matchSearch =
      !search ||
      v.razaoSocial.toLowerCase().includes(search.toLowerCase()) ||
      v.nif.includes(search);
    return matchStatus && matchSearch;
  });

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const getActionLabel = (v: Vendor) => {
    if (v.status === 'pendente') return 'Analisar';
    if (v.status === 'em_revisao') return 'Retomar';
    if (v.status === 'aprovado') return 'Ver';
    return 'Detalhes';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            {...register('q')}
            placeholder="Buscar por NIF ou nome da empresa..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border-2 border-slate-200 text-sm text-slate-800 placeholder-slate-300 bg-slate-50 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all whitespace-nowrap
                ${
                  statusFilter === f.value
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-100'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-orange-300 hover:text-orange-600'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[640px]">
          <thead className="bg-slate-50/80">
            <tr>
              {[
                'Empresa / Vendedor',
                'NIF',
                'Localização',
                'Data Envio',
                'Status',
                'Acção',
              ].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 sm:px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest ${i === 5 ? 'text-right' : ''}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-slate-400 text-sm"
                >
                  Nenhum vendedor encontrado.
                </td>
              </tr>
            ) : (
              paged.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => selectVendor(v.id)}
                  className={`cursor-pointer transition-all
                    ${
                      selectedId === v.id
                        ? 'bg-orange-50/60 border-l-4 border-l-orange-500'
                        : 'hover:bg-slate-50/60 border-l-4 border-l-transparent'
                    }`}
                >
                  <td className="px-4 sm:px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-orange-100 text-orange-600 font-black text-sm flex items-center justify-center flex-shrink-0">
                        {v.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate max-w-[160px]">
                          {v.razaoSocial}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {v.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-5 py-4 text-sm text-slate-600 font-mono">
                    {v.nif}
                  </td>
                  <td className="px-4 sm:px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                    {v.provincia} – {v.municipio}
                  </td>
                  <td className="px-4 sm:px-5 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {v.dataEnvio}
                  </td>
                  <td className="px-4 sm:px-5 py-4">
                    <VendorStatusBadge status={v.status} />
                  </td>
                  <td className="px-4 sm:px-5 py-4 text-right">
                    <button
                      className="text-orange-500 text-sm font-bold hover:text-orange-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectVendor(v.id);
                      }}
                    >
                      {getActionLabel(v)}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
        <p className="text-xs text-slate-400 font-medium">
          Mostrando {Math.min((page - 1) * perPage + 1, filtered.length)}–
          {Math.min(page * perPage, filtered.length)} de {filtered.length}{' '}
          solicitações
        </p>
        <div className="flex gap-1.5">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="p-2 rounded-lg border-2 border-slate-200 hover:border-orange-300 text-slate-500 hover:text-orange-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_left
            </span>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg border-2 text-xs font-bold transition-all
                ${
                  p === page
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-100'
                    : 'border-slate-200 text-slate-500 hover:border-orange-300 hover:text-orange-500'
                }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="p-2 rounded-lg border-2 border-slate-200 hover:border-orange-300 text-slate-500 hover:text-orange-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
