import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ACTIVITY_ICON, ActivityType, MOCK_ACTIVITY } from '@/constants/perfil';

const TYPE_LABELS: Record<ActivityType, string> = {
  login: 'Login',
  aprovacao: 'Aprovação',
  edicao: 'Edição',
  bloqueio: 'Bloqueio',
};

const ALL_TYPES: ActivityType[] = ['login', 'aprovacao', 'edicao', 'bloqueio'];

export function ProfileAtividadeTab() {
  const [filter, setFilter] = useState<ActivityType | 'todos'>('todos');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/activity');
        return res.data;
      } catch {
        return MOCK_ACTIVITY;
      }
    },
  });

  const filtered = (logs ?? MOCK_ACTIVITY).filter(
    (l) => filter === 'todos' || l.type === filter
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 sm:px-8 py-5 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            Registo de Actividade
          </h3>
          <p className="text-slate-400 text-sm mt-0.5">
            Últimas interacções no sistema
          </p>
        </div>
      </div>

      {/* Type filters */}
      <div className="px-6 sm:px-8 py-4 border-b border-slate-50 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setFilter('todos')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all whitespace-nowrap flex-shrink-0
            ${filter === 'todos' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-500 border-slate-200 hover:border-orange-300 hover:text-orange-500'}`}
        >
          Todos
        </button>
        {ALL_TYPES.map((t) => {
          const meta = ACTIVITY_ICON[t];
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1
                ${filter === t ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-500 border-slate-200 hover:border-orange-300 hover:text-orange-500'}`}
            >
              <span className="material-symbols-outlined text-[13px]">
                {meta.icon}
              </span>
              {TYPE_LABELS[t]}
            </button>
          );
        })}
      </div>

      {/* Log list */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-8 py-12 text-center text-slate-400 text-sm">
            Nenhuma actividade encontrada.
          </div>
        ) : (
          filtered.map((log, i) => {
            const meta = ACTIVITY_ICON[log.type];
            return (
              <div
                key={log.id}
                className="px-6 sm:px-8 py-4 flex items-center gap-4 hover:bg-orange-50/40 transition-colors border-b border-slate-50 last:border-0 group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div
                  className={`size-10 rounded-xl ${meta.bg} flex items-center justify-center ${meta.text} flex-shrink-0 transition-all group-hover:scale-105`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {meta.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {log.title}
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {log.description}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                    {log.timestamp}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
