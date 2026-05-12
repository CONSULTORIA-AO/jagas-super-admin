import { ORANJE } from '@/constants';
import { Badge } from './badgeCount';
import { Icon } from './icon';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/hooks/adminStore';
import { useEmpresa } from '@/service/profile/profile';
import { useSellerOrders } from '@/service/order/order';

export function Header({ onMenu }: { onMenu: () => void }) {
  const navigate = useNavigate();
  const empresaId = useAuthStore((state) => state.session?.user?.empresaId);

  const { data: empresa } = useEmpresa(empresaId);
  const { data: orders = [] } = useSellerOrders(empresaId);

  const pendingOrders = orders.filter(
    (o) => o.statusPedido === 'Pendente' || o.statusPedido === 'Processando'
  ).length;

  const avatarSrc = empresa?.logoEmpresa
    ? `${import.meta.env.VITE_API_URL}images/${empresa.logoEmpresa}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(empresa?.nomeEmpresa ?? 'E')}&background=f97316&color=fff&size=64`;

  return (
    <header
      style={{
        background: 'white',
        borderBottom: '1px solid #E5E7EB',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 300,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Menu */}
        <button
          onClick={onMenu}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            flexShrink: 0,
          }}
        >
          <Icon name="menu" color="#374151" />
        </button>

        {/* Logo */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: ORANJE,
              letterSpacing: -0.5,
            }}
          >
            JaGas
          </span>
        </button>

        {/* Nome da empresa — oculto em mobile muito pequeno */}
        {empresa?.nomeEmpresa && (
          <span
            className="hidden sm:block"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#6B7280',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 200,
            }}
          >
            {empresa.nomeEmpresa}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Acções */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          {/*<button
            onClick={() => goTo('messages')}
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
          >
            <Icon name="chat" color={unreadMessages > 0 ? ORANJE : '#6B7280'} size={20} />
            {unreadMessages > 0 && <Badge n={unreadMessages} />}
          </button>*/}

          {/* Pedidos pendentes */}
          <button
            onClick={() => navigate('/pedidos')}
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
            }}
            title="Pedidos"
          >
            <Icon
              name="package"
              color={pendingOrders > 0 ? '#F59E0B' : '#6B7280'}
              size={20}
            />
            {pendingOrders > 0 && (
              <Badge n={pendingOrders > 99 ? 99 : pendingOrders} />
            )}
          </button>

          {/* Avatar / perfil */}
          <button
            onClick={() => navigate('/perfil')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              flexShrink: 0,
            }}
            title={empresa?.nomeEmpresa ?? 'Perfil'}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                overflow: 'hidden',
                border: `2px solid ${ORANJE}`,
                flexShrink: 0,
              }}
            >
              <img
                src={avatarSrc}
                alt={empresa?.nomeEmpresa ?? 'Perfil'}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
