import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { AdminLayout } from '@/components/adminLayout';
import { StatCard } from '@/components/start';
import { OrderRow } from '@/components/OrderRow';
import { formatCurrency } from '@/utils/format';
import {
  ApiResponse,
  OrderStatus,
  Pedido,
  PedidoItem,
} from '@/types/dashboard';

export function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: pedidosData, isLoading: loadingPedidos } = useQuery<
    ApiResponse<Pedido>
  >({
    queryKey: ['pedidos-recentes'],
    queryFn: async () => (await api.get('/v1/pedidos')).data,
  });

  const { data: clientesData } = useQuery({
    queryKey: ['total-clientes'],
    queryFn: async () => (await api.get('/v1/clientes')).data,
  });

  const { data: empresasData } = useQuery({
    queryKey: ['total-empresas'],
    queryFn: async () => (await api.get('/v1/empresas')).data,
  });

  const { data: produtosData } = useQuery({
    queryKey: ['total-produtos'],
    queryFn: async () => (await api.get('/v1/produtos')).data,
  });

  // Cálculo do Volume Total (GMV) - Somando preco_total de todos os itens de todos os pedidos
  const totalGMV = useMemo(() => {
    return (
      pedidosData?.mensagem?.reduce((acc, pedido) => {
        const totalDoPedido = pedido.itens.reduce(
          (sum, item) => sum + (item.preco_total || 0),
          0
        );
        return acc + totalDoPedido;
      }, 0) || 0
    );
  }, [pedidosData]);

  const filteredOrders =
    pedidosData?.mensagem?.filter((o) => {
      const q = searchQuery.toLowerCase();
      return (
        o.numero_cotacao.toLowerCase().includes(q) ||
        o.nomeCliente.toLowerCase().includes(q)
      );
    }) || [];

  return (
    <AdminLayout>
      <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-black text-slate-900">
            Dashboard de Pedidos
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon="payments"
            iconBg="bg-emerald-100" // Adicionado
            iconText="text-emerald-600" // Adicionado
            label="Faturamento Total"
            value={formatCurrency(totalGMV)}
            growth={12.5} // Opcional: agora você pode passar números para o gráfico de tendência
          />

          <StatCard
            icon="shopping_cart"
            iconBg="bg-orange-100" // Adicionado
            iconText="text-orange-600" // Adicionado
            label="Total de Pedidos"
            value={pedidosData?.registros?.total || 0}
          />

          <StatCard
            icon="group"
            iconBg="bg-blue-100" // Adicionado
            iconText="text-blue-600" // Adicionado
            label="Clientes"
            value={clientesData?.registros?.total || 0}
          />

          <StatCard
            icon="storefront"
            iconBg="bg-purple-100" // Adicionado
            iconText="text-purple-600" // Adicionado
            label="Vendedores"
            value={empresasData?.registros?.total || 0}
          />
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Pedido / Cliente
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Data
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingPedidos ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center animate-pulse">
                    Carregando dados...
                  </td>
                </tr>
              ) : (
                filteredOrders.map((pedido) => {
                  // Calcula o total deste pedido específico
                  const rowTotal = pedido.itens.reduce(
                    (acc, item) => acc + (item.preco_total || 0),
                    0
                  );

                  return (
                    <OrderRow
                      key={pedido.pedidoCotacaoId}
                      order={{
                        // Converte ID number para string se o componente exigir
                        id: String(pedido.pedidoCotacaoId),
                        // Pega os primeiros 8 caracteres do UUID da cotação
                        code: pedido.numero_cotacao
                          .substring(0, 8)
                          .toUpperCase(),
                        customer: {
                          name: pedido.nomeCliente,
                          // Resolve o erro: Property 'initials' and 'color' are missing
                          initials: pedido.nomeCliente
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .substring(0, 2),
                          color: 'bg-orange-500',
                        },
                        // Resolve o erro de OrderStatus usando casting
                        status: pedido.statusPedido as OrderStatus,
                        total: rowTotal,
                        date: new Date(pedido.pedido_time).toLocaleDateString(
                          'pt-AO'
                        ),
                      }}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
