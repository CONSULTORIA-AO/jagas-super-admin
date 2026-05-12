import { ProfileTab } from '@/constants/perfil';
import { useAdminProfileStore } from '@/hooks/profile';

const TABS: { id: ProfileTab; icon: string; label: string }[] = [
  { id: 'dados', icon: 'person', label: 'Dados Pessoais' },
  { id: 'seguranca', icon: 'shield', label: 'Segurança e Acesso' },
  { id: 'atividade', icon: 'history', label: 'Registo de Actividade' },
];

export function ProfileNav() {
  const { activeTab, setActiveTab, security } = useAdminProfileStore();

  return (
    <div className="flex flex-col gap-4">
      {/* Tab nav */}
      <nav className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 flex flex-col gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all w-full
              ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-100'
                  : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'
              }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] flex-shrink-0 ${activeTab === tab.id ? '[font-variation-settings:"FILL"_1]' : ''}`}
            >
              {tab.icon}
            </span>
            <span className="text-sm font-semibold">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Security widget */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-col gap-3">
          <div className="pt-1 space-y-2">
            {[
              {
                label: 'Última troca de senha',
                value: security.ultimaTrocaSenha,
              },
              { label: 'Sessão activa', value: security.sessaoAtiva },
              {
                label: 'Dispositivos confiados',
                value: `${security.dispositivosConfiados} dispositivos`,
              },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                  {item.label}
                </p>
                <p className="text-xs text-slate-700 font-medium mt-0.5">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
