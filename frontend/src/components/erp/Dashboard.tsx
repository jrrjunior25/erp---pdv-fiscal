

import React, { useState, useMemo } from 'react';
import type { Product, SaleRecord, User, AccountTransaction, StockLevel, StockMovement, Customer, Supplier, NFeImportResult, CashShift, Permission, PurchaseOrder, InventoryCountItem, InventoryReport } from '@types';
import ProductManagement from './ProductManagement';
import SalesHistory from './SalesHistory';
import UserManagement from './UserManagement';
import Financials from './Financials';
import InventoryManagement from './InventoryManagement';
import CustomerManagement from './CustomerManagement';
import SupplierManagement from './SupplierManagement';
import ShiftManagement from './ShiftManagement';
import PurchaseOrderManagement from './PurchaseOrderManagement';
import MainDashboard from './Dashboard/MainDashboard';
import SettingsManagement from './SettingsManagement';
import ReportsAndAnalytics from './ReportsAndAnalytics';
import FiscalManagement from './FiscalManagement';
import { hasPermission } from '@services/authService';


// Ícones consolidados
const Icons = {
  Dashboard: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
    </svg>
  ),
  Products: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  ),
  Customers: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.53-2.473M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-4.67c.12-.241.252-.477.396-.702a.75.75 0 0 1 1.256-.217L21 13.5M15 19.128a9.38 9.38 0 0 0 2.625.372" />
    </svg>
  ),
  Suppliers: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72L4.318 3.44A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
    </svg>
  ),
  Inventory: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  ),
  Financial: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  ),
  Reports: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
    </svg>
  ),
  Operations: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
    </svg>
  ),
  Users: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962a3.75 3.75 0 1 0-5.207 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  ),
  Settings: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
  Back: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
  ),
  Logout: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  )
};



interface ERPDashboardProps {
  currentUser: User | null;
  analyticsData: any;
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  onUpdateProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'loyaltyPoints' | 'createdAt' | 'creditLimit' | 'currentBalance'>) => Promise<void>;
  onUpdateCustomer: (customer: Customer) => Promise<void>;
  onDeleteCustomer: (customerId: string) => Promise<void>;
  onSettleCustomerDebt: (customerId: string) => Promise<void>;

  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  onUpdateSupplier: (supplier: Supplier) => Promise<void>;
  onDeleteSupplier: (supplierId: string) => Promise<void>;

  salesHistory: SaleRecord[];
  shiftHistory: CashShift[];
  
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => Promise<void>;
  onUpdateUser: (user: User) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;

  financials: AccountTransaction[];
  onUpdateTransactionStatus: (transactionId: string) => Promise<void>;
  stockLevels: StockLevel[];
  stockMovements: StockMovement[];
  
  purchaseOrders: PurchaseOrder[];
  onAddPurchaseOrder: (orderData: Omit<PurchaseOrder, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  onUpdatePurchaseOrderStatus: (orderId: string, status: 'Recebido' | 'Cancelado') => Promise<void>;

  onProcessInventoryCount: (items: InventoryCountItem[]) => Promise<InventoryReport>;
  onNFeImport: (file: File) => Promise<NFeImportResult>;
  onBackToPDV: () => void;
  onLogout: () => void;
}

type ERPView = 'dashboard' | 'products' | 'customers' | 'suppliers' | 'inventory' | 'purchasing' | 'sales' | 'shifts' | 'financials' | 'reports' | 'fiscal' | 'users' | 'settings';

