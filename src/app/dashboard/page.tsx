import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { AdminLayout } from '@/components/adminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PedidoItem {
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
  statusPedido: string;
  pedido_time: string;
  pedido_update: string;
  nomeCliente: string;
  emailCliente: string;
  fotoCliente: string | null;
  telefoneCliente: string;
  itens: PedidoItem[];
}

interface Cliente {
  clienteId: number;
  nomeCliente: string;
  emailCliente: string;
  fotoCliente: string | null;
  bloqueio: string;
  novo_cliente: string;
  criado_em: string;
  ultimo_login: string;
  telefoneCliente: string;
}

interface Empresa {
  empresaId: number;
  nomeEmpresa: string;
  emailEmpresa: string;
  logoEmpresa: string | null;
  bloqueioEmpresa: string;
  nova_empresa: string;
  responsavel: string;
  cidade: string;
  empresa_time: string;
}

interface Produto {
  produtoId: number;
  descricao: string;
  preco: number;
  ativo: string;
  unidadeMedida: string;
  empresaDona: number;
  imagem_produto: string;
  produto_time: string;
}

interface Categoria {
  categoria_id: number;
  nome_cat: string;
  descricao_cat: string;
  ativo_cat: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0,
  });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const fmtShort = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

const Icon = ({
  name,
  className = '',
}: {
  name: string;
  className?: string;
}) => (
  <span
    className={`material-symbols-outlined select-none ${className}`}
    style={{
      fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
    }}
  >
    {name}
  </span>
);

