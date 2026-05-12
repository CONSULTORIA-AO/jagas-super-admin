import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '@/components/adminLayout';
import { api } from '@/utils/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProdutoStatus = 'ativo' | 'inativo';

interface Produto {
  produtoId: number;
  empresaDona: number;
  imagem_produto: string;
  descricao: string;
  unidadeMedida: string;
  preco: number;
  ativo: string;
  produto_time: string;
  produto_update: string;
}

interface ProdutosResponse {
  status: string;
  statusCode: number;
  registros: {
    paginas: number;
    pagina_actual: number;
    total: number;
    limite: number;
    total_apresentados: number;
  };
  mensagem: Produto[];
}

interface Filters {
  search: string;
  status: '' | ProdutoStatus;
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

const getStatus = (p: Produto): ProdutoStatus =>
  p.ativo === '1' ? 'ativo' : 'inativo';

const statusConfig: Record<
  ProdutoStatus,
  { dot: string; text: string; label: string }
> = {
  ativo: { dot: 'bg-emerald-500', text: 'text-emerald-600', label: 'Ativo' },
  inativo: { dot: 'bg-slate-400', text: 'text-slate-500', label: 'Inativo' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatPrice = (price: number) =>
  price.toLocaleString('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0,
  });

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
  produto,
  onToggleStatus,
  onDelete,
}: {
  produto: Produto;
  onToggleStatus: (id: number, ativo: '0' | '1') => void;
  onDelete: (id: number) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useState<HTMLDivElement | null>(null);
  const divRef = (node: HTMLDivElement | null) => {
    (ref as any)[0] = node;
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if ((ref as any)[0] && !(ref as any)[0].contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isAtivo = produto.ativo === '1';

  const actions = [
    {
      label: isAtivo ? 'Desactivar produto' : 'Activar produto',
      icon: isAtivo ? 'pause_circle' : 'check_circle',
      color: isAtivo ? 'text-slate-600' : 'text-emerald-600',
      onClick: () => {
        onToggleStatus(produto.produtoId, isAtivo ? '0' : '1');
        setOpen(false);
      },
    },
  ];

  return (
    <div className="relative" ref={divRef}>
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
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors text-left ${action.color}`}
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

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { toasts, show: showToast } = useToast();
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 8;

  const [filters, setFilters] = useState<Filters>({ search: '', status: '' });
  const [inputSearch, setInputSearch] = useState('');

  const handleSearch = () => {
    setFilters((f) => ({ ...f, search: inputSearch }));
    setPage(1); // Reseta para a primeira página ao buscar
  };

  // ── Fetch produtos ──────────────────────────────────────────────────────────
  const { data: response, isLoading } = useQuery<ProdutosResponse>({
    queryKey: ['produtos-admin'],
    queryFn: async () => {
      const res = await api.get('/produtos');
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const allProdutos: Produto[] = response?.mensagem ?? [];

  // Filtragem local
  const filtered = allProdutos.filter((p) => {
    // Convertemos a busca para minúsculas uma única vez
    const q = filters.search.toLowerCase();

    // Se não houver busca, retorna tudo (curto-circuito para performance)
    if (!q && !filters.status) return true;

    // Blindagem contra campos null/undefined vindo da API
    const descricao = (p.descricao || '').toLowerCase();
    const unidade = (p.unidadeMedida || '').toLowerCase();
    const preco = String(p.preco || 0); // Garante que preço nulo vire '0'

    const matchSearch =
      !q || descricao.includes(q) || unidade.includes(q) || preco.includes(q);

    const matchStatus = !filters.status || getStatus(p) === filters.status;

    return matchSearch && matchStatus;
  });

  // Paginação local
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats derivadas
  const total = allProdutos.length;
  const ativos = allProdutos.filter((p) => p.ativo === '1').length;
  const inativos = allProdutos.filter((p) => p.ativo === '0').length;
  const avgPrice =
    total > 0
      ? Math.round(allProdutos.reduce((acc, p) => acc + p.preco, 0) / total)
      : 0;

  // ── Mutations ───────────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: number; ativo: '0' | '1' }) => {
      await api.patch(`/produtos/${id}`, { ativo });
    },
    onSuccess: (_, { ativo }) => {
      queryClient.invalidateQueries({ queryKey: ['produtos-admin'] });
      showToast(ativo === '1' ? 'Produto activado.' : 'Produto desactivado.');
    },
    onError: () => showToast('Erro ao actualizar produto.', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/produtos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-admin'] });
      showToast('Produto removido com sucesso.');
    },
    onError: () => showToast('Erro ao remover produto.', 'error'),
  });

  const statCards = [
    {
      label: 'Total de Produtos',
      value: String(total),
      icon: 'inventory_2',
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
      label: 'Preço Médio',
      value: formatPrice(avgPrice),
      icon: 'payments',
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
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
              Gestão de Produtos
            </h2>
            <p className="text-slate-500 text-base mt-1">
              Visualize e administre todos os produtos registados na plataforma.
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
                className="w-full pl-12 pr-4 h-12 bg-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/30 transition-all"
                placeholder="Buscar categoria por nome ou descrição..."
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition-all flex items-center gap-2 shadow-md shadow-orange-600/10"
            >
              <Icon name="search" />
              <span>Pesquisar</span>
            </button>
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
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[
                    'Produto',
                    'Unidade',
                    'Preço',
                    'Empresa',
                    'Registo',
                    'Estado',
                    'Acções',
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${i === 6 ? 'text-right' : ''}`}
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
                      <td colSpan={7} className="px-6 py-4">
                        <div className="h-9 bg-slate-100 rounded-lg animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center text-slate-400"
                    >
                      <Icon
                        name="manage_search"
                        className="text-4xl mb-2 block mx-auto"
                      />
                      <p className="text-sm font-medium">
                        Nenhum produto encontrado
                      </p>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {paginated.map((produto, index) => {
                      const status = getStatus(produto);
                      const sc = statusConfig[status];
                      return (
                        <motion.tr
                          key={produto.produtoId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          {/* Produto */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-bold text-slate-900 max-w-[160px] truncate">
                                {produto.descricao}
                              </p>
                            </div>
                          </td>
                          {/* Unidade */}
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                              {produto.unidadeMedida}
                            </span>
                          </td>
                          {/* Preço */}
                          <td className="px-6 py-4 text-sm font-bold text-orange-600">
                            {formatPrice(produto.preco)}
                          </td>
                          {/* Empresa */}
                          <td className="px-6 py-4 text-sm text-slate-600">
                            Empresa #{produto.empresaDona}
                          </td>
                          {/* Registo */}
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {formatDate(produto.produto_time)}
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
                              produto={produto}
                              onToggleStatus={(id, ativo) =>
                                toggleMutation.mutate({ id, ativo })
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
      </div>

      <ToastContainer toasts={toasts} />
    </AdminLayout>
  );
}