const ERPDashboard: React.FC<ERPDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<ERPView>('dashboard');

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return props.analyticsData ? (
          <MainDashboard 
            data={props.analyticsData} 
            salesHistory={props.salesHistory} 
            products={props.products} 
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Carregando dashboard...</span>
          </div>
        );
      case 'products':
        return (
          <ProductManagement 
            products={props.products} 
            onAdd={props.onAddProduct}
            onUpdate={props.onUpdateProduct}
            onDelete={props.onDeleteProduct}
          />
        );
      case 'customers':
        return (
          <CustomerManagement
            customers={props.customers}
            onAdd={props.onAddCustomer}
            onUpdate={props.onUpdateCustomer}
            onDelete={props.onDeleteCustomer}
            onSettleDebt={props.onSettleCustomerDebt}
          />
        );
      case 'suppliers':
        return (
          <SupplierManagement
            suppliers={props.suppliers}
            onAdd={props.onAddSupplier}
            onUpdate={props.onUpdateSupplier}
            onDelete={props.onDeleteSupplier}
          />
        );
      case 'inventory':
        return (
          <InventoryManagement 
            stockLevels={props.stockLevels} 
            stockMovements={props.stockMovements}
            products={props.products}
            onProcessInventoryCount={props.onProcessInventoryCount}
            onNFeImport={props.onNFeImport}
          />
        );
      case 'purchasing':
        return (
          <PurchaseOrderManagement
            purchaseOrders={props.purchaseOrders}
            suppliers={props.suppliers}
            products={props.products}
            onAdd={props.onAddPurchaseOrder}
            onUpdateStatus={props.onUpdatePurchaseOrderStatus}
          />
        );
      case 'sales':
        return <SalesHistory sales={props.salesHistory} />;
      case 'shifts':
        return <ShiftManagement shifts={props.shiftHistory} />;
      case 'financials':
        return (
          <Financials 
            transactions={props.financials} 
            onUpdateStatus={props.onUpdateTransactionStatus} 
          />
        );
      case 'reports':
        return <ReportsAndAnalytics />;
      case 'fiscal':
        return <FiscalManagement salesHistory={props.salesHistory} />;
      case 'users':
        return (
          <UserManagement 
            users={props.users} 
            onAdd={props.onAddUser}
            onUpdate={props.onUpdateUser}
            onDelete={props.onDeleteUser}
          />
        );
      case 'settings':
        return <SettingsManagement />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <span className="text-gray-500">Selecione uma opção no menu</span>
          </div>
        );
    }
  };

  const NavItem: React.FC<{
    label: string;
    view: ERPView;
    icon: React.ReactNode;
  }> = ({ label, view, icon }) => (
    <li>
      <button
        onClick={() => setActiveView(view)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
          activeView === view 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
            : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
        }`}
      >
        {icon}
        <span className="font-medium text-sm">{label}</span>
      </button>
    </li>
  );
  
  // Configuração do menu reorganizada e otimizada
  const navItemsConfig: { label: string; view: ERPView; icon: React.ReactNode; permission: Permission; section: string }[] = [
    // Dashboard Principal
    { label: 'Dashboard', view: 'dashboard', icon: <Icons.Dashboard className="w-5 h-5" />, permission: 'view_dashboard', section: 'Principal' },
    
    // Cadastros Básicos
    { label: 'Produtos', view: 'products', icon: <Icons.Products className="w-5 h-5" />, permission: 'manage_products', section: 'Cadastros' },
    { label: 'Clientes', view: 'customers', icon: <Icons.Customers className="w-5 h-5" />, permission: 'manage_customers', section: 'Cadastros' },
    { label: 'Fornecedores', view: 'suppliers', icon: <Icons.Suppliers className="w-5 h-5" />, permission: 'manage_suppliers', section: 'Cadastros' },
    
    // Operações
    { label: 'Estoque', view: 'inventory', icon: <Icons.Inventory className="w-5 h-5" />, permission: 'manage_inventory', section: 'Operações' },
    { label: 'Compras', view: 'purchasing', icon: <Icons.Operations className="w-5 h-5" />, permission: 'manage_purchasing', section: 'Operações' },
    { label: 'Vendas', view: 'sales', icon: <Icons.Reports className="w-5 h-5" />, permission: 'view_reports', section: 'Operações' },
    { label: 'Turnos', view: 'shifts', icon: <Icons.Operations className="w-5 h-5" />, permission: 'view_reports', section: 'Operações' },
    
    // Financeiro
    { label: 'Financeiro', view: 'financials', icon: <Icons.Financial className="w-5 h-5" />, permission: 'manage_financials', section: 'Financeiro' },
    
    // Relatórios
    { label: 'Relatórios', view: 'reports', icon: <Icons.Reports className="w-5 h-5" />, permission: 'view_reports', section: 'Relatórios' },
    { label: 'Fiscal', view: 'fiscal', icon: <Icons.Operations className="w-5 h-5" />, permission: 'manage_financials', section: 'Relatórios' },
    
    // Sistema
    { label: 'Usuários', view: 'users', icon: <Icons.Users className="w-5 h-5" />, permission: 'manage_users', section: 'Sistema' },
    { label: 'Configurações', view: 'settings', icon: <Icons.Settings className="w-5 h-5" />, permission: 'manage_users', section: 'Sistema' },
  ];

  const visibleNavItems = useMemo(() => {
    if (!props.currentUser) return [];
    return navItemsConfig.filter(item => hasPermission(props.currentUser!.role, item.permission));
  }, [props.currentUser]);
  
  const navSections = useMemo(() => {
    const sections: Record<string, typeof visibleNavItems> = {};
    for (const item of visibleNavItems) {
        if (!sections[item.section]) {
            sections[item.section] = [];
        }
        sections[item.section].push(item);
    }
    return sections;
  }, [visibleNavItems]);


  return (
    <div className="flex h-screen font-sans bg-brand-primary text-brand-text">
      <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col border-r border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">ERP + PDV</h1>
              <p className="text-xs text-gray-400">Sistema Integrado</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            {Object.entries(navSections).map(([section, items]) => (
              <div key={section}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {section}
                </h3>
                <ul className="space-y-1">
                  {items.map(item => (
                    <NavItem key={item.view} {...item} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <button
            onClick={props.onBackToPDV}
            className="flex items-center justify-center gap-2 w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 text-white font-medium shadow-md"
          >
            <Icons.Back className="w-4 h-4" />
            <span>Voltar ao PDV</span>
          </button>
          <button
            onClick={props.onLogout}
            className="flex items-center justify-center gap-2 w-full p-3 bg-gray-700 hover:bg-red-600 rounded-lg transition-all duration-200 text-gray-300 hover:text-white font-medium shadow-md"
          >
            <Icons.Logout className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
          {props.currentUser ? renderContent() : (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Carregando usuário...</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ERPDashboard;