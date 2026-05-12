import { IconType } from 'react-icons';
export interface NavItem {
  icon: IconType | string;
  label: string;
  path: string;
  badge?: number;
}

export type OrderStatus =
  | 'em_transito'
  | 'entregue'
  | 'aguardando'
  | 'cancelado';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type ChartMode = 'receita' | 'volume';
export type DateRange = '7d' | '30d' | '90d';

export interface Customer {
  name: string;
  initials: string;
  color: string;
}

export interface Order {
  id: string;
  code: string;
  customer: {
    name: string;
    initials: string;
    color: string;
  };
  status: OrderStatus; // Use 'any' ou o seu OrderStatus
  date: string;
  total: number; // <-- ADICIONE ESTA LINHA AQ
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  icon: string;
  timeAgo: string;
}

export interface DashboardStats {
  gmv: number;
  newUsers: number;
  ordersToday: number;
  criticalAlerts: number;
  gmvGrowth: number;
  usersGrowth: number;
  ordersGrowth: number;
}

export interface WeeklyData {
  label: string;
  value: number;
  isToday?: boolean;
}

export interface BillingType {
  label: string;
  percent: number;
  color: string;
}

export interface DashboardResponse {
  stats: DashboardStats;
  weeklyOrders: WeeklyData[];
  recentOrders: Order[];
  alerts: Alert[];
  billingByType: BillingType[];
}

// Tipagem baseada exatamente no seu JSON de retorno
export interface PedidoItem {
  id_itens_pedido: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
}

export interface Pedido {
  pedidoCotacaoId: number;
  numero_cotacao: string;
  clienteIdPedido: number;
  statusPedido: string;
  pedido_time: string;
  nomeCliente: string;
  emailCliente: string;
  fotoCliente: string;
  itens: PedidoItem[];
}

export interface ApiResponse<T> {
  mensagem: T[];
  registros: {
    total: number;
    paginas: number;
  };
}
