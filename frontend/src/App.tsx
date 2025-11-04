import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import type { Payment, InventoryCountItem, InventoryReport, NFeImportResult } from '@types/index';

// Contexts
import { AuthProvider, useAuth } from '@contexts/AuthContext';
import { CartProvider, useCart } from '@contexts/CartContext';
import { ShiftProvider, useShift } from '@contexts/ShiftContext';
import { DataProvider, useData } from '@contexts/DataContext';
import { ToastProvider, useToast } from '@components/shared/Toast';

// PDV Components
import PDVHeader from '@components/pdv/PDVHeader';
import ProductGrid from '@components/pdv/ProductGrid';
import CartDisplay from '@components/pdv/CartDisplay';
import PaymentModal from '@components/pdv/PaymentModal';
import VoiceCommandControl, { VoiceStatus } from '@components/pdv/VoiceCommandControl';

import Login from '@components/shared/Login';
import ModernPDV from '@components/pdv/ModernPDV';

// Modals
import OpenShiftModal from '@components/modals/OpenShiftModal';
import CloseShiftModal from '@components/modals/CloseShiftModal';
import ShiftMovementModal from '@components/modals/ShiftMovementModal';
import CustomerSearchModal from '@components/modals/CustomerSearchModal';
import DiscountModal from '@components/modals/DiscountModal';
import LoyaltyRedemptionModal from '@components/modals/LoyaltyRedemptionModal';

// Services
import * as geminiService from '@services/geminiService';
import apiClient from '@services/apiClient';
import { hasPermission } from '@services/authService';

// Lazy loaded components
const ERPDashboard = lazy(() => import('@components/erp/Dashboard'));
const HomologationPanel = lazy(() => import('@components/shared/HomologationPanel'));

type AppView = 'pdv' | 'erp';
type ShiftModal = 'close' | 'movement' | null;
type DiscountTarget = { type: 'total' } | { type: 'item'; itemId: string };

