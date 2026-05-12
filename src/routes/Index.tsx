import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AdminLogin } from '@/app/(public)/auth/login/page';
import { AdminRegister } from '@/app/(public)/auth/signup/page';
import { AdminForgotPassword } from '@/app/(public)/auth/recoverpassword/page';
import NotFoundPage from '@/app/(public)/notfound/page';
import { AdminDashboard } from '@/app/dashboard/page';
import { AdminProfile } from '@/app/profile/page';
import { ProductsPage } from '@/app/products/page';
import { SellerPage } from '@/app/management/page';
import { ClientsPage } from '@/app/clients/page';
import { OrdersPage } from '@/app/order/page';
import { CategoriesPage } from '@/app/category/page';

export function AppRoutes() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/" element={<AdminLogin />} />

      <Route path="/cadastrar-admin" element={<AdminRegister />} />

      <Route path="/recuperar-senha" element={<AdminForgotPassword />} />

      <Route path="/dashboard" element={<AdminDashboard />} />

      {/*<Route path="/perfil" element={<AdminProfile />} />*/}

      <Route path="/vendedores" element={<SellerPage />} />

      <Route path="/clientes" element={<ClientsPage />} />

      <Route path="/produtos" element={<ProductsPage />} />

      <Route path="/pedidos" element={<OrdersPage />} />

      <Route path="/categoria" element={<CategoriesPage />} />

      {/* Rotas Privadas */}

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
