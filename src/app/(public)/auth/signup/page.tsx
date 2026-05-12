import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/utils/api';
import { EyeIcon } from '@/components/EyeIcon';
import axios from 'axios';

// ─── Schema ───────────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    nome_usuario: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email_: z.string().email('E-mail inválido'),
    tipo_usuario: z.number().default(1),
    senha_: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    confirmar_senha: z.string(),
  })
  .refine((d) => d.senha_ === d.confirmar_senha, {
    message: 'As senhas não coincidem',
    path: ['confirmar_senha'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminRegister() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { tipo_usuario: 1 },
  });

  const senha = watch('senha_') ?? '';
  const confirmar = watch('confirmar_senha') ?? '';

  const {
    mutate,
    isPending,
    error: mutationError,
  } = useMutation({
    mutationFn: async (data: RegisterForm) => {
      try {
        const res = await api.post('/administradores', {
          email_: data.email_,
          senha_: data.senha_,
          confirmar_senha: data.confirmar_senha,
          nome_usuario: data.nome_usuario,
          tipo_usuario: data.tipo_usuario,
          gerador: 'web',
        });
        console.log('SUCCESS:', res.data);
        return res.data;
      } catch (err: any) {
        console.log('STATUS:', err.response?.status);
        console.log('DATA:', err.response?.data);
        throw err;
      }
    },
    onSuccess: () => setSuccess(true),
  });

  const onSubmit = (data: RegisterForm) => mutate(data);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">
      {/* Decorative background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-orange-500/8 blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-orange-400/6 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-orange-300/3 blur-[150px]" />
      </div>

      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-[440px]">
          {/* Success state */}
          {success ? (
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
              <div className="px-8 py-12 flex flex-col items-center text-center gap-5">
                <div className="relative inline-flex">
                  <div className="absolute w-20 h-20 rounded-full bg-green-100 animate-ping opacity-20" />
                  <div className="relative w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-gray-900 text-xl font-bold">
                    Cadastro Realizado!
                  </h2>
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                    A conta foi criada com sucesso. Podes agora aceder ao
                    painel.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="w-full h-12 rounded-xl bg-orange-500 text-white font-bold text-sm tracking-wide hover:bg-orange-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-200"
                >
                  Ir para o Login
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
              {/* Card header */}
              <div className="px-8 pt-10 pb-7 text-center border-b border-gray-50">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-50 mb-5">
                  <svg
                    className="w-7 h-7 text-orange-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <h1 className="text-gray-900 text-[22px] font-bold tracking-tight">
                  Criar Conta Admin
                </h1>
                <p className="text-gray-500 text-sm mt-1.5">
                  Preenche os dados para registar um novo administrador.
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="px-8 py-7 flex flex-col gap-5"
              >
                {/* API error */}
                {mutationError && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                    <svg
                      className="w-4 h-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Erro ao criar conta. Verifica os dados e tenta novamente.
                  </div>
                )}

                {/* Nome */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-700 text-sm font-semibold">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      {...register('nome_usuario')}
                      type="text"
                      placeholder="Ex: Laís Germano"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-gray-800 bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 focus:bg-white transition-all ${errors.nome_usuario ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    />
                  </div>
                  {errors.nome_usuario && (
                    <p className="text-red-500 text-xs">
                      {errors.nome_usuario.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-700 text-sm font-semibold">
                    E-mail Corporativo
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <input
                      {...register('email_')}
                      type="email"
                      placeholder="exemplo@empresa.com"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-gray-800 bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 focus:bg-white transition-all ${errors.email_ ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    />
                  </div>
                  {errors.email_ && (
                    <p className="text-red-500 text-xs">
                      {errors.email_.message}
                    </p>
                  )}
                </div>

                {/* Senha */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-700 text-sm font-semibold">
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      {...register('senha_')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm text-gray-800 bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 focus:bg-white transition-all ${errors.senha_ ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                  {errors.senha_ && (
                    <p className="text-red-500 text-xs">
                      {errors.senha_.message}
                    </p>
                  )}
                </div>

                {/* Confirmar Senha */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-700 text-sm font-semibold">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <input
                      {...register('confirmar_senha')}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repita a senha"
                      className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm text-gray-800 bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 focus:bg-white transition-all
                        ${errors.confirmar_senha ? 'border-red-300 bg-red-50' : confirmar && senha === confirmar ? 'border-green-400 bg-green-50/30' : 'border-gray-200'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                  {errors.confirmar_senha ? (
                    <p className="text-red-500 text-xs">
                      {errors.confirmar_senha.message}
                    </p>
                  ) : confirmar && senha === confirmar ? (
                    <p className="text-green-500 text-xs flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      As senhas coincidem
                    </p>
                  ) : null}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 rounded-xl bg-orange-500 text-white font-bold text-sm tracking-wide hover:bg-orange-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                >
                  {isPending ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      A cadastrar...
                    </>
                  ) : (
                    'Criar Conta'
                  )}
                </button>

                {/* Login link */}
                <p className="text-center text-sm text-gray-500">
                  Já tens conta?{' '}
                  <a
                    href="/"
                    className="text-orange-500 font-semibold hover:text-orange-600 transition-colors"
                  >
                    Acesse a sua conta
                  </a>
                </p>
              </form>
            </div>
          )}
        </div>
      </main>

      <footer className="py-6 text-center">
        <p className="text-gray-400 text-xs">
          © {new Date().getFullYear()} JaGás — Todos os direitos reservados.
        </p>
        <p className="text-gray-300 text-xs mt-1">Versão 1.0.0</p>
      </footer>
    </div>
  );
}
