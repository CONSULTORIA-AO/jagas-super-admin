import { AdminLayout } from '@/components/adminLayout';
import { useAdminProfileStore } from '@/hooks/profile';
import { ProfileHeader } from './header';
import { ProfileNav } from './nav';
import { ProfileDadosTab } from './dados';
import { ProfileSegurancaTab } from './seguranca';
import { ProfileAtividadeTab } from './atividade';

export function AdminProfile() {
  const { activeTab } = useAdminProfileStore();

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 pb-12">
        {/* Profile banner */}
        <ProfileHeader />

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar nav */}
          <aside className="lg:col-span-3">
            <ProfileNav />
          </aside>

          {/* Tab content */}
          <div className="lg:col-span-9">
            {activeTab === 'dados' && <ProfileDadosTab />}
            {activeTab === 'seguranca' && <ProfileSegurancaTab />}
            {activeTab === 'atividade' && <ProfileAtividadeTab />}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AdminLayout>
  );
}
