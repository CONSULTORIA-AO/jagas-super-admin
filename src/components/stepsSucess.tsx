export function StepSuccess({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="fade-slide-in">
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="px-8 py-16 text-center flex flex-col items-center gap-6">
          {/* Animated checkmark */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full bg-green-100 animate-ping opacity-20" />
            <div className="relative w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
              <svg
                className="w-9 h-9 text-green-500"
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
            <h1 className="text-gray-900 text-[22px] font-bold tracking-tight">
              Senha Redefinida!
            </h1>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed max-w-sm mx-auto">
              A sua senha foi alterada com sucesso. Pode agora iniciar sessão
              com as novas credenciais.
            </p>
          </div>

          <button
            onClick={onLogin}
            className="w-full h-12 rounded-xl bg-orange-500 text-white font-bold text-sm tracking-wide hover:bg-orange-600 active:scale-[0.98] transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
          >
            Ir para o Login
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
          </button>
        </div>
      </div>
    </div>
  );
}
