import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '@/components/adminLayout';
import { api } from '@/utils/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type PedidoStatus = 'Pendente' | 'Concluído' | 'Cancelado' | string;

interface ItemPedido {
  id_itens_pedido: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
}

interface Pedido {
  pedidoCotacaoId: number;
  numero_cotacao: string;
  clienteIdPedido: number;
  statusPedido: PedidoStatus;
  pedido_time: string;
  pedido_update: string;
  nomeCliente: string;
  emailCliente: string;
  fotoCliente: string;
  telefoneCliente: string;
  telefoneClienteAlt: string;
  criado_em: string;
  actualizado_em: string;
  itens: ItemPedido[];
}

interface PedidosResponse {
  status: string;
  statusCode: number;
  registros: {
    paginas: number;
    pagina_actual: number;
    total: number;
    limite: number;
    total_apresentados: number;
  };
  mensagem: Pedido[];
}

interface Filters {
  search: string;
  status: string;
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

const statusConfig: Record<
  string,
  { dot: string; text: string; label: string }
> = {
  Pendente: { dot: 'bg-amber-500', text: 'text-amber-600', label: 'Pendente' },
  Concluído: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
    label: 'Concluído',
  },
  Cancelado: { dot: 'bg-red-500', text: 'text-red-600', label: 'Cancelado' },
  default: {
    dot: 'bg-slate-400',
    text: 'text-slate-500',
    label: 'Desconhecido',
  },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatPrice = (price: number) =>
  price.toLocaleString('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0,
  });

const getAvatar = (p: Pedido) =>
  p.fotoCliente && p.fotoCliente !== '0'
    ? `${import.meta.env.VITE_API_URL}images/customers/${p.fotoCliente}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nomeCliente)}&background=f97316&color=fff&size=64`;

// Calcula o total do pedido somando os itens
const calculateOrderTotal = (itens: ItemPedido[]) =>
  itens.reduce((acc, item) => acc + item.preco_total, 0);

// ─── Componentes de UI (Mantidos do Original) ───────────────────────────────

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
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 80 }}
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

const StatCard = ({ label, value, icon, iconColor, iconBg, index }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08 }}
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
    <p className="text-slate-900 text-2xl font-bold">{value}</p>
  </motion.div>
);

const RowMenu = ({
  pedido,
  onDelete,
}: {
  pedido: Pedido;
  onDelete: (id: number) => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
      >
        <Icon name="more_horiz" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute right-0 top-9 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-1"
          >
            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-600">
              <Icon name="visibility" className="text-base" /> Ver Detalhes
            </button>
            <button
              onClick={() => onDelete(pedido.pedidoCotacaoId)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 text-red-600"
            >
              <Icon name="delete" className="text-base" /> Excluir Pedido
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Pagination = ({ page, totalPages, total, pageSize, onPage }: any) => {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
      <p className="text-sm text-slate-500">
        Mostrando{' '}
        <span className="font-bold">
          {from}-{to}
        </span>{' '}
        de <span className="font-bold">{total}</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-2 border rounded-lg disabled:opacity-30"
        >
          <Icon name="chevron_left" />
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="p-2 border rounded-lg disabled:opacity-30"
        >
          <Icon name="chevron_right" />
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export function OrdersPage() {
  const queryClient = useQueryClient();
  const { toasts, show: showToast } = useToast();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const [filters, setFilters] = useState<Filters>({ search: '', status: '' });
  const [inputSearch, setInputSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(
      () => setFilters((f) => ({ ...f, search: inputSearch })),
      350
    );
    return () => clearTimeout(t);
  }, [inputSearch]);

  const { data: response, isLoading } = useQuery<PedidosResponse>({
    queryKey: ['pedidos-admin'],
    queryFn: async () => {
      const res = await api.get('/pedidos');
      return res.data;
    },
  });

  const allPedidos: Pedido[] = response?.mensagem ?? [];

  const filtered = allPedidos.filter((p) => {
    const q = filters.search.toLowerCase();
    const matchSearch =
      !q ||
      p.nomeCliente.toLowerCase().includes(q) ||
      p.numero_cotacao.toLowerCase().includes(q);
    const matchStatus = !filters.status || p.statusPedido === filters.status;
    return matchSearch && matchStatus;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const total = allPedidos.length;
  const pendentes = allPedidos.filter(
    (p) => p.statusPedido === 'Pendente'
  ).length;
  const faturamentoTotal = allPedidos.reduce(
    (acc, p) => acc + calculateOrderTotal(p.itens),
    0
  );

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await api.delete(`/pedidos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-admin'] });
      showToast('Pedido removido com sucesso.');
    },
    onError: () => showToast('Erro ao remover pedido.', 'error'),
  });

  const statCards = [
    {
      label: 'Total de Pedidos',
      value: String(total),
      icon: 'shopping_cart',
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-500/10',
    },
    {
      label: 'Pendentes',
      value: String(pendentes),
      icon: 'schedule',
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
    },
    {
      label: 'Faturamento',
      value: formatPrice(faturamentoTotal),
      icon: 'payments',
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
    },
    {
      label: 'Clientes Únicos',
      value: String(new Set(allPedidos.map((p) => p.clienteIdPedido)).size),
      icon: 'group',
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
    },
  ];

  return (
    <AdminLayout>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <div className="p-6 sm:p-8">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-slate-900 text-2xl sm:text-3xl font-black tracking-tight">
            Gestão de Pedidos
          </h2>
          <p className="text-slate-500 mt-1">
            Gerencie as cotações e ordens de serviço recebidas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((s, i) => (
            <StatCard key={s.label} index={i} {...s} />
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 p-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[240px] relative">
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="w-full pl-12 pr-4 h-12 bg-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/30"
              placeholder="Buscar por cliente ou Nº cotação..."
              value={inputSearch}
              onChange={(e) => setInputSearch(e.target.value)}
            />
          </div>
          <select
            className="w-44 h-12 bg-slate-100 rounded-lg px-3 font-medium text-slate-700 outline-none"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Todos os estados</option>
            <option value="Pendente">Pendente</option>
            <option value="Concluído">Concluído</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[
                    'Cliente',
                    'Nº Cotação',
                    'Total',
                    'Itens',
                    'Data',
                    'Estado',
                    'Acções',
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase ${i === 6 ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-6 py-4 animate-pulse">
                        <div className="h-8 bg-slate-100 rounded" />
                      </td>
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center text-slate-400"
                    >
                      <p>Nenhum pedido encontrado</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((pedido, idx) => {
                    const sc =
                      statusConfig[pedido.statusPedido] || statusConfig.default;
                    return (
                      <motion.tr
                        key={pedido.pedidoCotacaoId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-slate-50/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getAvatar(pedido)}
                              className="size-9 rounded-full object-cover bg-slate-100"
                            />
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {pedido.nomeCliente}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {pedido.emailCliente}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-500 truncate max-w-[120px]">
                          {pedido.numero_cotacao}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-orange-600">
                          {formatPrice(calculateOrderTotal(pedido.itens))}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {pedido.itens.length} prod.
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {formatDate(pedido.pedido_time)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`size-2 rounded-full ${sc.dot}`} />
                            <span className={`text-sm font-medium ${sc.text}`}>
                              {sc.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <RowMenu
                            pedido={pedido}
                            onDelete={(id) => deleteMutation.mutate(id)}
                          />
                        </td>
                      </motion.tr>
                    );
                  })
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
        </div>
      </div>
      <ToastContainer toasts={toasts} />
    </AdminLayout>
  );
}
