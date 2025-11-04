
import React from 'react';
import KpiCard from './KpiCard';
import SalesTrendChart from './SalesTrendChart';
import PaymentMethodDonut from './PaymentMethodDonut';
import TopItemsList from './TopItemsList';
import GeminiAnalyzer from '@components/shared/GeminiAnalyzer';
import type { SaleRecord, Product } from '@types/index';


interface MainDashboardProps {
    data: any; // Analytics data
    salesHistory: SaleRecord[];
    products: Product[];
}

const CurrencyBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const MainDashboard: React.FC<MainDashboardProps> = ({ data, salesHistory, products }) => {
    if (!data) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
                    <p className="text-brand-subtle">Carregando analytics...</p>
                </div>
            </div>
        );
    }

    // Se data não tem a estrutura esperada, mostra dashboard básico
    if (!data.kpis || !data.charts || !data.lists) {
        return (
            <div>
                <h2 className="text-3xl font-bold text-white mb-6">Dashboard de Performance</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <KpiCard title="Total de Produtos" value={data.totalProducts || 0} />
                    <KpiCard title="Total de Clientes" value={data.totalCustomers || 0} />
                    <KpiCard title="Total de Vendas" value={data.totalSales || 0} />
                    <KpiCard title="Receita Total" value={CurrencyBRL.format(data.totalRevenue || 0)} variant="success" />
                    <KpiCard title="Produtos em Estoque Baixo" value={data.lowStockProducts || 0} variant="danger" />
                    <KpiCard title="Contas a Receber" value={data.pendingReceivables || 0} variant="warning" />
                </div>
                <div className="bg-brand-secondary rounded-lg border border-brand-border p-8 text-center">
                    <p className="text-brand-subtle text-lg">Realize vendas para ver estatísticas detalhadas e gráficos!</p>
                </div>
            </div>
        );
    }

    const { kpis, charts, lists } = data;

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-4">Dashboard de Performance</h2>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
                <KpiCard title="Vendas do Dia" value={CurrencyBRL.format(kpis.totalSalesToday.value)} trend={kpis.totalSalesToday.trend} />
                <KpiCard title="Ticket Médio" value={CurrencyBRL.format(kpis.ticketMedio.value)} trend={kpis.ticketMedio.trend} />
                <KpiCard title="Novos Clientes" value={kpis.newCustomersToday.value} trend={kpis.newCustomersToday.trend} />
                <KpiCard title="Itens Vendidos" value={kpis.itemsSoldToday.value} trend={kpis.itemsSoldToday.trend} />
                <KpiCard title="A Pagar" value={CurrencyBRL.format(kpis.totalPayablePending)} variant="danger" />
                <KpiCard title="A Receber" value={CurrencyBRL.format(kpis.totalReceivablePending)} variant="success" />
            </div>

            {/* AI Analyzer */}
            <GeminiAnalyzer salesHistory={salesHistory} products={products} />

            {/* Charts and Lists */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
                <div className="xl:col-span-2 bg-brand-secondary rounded-lg border border-brand-border p-4">
                    <h3 className="text-lg font-bold text-white mb-3">Tendência de Vendas (Últimos 7 dias)</h3>
                    {charts.salesTrend && charts.salesTrend.length > 1 ? (
                       <SalesTrendChart data={charts.salesTrend} />
                    ) : (
                        <div className="h-48 flex items-center justify-center text-brand-subtle">Dados insuficientes</div>
                    )}
                </div>
                <div className="bg-brand-secondary rounded-lg border border-brand-border p-4">
                    <h3 className="text-lg font-bold text-white mb-3">Faturamento por Pagamento</h3>
                    {charts.paymentMethods && charts.paymentMethods.length > 0 ? (
                        <PaymentMethodDonut data={charts.paymentMethods} />
                    ) : (
                        <div className="h-48 flex items-center justify-center text-brand-subtle">Sem dados</div>
                    )}
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-brand-secondary rounded-lg border border-brand-border p-4">
                    <h3 className="text-lg font-bold text-white mb-3">Top 5 Produtos</h3>
                    <TopItemsList items={lists.topProducts} valueType="currency" />
                </div>
                <div className="bg-brand-secondary rounded-lg border border-brand-border p-4">
                    <h3 className="text-lg font-bold text-white mb-3">Top 5 Clientes</h3>
                    <TopItemsList items={lists.topCustomers} valueType="currency" />
                </div>
             </div>
        </div>
    );
};

export default MainDashboard;
