import { DOC_ICONS, INFO_FIELDS } from '@/constants/aprovar';
import { Vendor } from '@/types/aprovar';
import { VendorStatusBadge } from './statusBadget';

function docIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return DOC_ICONS[ext] ?? 'description';
}

export function VendorDetailPanel({ vendor }: { vendor: Vendor }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
      {/* Accent stripe */}
      <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 rounded-l-2xl" />

      <div className="p-5 sm:p-7 pl-6 sm:pl-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="size-14 sm:size-16 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-lg shadow-orange-200 flex-shrink-0">
              {vendor.initials}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {vendor.razaoSocial}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[14px] text-orange-500">
                  location_on
                </span>
                <span className="text-sm text-slate-500">
                  {vendor.endereco}
                </span>
              </div>
              <div className="mt-2">
                <VendorStatusBadge status={vendor.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 py-5 border-y border-slate-100">
          {INFO_FIELDS(vendor).map((f) => (
            <div key={f.label}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {f.label}
              </p>
              <p className="text-sm font-semibold text-slate-800">{f.value}</p>
            </div>
          ))}
        </div>

        {/* Documents */}
        <div className="mt-6">
          <h4 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-orange-500">
              description
            </span>
            Documentos Anexados
            <span className="ml-auto text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {vendor.documents.length}
            </span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {vendor.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="group border-2 border-slate-100 rounded-xl p-3 hover:border-orange-300 hover:shadow-md transition-all bg-slate-50 hover:bg-orange-50/50"
              >
                <div className="aspect-video rounded-lg bg-white border border-dashed border-slate-200 flex items-center justify-center mb-2 group-hover:border-orange-200 transition-colors">
                  <span className="material-symbols-outlined text-4xl text-slate-300 group-hover:text-orange-400 transition-colors">
                    {docIcon(doc.name)}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-700 truncate group-hover:text-orange-700 transition-colors">
                  {doc.name}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {doc.size} · Enviado {doc.sentAt}
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
