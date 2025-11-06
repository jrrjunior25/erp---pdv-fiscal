import React, { useState, useMemo } from 'react';
import type { User } from '@types';
import EntityFormModal from './EntityFormModal';
import ConfirmationModal from './ConfirmationModal';
import { downloadFile } from '@utils/downloadHelper';

interface UserManagementProps {
  users: User[];
  onAdd: (user: Omit<User, 'id'>) => Promise<void>;
  onUpdate: (user: User) => Promise<void>;
  onDelete: (userId: string) => Promise<void>;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAdd, onUpdate, onDelete }) => {
  const [isFormOpen, setFormOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<'Todos' | 'Admin' | 'Caixa'>('Todos');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Active' | 'Inactive'>('Todos');

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (roleFilter === 'Todos' || u.role === roleFilter) &&
      (statusFilter === 'Todos' || u.status === statusFilter)
    );
  }, [users, roleFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    admins: users.filter(u => u.role === 'Admin').length,
    cashiers: users.filter(u => u.role === 'Caixa').length
  }), [users]);

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setFormOpen(true);
  };

  const handleOpenDelete = (user: User) => {
    setSelectedUser(user);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedUser) {
      await onDelete(selectedUser.id);
      setConfirmOpen(false);
      setSelectedUser(null);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/users/import/excel', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`Importação concluída! ${result.imported} usuários importados.`);
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
    if (selectedUser) {
      await onUpdate({ ...selectedUser, ...data });
    } else {
      await onAdd(data);
    }
    setFormOpen(false);
    setSelectedUser(null);
  };
  
  const userFields = [
    { name: 'name', label: 'Nome Completo', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'password', label: 'Senha', type: 'password', required: !selectedUser },
    { 
      name: 'role', 
      label: 'Função', 
      type: 'select', 
      required: true, 
      options: [
        { value: 'Admin', label: 'Admin' },
        { value: 'Caixa', label: 'Caixa' },
      ]
    },
     { 
      name: 'status', 
      label: 'Status', 
      type: 'select', 
      required: true, 
      options: [
        { value: 'Active', label: 'Ativo' },
        { value: 'Inactive', label: 'Inativo' },
      ]
    },
  ];


  const getStatusBadge = (status: 'Active' | 'Inactive') => {
    return status === 'Active'
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  };

  const getRoleBadge = (role: string) => {
    return role === 'Admin'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Usuários</h2>
        <div className="flex gap-2">
          <button
            onClick={() => downloadFile('/api/users/export/template', 'modelo_usuarios.xlsx')}
            className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            📥 Modelo
          </button>
          <button
            onClick={() => downloadFile('/api/users/export/excel', `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`)}
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
            + Novo Usuário
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total de Usuários</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm opacity-80 mt-1">Cadastrados</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Usuários Ativos</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.active}</p>
          <p className="text-sm opacity-80 mt-1">{((stats.active / stats.total) * 100).toFixed(0)}% do total</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Administradores</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.admins}</p>
          <p className="text-sm opacity-80 mt-1">Com permissões totais</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Caixas</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold">{stats.cashiers}</p>
          <p className="text-sm opacity-80 mt-1">Operadores de caixa</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Função:</span>
            {(['Todos', 'Admin', 'Caixa'] as const).map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  roleFilter === role
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            {(['Todos', 'Active', 'Inactive'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'Active' ? 'Ativo' : status === 'Inactive' ? 'Inativo' : 'Todos'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                      {user.status === 'Active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleOpenEdit(user)} className="text-blue-600 hover:text-blue-800 font-medium mr-4">Editar</button>
                    <button onClick={() => handleOpenDelete(user)} className="text-red-600 hover:text-red-800 font-medium">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
       {isFormOpen && (
        <EntityFormModal
          title={selectedUser ? 'Editar Usuário' : 'Adicionar Usuário'}
          fields={userFields}
          initialData={selectedUser}
          onSave={handleSave}
          onClose={() => setFormOpen(false)}
        />
      )}
      {isConfirmOpen && selectedUser && (
        <ConfirmationModal
          title="Excluir Usuário"
          message={`Tem certeza que deseja excluir o usuário "${selectedUser.name}"?`}
          onConfirm={handleConfirmDelete}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
};

export default UserManagement;