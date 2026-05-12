import { useAdminProfileStore } from '@/hooks/profile';
import { useRef } from 'react';

export function ProfileHeader() {
  const { profile, avatarPreview, setAvatarPreview } = useAdminProfileStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const initials = profile.nomeCompleto
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Orange gradient banner */}
      <div className="h-24 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 relative">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="px-6 sm:px-8 pb-6">
        {/* Avatar row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Avatar */}
            <div className="relative group flex-shrink-0">
              <div className="size-24 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-orange-100 flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-orange-600 font-black text-2xl">
                    {initials}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-white text-slate-600 p-1.5 rounded-xl shadow-md border border-slate-100 hover:text-orange-500 hover:scale-110 transition-all"
                title="Alterar foto"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">
                  photo_camera
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Name + role */}
            <div className="text-center sm:text-left mb-1">
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {profile.nomeCompleto}
                </h1>
                <span className="bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-orange-200">
                  Super Admin
                </span>
              </div>
              <p className="text-slate-500 text-sm font-medium mt-0.5">
                {profile.cargo}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-1.5 justify-center sm:justify-start">
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    calendar_today
                  </span>
                  Membro desde {profile.membroDesde}
                </span>
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    location_on
                  </span>
                  {profile.localidade}
                </span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-4 sm:gap-6 justify-center sm:justify-end mb-1">
            {[
              { label: 'Acções', value: profile.totalAcoes },
              { label: 'Dispositivos', value: 2 },
              { label: 'Dias activo', value: 312 },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-black text-slate-900">{s.value}</p>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
