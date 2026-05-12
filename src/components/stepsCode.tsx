import {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  ClipboardEvent,
} from 'react';
import { useCountdown } from './CountDown';
import { CODE_LENGTH } from '@/constants';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';

export function StepCode({
  email,
  onNext,
  onBack,
}: {
  email: string;
  onNext: (code: string) => void;
  onBack: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { mm, ss, expired, reset: resetTimer } = useCountdown(179);

  const code = digits.join('');
  const isComplete =
    code.length === CODE_LENGTH && digits.every((d) => d !== '');

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const { mutate: verify, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/auth/verify-reset-code', {
        email,
        code,
      });
      return res.data;
    },
    onSuccess: () => onNext(code),
    onError: () => {
      setError('Código inválido ou expirado. Tente novamente.');
      setDigits(Array(CODE_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    },
  });

  const { mutate: resend, isPending: isResending } = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/auth/forgot-password', { email });
      return res.data;
    },
    onSuccess: () => {
      resetTimer();
      setError('');
      setDigits(Array(CODE_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    },
  });

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setError('');
    if (value && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      }
    }
    if (e.key === 'ArrowLeft' && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1)
      inputRefs.current[index + 1]?.focus();
    if (e.key === 'Enter' && isComplete) verify();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((char, i) => {
      next[i] = char;
    });
    setDigits(next);
    setTimeout(
      () =>
        inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus(),
      0
    );
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-gray-900 text-[22px] font-bold tracking-tight">
            Verificação de Código
          </h1>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed max-w-sm mx-auto">
            Insira o código de 6 dígitos enviado para{' '}
            <span className="font-semibold text-gray-700">{email}</span>.
          </p>
        </div>

        {/* Code inputs */}
        <div className="px-8 py-2">
          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none
                  ${digit ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-gray-200 bg-gray-50 text-gray-800'}
                  ${error ? 'border-red-300 bg-red-50 text-red-600 shake' : ''}
                  focus:border-orange-400 focus:bg-orange-50/50 focus:ring-2 focus:ring-orange-200`}
              />
            ))}
          </div>
          {error && (
            <div className="mt-4 flex items-center justify-center gap-2 text-red-500 text-sm">
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
        </div>

        {/* Timer */}
        <div className="px-8 pt-5 pb-2 flex justify-center items-center gap-3">
          {expired ? (
            <p className="text-red-500 text-sm font-medium">Código expirado.</p>
          ) : (
            <>
              <p className="text-gray-400 text-sm">O código expira em:</p>
              <div className="flex items-center gap-1">
                <div
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold text-sm transition-colors ${parseInt(mm) === 0 && parseInt(ss) <= 30 ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}
                >
                  {mm}
                </div>
                <span className="text-gray-300 font-bold">:</span>
                <div
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold text-sm transition-colors ${parseInt(mm) === 0 && parseInt(ss) <= 30 ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}
                >
                  {ss}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Progress bar */}
        {!expired && (
          <div className="px-8 pt-1">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-400 rounded-full transition-all duration-1000"
                style={{
                  width: `${((parseInt(mm) * 60 + parseInt(ss)) / 179) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-8 pb-10 pt-6 flex flex-col gap-3">
          <button
            onClick={() => verify()}
            disabled={!isComplete || isPending || expired}
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
                A verificar...
              </>
            ) : (
              'Confirmar Código'
            )}
          </button>

          <div className="flex flex-col items-center gap-2.5 pt-1">
            <button
              onClick={() => resend()}
              disabled={isResending || (!expired && parseInt(mm) > 0)}
              className="text-orange-500 text-sm font-semibold hover:text-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isResending ? 'A reenviar...' : 'Não recebi o código'}
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-gray-400 text-sm hover:text-gray-600 transition-colors"
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
              Alterar e-mail
            </button>
          </div>
        </div>
      </div>
      <p className="text-center text-gray-400 text-xs mt-4">
        💡 Pode colar o código directamente nos campos acima.
      </p>
    </div>
  );
}
