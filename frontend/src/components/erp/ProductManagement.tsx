import React, { useState } from 'react';
import type { Product } from '@types';
import EntityFormModal from './EntityFormModal';
import ConfirmationModal from './ConfirmationModal';
import LabelPrintModal from './LabelPrintModal';
import * as productEnrichmentService from '@services/productEnrichmentService';
import * as tokenService from '@services/tokenService';
import { sanitizeText } from '@utils/sanitize';

const PrinterIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
    </svg>
);


interface ProductManagementProps {
  products: Product[];
  onAdd: (product: Omit<Product, 'id'>) => Promise<void>;
  onUpdate: (product: Product) => Promise<void>;
  onDelete: (productId: string) => Promise<void>;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ products, onAdd, onUpdate, onDelete }) => {
  const [isFormOpen, setFormOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormOpen(true);
  };

  const handleOpenDelete = (product: Product) => {
    setSelectedProduct(product);
    setConfirmOpen(true);
  };

  const handleOpenPrint = (product: Product) => {
    setSelectedProduct(product);
    setPrintModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedProduct) {
      await onDelete(selectedProduct.id);
      setConfirmOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleSave = async (data: any) => {
    // Prepare product data with all fields
    const productData: any = {
      code: sanitizeText(data.code?.trim() || ''),
      name: sanitizeText(data.name?.trim() || ''),
      barcode: data.barcode?.trim() ? sanitizeText(data.barcode.trim()) : null,
      description: data.description?.trim() ? sanitizeText(data.description.trim()) : null,
      category: sanitizeText(data.category?.trim() || ''),
      unit: data.unit?.trim() || 'UN',
      price: parseFloat(data.price),
      cost: data.cost ? parseFloat(data.cost) : null,
      
      // Campos Fiscais
      ncm: data.ncm?.trim() || null,
      cfop: data.cfop?.trim() || null,
      cest: data.cest?.trim() || null,
      origem: data.origem?.trim() || '0',
      cstIcms: data.cstIcms?.trim() || null,
      cstPis: data.cstPis?.trim() || null,
      cstCofins: data.cstCofins?.trim() || null,
      
      // Alíquotas
      aliqIcms: data.aliqIcms ? parseFloat(data.aliqIcms) : null,
      aliqPis: data.aliqPis ? parseFloat(data.aliqPis) : null,
      aliqCofins: data.aliqCofins ? parseFloat(data.aliqCofins) : null,
      
      active: true,
    };

    if (selectedProduct) {
      await onUpdate({ id: selectedProduct.id, ...productData });
    } else {
      await onAdd(productData);
    }
    setFormOpen(false);
    setSelectedProduct(null);
  };

  const handleAutoEnrich = async (type: 'barcode' | 'fiscal', currentData: any): Promise<any> => {
      try {
          if (type === 'barcode' && currentData.barcode) {
              // Busca informações completas pelo código de barras
              const enriched = await productEnrichmentService.enrichCompleteProductData({
                  barcode: currentData.barcode,
                  name: currentData.name,
                  category: currentData.category,
              });
              return enriched;
          } else if (type === 'fiscal' && (currentData.name || currentData.description)) {
              // Busca apenas dados fiscais pela descrição
              const fiscalData = await productEnrichmentService.suggestFiscalData(
                  currentData.name || currentData.description,
                  currentData.category
              );
              return fiscalData;
          }
          return null;
      } catch (error) {
          console.error("Auto enrichment failed:", error);
          return null;
      }
  }
  
  const productFields = [
    // Dados Básicos
    { name: 'name', label: 'Nome do Produto', type: 'text', required: true },
    { name: 'code', label: 'Código Interno (SKU)', type: 'text', required: true },
    { name: 'barcode', label: 'Código de Barras (GTIN/EAN)', type: 'text', autoEnrich: 'barcode' },
    { name: 'description', label: 'Descrição', type: 'text' },
    { name: 'category', label: 'Categoria', type: 'text', required: true },
    { name: 'unit', label: 'Unidade de Medida', type: 'select', required: true, options: [
      { value: 'UN', label: 'Unidade (UN)' },
      { value: 'KG', label: 'Quilograma (KG)' },
      { value: 'LT', label: 'Litro (LT)' },
      { value: 'MT', label: 'Metro (MT)' },
      { value: 'CX', label: 'Caixa (CX)' },
      { value: 'PC', label: 'Peça (PC)' },
    ]},
    
    // Preços
    { name: 'price', label: 'Preço de Venda (R$)', type: 'number', required: true, step: '0.01' },
    { name: 'cost', label: 'Custo de Compra (R$)', type: 'number', step: '0.01' },
    
    // Campos Fiscais Obrigatórios para NF-e/NFC-e
    { name: 'ncm', label: 'NCM (8 dígitos)', type: 'text', required: true, autoEnrich: 'fiscal' },
    { name: 'cfop', label: 'CFOP Padrão (4 dígitos)', type: 'text', required: true },
    { name: 'cest', label: 'CEST (7 dígitos)', type: 'text' },
    { name: 'origem', label: 'Origem da Mercadoria', type: 'select', required: true, options: [
      { value: '0', label: '0 - Nacional' },
      { value: '1', label: '1 - Estrangeira - Importação direta' },
      { value: '2', label: '2 - Estrangeira - Adquirida no mercado interno' },
      { value: '3', label: '3 - Nacional com mais de 40% de conteúdo estrangeiro' },
      { value: '4', label: '4 - Nacional - Produção em conformidade com processos produtivos básicos' },
      { value: '5', label: '5 - Nacional com menos de 40% de conteúdo estrangeiro' },
      { value: '6', label: '6 - Estrangeira - Importação direta sem similar nacional' },
      { value: '7', label: '7 - Estrangeira - Adquirida no mercado interno sem similar nacional' },
      { value: '8', label: '8 - Nacional - Mercadoria ou bem com Conteúdo de Importação superior a 70%' },
    ]},
    
    // CST (Código de Situação Tributária)
    { name: 'cstIcms', label: 'CST/CSOSN ICMS', type: 'text' },
    { name: 'cstPis', label: 'CST PIS', type: 'text' },
    { name: 'cstCofins', label: 'CST COFINS', type: 'text' },
    
    // Alíquotas de Impostos
    { name: 'aliqIcms', label: 'Alíquota ICMS (%)', type: 'number', step: '0.01' },
    { name: 'aliqPis', label: 'Alíquota PIS (%)', type: 'number', step: '0.01' },
    { name: 'aliqCofins', label: 'Alíquota COFINS (%)', type: 'number', step: '0.01' },
  ];

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      const token = tokenService.getToken();
      if (!token) throw new Error('Usuário não autenticado');

      const response = await fetch('http://localhost:3001/api/products/export/excel', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.message || 'Erro ao exportar produtos');
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Arquivo vazio recebido');

      const filename = `produtos_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadFile(blob, filename);
      
      alert(`✓ Exportação concluída!\n${products.length} produtos exportados.`);
    } catch (error: any) {
      console.error('[Export] Erro:', error);
      alert(`✗ Erro ao exportar:\n${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = tokenService.getToken();
      if (!token) throw new Error('Usuário não autenticado');

      const response = await fetch('http://localhost:3001/api/products/export/template', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) throw new Error(`Erro ${response.status}`);

      const blob = await response.blob();
      downloadFile(blob, 'modelo_importacao_produtos.xlsx');
      
      alert('✓ Modelo baixado com sucesso!');
    } catch (error: any) {
      console.error('[Template] Erro:', error);
      alert(`✗ Erro ao baixar modelo:\n${error.message}`);
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      alert('✗ Formato inválido!\nApenas arquivos .xlsx ou .xls são aceitos.');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('✗ Arquivo muito grande!\nTamanho máximo: 10MB');
      event.target.value = '';
      return;
    }

    if (!confirm(`Importar arquivo "${file.name}"?\n\nIsso pode criar ou atualizar produtos.`)) {
      event.target.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const token = tokenService.getToken();
      if (!token) throw new Error('Usuário não autenticado');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3001/api/products/import/excel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'Erro ao processar arquivo');
      }

      const result = await response.json();

      if (result.success) {
        alert(`✓ Importação concluída!\n\n${result.imported} produtos importados com sucesso.`);
        window.location.reload();
      } else {
        const errorCount = result.errors?.length || 0;
        let message = `⚠ Importação parcial\n\n`;
        message += `✓ Importados: ${result.imported}\n`;
        message += `✗ Erros: ${errorCount}\n\n`;
        
        if (errorCount > 0) {
          message += 'Primeiros erros:\n';
          result.errors.slice(0, 3).forEach((err: any) => {
            message += `\nLinha ${err.row}: ${err.errors[0]}`;
          });
          if (errorCount > 3) {
            message += `\n\n... e mais ${errorCount - 3} erros.`;
          }
        }
        
        alert(message);
        if (result.imported > 0) window.location.reload();
      }
    } catch (error: any) {
      console.error('[Import] Erro:', error);
      alert(`✗ Erro na importação:\n${error.message}`);
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const stats = {
    total: products.length,
    active: products.filter(p => (p as any).active !== false).length,
    totalValue: products.reduce((sum, p) => sum + (p.price * ((p as any).stock || 0)), 0),
    lowStock: products.filter(p => ((p as any).stock || 0) < ((p as any).minStock || 5)).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Produtos</h1>
            <p className="text-sm text-gray-500 mt-1">Cadastro e controle de produtos</p>
          </div>
          <div className="flex gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
            title="Baixar planilha modelo para importação"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Modelo
          </button>
          <button
            onClick={handleExportExcel}
            disabled={isExporting || products.length === 0}
            className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            title="Exportar todos os produtos para Excel"
          >
            {isExporting ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {isExporting ? 'Exportando...' : 'Exportar'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            title="Importar produtos de planilha Excel"
          >
            {isImporting ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
            {isImporting ? 'Importando...' : 'Importar'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            className="hidden"
            disabled={isImporting}
          />
          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Novo Produto
          </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 border border-blue-500 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total de Produtos</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
              <p className="text-blue-200 text-xs mt-1">{stats.active} ativos</p>
            </div>
            <div className="bg-blue-500/30 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 border border-green-500 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Valor em Estoque</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              <p className="text-green-200 text-xs mt-1">Valor total</p>
            </div>
            <div className="bg-green-500/30 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 border border-orange-500 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Estoque Baixo</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.lowStock}</p>
              <p className="text-orange-200 text-xs mt-1">Requer atenção</p>
            </div>
            <div className="bg-orange-500/30 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 border border-purple-500 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Categorias</p>
              <p className="text-3xl font-bold text-white mt-2">{new Set(products.map(p => p.category).filter(Boolean)).size}</p>
              <p className="text-purple-200 text-xs mt-1">Diferentes</p>
            </div>
            <div className="bg-purple-500/30 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Produto</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">NCM</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Preço</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                        {product.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.category || 'Sem categoria'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{(product as any).ncm || 'Não informado'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                    {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <button onClick={() => handleOpenPrint(product)} className="text-teal-600 hover:text-teal-700 mr-4 inline-flex items-center gap-1 transition-colors"><PrinterIcon className="w-4 h-4" /> Etiquetas</button>
                  <button onClick={() => handleOpenEdit(product)} className="text-blue-600 hover:text-blue-700 mr-4 transition-colors">Editar</button>
                  <button onClick={() => handleOpenDelete(product)} className="text-red-600 hover:text-red-700 transition-colors">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isFormOpen && (
        <EntityFormModal
          title={selectedProduct ? 'Editar Produto' : 'Adicionar Produto'}
          fields={productFields}
          initialData={selectedProduct}
          onSave={handleSave}
          onClose={() => setFormOpen(false)}
          onAutoEnrich={handleAutoEnrich}
        />
      )}
      {isConfirmOpen && selectedProduct && (
        <ConfirmationModal
          title="Excluir Produto"
          message={`Tem certeza que deseja excluir o produto "${selectedProduct.name}"? Esta ação não pode ser desfeita.`}
          onConfirm={handleConfirmDelete}
          onClose={() => setConfirmOpen(false)}
        />
      )}
      {isPrintModalOpen && selectedProduct && (
        <LabelPrintModal
          product={selectedProduct}
          onClose={() => setPrintModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductManagement;