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
  vendedorIdpedido: number | null;
  statusPedido: PedidoStatus;
  pedido_time: string;
  pedido_update: string;
  nifCliente: string | null;
  // campos presentes na listagem mas ausentes no endpoint /pedidos/:id
  nomeCliente?: string;
  emailCliente?: string;
  fotoCliente?: string;
  telefoneCliente?: string;
  telefoneClienteAlt?: string;
  criado_em?: string;
  actualizado_em?: string;
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
  { dot: string; text: string; label: string; bg: string }
> = {
  Pendente: {
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    label: 'Pendente',
    bg: 'bg-amber-50 border-amber-200',
  },
  Concluído: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    label: 'Concluído',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  Cancelado: {
    dot: 'bg-red-500',
    text: 'text-red-700',
    label: 'Cancelado',
    bg: 'bg-red-50 border-red-200',
  },
  default: {
    dot: 'bg-slate-400',
    text: 'text-slate-500',
    label: 'Desconhecido',
    bg: 'bg-slate-50 border-slate-200',
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

const calculateOrderTotal = (itens: ItemPedido[]) =>
  itens.reduce((acc, item) => acc + item.preco_total, 0);

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

// ─── Stat Card ────────────────────────────────────────────────────────────────

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

// ─── Row Menu ─────────────────────────────────────────────────────────────────

const RowMenu = ({
  pedido,
  onDelete,
  onView,
}: {
  pedido: Pedido;
  onDelete: (id: number) => void;
  onView: (pedido: Pedido) => void;
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
            <button
              onClick={() => {
                onView(pedido);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-600"
            >
              <Icon name="visibility" className="text-base" /> Ver Detalhes
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────

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

// ─── Info Row helper ──────────────────────────────────────────────────────────

const InfoRow = ({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: string;
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
      <Icon name={icon} className="text-slate-500 text-base" />
    </span>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`text-sm text-slate-800 font-medium break-all ${mono ? 'font-mono text-xs' : ''}`}
      >
        {value || '—'}
      </p>
    </div>
  </div>
);

// ─── Order Details Modal ──────────────────────────────────────────────────────

const OrderDetailsModal = ({
  pedidoId,
  onClose,
}: {
  pedidoId: number;
  onClose: () => void;
}) => {
  const { data, isLoading, isError } = useQuery<Pedido>({
    queryKey: ['pedido-detalhe', pedidoId],
    queryFn: async () => {
      const res = await api.get(`/pedidos/${pedidoId}`);
      // suporta tanto { mensagem: {...} } quanto o objecto directo
      return res.data?.mensagem ?? res.data;
    },
    staleTime: 30_000,
  });

  if (isLoading)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
      >
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-4 shadow-2xl">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">
            A carregar detalhes...
          </p>
        </div>
      </motion.div>
    );

  if (isError || !data)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-4 shadow-2xl">
          <Icon name="error" className="text-red-500 text-4xl" />
          <p className="text-sm text-slate-600 font-medium">
            Erro ao carregar o pedido.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    );

  const pedido = data;

  const sc = statusConfig[pedido.statusPedido] || statusConfig.default;
  const total = calculateOrderTotal(pedido.itens);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 24 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Detalhes do Pedido
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-xs">
              {pedido.numero_cotacao}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${sc.text} ${sc.bg}`}
            >
              <span className={`size-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              <Icon name="close" className="text-slate-500" />
            </button>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto">
          {/* ── Identificação ── */}
          <div className="px-6 pt-6 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              Identificação
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                icon="badge"
                label="ID do Pedido"
                value={`#${pedido.pedidoCotacaoId}`}
              />
              <InfoRow
                icon="person"
                label="ID do Cliente"
                value={`#${pedido.clienteIdPedido}`}
              />
              <InfoRow
                icon="sell"
                label="ID do Vendedor"
                value={
                  pedido.vendedorIdpedido ? `#${pedido.vendedorIdpedido}` : '—'
                }
              />
              <InfoRow
                icon="fingerprint"
                label="NIF do Cliente"
                value={pedido.nifCliente ?? '—'}
              />
            </div>
          </div>

          <div className="mx-6 border-t border-slate-100" />

          {/* ── Datas ── */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              Cronologia
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                icon="add_circle"
                label="Pedido Criado em"
                value={formatDate(pedido.pedido_time)}
              />
              <InfoRow
                icon="update"
                label="Última Atualização"
                value={formatDate(pedido.pedido_update)}
              />
            </div>
          </div>

          <div className="mx-6 border-t border-slate-100" />

          {/* ── Itens ── */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Itens da Cotação
              </p>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {pedido.itens.length}{' '}
                {pedido.itens.length === 1 ? 'produto' : 'produtos'}
              </span>
            </div>

            <div className="space-y-2">
              {pedido.itens.map((item, idx) => (
                <motion.div
                  key={item.id_itens_pedido}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-colors"
                >
                  {/* Índice visual */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 text-xs font-black">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800">
                        Produto{' '}
                        <span className="font-mono text-orange-600">
                          #{item.produto_id}
                        </span>
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                        Item #{item.id_itens_pedido}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-500">
                        Qtd:{' '}
                        <span className="font-bold text-slate-700">
                          {item.quantidade}
                        </span>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500">
                        Unitário:{' '}
                        <span className="font-bold text-slate-700">
                          {formatPrice(item.preco_unitario)}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-slate-900">
                      {formatPrice(item.preco_total)}
                    </p>
                    <p className="text-[10px] text-slate-400">subtotal</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Resumo financeiro */}
            <div className="mt-4 p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs font-bold uppercase tracking-wider">
                    Total Geral
                  </p>
                  <p className="text-white text-2xl font-black mt-0.5">
                    {formatPrice(total)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-orange-100 text-xs">
                    {pedido.itens.length} produto(s)
                  </p>
                  <p className="text-orange-200 text-xs mt-0.5">
                    {pedido.itens.reduce((a, i) => a + i.quantidade, 0)}{' '}
                    unidades
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <p className="text-xs text-slate-400 font-mono truncate max-w-xs hidden sm:block">
            {pedido.numero_cotacao}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null);
  const { toasts, show: showToast } = useToast();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const [filters, setFilters] = useState<Filters>({ search: '', status: '' });
  const [inputSearch, setInputSearch] = useState('');

  const handleSearch = () => {
    setFilters((f) => ({ ...f, search: inputSearch }));
    setPage(1);
  };

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
    const nomeCliente = (p.nomeCliente || '').toLowerCase();
    const numeroCotacao = (p.numero_cotacao || '').toLowerCase();
    const matchSearch =
      !q || nomeCliente.includes(q) || numeroCotacao.includes(q);
    const matchStatus = !filters.status || p.statusPedido === filters.status;
    return matchSearch && matchStatus;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
          >
            <Icon name="search" className="text-white text-lg" />
            <span>Pesquisar</span>
          </button>
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
                    'ID',
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
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {pedido.pedidoCotacaoId}
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
                            onView={(p) =>
                              setSelectedPedidoId(p.pedidoCotacaoId)
                            }
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

      <AnimatePresence>
        {selectedPedidoId !== null && (
          <OrderDetailsModal
            pedidoId={selectedPedidoId}
            onClose={() => setSelectedPedidoId(null)}
          />
        )}
      </AnimatePresence>
      <ToastContainer toasts={toasts} />
    </AdminLayout>
  );
}
