'use client';
import { Link } from 'react-router-dom';
import Particles from 'react-tsparticles';

export default function NotFoundPage() {
  return (
    <div className="pageNotfound">
      {/* Fundo animado com partículas */}
      <Particles
        options={{
          background: { color: { value: '#1D1D1D' } },
          fpsLimit: 60,
          particles: {
            number: { value: 80, density: { enable: true, area: 800 } },
            color: { value: ['#FF5777', '#171718', '#FFFFFF'] },
            shape: { type: 'circle' },
            opacity: { value: 0.5 },
            size: { value: { min: 1, max: 5 } },
            move: {
              enable: true,
              speed: 2,
              direction: 'none',
              outModes: 'out',
            },
          },
          interactivity: {
            events: {
              onHover: { enable: true, mode: 'repulse' },
              onClick: { enable: true, mode: 'push' },
            },
            modes: {
              repulse: { distance: 100, duration: 0.4 },
              push: { quantity: 4 },
            },
          },
        }}
      />

      {/* Conteúdo principal */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
        {/* Logotipo */}
        <div className="mb-6">
          <svg
            width="80"
            height="80"
            viewBox="0 0 46 46"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Copie aqui o conteúdo do seu SVG */}
            <path
              d="M21.5387 41.1748C20.9375 41.7277 18.992 43.3678 16.1913 43.3678..."
              fill="url(#paint0_linear_9_1275)"
            />
            {/* Continue com o restante do SVG */}
          </svg>
        </div>

        {/* Mensagem de erro */}
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold text-[#FFA500]">
          404
        </h1>
        <p className="text-lg md:text-xl text-white lg:text-2xl mt-4">
          Ups! Página não encontrada.
        </p>

        {/* Link para voltar */}
        <Link
          to="/"
          className="mt-6 text-[#FFA500] cursor-pointer hover:text-orange-500 text-base md:text-lg lg:text-xl"
        >
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
