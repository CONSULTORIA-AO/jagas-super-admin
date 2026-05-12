export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-sans">
      {/* Decorative background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-orange-500/6 blur-[130px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-orange-400/5 blur-[120px]" />
      </div>

      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[460px]">{children}</div>
      </main>

      <footer className="py-6 text-center px-4">
        <p className="text-gray-400 text-xs leading-relaxed">
          A sua ligação é encriptada e segura.{' '}
          <span className="hidden sm:inline">
            <br />
          </span>
          © {new Date().getFullYear()} JaGás Todos os direitos reservados.
        </p>
      </footer>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        .shake { animation: shake 0.4s ease-in-out; }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-slide-in { animation: fadeSlideIn 0.35s ease both; }
      `}</style>
    </div>
  );
}
