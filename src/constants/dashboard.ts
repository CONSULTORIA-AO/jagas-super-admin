import { NavItem } from '@/types/dashboard';
import { MdOutlineBorderColor } from 'react-icons/md';
import { BiCategory } from 'react-icons/bi';
import { TbUsersGroup } from 'react-icons/tb';
import { MdProductionQuantityLimits } from 'react-icons/md';
import { ImProfile } from 'react-icons/im';
import { FaUserTie } from 'react-icons/fa6';

export type OrderStatus = 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Cancelado';

export const STATUS_MAP: Record<
  OrderStatus,
  { label: string; classes: string }
> = {
  Pendente: {
    label: 'Pendente',
    classes: 'bg-amber-50 text-amber-600',
  },
  Aprovado: {
    label: 'Aprovado',
    classes: 'bg-emerald-50 text-emerald-600',
  },
  Rejeitado: {
    label: 'Rejeitado',
    classes: 'bg-red-50 text-red-600',
  },
  Cancelado: {
    label: 'Cancelado',
    classes: 'bg-gray-100 text-gray-600',
  },
};

export const NAV_ITEMS: NavItem[] = [
  { icon: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { icon: MdOutlineBorderColor, label: 'Pedidos', path: '/pedidos' },
  { icon: BiCategory, label: 'Categoria', path: '/categoria' },
  { icon: TbUsersGroup, label: 'Clientes', path: '/clientes' },
  { icon: FaUserTie, label: 'Vendedores', path: '/vendedores' },
  { icon: MdProductionQuantityLimits, label: 'Produtos', path: '/produtos' },
  { icon: ImProfile, label: 'Perfil', path: '/perfil' },
];
