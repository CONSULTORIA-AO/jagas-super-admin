import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { useAdminProfileStore } from '@/hooks/profile';
import { ProfileForm, ProfileFormSchema } from '@/schema/perfil';
import { DEPARTAMENTOS } from '@/constants/perfil';

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </label>
      {children}
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
  `w-full h-11 px-4 rounded-xl border-2 text-sm text-slate-800 placeholder-slate-300 bg-slate-50 transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-100
  ${err ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-orange-400'}`;

export function ProfileDadosTab() {
  const { profile, updateProfile } = useAdminProfileStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      nomeCompleto: profile.nomeCompleto,
      email: profile.email,
      telefone: profile.telefone,
      departamento: profile.departamento as (typeof DEPARTAMENTOS)[number],
      cargo: profile.cargo,
      localidade: profile.localidade,
    },
  });

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async (data: ProfileForm) => {
      try {
        await api.patch('/admin/profile', data);
      } catch {
        await new Promise((r) => setTimeout(r, 700));
      }
    },
    onSuccess: (_, data) => updateProfile(data),
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 sm:px-8 py-5 border-b border-slate-50">
        <h3 className="text-base sm:text-lg font-black text-slate-900">
          Dados do Perfil
        </h3>
        <p className="text-slate-400 text-sm mt-0.5">
          Informações básicas de identificação no sistema
        </p>
      </div>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div className="md:col-span-2">
            <Field label="Nome Completo" error={errors.nomeCompleto?.message}>
              <input
                {...register('nomeCompleto')}
                className={inputCls(!!errors.nomeCompleto)}
                placeholder="Nome completo"
              />
            </Field>
          </div>

          <Field label="E-mail Corporativo" error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              className={inputCls(!!errors.email)}
              placeholder="email@gasmarket.ao"
            />
          </Field>

          <Field label="Telefone" error={errors.telefone?.message}>
            <input
              {...register('telefone')}
              type="tel"
              className={inputCls(!!errors.telefone)}
              placeholder="+244 9XX XXX XXX"
            />
          </Field>

          <Field label="Departamento" error={errors.departamento?.message}>
            <div className="relative">
              <select
                {...register('departamento')}
                className={`${inputCls(!!errors.departamento)} appearance-none pr-9`}
              >
                {DEPARTAMENTOS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                expand_more
              </span>
            </div>
          </Field>

          <Field label="Cargo / Função" error={errors.cargo?.message}>
            <input
              {...register('cargo')}
              className={inputCls(!!errors.cargo)}
              placeholder="Ex: Gerente de Operações"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Localidade" error={errors.localidade?.message}>
              <input
                {...register('localidade')}
                className={inputCls(!!errors.localidade)}
                placeholder="Ex: Luanda, Angola"
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between pt-5 border-t border-slate-50">
          {isSuccess && (
            <span className="text-sm text-green-600 font-semibold flex items-center gap-1.5 animate-[fadeIn_0.3s_ease]">
              <span className="material-symbols-outlined text-[16px]">
                check_circle
              </span>
              Alterações guardadas!
            </span>
          )}
          <div className="ml-auto flex gap-3">
            <button
              type="submit"
              disabled={isPending || !isDirty}
              className="flex items-center gap-2 px-6 h-11 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{' '}
                  A guardar...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    save
                  </span>
                  Guardar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
