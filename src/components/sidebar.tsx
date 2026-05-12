import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuthStore } from '@/hooks/adminStore';
import { NAV_ITEMS } from '@/constants/dashboard';
import { MdLogout } from 'react-icons/md';

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const admin = useAdminAuthStore((s) => s.session?.admin);
  const clearSession = useAdminAuthStore((s) => s.clearSession);

  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside
        className={`
          flex-shrink-0 border-r border-orange-100/60 bg-white h-full flex flex-col justify-between
          shadow-sm transition-all duration-300 z-30
          ${collapsed ? 'w-16' : 'w-56'}
          fixed lg:relative
          ${collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        `}
      >
        {/* Top */}
        <div className="flex flex-col gap-6 p-3">
          {/* Logo + collapse toggle */}
          <div
            className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-1 pt-1`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-orange-500 p-2 rounded-xl text-white shadow-md shadow-orange-200 flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  local_gas_station
                </span>
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <h1 className="text-sm font-black leading-none text-slate-900 truncate">
                    Jagás Admin
                  </h1>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Portal Admin
                  </p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  menu_open
                </span>
              </button>
            )}
          </div>

          {/* Expand button when collapsed */}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="flex items-center justify-center p-1.5 rounded-lg hover:bg-orange-50 text-slate-400 hover:text-orange-500 transition-colors mx-auto"
            >
              <span className="material-symbols-outlined text-[18px]">
                menu
              </span>
            </button>
          )}

          {/* Nav */}
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative
                  ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                      : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'
                  }
                  ${collapsed ? 'justify-center' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="text-[20px] flex-shrink-0" />
                      {!collapsed && (
                        <span className="text-sm font-semibold truncate">
                          {item.label}
                        </span>
                      )}
                      {!collapsed && item.badge && (
                        <span
                          className={`ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-orange-100 text-orange-600'}`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {collapsed && item.badge && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div className="p-3 border-t border-orange-100/60">
          <button
            onClick={handleLogout}
            title={collapsed ? 'Sair' : undefined}
            className={`
      flex items-center w-full rounded-2xl
      text-slate-500 hover:bg-orange-50 hover:text-orange-600
      transition-all duration-300 group
      ${collapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
    `}
          >
            <MdLogout className="text-xl flex-shrink-0 group-hover:translate-x-1 transition-transform" />

            {!collapsed && (
              <span className="text-xs font-black uppercase tracking-widest truncate">
                Sair
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile toggle button (outside sidebar) */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="fixed bottom-6 left-4 z-40 lg:hidden bg-orange-500 text-white p-3 rounded-full shadow-lg shadow-orange-200"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      )}
    </>
  );
}
