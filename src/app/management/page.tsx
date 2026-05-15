import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminLayout } from '@/components/adminLayout';
import { api } from '@/utils/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type EmpresaStatus = 'ativo' | 'inativo' | 'bloqueado';

interface Empresa {
  empresaId: number;
  nomeEmpresa: string;
  nif: string;
  enderecoEmpresa: string;
  cidade: string;
  provincia: string;
  emailEmpresa: string;
  logoEmpresa: string | null;
  telefoneEmpresa: string;
  telefoneEmpresaAlt: string;
  responsavel: string;
  entidadePagamentoEMIS: string;
  bloqueioEmpresa: string;
  nova_empresa: string;
  empresa_time: string;
  empresa_update: string;
  id_confEmpresa: number;
  empresaIdConf: number;
  codigo_confirmacao: string;
  // campos extras retornados pelo endpoint /empresas/:id
  tentativas_login?: number;
  codigo_seguranca?: string;
  tempo_de_vida_codigo_seguranca?: string;
  servico_mensagens?: string;
  servico_email?: string;
  servico_principal?: string;
  endereco_mac_unico_empresa?: string | null;
}

interface EmpresasResponse {
  status: string;
  statusCode: number;
  formato: string;
  registros: {
    paginas: number;
    pagina_actual: number;
    total: number;
    limite: number;
    total_apresentados: number;
  };
  mensagem: Empresa[];
}

