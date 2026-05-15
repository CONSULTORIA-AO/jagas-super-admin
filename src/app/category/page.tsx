import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '@/components/adminLayout';
import { api } from '@/utils/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Categoria {
  categoria_id: number;
  nome_cat: string;
  descricao_cat: string;
  ativo_cat: string;
  cat_time: string;
  cat_update: string;
}

interface CategoriasResponse {
  status: string;
  statusCode: number;
  registros: {
    paginas: number;
    pagina_actual: number;
    total: number;
    limite: number;
    total_apresentados: number;
  };
  mensagem: Categoria[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
  >
    {name}
  </span>
);

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; type: 'success' | 'error' }

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
          <Icon name={t.type === 'success' ? 'check_circle' : 'error'} className="text-lg" />
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
      <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{label}</p>
      <span className={`${iconColor} ${iconBg} p-2 rounded-lg`}>
        <Icon name={icon} className="text-xl" />
      </span>
    </div>
    <p className="text-slate-900 text-2xl font-bold">{value}</p>
  </motion.div>
);

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination = ({ page, totalPages, total, pageSize, onPage }: any) => {
  const from = Math.max(0, (page - 1) * pageSize + 1);
  const to = Math.min(page * pageSize, total);
  return (
    <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
      <p className="text-sm text-slate-500">
        Mostrando <span className="font-bold">{from}-{to}</span> de{' '}
        <span className="font-bold">{total}</span>
      </p>
      <div className="flex gap-2">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="p-2 border rounded-lg disabled:opacity-30 hover:bg-white transition-colors">
          <Icon name="chevron_left" />
        </button>
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
          className="p-2 border rounded-lg disabled:opacity-30 hover:bg-white transition-colors">
          <Icon name="chevron_right" />
        </button>
      </div>
    </div>
  );
};

// ─── Info Row ─────────────────────────────────────────────────────────────────

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
      <Icon name={icon} className="text-slate-500 text-base" />
    </span>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm text-slate-800 font-medium break-words">{value || '—'}</p>
    </div>
  </div>
);

// ─── Categoria Details Modal ──────────────────────────────────────────────────

