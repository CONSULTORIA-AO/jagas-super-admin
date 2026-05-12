import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '@/components/adminLayout';
import { api } from '@/utils/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type ClienteStatus = 'ativo' | 'inativo' | 'bloqueado';

interface Cliente {
  clienteId: number;
  nomeCliente: string;
  emailCliente: string;
  telefoneCliente: string;
  telefoneClienteAlt: string;
  enderecoCliente: string;
  fotoCliente: string | null;
  bloqueio: string;
  novo_cliente: string;
  criado_em: string;
  actualizado_em: string;
  ultimo_login: string;
  referenciaEMIS: string;
  observacoes: string | null;
}

interface ClientesResponse {
  status: string;
  statusCode: number;
  registros: {
    paginas: number;
    pagina_actual: number;
    total: number;
    limite: number;
    total_apresentados: number;
  };
  mensagem: Cliente[];
}

interface Filters {
  search: string;
  status: '' | ClienteStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Icon = ({
  name,
  className = '',
}: {
  name: string;
  className?: string;
}) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{
      fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
    }}
  >
    {name}
  </span>
);

const getStatus = (c: Cliente): ClienteStatus => {
  if (c.bloqueio === '1') return 'bloqueado';
  if (c.novo_cliente === '1') return 'inativo';
  return 'ativo';
};

const statusConfig: Record<
  ClienteStatus,
  { dot: string; text: string; label: string }
> = {
  ativo: { dot: 'bg-emerald-500', text: 'text-emerald-600', label: 'Ativo' },
  inativo: { dot: 'bg-slate-400', text: 'text-slate-500', label: 'Inativo' },
  bloqueado: { dot: 'bg-red-500', text: 'text-red-600', label: 'Bloqueado' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const getAvatar = (c: Cliente) =>
  c.fotoCliente
    ? `${import.meta.env.VITE_API_URL}images/clients/${c.fotoCliente}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.nomeCliente)}&background=f97316&color=fff&size=64`;

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };
  return { toasts, show };
};

const ToastContainer = ({ toasts }: { toasts: Toast[] }) => (
  <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
    <AnimatePresence>
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, x: 80, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold pointer-events-auto ${t.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}
        >
          <Icon
            name={t.type === 'success' ? 'check_circle' : 'error'}
            className="text-lg"
          />
          {t.message}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  icon,
  iconColor,
  iconBg,
  index,
}: {
  label: string;
  value: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.35 }}
    className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm"
  >
    <div className="flex justify-between items-start mb-4">
      <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">
        {label}
      </p>
      <span className={`${iconColor} ${iconBg} p-2 rounded-lg`}>
        <Icon name={icon} className="text-xl" />
      </span>
    </div>
    <p className="text-slate-900 text-3xl font-bold">{value}</p>
  </motion.div>
);

// ─── Row Action Menu ──────────────────────────────────────────────────────────

