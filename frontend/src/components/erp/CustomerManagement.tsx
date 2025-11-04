import React, { useState } from 'react';
import type { Customer } from '@types';
import EntityFormModal from './EntityFormModal';
import ConfirmationModal from './ConfirmationModal';
import SettleDebtModal from './SettleDebtModal';

interface CustomerManagementProps {
  customers: Customer[];
  onAdd: (customer: Omit<Customer, 'id' | 'loyaltyPoints' | 'createdAt' | 'creditLimit' | 'currentBalance'>) => Promise<void>;
  onUpdate: (customer: Customer) => Promise<void>;
  onDelete: (customerId: string) => Promise<void>;
  onSettleDebt: (customerId: string) => Promise<void>;
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({ customers, onAdd, onUpdate, onDelete, onSettleDebt }) => {
  const [isFormOpen, setFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: customers.length,
    withDebt: customers.filter(c => (c.currentBalance || 0) > 0).length,
    totalDebt: customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0),
    totalPoints: customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0),
  };
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [isSettleDebtModalOpen, setSettleDebtModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleOpenAdd = () => {
    setSelectedCustomer(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormOpen(true);
  };

  const handleOpenDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setConfirmOpen(true);
  };

  const handleOpenSettleDebt = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSettleDebtModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedCustomer) {
      await onDelete(selectedCustomer.id);
      setConfirmOpen(false);
      setSelectedCustomer(null);
    }
  };
  
  const handleConfirmSettleDebt = async () => {
      if (selectedCustomer) {
          await onSettleDebt(selectedCustomer.id);
          setSettleDebtModalOpen(false);
          setSelectedCustomer(null);
      }
  }

  const handleSave = async (data: any) => {
    if (selectedCustomer) {
      await onUpdate({ ...selectedCustomer, ...data, creditLimit: parseFloat(data.creditLimit) });
    } else {
      await onAdd(data);
    }
    setFormOpen(false);
    setSelectedCustomer(null);
  };
  
  const customerFields = [
    { name: 'name', label: 'Nome Completo', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Telefone', type: 'text', required: true },
    { name: 'cpf', label: 'CPF', type: 'text', required: true },
    { name: 'creditLimit', label: 'Limite de Crédito (R$)', type: 'number', required: true, step: '0.01' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Clientes</h1>
            <p className="text-sm text-gray-500 mt-1">Cadastro e controle de clientes</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Novo Cliente
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 border border-blue-500 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total de Clientes</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
            </div>
            <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 border border-red-500 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Clientes com Dívida</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.withDebt}</p>
            </div>
            <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 border border-orange-500 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total a Receber</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.totalDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
            <svg className="w-10 h-10 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-6 border border-yellow-500 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pontos de Fidelidade</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.totalPoints}</p>
            </div>
            <svg className="w-10 h-10 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nome</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contato</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Saldo Devedor</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    <div>{customer.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{customer.cpf}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{customer.email}</div>
                  <div className="text-sm text-gray-500">{customer.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    {(customer.currentBalance || 0) > 0 ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        {(customer.currentBalance || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        Em dia
                      </span>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                        Limite: {(customer.creditLimit || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  {(customer.currentBalance || 0) > 0 && (
                     <button onClick={() => handleOpenSettleDebt(customer)} className="text-green-600 hover:text-green-700 mr-4 transition-colors">Receber</button>
                  )}
                  <button onClick={() => handleOpenEdit(customer)} className="text-blue-600 hover:text-blue-700 mr-4 transition-colors">Editar</button>
                  <button onClick={() => handleOpenDelete(customer)} className="text-red-600 hover:text-red-700 transition-colors">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isFormOpen && (
        <EntityFormModal
          title={selectedCustomer ? 'Editar Cliente' : 'Adicionar Cliente'}
          fields={customerFields}
          initialData={selectedCustomer}
          onSave={handleSave}
          onClose={() => setFormOpen(false)}
        />
      )}
      {isConfirmOpen && selectedCustomer && (
        <ConfirmationModal
          title="Excluir Cliente"
          message={`Tem certeza que deseja excluir o cliente "${selectedCustomer.name}"?`}
          onConfirm={handleConfirmDelete}
          onClose={() => setConfirmOpen(false)}
        />
      )}
      {isSettleDebtModalOpen && selectedCustomer && (
          <SettleDebtModal
            customer={selectedCustomer}
            onConfirm={handleConfirmSettleDebt}
            onClose={() => setSettleDebtModalOpen(false)}
          />
      )}
    </div>
  );
};

export default CustomerManagement;