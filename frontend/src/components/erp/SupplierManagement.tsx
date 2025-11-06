import React, { useState, useMemo } from 'react';
import type { Supplier } from '@types';
import EntityFormModal from './EntityFormModal';
import ConfirmationModal from './ConfirmationModal';
import { downloadFile } from '@utils/downloadHelper';

interface SupplierManagementProps {
  suppliers: Supplier[];
  onAdd: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  onUpdate: (supplier: Supplier) => Promise<void>;
  onDelete: (supplierId: string) => Promise<void>;
}

const SupplierManagement: React.FC<SupplierManagementProps> = ({ suppliers, onAdd, onUpdate, onDelete }) => {
  const [isFormOpen, setFormOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cnpj.includes(searchTerm) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  const handleOpenAdd = () => {
    setSelectedSupplier(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormOpen(true);
  };

  const handleOpenDelete = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedSupplier) {
      await onDelete(selectedSupplier.id);
      setConfirmOpen(false);
      setSelectedSupplier(null);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/suppliers/import/excel', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`Importação concluída! ${result.imported} fornecedores importados.`);
        window.location.reload();
      } else {
        alert(`Erro na importação: ${result.errors?.length || 0} erros encontrados.`);
      }
    } catch (error) {
      alert('Erro ao importar arquivo');
    }
    e.target.value = '';
  };

  const handleSave = async (data: any) => {
    if (selectedSupplier) {
      await onUpdate({ ...selectedSupplier, ...data });
    } else {
      await onAdd(data);
    }
    setFormOpen(false);
    setSelectedSupplier(null);
  };
  
  const supplierFields = [
    { name: 'name', label: 'Nome do Fornecedor', type: 'text', required: true },
    { name: 'contactPerson', label: 'Pessoa de Contato', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Telefone', type: 'text', required: true },
    { name: 'cnpj', label: 'CNPJ', type: 'text', required: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Fornecedores</h2>
        <div className="flex gap-2">
          <button
            onClick={() => downloadFile('/api/suppliers/export/template', 'modelo_fornecedores.xlsx')}
            className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            📥 Modelo
          </button>
          <button
            onClick={() => downloadFile('/api/suppliers/export/excel', `fornecedores_${new Date().toISOString().split('T')[0]}.xlsx`)}
            className="bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
          >
            📊 Exportar
          </button>
          <label className="bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm cursor-pointer">
            📤 Importar
            <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
          </label>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Novo Fornecedor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total de Fornecedores</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{suppliers.length}</p>
          <p className="text-sm opacity-80 mt-1">Cadastrados</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Fornecedores Ativos</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{suppliers.length}</p>
          <p className="text-sm opacity-80 mt-1">100% ativos</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Contatos</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{suppliers.length}</p>
          <p className="text-sm opacity-80 mt-1">Emails cadastrados</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <input
          type="text"
          placeholder="Buscar por nome, CNPJ ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                    <div className="text-sm text-gray-500">{supplier.contactPerson}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{supplier.email}</div>
                    <div className="text-sm text-gray-500">{supplier.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-mono">{supplier.cnpj}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleOpenEdit(supplier)} className="text-blue-600 hover:text-blue-800 font-medium mr-4">Editar</button>
                    <button onClick={() => handleOpenDelete(supplier)} className="text-red-600 hover:text-red-800 font-medium">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isFormOpen && (
        <EntityFormModal
          title={selectedSupplier ? 'Editar Fornecedor' : 'Adicionar Fornecedor'}
          fields={supplierFields}
          initialData={selectedSupplier}
          onSave={handleSave}
          onClose={() => setFormOpen(false)}
        />
      )}
      {isConfirmOpen && selectedSupplier && (
        <ConfirmationModal
          title="Excluir Fornecedor"
          message={`Tem certeza que deseja excluir o fornecedor "${selectedSupplier.name}"?`}
          onConfirm={handleConfirmDelete}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
};

export default SupplierManagement;