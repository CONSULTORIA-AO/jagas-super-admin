import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

import { AdminLogin } from '@/app/(public)/auth/login/page';
import { AdminRegister } from '@/app/(public)/auth/signup/page';
import NotFoundPage from '@/app/(public)/notfound/page';

import AdminDashboard from '@/app/dashboard/page';
import { AdminProfile } from '@/app/profile/page';
import ProductsPage from '@/app/products/page';
import SellerPage from '@/app/management/page';
import ClientsPage from '@/app/clients/page';
import OrdersPage from '@/app/order/page';
import CategoriesPage from '@/app/category/page';

export function AppRoutes() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/" element={<AdminLogin />} />

      <Route path="/cadastrar-admin" element={<AdminRegister />} />

      {/* Rotas Privadas */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vendedores"
        element={
          <ProtectedRoute>
            <SellerPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <ClientsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/produtos"
        element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pedidos"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/categoria"
        element={
          <ProtectedRoute>
            <CategoriesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <AdminProfile />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
