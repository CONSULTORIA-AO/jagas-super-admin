import { useAdminAuthStore } from '@/hooks/adminStore';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAdminAuthStore((state) => state.session.token);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