const CategoriaDetailsModal = ({ categoriaId, onClose }: { categoriaId: number; onClose: () => void }) => {
  const { data, isLoading, isError } = useQuery<Categoria>({
    queryKey: ['categoria-detalhe', categoriaId],
    queryFn: async () => {
      const res = await api.get(`/categorias/${categoriaId}`);
      return res.data?.mensagem ?? res.data;
    },
    staleTime: 30_000,
  });

  if (isLoading) return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-4 shadow-2xl">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">A carregar categoria...</p>
      </div>
    </motion.div>
  );

  if (isError || !data) return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-4 shadow-2xl">
        <Icon name="error" className="text-red-500 text-4xl" />
        <p className="text-sm text-slate-600 font-medium">Erro ao carregar a categoria.</p>
        <button onClick={onClose} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold">Fechar</button>
      </div>
    </motion.div>
  );

  const cat = data;
  const isAtivo = cat.ativo_cat === '1';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 24 }}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Icon name="category" className="text-blue-500 text-xl" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">{cat.nome_cat}</h3>
              <p className="text-xs text-slate-400 font-mono">ID #{cat.categoria_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isAtivo ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
              <span className={`size-1.5 rounded-full ${isAtivo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {isAtivo ? 'Ativo' : 'Inativo'}
            </span>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <Icon name="close" className="text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* ── Informações ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Informações</p>
            <div className="space-y-4">
              <InfoRow icon="badge" label="ID da Categoria" value={`#${cat.categoria_id}`} />
              <InfoRow icon="label" label="Nome" value={cat.nome_cat} />
              <InfoRow icon="description" label="Descrição" value={cat.descricao_cat} />
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* ── Cronologia ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Cronologia</p>
            <div className="space-y-4">
              <InfoRow icon="add_circle" label="Criado em" value={formatDateTime(cat.cat_time)} />
              <InfoRow icon="update" label="Última Actualização" value={formatDateTime(cat.cat_update)} />
            </div>
          </div>

          {/* ── Estado visual ── */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${isAtivo ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <Icon name={isAtivo ? 'check_circle' : 'block'} className={`text-2xl ${isAtivo ? 'text-emerald-500' : 'text-slate-400'}`} />
            <div>
              <p className={`text-sm font-bold ${isAtivo ? 'text-emerald-700' : 'text-slate-600'}`}>
                Categoria {isAtivo ? 'Activa' : 'Inactiva'}
              </p>
              <p className="text-xs text-slate-500">
                {isAtivo
                  ? 'Esta categoria está visível e disponível para produtos.'
                  : 'Esta categoria está oculta e não disponível para produtos.'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <p className="text-xs text-slate-400 font-mono hidden sm:block">categoria #{cat.categoria_id}</p>
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

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { toasts, show: showToast } = useToast();
  const [page, setPage] = useState(1);
  const [inputSearch, setInputSearch] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(null);
  const [newCat, setNewCat] = useState({ nome_cat: '', descricao_cat: '' });
  const PAGE_SIZE = 10;

  const { data: response, isLoading } = useQuery<CategoriasResponse>({
    queryKey: ['categorias-admin'],
    queryFn: async () => {
      const res = await api.get('/categorias');
      return res.data;
    },
  });

  const allCategories = response?.mensagem ?? [];

  const createMutation = useMutation({
    mutationFn: async (payload: typeof newCat) => await api.post('/categorias', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-admin'] });
      showToast('Categoria cadastrada com sucesso!');
      setShowAddModal(false);
      setNewCat({ nome_cat: '', descricao_cat: '' });
    },
    onError: () => showToast('Erro ao cadastrar categoria.', 'error'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) =>
      await api.patch(`/categorias/${id}`, { ativo_cat: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-admin'] });
      showToast('Status atualizado com sucesso!');
    },
    onError: () => showToast('Erro ao atualizar status.', 'error'),
  });

  const filtered = allCategories.filter(
    (c) =>
      c.nome_cat.toLowerCase().includes(search.toLowerCase()) ||
      c.descricao_cat.toLowerCase().includes(search.toLowerCase())
  );

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = () => { setSearch(inputSearch); setPage(1); };

  const stats = [
    { label: 'Total Categorias', value: String(allCategories.length),                               icon: 'category',     iconColor: 'text-blue-500',   iconBg: 'bg-blue-500/10' },
    { label: 'Ativas',           value: String(allCategories.filter((c) => c.ativo_cat === '1').length), icon: 'check_circle', iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/10' },
    { label: 'Inativas',         value: String(allCategories.filter((c) => c.ativo_cat === '0').length), icon: 'block',        iconColor: 'text-red-500',    iconBg: 'bg-red-500/10' },
    { label: 'Novas (Mês)',      value: '12',                                                         icon: 'auto_awesome', iconColor: 'text-purple-500', iconBg: 'bg-purple-500/10' },
  ];

  return (
    <AdminLayout>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <div className="p-6 sm:p-8">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-slate-900 text-2xl sm:text-3xl font-black tracking-tight">Categorias</h2>
            <p className="text-slate-500 mt-1">Gerencie a classificação dos seus produtos.</p>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-orange-600/20 transition-all"
          >
            <Icon name="add" /> Nova Categoria
          </motion.button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((s, i) => <StatCard key={s.label} index={i} {...s} />)}
        </div>

        <div className="bg-white rounded-xl border flex space-x-4 border-slate-200 shadow-sm mb-6 p-4">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
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
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['ID', 'Nome', 'Descrição', 'Criado em', 'Status', 'Ações'].map((h, i) => (
                    <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase ${i === 5 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-6 py-4 animate-pulse">
                        <div className="h-10 bg-slate-100 rounded-lg" />
                      </td>
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                      Nenhuma categoria encontrada
                    </td>
                  </tr>
                ) : (
                  paginated.map((cat, idx) => (
                    <motion.tr
                      key={cat.categoria_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-mono text-slate-400">#{cat.categoria_id}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{cat.nome_cat}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 italic max-w-xs truncate">{cat.descricao_cat}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(cat.cat_time)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cat.ativo_cat === '1' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          <span className={`size-1.5 rounded-full ${cat.ativo_cat === '1' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {cat.ativo_cat === '1' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      {/* ── Ações: Ver Detalhes + Toggle Status ── */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Ver Detalhes */}
                          <button
                            onClick={() => setSelectedCategoriaId(cat.categoria_id)}
                            className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                            title="Ver Detalhes"
                          >
                            <Icon name="visibility" />
                          </button>
                          {/* Toggle Status */}
                          <button
                            onClick={() => toggleStatusMutation.mutate({
                              id: cat.categoria_id,
                              status: cat.ativo_cat === '1' ? '0' : '1',
                            })}
                            className={`p-2 rounded-lg transition-colors ${cat.ativo_cat === '1' ? 'hover:bg-red-50 text-red-500' : 'hover:bg-emerald-50 text-emerald-600'}`}
                            title={cat.ativo_cat === '1' ? 'Desativar' : 'Ativar'}
                          >
                            <Icon name={cat.ativo_cat === '1' ? 'block' : 'check_circle'} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={totalFiltered} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      </div>

      {/* ── Modal Cadastro ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-900">Nova Categoria</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <Icon name="close" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Categoria</label>
                  <input
                    className="w-full px-4 py-3 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
                    placeholder="Ex: Eletrônicos"
                    value={newCat.nome_cat}
                    onChange={(e) => setNewCat({ ...newCat, nome_cat: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                  <textarea
                    className="w-full px-4 py-3 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 h-24 resize-none"
                    placeholder="Breve descrição..."
                    value={newCat.descricao_cat}
                    onChange={(e) => setNewCat({ ...newCat, descricao_cat: e.target.value })}
                  />
                </div>
                <button
                  disabled={createMutation.isPending || !newCat.nome_cat}
                  onClick={() => createMutation.mutate(newCat)}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-600/20 transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Salvando...' : 'Cadastrar Categoria'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal Detalhes ── */}
      <AnimatePresence>
        {selectedCategoriaId !== null && (
          <CategoriaDetailsModal
            categoriaId={selectedCategoriaId}
            onClose={() => setSelectedCategoriaId(null)}
          />
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} />
    </AdminLayout>
  );
}