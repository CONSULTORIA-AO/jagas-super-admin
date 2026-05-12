import { useState } from 'react';
import { getStrength } from './paswordStrength';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';

export function StepPassword({
  email,
  code,
  onNext,
  onBack,
}: {
  email: string;
  code: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const strength = getStrength(password);
  const passwordsMatch = password === confirm;
  const canSubmit = password.length >= 8 && passwordsMatch && confirm !== '';

  const { mutate: reset, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/auth/reset-password', {
        email,
        code,
        password,
      });
      return res.data;
    },
    onSuccess: onNext,
    onError: () =>
      setError('Erro ao redefinir senha. O código pode ter expirado.'),
  });

  const handleSubmit = () => {
    if (!passwordsMatch) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    setError('');
    reset();
  };

  return (
    <div className="fade-slide-in">
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute w-20 h-20 rounded-full bg-orange-100 animate-ping opacity-20" />
            <div className="relative w-16 h-16 rounded-full bg-orange-50 border-2 border-orange-100 flex items-center justify-center">
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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-gray-900 text-[22px] font-bold tracking-tight">
            Nova Senha
          </h1>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed max-w-sm mx-auto">
            Crie uma senha forte e segura para a sua conta de administrador.
          </p>
        </div>

        <div className="px-8 pb-10 flex flex-col gap-4">
          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Mínimo 8 caracteres"
                autoFocus
                className="w-full h-12 px-4 pr-11 rounded-xl border-2 text-sm font-medium text-gray-800 placeholder-gray-300 bg-gray-50 transition-all focus:outline-none focus:bg-white focus:border-orange-400 focus:ring-2 focus:ring-orange-200 border-gray-200"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPw ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Strength bar */}
            {password && (
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-gray-100'}`}
                    />
                  ))}
                </div>
                <p
                  className={`text-xs font-medium ${strength.score <= 1 ? 'text-red-400' : strength.score <= 2 ? 'text-orange-400' : strength.score <= 3 ? 'text-yellow-500' : 'text-green-500'}`}
                >
                  Força: {strength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Confirmar Senha
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) =>
                  e.key === 'Enter' && canSubmit && handleSubmit()
                }
                placeholder="Repita a nova senha"
                className={`w-full h-12 px-4 pr-11 rounded-xl border-2 text-sm font-medium text-gray-800 placeholder-gray-300 bg-gray-50 transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-200
                  ${confirm && !passwordsMatch ? 'border-red-300 focus:border-red-400' : confirm && passwordsMatch ? 'border-green-400 focus:border-green-400' : 'border-gray-200 focus:border-orange-400'}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirm ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {confirm && passwordsMatch && (
              <div className="flex items-center gap-1.5 text-green-500 text-xs">
                <svg
                  className="w-3.5 h-3.5"
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
              </div>
            )}
          </div>

          {/* Rules */}
          <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5">
            {[
              { ok: password.length >= 8, text: 'Mínimo 8 caracteres' },
              { ok: /[A-Z]/.test(password), text: 'Uma letra maiúscula' },
              { ok: /[0-9]/.test(password), text: 'Um número' },
              {
                ok: /[^A-Za-z0-9]/.test(password),
                text: 'Um caractere especial',
              },
            ].map((rule) => (
              <div key={rule.text} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${rule.ok ? 'bg-green-100' : 'bg-gray-200'}`}
                >
                  {rule.ok ? (
                    <svg
                      className="w-2.5 h-2.5 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  )}
                </div>
                <span
                  className={`text-xs transition-colors ${rule.ok ? 'text-green-600 font-medium' : 'text-gray-400'}`}
                >
                  {rule.text}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
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
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            className="w-full h-12 rounded-xl bg-orange-500 text-white font-bold text-sm tracking-wide hover:bg-orange-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
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
                A guardar...
              </>
            ) : (
              'Redefinir Senha'
            )}
          </button>

          <button
            onClick={onBack}
            className="flex items-center justify-center gap-1.5 text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
