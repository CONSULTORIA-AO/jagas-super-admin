import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AdminLayout } from '@/components/adminLayout';
import { useAdminAuthStore } from '@/hooks/adminStore';
import { api } from '@/utils/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminProfile {
  id_usuarios: number;
  nome_usuario: string;
  email_: string;
  tipo_usuario: number;
  cadastrado_em: string;
  actualizado_em_usuario: string;
  acesso: string;
  tipo_nome_usuario: string;
}

type TabId = 'dados' | 'seguranca';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const DadosSchema = z.object({
  nome_usuario: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email_: z.string().email('E-mail inválido'),
});

const SenhaSchema = z
  .object({
    senhaActual: z.string().min(1, 'Senha actual obrigatória'),
    novaSenha: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmarSenha: z.string(),
  })
  .refine((d) => d.novaSenha === d.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  });

type DadosForm = z.infer<typeof DadosSchema>;
type SenhaForm = z.infer<typeof SenhaSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const getStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Fraca', color: 'bg-red-400' };
  if (score <= 2) return { score, label: 'Razoável', color: 'bg-orange-400' };
  if (score <= 3) return { score, label: 'Boa', color: 'bg-yellow-400' };
  return { score, label: 'Forte', color: 'bg-green-500' };
};

const inputCls = (err?: boolean) =>
  `w-full h-11 px-4 rounded-xl border-2 text-sm text-slate-800 placeholder-slate-300 bg-slate-50 transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-100 ${err ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-orange-400'}`;

// ─── Shared UI ────────────────────────────────────────────────────────────────

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

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
      {label}
    </label>
    {children}
    {error && (
      <p className="text-xs text-red-500 flex items-center gap-1">
        <Icon name="error" className="text-[13px]" />
        {error}
      </p>
    )}
  </div>
);

const Sk = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
);

// ─── Tab: Dados ───────────────────────────────────────────────────────────────