const RowMenu = ({
  cliente,
  onStatusChange,
  onDelete,
}: {
  cliente: Cliente;
  onStatusChange: (id: number, bloqueio: '0' | '1') => void;
  onDelete: (id: number) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const status = getStatus(cliente);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const actions = [
    ...(status === 'bloqueado'
      ? [
          {
            label: 'Desbloquear',
            icon: 'check_circle',
            onClick: () => {
              onStatusChange(cliente.clienteId, '0');
              setOpen(false);
            },
          },
        ]
      : [
          {
            label: 'Bloquear conta',
            icon: 'block',
            color: 'text-red-500',
            onClick: () => {
              onStatusChange(cliente.clienteId, '1');
              setOpen(false);
            },
          },
        ]),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700"
      >
        <Icon name="more_horiz" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-9 w-52 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden py-1"
          >
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors text-left ${action.color ?? 'text-slate-700'}`}
              >
                <Icon name={action.icon} className="text-base" />
                {action.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination = ({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) => {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages: (number | '...')[] = [];
  if (totalPages <= 6) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1, 2, 3);
    if (page > 4) pages.push('...');
    if (page > 3 && page < totalPages - 2) pages.push(page);
    if (page < totalPages - 3) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="px-6 py-4 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100">
      <p className="text-sm text-slate-500">
        Mostrando{' '}
        <span className="font-bold text-slate-700">
          {from} - {to}
        </span>{' '}
        de{' '}
        <span className="font-bold text-slate-700">
          {total.toLocaleString('pt-BR')}
        </span>{' '}
        resultados
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="size-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-white transition-colors text-slate-400 disabled:opacity-40"
        >
          <Icon name="chevron_left" className="text-[18px]" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dot-${i}`} className="text-slate-400 mx-1">
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p as number)}
              className={`size-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-orange-500 text-white shadow-sm' : 'border border-slate-200 hover:bg-white text-slate-600'}`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="size-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-white transition-colors text-slate-400 disabled:opacity-40"
        >
          <Icon name="chevron_right" className="text-[18px]" />
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ClientsPage() {
  const queryClient = useQueryClient();
  const { toasts, show: showToast } = useToast();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const [filters, setFilters] = useState<Filters>({ search: '', status: '' });
  const [inputSearch, setInputSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, search: inputSearch }));
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [inputSearch]);

  // ── Fetch clientes ──────────────────────────────────────────────────────────
  const { data: response, isLoading } = useQuery<ClientesResponse>({
    queryKey: ['clientes'],
    queryFn: async () => {
      const res = await api.get('/clientes');
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const allClientes: Cliente[] = response?.mensagem ?? [];

  // Filtragem local
  const filtered = allClientes.filter((c) => {
    const q = filters.search.toLowerCase();
    const matchSearch =
      !q ||
      c.nomeCliente.toLowerCase().includes(q) ||
      c.emailCliente.toLowerCase().includes(q) ||
      c.telefoneCliente.includes(q) ||
      c.enderecoCliente.toLowerCase().includes(q);
    const matchStatus = !filters.status || getStatus(c) === filters.status;
    return matchSearch && matchStatus;
  });

  // Paginação local
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats derivadas
  const total = allClientes.length;
  const ativos = allClientes.filter((c) => getStatus(c) === 'ativo').length;
  const inativos = allClientes.filter((c) => getStatus(c) === 'inativo').length;
  const bloqueados = allClientes.filter(
    (c) => getStatus(c) === 'bloqueado'
  ).length;

  // ── Mutations ───────────────────────────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      bloqueio,
    }: {
      id: number;
      bloqueio: '0' | '1';
    }) => {
      await api.patch(`/clientes/${id}`, {
        bloqueio,
      });
    },
    onSuccess: (_, { bloqueio }) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      showToast(
        bloqueio === '1' ? 'Cliente bloqueado.' : 'Cliente desbloqueado.'
      );
    },
    onError: () => showToast('Erro ao atualizar status.', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/clientes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      showToast('Cliente removido com sucesso.');
    },
    onError: () => showToast('Erro ao remover cliente.', 'error'),
  });

  const statCards = [
    {
      label: 'Total de Clientes',
      value: String(total),
      icon: 'groups',
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-500/10',
    },
    {
      label: 'Activos',
      value: String(ativos),
      icon: 'check_circle',
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
    },
    {
      label: 'Inactivos',
      value: String(inativos),
      icon: 'pause_circle',
      iconColor: 'text-slate-500',
      iconBg: 'bg-slate-500/10',
    },
    {
      label: 'Bloqueados',
      value: String(bloqueados),
      icon: 'block',
      iconColor: 'text-red-500',
      iconBg: 'bg-red-500/10',
    },
  ];

  return (
    <AdminLayout>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <style>{`.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }`}</style>

      <div className="p-6 sm:p-8">
        {/* Heading */}
        <motion.div
          className="flex flex-wrap justify-between items-end gap-4 mb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div>
            <h2 className="text-slate-900 text-2xl sm:text-3xl font-black tracking-tight">
              Gestão de Clientes
            </h2>
            <p className="text-slate-500 text-base mt-1">
              Administre os clientes registados na plataforma.
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((s, i) => (
            <StatCard
              key={s.label}
              index={i}
              label={s.label}
              value={s.value}
              icon={s.icon}
              iconColor={s.iconColor}
              iconBg={s.iconBg}
            />
          ))}
        </div>

        {/* Filters */}
        <motion.div
          className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px] relative">
              <Icon
                name="search"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl"
              />
              <input
                className="w-full pl-12 pr-4 h-12 bg-slate-100 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/30 transition-all"
                placeholder="Buscar por nome, e-mail, telefone ou endereço..."
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
              />
            </div>
            <select
              className="w-44 h-12 bg-slate-100 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/30 px-3 font-medium text-slate-700"
              value={filters.status}
              onChange={(e) => {
                setFilters((f) => ({
                  ...f,
                  status: e.target.value as Filters['status'],
                }));
                setPage(1);
              }}
            >
              <option value="">Todos os estados</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setFilters({ search: '', status: '' });
                setInputSearch('');
                setPage(1);
              }}
              className="px-5 h-12 text-slate-500 hover:text-slate-800 font-semibold text-sm transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[
                    'Cliente',
                    'Telefone',
                    'Endereço',
                    'Último Login',
                    'Estado',
                    'Acções',
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${i === 5 ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-9 bg-slate-100 rounded-lg animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-slate-400"
                    >
                      <Icon
                        name="manage_search"
                        className="text-4xl mb-2 block mx-auto"
                      />
                      <p className="text-sm font-medium">
                        Nenhum cliente encontrado
                      </p>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {paginated.map((cliente, index) => {
                      const status = getStatus(cliente);
                      const sc = statusConfig[status];
                      return (
                        <motion.tr
                          key={cliente.clienteId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          {/* Cliente */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  {cliente.nomeCliente}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {cliente.emailCliente}
                                </p>
                              </div>
                            </div>
                          </td>
                          {/* Telefone */}
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-700">
                              {cliente.telefoneCliente}
                            </p>
                            {cliente.telefoneClienteAlt && (
                              <p className="text-xs text-slate-400">
                                {cliente.telefoneClienteAlt}
                              </p>
                            )}
                          </td>
                          {/* Endereço */}
                          <td className="px-6 py-4 text-sm text-slate-600 max-w-[180px] truncate">
                            {cliente.enderecoCliente || '—'}
                          </td>
                          {/* Último Login */}
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {formatDate(cliente.ultimo_login)}
                          </td>
                          {/* Estado */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`size-2 rounded-full ${sc.dot} inline-block`}
                              />
                              <span
                                className={`text-sm font-medium ${sc.text}`}
                              >
                                {sc.label}
                              </span>
                            </div>
                          </td>
                          {/* Acções */}
                          <td className="px-6 py-4 text-right">
                            <RowMenu
                              cliente={cliente}
                              onStatusChange={(id, bloqueio) =>
                                statusMutation.mutate({ id, bloqueio })
                              }
                              onDelete={(id) => deleteMutation.mutate(id)}
                            />
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalFiltered}
            pageSize={PAGE_SIZE}
            onPage={setPage}
          />
        </motion.div>

        {/* Admin Tip */}
        <motion.div
          className="mt-8 p-6 bg-orange-500/5 rounded-xl border border-orange-500/15 flex gap-4 items-start"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Icon
            name="info"
            className="text-orange-500 text-[24px] flex-shrink-0 mt-0.5"
          />
          <div>
            <h4 className="text-orange-600 font-bold text-sm mb-1">
              Dica de Administrador
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ao bloquear um cliente, ele perderá acesso imediato à plataforma e
              não poderá efectuar novas encomendas. O desbloqueio é imediato e
              pode ser feito a qualquer momento pelo menu de acções.
            </p>
          </div>
        </motion.div>
      </div>

      <ToastContainer toasts={toasts} />
    </AdminLayout>
  );
}
