import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Plus, 
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { nfeService, IssueNFERequest, NFEItem, NFERecipient } from '../../services/nfeService';
import productService from '../../services/modules/productService';
import apiClient from '../../services/apiClient';

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  ncm?: string;
  cfop?: string;
  cstIcms?: string;
  cstPis?: string;
  cstCofins?: string;
  aliqIcms?: number;
  origem?: string;
}

interface Customer {
  id: string;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface NFE {
  id: string;
  number: number;
  series: number;
  key: string;
  status: string;
  createdAt: string;
  protocol?: string;
}

export const NFEManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'issue' | 'list'>('list');
  const [nfes, setNfes] = useState<NFE[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [sefazStatus, setSefazStatus] = useState<{ online: boolean; message: string } | null>(null);

  // Form states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<(NFEItem & { product: Product })[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('DINHEIRO');
  const [transportModality, setTransportModality] = useState('9');
  const [observations, setObservations] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    loadNFEs();
    loadProducts();
    loadCustomers();
    checkSefazStatus();
  }, []);

  const loadNFEs = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/fiscal/nfe');
      setNfes(data);
    } catch (error) {
      console.error('Erro ao carregar NFEs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      console.log('Carregando produtos...');
      const response = await productService.getAll();
      console.log('Resposta da API de produtos:', response);
      
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && Array.isArray(response.data)) {
        data = response.data;
      } else if (response && response.products && Array.isArray(response.products)) {
        data = response.products;
      }
      
      console.log(`${data.length} produtos carregados`);
      setProducts(data);
    } catch (error: any) {
      console.error('Erro ao carregar produtos:', error);
      if (error.message?.includes('autenticação') || error.message?.includes('401')) {
        alert('⚠️ Sessão expirada. Faça login novamente.');
      }
      setProducts([]);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await apiClient.get('/customers');
      setCustomers(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const checkSefazStatus = async () => {
    try {
      const status = await apiClient.get('/fiscal/sefaz/status');
      setSefazStatus(status);
    } catch (error) {
      console.error('Erro ao verificar status SEFAZ:', error);
    }
  };

  const addProduct = (product: Product) => {
    const existingIndex = selectedProducts.findIndex(p => p.productId === product.id);
    
    if (existingIndex >= 0) {
      const updated = [...selectedProducts];
      updated[existingIndex].quantity += 1;
      setSelectedProducts(updated);
    } else {
      setSelectedProducts([...selectedProducts, {
        productId: product.id,
        name: product.name,
        ncm: product.ncm || '00000000',
        cfop: product.cfop || '5102',
        quantity: 1,
        price: product.price,
        cstIcms: product.cstIcms || '102',
        cstPis: product.cstPis || '07',
        cstCofins: product.cstCofins || '07',
        aliqIcms: product.aliqIcms || 0,
        origem: product.origem || '0',
        product
      }]);
    }
  };

  const updateProductQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
    } else {
      const updated = [...selectedProducts];
      updated[index].quantity = quantity;
      setSelectedProducts(updated);
    }
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const issueNFE = async () => {
    if (!selectedCustomer) {
      alert('Selecione um cliente antes de emitir a NF-e');
      return;
    }
    
    if (selectedProducts.length === 0) {
      alert('Adicione pelo menos um produto antes de emitir a NF-e');
      return;
    }

    if (!confirm(`Confirma a emissão da NF-e no valor de R$ ${calculateTotal().toFixed(2)}?`)) {
      return;
    }

    try {
      setLoading(true);

      const recipient: NFERecipient = {
        name: selectedCustomer.name,
        cnpj: selectedCustomer.document?.length === 18 ? selectedCustomer.document : undefined,
        cpf: selectedCustomer.document?.length === 14 ? selectedCustomer.document : undefined,
        street: selectedCustomer.address?.split(',')[0] || 'Não informado',
        number: '0',
        neighborhood: 'Centro',
        city: selectedCustomer.city || 'São Paulo',
        cityCode: '3550308',
        state: selectedCustomer.state || 'SP',
        zipCode: selectedCustomer.zipCode || '01000000'
      };

      const nfeData = {
        items: selectedProducts.map(item => ({
          productId: item.productId,
          name: item.name,
          ncm: item.ncm,
          cfop: item.cfop,
          quantity: item.quantity,
          price: item.price,
          cstIcms: item.cstIcms,
          cstPis: item.cstPis,
          cstCofins: item.cstCofins,
          aliqIcms: item.aliqIcms,
          origem: item.origem
        })),
        total: calculateTotal(),
        recipient,
        transport: {
          modality: transportModality
        },
        payment: {
          method: paymentMethod
        },
        observations
      };

      const result = await apiClient.post('/fiscal/issue-nfe', nfeData);
      
      if (result.success) {
        alert(`✅ NF-e emitida com sucesso!\n\nNúmero: ${result.number}\nChave: ${result.accessKey}\nStatus: ${result.status}`);
        setSelectedCustomer(null);
        setSelectedProducts([]);
        setObservations('');
        setCustomerSearch('');
        setProductSearch('');
        setActiveTab('list');
        await loadNFEs();
      } else {
        alert(`❌ Erro ao emitir NF-e\n\n${result.message || 'Erro desconhecido'}`);
      }
    } catch (error: any) {
      console.error('Erro ao emitir NF-e:', error);
      alert(`❌ Erro ao emitir NF-e\n\n${error.message || 'Erro de comunicação com o servidor'}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadDANFE = async (nfeId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/fiscal/nfe/${nfeId}/danfe`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Erro ao baixar DANFE');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DANFE_${nfeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert(`Erro ao baixar DANFE: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AUTORIZADA':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PENDENTE':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'REJEITADA':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de NF-e</h2>
        
        {/* Status SEFAZ */}
        {sefazStatus && (
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            sefazStatus.online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${sefazStatus.online ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>SEFAZ {sefazStatus.online ? 'Online' : 'Offline'}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Lista de NF-e
          </button>
          <button
            onClick={() => setActiveTab('issue')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'issue'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Emitir NF-e
          </button>
        </nav>
      </div>

      {/* Lista de NF-e */}
      {activeTab === 'list' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">NF-e Emitidas</h3>
              <button
                onClick={loadNFEs}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Carregando NF-e...</p>
              </div>
            ) : nfes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Nenhuma NF-e emitida ainda</p>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chave de Acesso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {nfes.map((nfe) => (
                    <tr key={nfe.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {nfe.number.toString().padStart(9, '0')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {nfe.key.replace(/(\d{4})/g, '$1 ').trim()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(nfe.status)}
                          <span className="ml-2 text-sm text-gray-900">{nfe.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {nfe.createdAt ? new Date(nfe.createdAt).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => downloadDANFE(nfe.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Baixar DANFE"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emissão de NF-e */}
      {activeTab === 'issue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seleção de Cliente */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cliente</h3>
              
              {selectedCustomer ? (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedCustomer.name}</h4>
                      <p className="text-sm text-gray-600">{selectedCustomer.document}</p>
                      <p className="text-sm text-gray-600">{selectedCustomer.address}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {customers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 border rounded-md">
                      Nenhum cliente cadastrado
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border rounded-md">
                      {customers.filter(c => 
                        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                        c.document?.includes(customerSearch)
                      ).map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-600">{customer.document}</div>
                      </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Produtos */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Produtos</h3>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                
                {products.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 border rounded-md">
                    Nenhum produto cadastrado. Cadastre produtos primeiro.
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto border rounded-md">
                    {products.filter(p => 
                      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.code.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.barcode?.includes(productSearch)
                    ).map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addProduct(product)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        R$ {product.price.toFixed(2)} - {product.code}
                      </div>
                    </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Produtos Selecionados */}
          <div className="lg:col-span-2 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Produtos Selecionados</h3>
              
              {selectedProducts.length === 0 ? (
                <p className="text-gray-500">Nenhum produto selecionado</p>
              ) : (
                <div className="space-y-2">
                  {selectedProducts.map((item, index) => (
                    <div key={index} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-600">
                          R$ {item.price.toFixed(2)} x {item.quantity} = R$ {(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateProductQuantity(index, parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        <button
                          onClick={() => updateProductQuantity(index, 0)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="text-right text-lg font-bold">
                      Total: R$ {calculateTotal().toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Configurações */}
          <div className="lg:col-span-2 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="PIX">PIX</option>
                    <option value="BOLETO">Boleto</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modalidade do Frete
                  </label>
                  <select
                    value={transportModality}
                    onChange={(e) => setTransportModality(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="0">Por conta do emitente</option>
                    <option value="1">Por conta do destinatário</option>
                    <option value="2">Por conta de terceiros</option>
                    <option value="9">Sem frete</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Informações adicionais..."
                />
              </div>
            </div>
          </div>

          {/* Botão Emitir */}
          <div className="lg:col-span-2">
            <button
              onClick={issueNFE}
              disabled={loading || !selectedCustomer || selectedProducts.length === 0}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Emitindo NF-e...' : 'Emitir NF-e'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};