const AppContent: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { 
    cart, 
    selectedCustomer, 
    total, 
    subtotal, 
    promotionalDiscount, 
    loyaltyDiscountAmount, 
    loyaltyDiscount,
    addToCart, 
    updateQuantity, 
    clearCart, 
    setSelectedCustomer,
    applyDiscount,
    applyLoyaltyPoints
  } = useCart();
  const { currentShift, isShiftOpen, openShift, closeShift, recordMovement, refreshShift } = useShift();
  const { 
    products, 
    customers, 
    suppliers, 
    salesHistory, 
    users, 
    financials, 
    stockLevels, 
    stockMovements, 
    shiftHistory, 
    purchaseOrders,
    analyticsData,
    isLoadingData,
    refreshProducts,
    refreshCustomers,
    refreshSuppliers,
    refreshSalesHistory,
    refreshUsers,
    refreshFinancials,
    refreshInventory,
    refreshShiftHistory,
    refreshPurchaseOrders,
    loadAllData,
    clearData
  } = useData();
  const { showError, showSuccess } = useToast();

  // Local State
  const [currentView, setCurrentView] = useState<AppView>('pdv');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isCustomerSearchModalOpen, setCustomerSearchModalOpen] = useState(false);
  const [isDiscountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountTarget, setDiscountTarget] = useState<DiscountTarget | null>(null);
  const [isLoyaltyModalOpen, setLoyaltyModalOpen] = useState(false);
  const [isShiftOpenModalVisible, setShiftOpenModalVisible] = useState(false);
  const [activeShiftModal, setActiveShiftModal] = useState<ShiftModal>(null);
  const [movementType, setMovementType] = useState<'Suprimento' | 'Sangria'>('Sangria');
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [isHomologationPanelOpen, setHomologationPanelOpen] = useState(false);
  const [isOnline] = useState(true);
  const [isSyncing] = useState(false);

  // Check if shift is open on mount
  useEffect(() => {
    if (currentUser) {
      refreshShift();
    }
  }, [currentUser, refreshShift]);

  // Show shift modal if no shift is open (only for CASHIER role)
  useEffect(() => {
    if (currentUser && !currentShift && currentView === 'pdv') {
      // Administradores podem acessar sem caixa aberto
      if (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') {
        // Não força abertura de caixa para admins
        return;
      }
      // Para caixas, é obrigatório ter caixa aberto
      setShiftOpenModalVisible(true);
    }
  }, [currentUser, currentShift, currentView]);

  // Handlers for shift operations
  const handleOpenShift = useCallback(async (openingBalance: number) => {
    if (!currentUser) return;
    try {
      await openShift(openingBalance, currentUser.id, currentUser.name);
      setShiftOpenModalVisible(false);
      showSuccess('Caixa aberto com sucesso!');
    } catch (error) {
      showError('Não foi possível abrir o caixa.');
    }
  }, [currentUser, openShift, showSuccess, showError]);

  const handleCloseShift = useCallback(async (closingBalance: number) => {
    try {
      await closeShift(closingBalance);
      await refreshShiftHistory();
      setActiveShiftModal(null);
      setShiftOpenModalVisible(true);
      showSuccess('Caixa fechado com sucesso!');
    } catch (error) {
      showError('Não foi possível fechar o caixa.');
    }
  }, [closeShift, refreshShiftHistory, showSuccess, showError]);

  const handleRecordShiftMovement = useCallback(async (amount: number, reason: string) => {
    if (!currentUser) return;
    try {
      await recordMovement(movementType, amount, reason, currentUser.id);
      setActiveShiftModal(null);
      showSuccess(`${movementType} registrado com sucesso!`);
    } catch (error) {
      showError('Não foi possível registrar a movimentação.');
    }
  }, [currentUser, movementType, recordMovement, showSuccess, showError]);

  const openMovementModal = (type: 'Suprimento' | 'Sangria') => {
    setMovementType(type);
    setActiveShiftModal('movement');
  };

  // Discount handlers
  const handleOpenDiscountModal = useCallback((target: DiscountTarget) => {
    setDiscountTarget(target);
    setDiscountModalOpen(true);
  }, []);

  const handleApplyDiscount = useCallback((amount: number, type: 'fixed' | 'percentage') => {
    if (!discountTarget) return;
    applyDiscount(discountTarget, amount, type);
    setDiscountModalOpen(false);
    setDiscountTarget(null);
  }, [discountTarget, applyDiscount]);

  // Sale finalization
  const handleFinalizeSale = useCallback(async (payments: Payment[], changeGiven: number) => {
    try {
      const totalDiscountValue = promotionalDiscount + loyaltyDiscountAmount;
      let pointsEarned = 0;
      if (selectedCustomer) {
        pointsEarned = Math.floor(total / 10);
      }

      console.log('[App] Cart before mapping:', cart);
      
      const salePayload = {
        items: cart.map(item => {
          console.log('[App] Mapping cart item:', item.id, item);
          return {
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount?.amount || 0,
            total: item.price * item.quantity - (item.discount?.amount || 0),
          };
        }),
        shiftId: currentShift?.id,
        total,
        discount: totalDiscountValue,
        paymentMethod: payments[0]?.method || 'Dinheiro',
        payments,
        changeGiven,
        customerId: selectedCustomer?.id,
        loyaltyPointsEarned: pointsEarned,
        loyaltyPointsRedeemed: loyaltyDiscount.points,
        loyaltyDiscountAmount: loyaltyDiscount.amount,
      };

      console.log('[App] Sale Payload:', JSON.stringify(salePayload, null, 2));

      const { saleRecord, updatedShift } = await apiClient.post<{ saleRecord: any; updatedShift: any }>(
        '/sales',
        salePayload
      );

      if (updatedShift) {
        refreshShift();
      }

      await Promise.all([
        refreshInventory(),
        selectedCustomer && refreshCustomers(),
        payments.some(p => p.method === 'Fiado') && refreshFinancials(),
      ]);

      clearCart();
      setPaymentModalOpen(false);
      showSuccess('Venda finalizada com sucesso!');
    } catch (error) {
      const errorMessage = (error as any)?.message || 'Erro ao finalizar a venda';
      showError(errorMessage);
    }
  }, [
    cart,
    total,
    promotionalDiscount,
    loyaltyDiscountAmount,
    loyaltyDiscount,
    selectedCustomer,
    clearCart,
    refreshShift,
    refreshInventory,
    refreshCustomers,
    refreshFinancials,
    showSuccess,
    showError,
  ]);

  // Voice command
  const handleVoiceCommand = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showError('Reconhecimento de voz não é suportado neste navegador.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setVoiceStatus('listening');
    recognition.onend = () => { if (voiceStatus !== 'processing') setVoiceStatus('idle'); };
    recognition.onerror = () => setVoiceStatus('error');

    recognition.onresult = async (event: any) => {
      const command = event.results[0][0].transcript;
      setVoiceStatus('processing');
      try {
        const itemsToAdd = await geminiService.parseAddToCartCommand(command, products);
        if (itemsToAdd.length > 0) {
          itemsToAdd.forEach(item => {
            const product = products.find(p => p.name.toLowerCase() === item.productName.toLowerCase());
            if (product) addToCart(product, item.quantity);
          });
          showSuccess('Produtos adicionados ao carrinho!');
        }
        setVoiceStatus('idle');
      } catch (e) {
        showError('Não foi possível entender o comando.');
        setVoiceStatus('error');
      }
    };
    recognition.start();
  }, [products, addToCart, voiceStatus, showSuccess, showError]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isAnyModalOpen = 
        isPaymentModalOpen || 
        isHomologationPanelOpen || 
        !!activeShiftModal || 
        isShiftOpenModalVisible || 
        isCustomerSearchModalOpen || 
        isDiscountModalOpen || 
        isLoyaltyModalOpen;
      
      if (currentView !== 'pdv' || isAnyModalOpen) return;

      if (event.key === 'F1') {
        event.preventDefault();
        document.getElementById('product-search-input')?.focus();
      } else if (event.key === 'F2') {
        event.preventDefault();
        if (cart.length > 0) setPaymentModalOpen(true);
      } else if (event.ctrlKey && (event.key === 'c' || event.key === 'C')) {
        event.preventDefault();
        if (cart.length > 0) clearCart();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    currentView,
    cart.length,
    clearCart,
    isPaymentModalOpen,
    isHomologationPanelOpen,
    activeShiftModal,
    isShiftOpenModalVisible,
    isCustomerSearchModalOpen,
    isDiscountModalOpen,
    isLoyaltyModalOpen,
  ]);

  // ERP CRUD Handlers
  const handleAddProduct = useCallback(async (productData: any) => {
    try {
      await apiClient.post('/products', productData);
      await Promise.all([refreshProducts(), refreshInventory()]);
      showSuccess('Produto criado com sucesso!');
    } catch (error) {
      showError('Erro ao criar produto.');
    }
  }, [refreshProducts, refreshInventory, showSuccess, showError]);

  const handleUpdateProduct = useCallback(async (productData: any) => {
    try {
      await apiClient.put(`/products/${productData.id}`, productData);
      await refreshProducts();
      showSuccess('Produto atualizado com sucesso!');
    } catch (error) {
      showError('Erro ao atualizar produto.');
    }
  }, [refreshProducts, showSuccess, showError]);

  const handleDeleteProduct = useCallback(async (productId: string) => {
    try {
      await apiClient.delete(`/products/${productId}`);
      await Promise.all([refreshProducts(), refreshInventory()]);
      showSuccess('Produto excluído com sucesso!');
    } catch (error) {
      showError('Erro ao excluir produto.');
    }
  }, [refreshProducts, refreshInventory, showSuccess, showError]);

  const handleAddCustomer = useCallback(async (customerData: any) => {
    try {
      await apiClient.post('/customers', customerData);
      await refreshCustomers();
      showSuccess('Cliente criado com sucesso!');
    } catch (error) {
      showError('Erro ao criar cliente.');
    }
  }, [refreshCustomers, showSuccess, showError]);

  const handleUpdateCustomer = useCallback(async (customerData: any) => {
    try {
      await apiClient.put(`/customers/${customerData.id}`, customerData);
      await refreshCustomers();
      showSuccess('Cliente atualizado com sucesso!');
    } catch (error) {
      showError('Erro ao atualizar cliente.');
    }
  }, [refreshCustomers, showSuccess, showError]);

  const handleDeleteCustomer = useCallback(async (customerId: string) => {
    try {
      await apiClient.delete(`/customers/${customerId}`);
      await refreshCustomers();
      showSuccess('Cliente excluído com sucesso!');
    } catch (error) {
      showError('Erro ao excluir cliente.');
    }
  }, [refreshCustomers, showSuccess, showError]);

  const handleSettleCustomerDebt = useCallback(async (customerId: string) => {
    try {
      await apiClient.post(`/financials/settle-debt/${customerId}`);
      await Promise.all([refreshFinancials(), refreshCustomers()]);
      showSuccess('Débito quitado com sucesso!');
    } catch (error) {
      showError('Erro ao quitar débito.');
    }
  }, [refreshFinancials, refreshCustomers, showSuccess, showError]);

  const handleAddSupplier = useCallback(async (supplierData: any) => {
    try {
      await apiClient.post('/suppliers', supplierData);
      await refreshSuppliers();
      showSuccess('Fornecedor criado com sucesso!');
    } catch (error) {
      showError('Erro ao criar fornecedor.');
    }
  }, [refreshSuppliers, showSuccess, showError]);

  const handleUpdateSupplier = useCallback(async (supplierData: any) => {
    try {
      await apiClient.put(`/suppliers/${supplierData.id}`, supplierData);
      await refreshSuppliers();
      showSuccess('Fornecedor atualizado com sucesso!');
    } catch (error) {
      showError('Erro ao atualizar fornecedor.');
    }
  }, [refreshSuppliers, showSuccess, showError]);

  const handleDeleteSupplier = useCallback(async (supplierId: string) => {
    try {
      await apiClient.delete(`/suppliers/${supplierId}`);
      await refreshSuppliers();
      showSuccess('Fornecedor excluído com sucesso!');
    } catch (error) {
      showError('Erro ao excluir fornecedor.');
    }
  }, [refreshSuppliers, showSuccess, showError]);

  const handleAddUser = useCallback(async (userData: any) => {
    try {
      const payload = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'USER',
        active: userData.status === 'Active',
      };
      await apiClient.post('/users', payload);
      await refreshUsers();
      showSuccess('Usuário criado com sucesso!');
    } catch (error) {
      showError('Erro ao criar usuário.');
    }
  }, [refreshUsers, showSuccess, showError]);

  const handleUpdateUser = useCallback(async (userData: any) => {
    try {
      const payload: any = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        active: userData.status === 'Active',
      };
      if (userData.password) {
        payload.password = userData.password;
      }
      await apiClient.put(`/users/${userData.id}`, payload);
      await refreshUsers();
      showSuccess('Usuário atualizado com sucesso!');
    } catch (error) {
      showError('Erro ao atualizar usuário.');
    }
  }, [refreshUsers, showSuccess, showError]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    try {
      await apiClient.delete(`/users/${userId}`);
      await refreshUsers();
      showSuccess('Usuário excluído com sucesso!');
    } catch (error) {
      showError('Erro ao excluir usuário.');
    }
  }, [refreshUsers, showSuccess, showError]);

  const handleAddPurchaseOrder = useCallback(async (orderData: any) => {
    try {
      await apiClient.post('/purchasing/orders', orderData);
      await refreshPurchaseOrders();
      showSuccess('Pedido de compra criado com sucesso!');
    } catch (error) {
      showError('Erro ao criar pedido de compra.');
    }
  }, [refreshPurchaseOrders, showSuccess, showError]);

  const handleUpdatePurchaseOrderStatus = useCallback(async (orderId: string, status: 'Recebido' | 'Cancelado') => {
    try {
      await apiClient.patch(`/purchasing/orders/${orderId}/status`, { status });
      await refreshPurchaseOrders();
      if (status === 'Recebido') {
        await refreshInventory();
      }
      showSuccess(`Pedido ${status.toLowerCase()} com sucesso!`);
    } catch (error) {
      showError('Erro ao atualizar pedido.');
    }
  }, [refreshPurchaseOrders, refreshInventory, showSuccess, showError]);

  const handleUpdateTransactionStatus = useCallback(async (transactionId: string) => {
    try {
      await apiClient.patch(`/financials/transactions/${transactionId}/status`, { status: 'Pago' });
      await refreshFinancials();
      showSuccess('Transação atualizada com sucesso!');
    } catch (error) {
      showError('Erro ao atualizar transação.');
    }
  }, [refreshFinancials, showSuccess, showError]);

  const handleProcessInventoryCount = useCallback(async (items: InventoryCountItem[]): Promise<InventoryReport> => {
    try {
      const report = await apiClient.post<InventoryReport>('/inventory/count', { counts: items });
      await refreshInventory();
      showSuccess('Contagem processada com sucesso!');
      return report;
    } catch (error) {
      showError('Erro ao processar contagem.');
      throw error;
    }
  }, [refreshInventory, showSuccess, showError]);

  const handleNFeImport = useCallback(async (file: File): Promise<NFeImportResult> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await apiClient.post<NFeImportResult>('/inventory/import-nfe', formData, true);
      await Promise.all([refreshProducts(), refreshSuppliers(), refreshInventory()]);
      showSuccess('NF-e importada com sucesso!');
      return result;
    } catch (error) {
      showError('Erro ao importar NF-e.');
      throw error;
    }
  }, [refreshProducts, refreshSuppliers, refreshInventory, showSuccess, showError]);

  const handleLoginSuccess = useCallback(async (user: any) => {
    // Define view baseado no role do usuário
    if (user.role === 'CASHIER') {
      setCurrentView('pdv');
    } else {
      setCurrentView('pdv'); // Sempre começa no PDV
    }
    await loadAllData();
    await refreshShift();
  }, [loadAllData, refreshShift]);

  if (!currentUser) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  if (isLoadingData) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-brand-primary text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-accent mb-4"></div>
        <p>Carregando dados...</p>
        <p className="text-sm text-brand-subtle">Bem-vindo(a), {currentUser.name}!</p>
      </div>
    );
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentView === 'erp' && hasPermission(currentUser.role, 'view_dashboard')) {
    return (
      <>
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-brand-primary text-white">Carregando...</div>}>
          <ERPDashboard
            currentUser={currentUser}
          analyticsData={analyticsData}
          products={products}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          customers={customers}
          onAddCustomer={handleAddCustomer}
          onUpdateCustomer={handleUpdateCustomer}
          onDeleteCustomer={handleDeleteCustomer}
          onSettleCustomerDebt={handleSettleCustomerDebt}
          suppliers={suppliers}
          onAddSupplier={handleAddSupplier}
          onUpdateSupplier={handleUpdateSupplier}
          onDeleteSupplier={handleDeleteSupplier}
          salesHistory={salesHistory}
          shiftHistory={shiftHistory}
          users={users}
          onAddUser={handleAddUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          financials={financials}
          onUpdateTransactionStatus={handleUpdateTransactionStatus}
          stockLevels={stockLevels}
          stockMovements={stockMovements}
          purchaseOrders={purchaseOrders}
          onAddPurchaseOrder={handleAddPurchaseOrder}
          onUpdatePurchaseOrderStatus={handleUpdatePurchaseOrderStatus}
          onProcessInventoryCount={handleProcessInventoryCount}
          onNFeImport={handleNFeImport}
          onBackToPDV={() => {
            if (currentShift && currentShift.status === 'OPEN') {
              if (confirm('Você tem um caixa aberto. Deseja fechá-lo antes de sair?')) {
                setActiveShiftModal('close');
              } else {
                setCurrentView('pdv');
              }
            } else {
              setCurrentView('pdv');
            }
          }}
          onLogout={() => {
            if (currentShift && currentShift.status === 'OPEN') {
              showError('Por favor, feche o caixa antes de fazer logout!');
            } else {
              logout();
            }
          }}
          />
        </Suspense>

        {/* Modals que precisam aparecer mesmo no ERP */}
      {activeShiftModal === 'close' && currentShift && (
        <CloseShiftModal 
          shift={currentShift} 
          onClose={() => {
            setActiveShiftModal(null);
          }} 
          onSubmit={async (closingBalance: number) => {
            await handleCloseShift(closingBalance);
            setCurrentView('pdv');
          }} 
        />
      )}
    </>
    );
  }

  const isPdvLocked = !isShiftOpen;

  return (
    <div className="flex flex-col h-screen font-sans bg-brand-primary text-brand-text">
      <PDVHeader
        isOnline={isOnline}
        onToggleOnline={() => {}}
        pendingSalesCount={0}
        isSyncing={isSyncing}
        onOpenHomologationPanel={() => setHomologationPanelOpen(true)}
        onOpenERP={() => {
          if (currentShift && currentShift.status === 'OPEN') {
            if (confirm('Você tem um caixa aberto. Deseja continuar sem fechar o caixa?\n\nATENÇÃO: Recomendamos fechar o caixa antes de acessar o ERP.')) {
              setCurrentView('erp');
            }
          } else {
            setCurrentView('erp');
          }
        }}
        shiftStatus={currentShift?.status === 'OPEN' ? 'Aberto' : 'Fechado'}
        onCloseShift={() => setActiveShiftModal('close')}
        onSuprimento={() => openMovementModal('Suprimento')}
        onSangria={() => openMovementModal('Sangria')}
        currentUser={currentUser}
        onLogout={logout}
      />
      <main className="flex flex-1 overflow-hidden relative">
        {isPdvLocked && currentView === 'pdv' && (
          <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center p-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-gray-700 shadow-2xl">
              <div className="mb-4">
                <svg 
                  className="w-20 h-20 mx-auto text-blue-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">🔒 Caixa Fechado</h2>
              <p className="text-gray-400 mb-8 text-lg">Abra o caixa para iniciar as vendas</p>
              <button
                onClick={() => setShiftOpenModalVisible(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-600/30 inline-flex items-center gap-3 text-lg"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" 
                  />
                </svg>
                Abrir Caixa
              </button>
            </div>
          </div>
        )}
        <div className={`flex-1 ${isPdvLocked ? 'pointer-events-none blur-sm' : ''}`}>
          <ModernPDV
            products={filteredProducts}
            cart={cart}
            selectedCustomer={selectedCustomer}
            onAddToCart={p => addToCart(p, 1)}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={(productId) => updateQuantity(productId, 0)}
            onClearCart={clearCart}
            onSelectCustomer={() => setCustomerSearchModalOpen(true)}
            onApplyDiscount={handleOpenDiscountModal}
            onRedeemPoints={() => setLoyaltyModalOpen(true)}
            onFinalizeSale={() => setPaymentModalOpen(true)}
          />
        </div>
      </main>

      {isShiftOpenModalVisible && <OpenShiftModal onOpen={handleOpenShift} />}

      {activeShiftModal === 'close' && currentShift && (
        <CloseShiftModal 
          shift={currentShift} 
          onClose={() => {
            setActiveShiftModal(null);
            if (currentView === 'erp') {
              setCurrentView('pdv');
            }
          }} 
          onSubmit={handleCloseShift} 
        />
      )}

      {activeShiftModal === 'movement' && currentShift && (
        <ShiftMovementModal type={movementType} onClose={() => setActiveShiftModal(null)} onSubmit={handleRecordShiftMovement} />
      )}

      {isCustomerSearchModalOpen && (
        <CustomerSearchModal
          customers={customers}
          onClose={() => setCustomerSearchModalOpen(false)}
          onSelect={customer => {
            setSelectedCustomer(customer);
            setCustomerSearchModalOpen(false);
          }}
        />
      )}

      {isDiscountModalOpen && discountTarget && (
        <DiscountModal target={discountTarget} onClose={() => setDiscountModalOpen(false)} onSubmit={handleApplyDiscount} />
      )}

      {isLoyaltyModalOpen && selectedCustomer && (
        <LoyaltyRedemptionModal
          customer={selectedCustomer}
          cartTotal={total + loyaltyDiscountAmount}
          onClose={() => setLoyaltyModalOpen(false)}
          onSubmit={applyLoyaltyPoints}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal total={total} onFinalize={handleFinalizeSale} onCancel={() => setPaymentModalOpen(false)} selectedCustomer={selectedCustomer} />
      )}

      {isHomologationPanelOpen && (
        <Suspense fallback={<div>Carregando...</div>}>
          <HomologationPanel onClose={() => setHomologationPanelOpen(false)} />
        </Suspense>
      )}

    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          <ShiftProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </ShiftProvider>
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