function TabDados({ profile }: { profile: AdminProfile }) {
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<DadosForm>({
    resolver: zodResolver(DadosSchema),
    defaultValues: {
      nome_usuario: profile.nome_usuario,
      email_: profile.email_,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: DadosForm) => {
      await api.patch(
        `https://jagas.devgrc.com/v1/administradores/${profile.id_usuarios}`,
        data
      );
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 sm:px-8 py-5 border-b border-slate-50">
        <h3 className="text-base font-black text-slate-900">Dados do Perfil</h3>
        <p className="text-slate-400 text-sm mt-0.5">
          Informações de identificação no sistema
        </p>
      </div>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nome */}
          <div className="md:col-span-2">
            <Field label="Nome Completo" error={errors.nome_usuario?.message}>
              <input
                {...register('nome_usuario')}
                className={inputCls(!!errors.nome_usuario)}
                placeholder="Nome completo"
              />
            </Field>
          </div>

          {/* Email */}
          <Field label="E-mail" error={errors.email_?.message}>
            <input
              {...register('email_')}
              type="email"
              className={inputCls(!!errors.email_)}
              placeholder="email@empresa.com"
            />
          </Field>

          {/* Tipo — read-only */}
          <Field label="Tipo de Utilizador">
            <div
              className={`${inputCls()} flex items-center gap-2 cursor-default`}
            >
              <Icon name="shield" className="text-[16px] text-orange-500" />
              <span className="text-slate-600 font-medium">
                {profile.tipo_nome_usuario}
              </span>
            </div>
          </Field>

          {/* Cadastrado em — read-only */}
          <Field label="Membro Desde">
            <div
              className={`${inputCls()} flex items-center gap-2 cursor-default`}
            >
              <Icon
                name="calendar_today"
                className="text-[16px] text-slate-400"
              />
              <span className="text-slate-600">
                {fmtDate(profile.cadastrado_em)}
              </span>
            </div>
          </Field>

          {/* Acesso — read-only */}
          <Field label="Estado da Conta">
            <div
              className={`${inputCls()} flex items-center gap-2 cursor-default`}
            >
              <span
                className={`size-2 rounded-full ${profile.acesso === 'true' ? 'bg-emerald-500' : 'bg-red-500'}`}
              />
              <span className="text-slate-600 font-medium">
                {profile.acesso === 'true' ? 'Conta Activa' : 'Conta Inactiva'}
              </span>
            </div>
          </Field>
        </div>

        <div className="mt-6 flex items-center justify-between pt-5 border-t border-slate-50">
          {saved && (
            <span className="text-sm text-green-600 font-semibold flex items-center gap-1.5">
              <Icon name="check_circle" className="text-[16px]" />
              Alterações guardadas!
            </span>
          )}
          <button
            type="submit"
            disabled={isPending || !isDirty}
            className="ml-auto flex items-center gap-2 px-6 h-11 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                A guardar...
              </>
            ) : (
              <>
                <Icon name="save" className="text-[18px]" />
                Guardar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Tab: Segurança ───────────────────────────────────────────────────────────

function TabSeguranca({ profile }: { profile: AdminProfile }) {
  const [show, setShow] = useState({
    actual: false,
    nova: false,
    confirmar: false,
  });
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<SenhaForm>({
    resolver: zodResolver(SenhaSchema),
    defaultValues: { senhaActual: '', novaSenha: '', confirmarSenha: '' },
  });

  const novaSenha = watch('novaSenha') ?? '';
  const confirmarSenha = watch('confirmarSenha') ?? '';
  const strength = getStrength(novaSenha);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: SenhaForm) => {
      await api.patch(`/administradores/${profile.id_usuarios}/senha`, {
        senhaActual: data.senhaActual,
        novaSenha: data.novaSenha,
      });
    },
    onSuccess: () => {
      setSaved(true);
      reset();
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const toggle = (f: keyof typeof show) =>
    setShow((s) => ({ ...s, [f]: !s[f] }));

  return (
    <div className="flex flex-col gap-5">
      {/* Alterar senha */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-50">
          <h3 className="text-base font-black text-slate-900">
            Segurança e Acesso
          </h3>
          <p className="text-slate-400 text-sm mt-0.5">
            Altere a sua senha de acesso
          </p>
        </div>

        <form
          onSubmit={handleSubmit((d) => mutate(d))}
          className="p-6 sm:p-8 flex flex-col gap-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                field: 'senhaActual' as const,
                label: 'Senha Actual',
                key: 'actual',
                ph: '••••••••',
              },
              {
                field: 'novaSenha' as const,
                label: 'Nova Senha',
                key: 'nova',
                ph: 'Mínimo 8 caracteres',
              },
              {
                field: 'confirmarSenha' as const,
                label: 'Confirmar Senha',
                key: 'confirmar',
                ph: 'Repita a senha',
              },
            ].map(({ field, label, key, ph }) => (
              <Field key={field} label={label} error={errors[field]?.message}>
                <div className="relative">
                  <input
                    {...register(field)}
                    type={show[key as keyof typeof show] ? 'text' : 'password'}
                    placeholder={ph}
                    className={`${inputCls(!!errors[field])} pr-11 ${field === 'confirmarSenha' && confirmarSenha && novaSenha === confirmarSenha ? '!border-green-400' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => toggle(key as keyof typeof show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Icon
                      name={
                        show[key as keyof typeof show]
                          ? 'visibility_off'
                          : 'visibility'
                      }
                      className="text-[20px]"
                    />
                  </button>
                </div>
              </Field>
            ))}
          </div>

          {/* Força da senha */}
          {novaSenha.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-slate-100'}`}
                  />
                ))}
              </div>
              <p
                className={`text-xs font-semibold ${strength.score <= 1 ? 'text-red-400' : strength.score <= 2 ? 'text-orange-400' : strength.score <= 3 ? 'text-yellow-500' : 'text-green-500'}`}
              >
                Força: {strength.label}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
            {saved && (
              <span className="text-sm text-green-600 font-semibold flex items-center gap-1.5">
                <Icon name="check_circle" className="text-[16px]" />
                Senha alterada!
              </span>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="ml-auto flex items-center gap-2 px-6 h-11 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  A alterar...
                </>
              ) : (
                <>
                  <Icon name="lock_reset" className="text-[18px]" />
                  Alterar Senha
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info da conta */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">
          <Icon name="info" className="text-[18px] text-orange-500" />
          Informações da Conta
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              label: 'ID do utilizador',
              value: `#${profile.id_usuarios}`,
              icon: 'tag',
            },
            {
              label: 'Tipo de acesso',
              value: profile.tipo_nome_usuario,
              icon: 'shield',
            },
            {
              label: 'Registado em',
              value: fmtDate(profile.cadastrado_em),
              icon: 'calendar_today',
            },
            {
              label: 'Última actualização',
              value: fmtDate(profile.actualizado_em_usuario),
              icon: 'update',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
            >
              <div className="size-9 rounded-lg bg-white border border-slate-100 flex items-center justify-center flex-shrink-0">
                <Icon
                  name={item.icon}
                  className="text-[16px] text-orange-500"
                />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                  {item.label}
                </p>
                <p className="text-sm text-slate-800 font-bold mt-0.5">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminProfile() {
  const [activeTab, setActiveTab] = useState<TabId>('dados');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const admin = useAdminAuthStore((s) => s.session.admin);
  const adminHash = admin?.hash;

  const { data, isLoading } = useQuery<{ mensagem: AdminProfile }>({
    queryKey: ['admin-profile', adminHash],
    queryFn: async () =>
      (await api.get(`/administradores/hash/${adminHash}`)).data,
    enabled: !!adminHash,
    staleTime: 1000 * 60 * 5,
  });

  const profile = data?.mensagem;

  const initials = profile ? getInitials(profile.nome_usuario) : '?';

  const TABS: { id: TabId; icon: string; label: string }[] = [
    { id: 'dados', icon: 'person', label: 'Dados do Perfil' },
  ];

  return (
    <AdminLayout>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.35s ease both; }
      `}</style>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 pb-12">
        {/* ── Header banner ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden fade-in">
          {/* Banner */}
          <div className="h-28 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 relative">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
          </div>

          <div className="px-6 sm:px-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12">
              {/* Avatar + name */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
                {/* Avatar */}
                <div className="relative group flex-shrink-0">
                  <div className="size-24 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-orange-100 flex items-center justify-center">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-orange-600 font-black text-2xl">
                        {initials}
                      </span>
                    )}
                  </div>
                </div>

                {/* Name + role */}
                {isLoading ? (
                  <div className="flex flex-col gap-2 mb-2">
                    <Sk className="h-7 w-48" />
                    <Sk className="h-4 w-32" />
                  </div>
                ) : profile ? (
                  <div className="text-center sm:text-left mb-1">
                    <div className="flex flex-wrap items-center gap-4 mt-1.5 justify-center sm:justify-start">
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Icon name="calendar_today" className="text-[14px]" />
                        Membro desde {fmtDate(profile.cadastrado_em)}
                      </span>
                      <span
                        className={`text-xs flex items-center gap-1.5 font-semibold ${profile.acesso === 'true' ? 'text-emerald-500' : 'text-red-500'}`}
                      >
                        <span
                          className={`size-2 rounded-full ${profile.acesso === 'true' ? 'bg-emerald-500' : 'bg-red-500'}`}
                        />
                        {profile.acesso === 'true'
                          ? 'Conta Activa'
                          : 'Conta Inactiva'}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Quick stats */}
              {profile && (
                <div className="flex gap-6 justify-center sm:justify-end mb-1">
                  {[
                    {
                      label: 'Nome de usurio',
                      value: `${profile.nome_usuario}`,
                    },
                    { label: 'Tipo', value: profile.tipo_nome_usuario },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-xl font-semibold text-slate-700">
                        {s.value}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Content grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar nav */}
          <aside
            className="lg:col-span-3 fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex flex-col gap-4">
              {/* Tab nav */}
              <nav className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 flex flex-col gap-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all w-full ${activeTab === tab.id ? 'bg-orange-500 text-white shadow-md shadow-orange-100' : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'}`}
                  >
                    <Icon
                      name={tab.icon}
                      className={`text-[20px] flex-shrink-0 ${activeTab === tab.id ? '[font-variation-settings:"FILL"_1]' : ''}`}
                    />
                    <span className="text-sm font-semibold">{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Info card */}
              {isLoading ? (
                <Sk className="h-40" />
              ) : profile ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Resumo da Conta
                  </p>
                  {[
                    { label: 'ID', value: `#${profile.id_usuarios}` },
                    { label: 'Tipo', value: profile.tipo_nome_usuario },
                    {
                      label: 'Registado',
                      value: fmtDate(profile.cadastrado_em),
                    },
                    {
                      label: 'Actualizado',
                      value: fmtDate(profile.actualizado_em_usuario),
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-700 font-bold mt-0.5">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </aside>

          {/* Tab content */}
          <div
            className="lg:col-span-9 fade-in"
            style={{ animationDelay: '0.15s' }}
          >
            {isLoading ? (
              <div className="flex flex-col gap-4">
                <Sk className="h-12 w-48" />
                <Sk className="h-64" />
              </div>
            ) : profile ? (
              <>
                {activeTab === 'dados' && <TabDados profile={profile} />}
                {activeTab === 'seguranca' && (
                  <TabSeguranca profile={profile} />
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
                <Icon name="error" className="text-4xl block mx-auto mb-3" />
                <p className="text-sm font-medium">
                  Não foi possível carregar o perfil.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
