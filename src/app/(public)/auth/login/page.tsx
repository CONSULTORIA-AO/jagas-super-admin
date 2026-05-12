import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useAdminAuthStore } from '@/hooks/adminStore';
import { api } from '@/utils/api';
import { EyeIcon } from '@/components/EyeIcon';
import { useNavigate } from 'react-router-dom';

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const setSession = useAdminAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const {
    mutate: login,
    isPending,
    error: mutationError,
  } = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await api.post('/administradores/login', {
        email: data.email,
        senha: data.senha,
      });
      console.log(res);
      return res.data;
    },
    onSuccess: (data) => {
      setSession({ token: data.token, admin: data.admin, step: 'done' });
      navigate('/dashboard');
    },
  });

  const onSubmit = (data: LoginForm) => login(data);

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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h1 className="text-gray-900 text-[22px] font-bold tracking-tight">
                Portal do Super Admin
              </h1>
              <p className="text-gray-500 text-sm mt-1.5">
                Acesso exclusivo ao gerenciamento global da plataforma.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="px-8 py-7 flex flex-col gap-5"
            >
              {/* API Error */}
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
                  Credenciais inválidas. Verifique e tente novamente.
                </div>
              )}

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
                    {...register('email')}
                    type="email"
                    placeholder="exemplo@empresa.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-gray-800 bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 focus:bg-white transition-all
                      ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs">{errors.email.message}</p>
                )}
              </div>

              {/* Senha */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-gray-700 text-sm font-semibold">
                    Senha
                  </label>
                  <a
                    href="/recuperar-senha"
                    className="text-orange-500 text-xs font-semibold hover:text-orange-600 transition-colors"
                  >
                    Recuperar senha?
                  </a>
                </div>
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
                    {...register('senha')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha de segurança"
                    className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm text-gray-800 bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 focus:bg-white transition-all
                      ${errors.senha ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {errors.senha && (
                  <p className="text-red-500 text-xs">{errors.senha.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-12 rounded-xl bg-orange-500 text-white font-bold text-sm tracking-wide hover:bg-orange-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    A autenticar...
                  </>
                ) : (
                  'Acessar Painel'
                )}
              </button>

              <p className="text-center text-slate-500 text-sm font-medium pt-1">
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/cadastrar-admin')}
                  className="text-orange-500 font-black hover:underline underline-offset-2 focus:outline-none"
                >
                  Criar uma
                </button>
              </p>
            </form>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center">
        <p className="text-gray-400 text-xs">
          © {new Date().getFullYear()} JaGás — Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