interface Filters {
  search: string;
  status: '' | EmpresaStatus;
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const NewEmpresaSchema = z.object({
  nomeEmpresa: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  nif: z.string().min(9, 'NIF inválido'),
  emailEmpresa: z.string().email('E-mail inválido'),
  telefoneEmpresa: z.string().min(9, 'Telefone inválido'),
  responsavel: z.string().min(3, 'Nome do responsável obrigatório'),
  enderecoEmpresa: z.string().min(3, 'Endereço obrigatório'),
});

type NewEmpresaForm = z.infer<typeof NewEmpresaSchema>;

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

const getStatus = (empresa: Empresa): EmpresaStatus => {
  if (empresa.bloqueioEmpresa === '1') return 'bloqueado';
  if (empresa.nova_empresa === '1') return 'inativo';
  return 'ativo';
};

const statusConfig: Record<
  EmpresaStatus,
  { dot: string; text: string; label: string; bg: string }
> = {
  ativo: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    label: 'Ativo',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  inativo: {
    dot: 'bg-slate-400',
    text: 'text-slate-600',
    label: 'Inativo',
    bg: 'bg-slate-50 border-slate-200',
  },
  bloqueado: {
    dot: 'bg-red-500',
    text: 'text-red-700',
    label: 'Bloqueado',
    bg: 'bg-red-50 border-red-200',
  },
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const boolLabel = (val?: string) => {
  if (val === 'true' || val === '1')
    return {
      label: 'Activo',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    };
  if (val === 'false' || val === '0')
    return {
      label: 'Inactivo',
      color: 'text-slate-600 bg-slate-50 border-slate-200',
    };
  return { label: '—', color: 'text-slate-400 bg-slate-50 border-slate-100' };
};

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

// ─── Info Row ─────────────────────────────────────────────────────────────────

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

// ─── Empresa Details Modal ────────────────────────────────────────────────────

const EmpresaDetailsModal = ({
  empresaId,
  onClose,
}: {
  empresaId: number;
  onClose: () => void;
}) => {
  const { data, isLoading, isError } = useQuery<Empresa>({
    queryKey: ['empresa-detalhe', empresaId],
    queryFn: async () => {
      const res = await api.get(`/empresas/${empresaId}`);
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
            A carregar dados da empresa...
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
            Erro ao carregar a empresa.
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

  const empresa = data;
  const status = getStatus(empresa);
  const sc = statusConfig[status];
  const servicoMsg = boolLabel(empresa.servico_mensagens);
  const servicoEmail = boolLabel(empresa.servico_email);
  const servicoPrinc = boolLabel(empresa.servico_principal);

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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Icon name="corporate_fare" className="text-orange-500 text-xl" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {empresa.nomeEmpresa}
              </h3>
              <p className="text-xs text-slate-400 font-mono">{empresa.nif}</p>
            </div>
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
                label="ID da Empresa"
                value={`#${empresa.empresaId}`}
              />
              <InfoRow
                icon="fingerprint"
                label="NIF"
                value={empresa.nif}
                mono
              />
              <InfoRow
                icon="person"
                label="Responsável"
                value={empresa.responsavel}
              />
              <InfoRow icon="mail" label="Email" value={empresa.emailEmpresa} />
              <InfoRow
                icon="call"
                label="Telefone Principal"
                value={empresa.telefoneEmpresa}
              />
              <InfoRow
                icon="phone_in_talk"
                label="Telefone Alternativo"
                value={empresa.telefoneEmpresaAlt || '—'}
              />
            </div>
          </div>

          <div className="mx-6 border-t border-slate-100" />

          {/* ── Localização ── */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              Localização
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                icon="location_on"
                label="Endereço"
                value={empresa.enderecoEmpresa}
              />
              <InfoRow
                icon="location_city"
                label="Cidade"
                value={empresa.cidade}
              />
              <InfoRow icon="map" label="Província" value={empresa.provincia} />
            </div>
          </div>

          <div className="mx-6 border-t border-slate-100" />

          {/* ── Serviços ── */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              Serviços Activados
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Mensagens', data: servicoMsg, icon: 'chat' },
                { label: 'Email', data: servicoEmail, icon: 'mail' },
                { label: 'Principal', data: servicoPrinc, icon: 'star' },
              ].map(({ label, data: s, icon }) => (
                <div
                  key={label}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center ${s.color}`}
                >
                  <Icon name={icon} className="text-xl" />
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {label}
                  </p>
                  <p className="text-xs font-bold">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-6 border-t border-slate-100" />

          {/* ── Segurança ── */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              Segurança & Acesso
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                icon="login"
                label="Tentativas de Login"
                value={
                  empresa.tentativas_login != null
                    ? String(empresa.tentativas_login)
                    : '—'
                }
              />
              <InfoRow
                icon="payments"
                label="Entidade EMIS"
                value={empresa.entidadePagamentoEMIS || '—'}
              />
            </div>
          </div>

          <div className="mx-6 border-t border-slate-100" />

          {/* ── Cronologia ── */}
          <div className="px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              Cronologia
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                icon="add_circle"
                label="Registado em"
                value={formatDateTime(empresa.empresa_time)}
              />
              <InfoRow
                icon="update"
                label="Última Actualização"
                value={formatDateTime(empresa.empresa_update)}
              />
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <p className="text-xs text-slate-400 font-mono hidden sm:block">
            ID #{empresa.empresaId} · {empresa.nif}
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

// ─── Row Action Menu ──────────────────────────────────────────────────────────

const RowMenu = ({
  empresa,
  onStatusChange,
  onDelete,
  onView,
}: {
  empresa: Empresa;
  onStatusChange: (id: number, bloqueio: '0' | '1') => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const status = getStatus(empresa);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const actions = [
    {
      label: 'Ver Detalhes',
      icon: 'visibility',
      color: 'text-slate-700',
      onClick: () => {
        onView(empresa.empresaId);
        setOpen(false);
      },
    },
    ...(status !== 'ativo'
      ? [
          {
            label: 'Desbloquear',
            icon: 'check_circle',
            color: 'text-emerald-600',
            onClick: () => {
              onStatusChange(empresa.empresaId, '0');
              setOpen(false);
            },
          },
        ]
      : []),
    ...(status !== 'bloqueado'
      ? [
          {
            label: 'Bloquear conta',
            icon: 'block',
            color: 'text-red-500',
            onClick: () => {
              onStatusChange(empresa.empresaId, '1');
              setOpen(false);
            },
          },
        ]
      : []),
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

// ─── New Empresa Modal ────────────────────────────────────────────────────────

const NewEmpresaModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewEmpresaForm>({
    resolver: zodResolver(NewEmpresaSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: NewEmpresaForm) => {
      const res = await api.post('/empresas', data);
      return res.data;
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const inputCls =
    'w-full h-11 bg-slate-100 border-none rounded-lg text-sm outline-none px-4 focus:ring-2 focus:ring-orange-500/30 transition-all';
  const labelCls =
    'block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5';

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/40 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 p-8"
        initial={{ scale: 0.85, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
              <Icon name="corporate_fare" className="text-xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Nova Empresa</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all"
          >
            <Icon name="close" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="space-y-4"
        >
          <div>
            <label className={labelCls}>Nome da Empresa</label>
            <input
              {...register('nomeEmpresa')}
              className={inputCls}
              placeholder="Ex: Distribuidora de Gás Silva LDA"
            />
            {errors.nomeEmpresa && (
              <p className="text-red-500 text-xs mt-1">
                {errors.nomeEmpresa.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>NIF</label>
              <input
                {...register('nif')}
                className={inputCls}
                placeholder="000000000"
              />
              {errors.nif && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.nif.message}
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>Telefone</label>
              <input
                {...register('telefoneEmpresa')}
                className={inputCls}
                placeholder="+244 9XX XXX XXX"
              />
              {errors.telefoneEmpresa && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.telefoneEmpresa.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className={labelCls}>E-mail</label>
            <input
              {...register('emailEmpresa')}
              type="email"
              className={inputCls}
              placeholder="empresa@exemplo.com"
            />
            {errors.emailEmpresa && (
              <p className="text-red-500 text-xs mt-1">
                {errors.emailEmpresa.message}
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>Responsável</label>
            <input
              {...register('responsavel')}
              className={inputCls}
              placeholder="Nome do responsável"
            />
            {errors.responsavel && (
              <p className="text-red-500 text-xs mt-1">
                {errors.responsavel.message}
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>Endereço</label>
            <input
              {...register('enderecoEmpresa')}
              className={inputCls}
              placeholder="Rua, bairro, referência..."
            />
            {errors.enderecoEmpresa && (
              <p className="text-red-500 text-xs mt-1">
                {errors.enderecoEmpresa.message}
              </p>
            )}
          </div>

          {mutation.isError && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <Icon name="error" className="text-base" /> Erro ao criar empresa.
              Tenta novamente.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              {mutation.isPending && (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.8,
                    ease: 'linear',
                  }}
                >
                  <Icon name="progress_activity" className="text-base" />
                </motion.span>
              )}
              Criar Empresa
            </motion.button>
          </div>
        </form>
      </motion.div>
    </>
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

export default function SellerPage() {
  const queryClient = useQueryClient();
  const { toasts, show: showToast } = useToast();
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<number | null>(
    null
  );
  const PAGE_SIZE = 8;

  const [filters, setFilters] = useState<Filters>({ search: '', status: '' });
  const [inputSearch, setInputSearch] = useState('');

  const { data: response, isLoading } = useQuery<EmpresasResponse>({
    queryKey: ['empresas'],
    queryFn: async () => {
      const res = await api.get('/empresas');
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const allEmpresas: Empresa[] = Array.from(
    new Map((response?.mensagem ?? []).map((e) => [e.empresaId, e])).values()
  );

  const filtered = allEmpresas.filter((e) => {
    const q = filters.search.toLowerCase();
    const matchSearch =
      !q ||
      e.nomeEmpresa.toLowerCase().includes(q) ||
      e.nif.includes(q) ||
      e.emailEmpresa.toLowerCase().includes(q) ||
      e.responsavel.toLowerCase().includes(q);
    const matchStatus = !filters.status || getStatus(e) === filters.status;
    return matchSearch && matchStatus;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const total = allEmpresas.length;
  const ativos = allEmpresas.filter((e) => getStatus(e) === 'ativo').length;
  const inativos = allEmpresas.filter((e) => getStatus(e) === 'inativo').length;
  const bloqueados = allEmpresas.filter(
    (e) => getStatus(e) === 'bloqueado'
  ).length;

  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      bloqueio,
    }: {
      id: number;
      bloqueio: '0' | '1';
    }) => {
      await api.patch(`/empresas/${id}`, { bloqueioEmpresa: bloqueio });
    },
    onSuccess: (_, { bloqueio }) => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      showToast(
        bloqueio === '1' ? 'Empresa bloqueada.' : 'Empresa desbloqueada.'
      );
    },
    onError: () => showToast('Erro ao atualizar status.', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/empresas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      showToast('Empresa removida com sucesso.');
    },
    onError: () => showToast('Erro ao remover empresa.', 'error'),
  });

  const handleSearch = () => {
    setFilters((f) => ({ ...f, search: inputSearch }));
    setPage(1);
  };

  const statCards = [
    {
      label: 'Total de Empresas',
      value: String(total),
      icon: 'corporate_fare',
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-500/10',
    },
    {
      label: 'Activas',
      value: String(ativos),
      icon: 'check_circle',
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
    },
    {
      label: 'Inactivas',
      value: String(inativos),
      icon: 'pause_circle',
      iconColor: 'text-slate-500',
      iconBg: 'bg-slate-500/10',
    },
    {
      label: 'Bloqueadas',
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
        <motion.div
          className="flex flex-wrap justify-between items-end gap-4 mb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div>
            <h2 className="text-slate-900 text-2xl sm:text-3xl font-black tracking-tight">
              Gestão de Vendedores
            </h2>
            <p className="text-slate-500 text-base mt-1">
              Administre as empresas vendedoras registadas na plataforma.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((s, i) => (
            <StatCard key={s.label} index={i} {...s} />
          ))}
        </div>

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
                placeholder="Buscar por nome, NIF, email ou responsável..."
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
                    'Empresa',
                    'NIF',
                    'Responsável',
                    'Contacto',
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
                        Nenhuma empresa encontrada
                      </p>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {paginated.map((empresa, index) => {
                      const status = getStatus(empresa);
                      const sc = statusConfig[status];
                      return (
                        <motion.tr
                          key={empresa.id_confEmpresa}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-900">
                              {empresa.nomeEmpresa}
                            </p>
                            <p className="text-xs text-slate-500">
                              {empresa.emailEmpresa}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                            {empresa.nif}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {empresa.responsavel}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {empresa.telefoneEmpresa}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {formatDate(empresa.empresa_time)}
                          </td>
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
                          <td className="px-6 py-4 text-right">
                            <RowMenu
                              empresa={empresa}
                              onStatusChange={(id, bloqueio) =>
                                statusMutation.mutate({ id, bloqueio })
                              }
                              onDelete={(id) => deleteMutation.mutate(id)}
                              onView={(id) => setSelectedEmpresaId(id)}
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

      <AnimatePresence>
        {showModal && (
          <NewEmpresaModal
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['empresas'] });
              showToast('Empresa criada com sucesso!');
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEmpresaId !== null && (
          <EmpresaDetailsModal
            empresaId={selectedEmpresaId}
            onClose={() => setSelectedEmpresaId(null)}
          />
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} />
    </AdminLayout>
  );
}
