import { Step } from '@/types/steps';

export function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = ['email', 'code', 'password'];
  const labels = ['E-mail', 'Código', 'Nova Senha'];
  const idx = steps.indexOf(current);

  if (current === 'success') return null;

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                ${i < idx ? 'bg-orange-500 text-white' : i === idx ? 'bg-orange-500 text-white ring-4 ring-orange-100' : 'bg-gray-100 text-gray-400'}`}
            >
              {i < idx ? (
                <svg
                  className="w-4 h-4"
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
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-[10px] font-medium ${i === idx ? 'text-orange-500' : 'text-gray-400'}`}
            >
              {labels[i]}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-14 h-0.5 mb-4 mx-1 transition-all duration-500 ${i < idx ? 'bg-orange-400' : 'bg-gray-200'}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