const statusMap: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  Pendente: {
    label: 'Pendente',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  Aprovado: {
    label: 'Aprovado',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  Entregue: {
    label: 'Entregue',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  Cancelado: {
    label: 'Cancelado',
    bg: 'bg-red-100',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  em_transito: {
    label: 'Em trânsito',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
};

const CHART_COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

// ─── Skeleton ────────────────────────────────────────────────────────────────

const Sk = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

const KpiCard = ({
  icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  index,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  iconBg: string;
  iconColor: string;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07, duration: 0.4 }}
    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4"
  >
    <div className="flex items-center justify-between">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        {label}
      </p>
      <span className={`${iconBg} ${iconColor} p-2.5 rounded-xl`}>
        <Icon name={icon} className="text-[20px]" />
      </span>
    </div>
    <div>
      <p className="text-3xl font-black text-slate-900 tracking-tight">
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-1 font-medium">{sub}</p>}
    </div>
  </motion.div>
);

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
  return (
    <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/50 text-sm">
      <p className="text-slate-400">
        <span className="font-bold text-slate-600">
          {from}–{to}
        </span>{' '}
        de <span className="font-bold text-slate-600">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="size-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-30 transition-all"
        >
          <Icon name="chevron_left" className="text-[18px]" />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
          (p) => (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`size-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${page === p ? 'bg-orange-500 text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-white'}`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="size-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-30 transition-all"
        >
          <Icon name="chevron_right" className="text-[18px]" />
        </button>
      </div>
    </div>
  );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-xl px-4 py-3">
      <p className="text-xs font-bold text-slate-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
          {typeof p.value === 'number' && p.value > 1000
            ? fmt(p.value)
            : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [pedidoSearch, setPedidoSearch] = useState('');
  const [pedidoStatus, setPedidoStatus] = useState('');
  const [pedidoPage, setPedidoPage] = useState(1);
  const [clientePage, setClientePage] = useState(1);
  const [activeTab, setActiveTab] = useState<
    'pedidos' | 'clientes' | 'produtos'
  >('pedidos');
  const PAGE_SIZE = 5;

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: pedidosRes, isLoading: loadPedidos } = useQuery({
    queryKey: ['dash-pedidos'],
    queryFn: async () => (await api.get('/pedidos')).data,
    staleTime: 1000 * 60,
  });

  const { data: clientesRes, isLoading: loadClientes } = useQuery({
    queryKey: ['dash-clientes'],
    queryFn: async () => (await api.get('/clientes')).data,
    staleTime: 1000 * 60,
  });

  const { data: empresasRes, isLoading: loadEmpresas } = useQuery({
    queryKey: ['dash-empresas'],
    queryFn: async () => (await api.get('/empresas')).data,
    staleTime: 1000 * 60,
  });

  const { data: produtosRes, isLoading: loadProdutos } = useQuery({
    queryKey: ['dash-produtos'],
    queryFn: async () => (await api.get('/produtos')).data,
    staleTime: 1000 * 60,
  });

  const { data: categoriasRes } = useQuery({
    queryKey: ['dash-categorias'],
    queryFn: async () => (await api.get('/categorias')).data,
    staleTime: 1000 * 60 * 10,
  });

  // ── Derived data ─────────────────────────────────────────────────────────────
  const pedidos: Pedido[] = pedidosRes?.mensagem ?? [];
  const clientes: Cliente[] = clientesRes?.mensagem ?? [];
  const empresas: Empresa[] = useMemo(() => {
    const raw: Empresa[] = empresasRes?.mensagem ?? [];
    return Array.from(new Map(raw.map((e) => [e.empresaId, e])).values());
  }, [empresasRes]);
  const produtos: Produto[] = produtosRes?.mensagem ?? [];
  const categorias: Categoria[] = categoriasRes?.mensagem ?? [];

  // KPIs
  const totalGMV = useMemo(
    () =>
      pedidos.reduce(
        (acc, p) => acc + p.itens.reduce((s, i) => s + i.preco_total, 0),
        0
      ),
    [pedidos]
  );

  const pedidosPendentes = pedidos.filter(
    (p) => p.statusPedido === 'Pendente'
  ).length;
  const clientesAtivos = clientes.filter((c) => c.bloqueio === '0').length;
  const produtosAtivos = produtos.filter((p) => p.ativo === '1').length;

  // Chart: pedidos por status
  const pedidosPorStatus = useMemo(() => {
    const map: Record<string, number> = {};
    pedidos.forEach((p) => {
      map[p.statusPedido] = (map[p.statusPedido] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [pedidos]);

  // Chart: faturamento por pedido (área)
  const faturamentoChart = useMemo(
    () =>
      pedidos.slice(0, 10).map((p) => ({
        label: fmtShort(p.pedido_time),
        valor: p.itens.reduce((s, i) => s + i.preco_total, 0),
      })),
    [pedidos]
  );

  // Chart: produtos por preço (barras top 8)
  const produtosChart = useMemo(
    () =>
      [...produtos]
        .sort((a, b) => b.preco - a.preco)
        .slice(0, 8)
        .map((p) => ({
          name:
            p.descricao.length > 12
              ? p.descricao.slice(0, 12) + '…'
              : p.descricao,
          preco: p.preco,
        })),
    [produtos]
  );

  // Filtered pedidos
  const filteredPedidos = useMemo(
    () =>
      pedidos.filter((p) => {
        const q = pedidoSearch.toLowerCase();
        const matchQ =
          !q ||
          p.nomeCliente.toLowerCase().includes(q) ||
          p.numero_cotacao.includes(q);
        const matchS = !pedidoStatus || p.statusPedido === pedidoStatus;
        return matchQ && matchS;
      }),
    [pedidos, pedidoSearch, pedidoStatus]
  );

  const pedidoTotalPages = Math.max(
    1,
    Math.ceil(filteredPedidos.length / PAGE_SIZE)
  );
  const pedidosPaged = filteredPedidos.slice(
    (pedidoPage - 1) * PAGE_SIZE,
    pedidoPage * PAGE_SIZE
  );

  const clienteTotalPages = Math.max(1, Math.ceil(clientes.length / PAGE_SIZE));
  const clientesPaged = clientes.slice(
    (clientePage - 1) * PAGE_SIZE,
    clientePage * PAGE_SIZE
  );

  const isLoading = loadPedidos || loadClientes || loadEmpresas || loadProdutos;

  const TABS = [
    {
      id: 'pedidos' as const,
      label: 'Pedidos',
      icon: 'shopping_cart',
      count: pedidos.length,
    },
    {
      id: 'clientes' as const,
      label: 'Clientes',
      icon: 'group',
      count: clientes.length,
    },
    {
      id: 'produtos' as const,
      label: 'Produtos',
      icon: 'inventory_2',
      count: produtos.length,
    },
  ];

  return (
    <AdminLayout>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <style>{`.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }`}</style>

      <div className="p-6 sm:p-8 space-y-8 bg-slate-50/40 min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Visão geral da plataforma JaGás — actualizado agora
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-100 rounded-xl px-4 py-2.5 shadow-sm">
            <Icon name="schedule" className="text-[16px] text-orange-400" />
            {new Date().toLocaleDateString('pt-AO', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </div>
        </motion.div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Sk key={i} className="h-36" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard
              index={0}
              icon="payments"
              label="Faturamento Total"
              value={fmt(totalGMV)}
              sub={`${pedidos.length} pedidos`}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <KpiCard
              index={1}
              icon="shopping_cart"
              label="Pedidos Pendentes"
              value={pedidosPendentes}
              sub="aguardando aprovação"
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
            <KpiCard
              index={2}
              icon="group"
              label="Clientes Activos"
              value={clientesAtivos}
              sub={`${clientes.length} registados`}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <KpiCard
              index={3}
              icon="storefront"
              label="Vendedores"
              value={empresas.length}
              sub={`${produtosAtivos} produtos activos`}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
            />
          </div>
        )}

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Pedidos',
              value: pedidos.length,
              icon: 'receipt_long',
              color: 'text-orange-500',
            },
            {
              label: 'Total Clientes',
              value: clientes.length,
              icon: 'person',
              color: 'text-blue-500',
            },
            {
              label: 'Total Empresas',
              value: empresas.length,
              icon: 'corporate_fare',
              color: 'text-purple-500',
            },
            {
              label: 'Categorias',
              value: categorias.length,
              icon: 'category',
              color: 'text-rose-500',
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4"
            >
              <Icon name={s.icon} className={`text-[24px] ${s.color}`} />
              <div>
                <p className="text-2xl font-black text-slate-800">{s.value}</p>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  {s.label}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Faturamento por pedido — área */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Faturamento por Pedido
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Valor total de cada cotação
                </p>
              </div>
              <span className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
                {fmt(totalGMV)} total
              </span>
            </div>
            {loadPedidos ? (
              <Sk className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={faturamentoChart}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#f97316"
                        stopOpacity={0.18}
                      />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    fill="url(#gradOrange)"
                    dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Pedidos por status — pie */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
          >
            <h3 className="font-bold text-slate-800 text-base mb-1">
              Estado dos Pedidos
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Distribuição por status
            </p>
            {loadPedidos ? (
              <Sk className="h-48" />
            ) : pedidosPorStatus.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-300 text-sm">
                Sem dados
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={pedidosPorStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {pedidosPorStatus.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-2">
                  {pedidosPorStatus.map((s, i) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{
                            background: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                        <span className="text-slate-600 font-medium">
                          {s.name}
                        </span>
                      </div>
                      <span className="font-bold text-slate-800">
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Produtos chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Produtos por Preço
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Top 8 produtos mais caros
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {produtos.length} produtos total
            </span>
          </div>
          {loadProdutos ? (
            <Sk className="h-40" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={produtosChart}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="preco"
                  fill="#f97316"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Tabs table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          {/* Tab bar */}
          <div className="flex border-b border-slate-100">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === tab.id ? 'border-orange-500 text-orange-600 bg-orange-50/40' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
              >
                <Icon name={tab.icon} className="text-[18px]" />
                {tab.label}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === tab.id ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Pedidos tab */}
          <AnimatePresence mode="wait">
            {activeTab === 'pedidos' && (
              <motion.div
                key="pedidos"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Search + filter */}
                <div className="p-4 border-b border-slate-50 flex flex-wrap gap-3">
                  <select
                    value={pedidoStatus}
                    onChange={(e) => {
                      setPedidoStatus(e.target.value);
                      setPedidoPage(1);
                    }}
                    className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-300 text-slate-600"
                  >
                    <option value="">Todos os status</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Entregue">Entregue</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                  {(pedidoSearch || pedidoStatus) && (
                    <button
                      onClick={() => {
                        setPedidoSearch('');
                        setPedidoStatus('');
                        setPedidoPage(1);
                      }}
                      className="h-10 px-4 text-sm text-slate-500 hover:text-slate-800 font-semibold transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {[
                          'Cotação',
                          'Cliente',
                          'Itens',
                          'Total',
                          'Data',
                          'Status',
                        ].map((h, i) => (
                          <th
                            key={h}
                            className={`px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest ${i === 5 ? 'text-right' : ''}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loadPedidos ? (
                        Array.from({ length: PAGE_SIZE }).map((_, i) => (
                          <tr key={i}>
                            <td colSpan={6} className="px-6 py-4">
                              <Sk className="h-8" />
                            </td>
                          </tr>
                        ))
                      ) : pedidosPaged.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-16 text-center text-slate-300 text-sm"
                          >
                            Nenhum pedido encontrado
                          </td>
                        </tr>
                      ) : (
                        pedidosPaged.map((p) => {
                          const total = p.itens.reduce(
                            (s, i) => s + i.preco_total,
                            0
                          );
                          const sc =
                            statusMap[p.statusPedido] ?? statusMap['Pendente'];
                          return (
                            <motion.tr
                              key={p.pedidoCotacaoId}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="hover:bg-slate-50/60 transition-colors"
                            >
                              <td className="px-6 py-4 text-xs font-mono font-bold text-slate-600">
                                #
                                {p.numero_cotacao.substring(0, 8).toUpperCase()}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <p className="text-sm font-bold text-slate-800 leading-tight">
                                      {p.nomeCliente}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {p.emailCliente}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500">
                                <span className="font-bold text-slate-700">
                                  {p.itens.length}
                                </span>{' '}
                                {p.itens.length === 1 ? 'item' : 'itens'}
                              </td>
                              <td className="px-6 py-4 text-sm font-black text-orange-600">
                                {fmt(total)}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500">
                                {fmtDate(p.pedido_time)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${sc.bg} ${sc.text}`}
                                >
                                  <span
                                    className={`size-1.5 rounded-full ${sc.dot}`}
                                  />
                                  {sc.label}
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={pedidoPage}
                  totalPages={pedidoTotalPages}
                  total={filteredPedidos.length}
                  pageSize={PAGE_SIZE}
                  onPage={setPedidoPage}
                />
              </motion.div>
            )}

            {/* Clientes tab */}
            {activeTab === 'clientes' && (
              <motion.div
                key="clientes"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {[
                          'Cliente',
                          'Telefone',
                          'Último Login',
                          'Estado',
                          'Registado',
                        ].map((h, i) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loadClientes
                        ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                            <tr key={i}>
                              <td colSpan={5} className="px-6 py-4">
                                <Sk className="h-8" />
                              </td>
                            </tr>
                          ))
                        : clientesPaged.map((c) => {
                            const bloqueado = c.bloqueio === '1';
                            const inativo = c.novo_cliente === '1';
                            const statusLabel = bloqueado
                              ? 'Bloqueado'
                              : inativo
                                ? 'Inactivo'
                                : 'Activo';
                            const statusCls = bloqueado
                              ? 'bg-red-100 text-red-700'
                              : inativo
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-emerald-100 text-emerald-700';
                            return (
                              <motion.tr
                                key={c.clienteId}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="hover:bg-slate-50/60 transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <p className="text-sm font-bold text-slate-800">
                                        {c.nomeCliente}
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        {c.emailCliente}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                  {c.telefoneCliente}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                  {fmtDate(c.ultimo_login)}
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${statusCls}`}
                                  >
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                  {fmtDate(c.criado_em)}
                                </td>
                              </motion.tr>
                            );
                          })}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={clientePage}
                  totalPages={clienteTotalPages}
                  total={clientes.length}
                  pageSize={PAGE_SIZE}
                  onPage={setClientePage}
                />
              </motion.div>
            )}

            {/* Produtos tab */}
            {activeTab === 'produtos' && (
              <motion.div
                key="produtos"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {[
                          'Produto',
                          'Unidade',
                          'Preço',
                          'Estado',
                          'Registado',
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loadProdutos
                        ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                            <tr key={i}>
                              <td colSpan={5} className="px-6 py-4">
                                <Sk className="h-8" />
                              </td>
                            </tr>
                          ))
                        : produtos.slice(0, PAGE_SIZE).map((p) => (
                            <motion.tr
                              key={p.produtoId}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="hover:bg-slate-50/60 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <p className="text-sm font-bold text-slate-800">
                                    {p.descricao}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold">
                                  {p.unidadeMedida}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-black text-orange-600">
                                {fmt(p.preco)}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${p.ativo === '1' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                                >
                                  {p.ativo === '1' ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500">
                                {fmtDate(p.produto_time)}
                              </td>
                            </motion.tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bottom row: top vendors + categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top vendedores */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
          >
            <h3 className="font-bold text-slate-800 text-base mb-5">
              Vendedores Registados
            </h3>
            {loadEmpresas ? (
              <Sk className="h-32" />
            ) : (
              <div className="flex flex-col gap-3">
                {empresas.slice(0, 5).map((e, i) => (
                  <div key={e.empresaId} className="flex items-center gap-3">
                    <span className="text-[11px] font-black text-slate-300 w-4">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {e.nomeEmpresa}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {e.cidade} · {e.responsavel}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${e.bloqueioEmpresa === '0' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}
                    >
                      {e.bloqueioEmpresa === '0' ? 'Activo' : 'Bloqueado'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Categorias */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 text-base">Categorias</h3>
              <span className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
                {categorias.length} total
              </span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
              {categorias.slice(0, 20).map((c) => (
                <span
                  key={c.categoria_id}
                  className="text-[11px] font-semibold px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-full hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors cursor-default"
                >
                  {c.nome_cat}
                </span>
              ))}
              {categorias.length > 20 && (
                <span className="text-[11px] font-bold px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full">
                  +{categorias.length - 20} mais
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
