import { api } from '@/utils/api';
import { useMutation } from '@tanstack/react-query';
import {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  ClipboardEvent,
} from 'react';

export function StepEmail({ onNext }: { onNext: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const { mutate: sendCode, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/auth/forgot-password', { email });
      return res.data;
    },
    onSuccess: () => onNext(email),
    onError: () => setError('E-mail não encontrado ou não autorizado.'),
  });

  const handleSubmit = () => {
    if (!email.includes('@')) {
      setError('Insira um e-mail válido.');
      return;
    }
    setError('');
    sendCode();
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-gray-900 text-[22px] font-bold tracking-tight">
            Recuperar Senha
          </h1>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed max-w-sm mx-auto">
            Insira o e-mail associado à sua conta de administrador. Enviaremos
            um código de verificação.
          </p>
        </div>

        <div className="px-8 pb-10 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              E-mail corporativo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="admin@gasmarket.ao"
              autoFocus
              className={`w-full h-12 px-4 rounded-xl border-2 text-sm font-medium text-gray-800 placeholder-gray-300 bg-gray-50 transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-200
                ${error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-orange-400'}`}
            />
            {error && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs mt-0.5">
                <svg
                  className="w-3.5 h-3.5 shrink-0"
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
          </div>

          <button
            onClick={handleSubmit}
            disabled={!email || isPending}
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
                A enviar...
              </>
            ) : (
              <>
                Enviar Código
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
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
