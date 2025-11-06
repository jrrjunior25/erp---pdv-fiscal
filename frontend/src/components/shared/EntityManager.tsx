import React, { useState, useEffect } from 'react';
import { useEntity } from '@hooks/useEntity';

interface EntityManagerProps<T> {
  title: string;
  service: any;
  storeKey: 'products' | 'customers' | 'suppliers';
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required?: boolean;
    options?: Array<{ value: string; label: string }>;
  }>;
  renderRow: (entity: T) => React.ReactNode;
  getStats?: (entities: T[]) => Array<{ label: string; value: string | number; color: string }>;
}

const EntityManager = <T extends { id: string; name: string }>({
  title,
  service,
  storeKey,
  fields,
  renderRow,
  getStats,
}: EntityManagerProps<T>) => {
  const {
    entities,
    loading,
    error,
    loadAll,
    create,
    update,
    remove,
    exportExcel,
    exportTemplate,
    importExcel,
  } = useEntity<T>({ service, storeKey });

  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredEntities = entities.filter(entity =>
    entity.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = getStats ? getStats(entities) : [];

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await importExcel(file);
      alert(`Importação concluída! ${result.imported} registros importados.`);
    } catch (error) {
      alert('Erro ao importar arquivo');
    }
    e.target.value = '';
  };

  if (loading) return <div className="p-6">Carregando...</div>;
  if (error) return <div className="p-6 text-red-600">Erro: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="flex gap-2">
          <button onClick={exportTemplate} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            📥 Modelo
          </button>
          <button onClick={exportExcel} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
            📊 Exportar
          </button>
          <label className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 cursor-pointer">
            📤 Importar
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          </label>
          <button onClick={() => setFormOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Novo
          </button>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 text-white shadow-lg`}>
              <p className="text-sm opacity-90">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border p-4">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="divide-y divide-gray-200">
            {filteredEntities.map(renderRow)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EntityManager;