import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { useAdminProfileStore } from '@/hooks/profile';
import { PasswordForm, PasswordFormSchema } from '@/schema/perfil';

function getStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
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
}

function PasswordField({
  label,
  show,
  onToggle,
  error,
  children,
}: {
  label: string;
  show: boolean;
  onToggle: () => void;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        {children}
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">
            {show ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">error</span>
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (err?: boolean) =>
  `w-full h-11 px-4 pr-11 rounded-xl border-2 text-sm text-slate-800 bg-slate-50 transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-100 placeholder-slate-300
  ${err ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-orange-400'}`;

export function ProfileSegurancaTab() {
  const { security } = useAdminProfileStore();
  const [show, setShow] = useState({
    actual: false,
    nova: false,
    confirmar: false,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(PasswordFormSchema),
    defaultValues: { senhaActual: '', novaSenha: '', confirmarSenha: '' },
  });

  const novaSenha = watch('novaSenha') ?? '';
  const confirmarSenha = watch('confirmarSenha') ?? '';
  const strength = getStrength(novaSenha);

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async (data: PasswordForm) => {
      try {
        await api.patch('/admin/profile/password', data);
      } catch {
        await new Promise((r) => setTimeout(r, 800));
      }
    },
    onSuccess: () => reset(),
  });

  const toggle = (field: keyof typeof show) =>
    setShow((s) => ({ ...s, [field]: !s[field] }));

  return (
    <div className="flex flex-col gap-5">
      {/* Change password */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-50">
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            Segurança e Acesso
          </h3>
          <p className="text-slate-400 text-sm mt-0.5">Gerencie a sua senha</p>
        </div>

        <form
          onSubmit={handleSubmit((d) => mutate(d))}
          className="p-6 sm:p-8 flex flex-col gap-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <PasswordField
              label="Senha Actual"
              show={show.actual}
              onToggle={() => toggle('actual')}
              error={errors.senhaActual?.message}
            >
              <input
                {...register('senhaActual')}
                type={show.actual ? 'text' : 'password'}
                className={inputCls(!!errors.senhaActual)}
                placeholder="••••••••"
              />
            </PasswordField>

            <PasswordField
              label="Nova Senha"
              show={show.nova}
              onToggle={() => toggle('nova')}
              error={errors.novaSenha?.message}
            >
              <input
                {...register('novaSenha')}
                type={show.nova ? 'text' : 'password'}
                className={inputCls(!!errors.novaSenha)}
                placeholder="Mínimo 8 caracteres"
              />
            </PasswordField>

            <PasswordField
              label="Confirmar Senha"
              show={show.confirmar}
              onToggle={() => toggle('confirmar')}
              error={errors.confirmarSenha?.message}
            >
              <input
                {...register('confirmarSenha')}
                type={show.confirmar ? 'text' : 'password'}
                className={`${inputCls(!!errors.confirmarSenha)} ${confirmarSenha && novaSenha === confirmarSenha ? '!border-green-400' : ''}`}
                placeholder="Repita a senha"
              />
            </PasswordField>
          </div>

          {/* Strength bar */}
          {novaSenha.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-slate-100'}`}
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
            {isSuccess && (
              <span className="text-sm text-green-600 font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">
                  check_circle
                </span>
                Senha alterada com sucesso!
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
                  <span className="material-symbols-outlined text-[18px]">
                    lock_reset
                  </span>
                  Alterar Senha
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Active sessions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-orange-500">
            devices
          </span>
          Sessões Activas
        </h4>
        {[
          {
            device: 'MacBook Pro 14"',
            location: 'Luanda, Angola',
            time: 'Agora',
            current: true,
          },
          {
            device: 'iPhone 15',
            location: 'Luanda, Angola',
            time: 'Há 2 horas',
            current: false,
          },
        ].map((sess) => (
          <div
            key={sess.device}
            className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                <span className="material-symbols-outlined text-[18px]">
                  {sess.device.includes('iPhone') ? 'smartphone' : 'laptop_mac'}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {sess.device}
                </p>
                <p className="text-xs text-slate-400">
                  {sess.location} · {sess.time}
                </p>
              </div>
            </div>
            {sess.current ? (
              <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                Actual
              </span>
            ) : (
              <button className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
                Terminar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
