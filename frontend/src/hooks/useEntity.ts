import { useState, useCallback } from 'react';
import { useAppStore } from '@store';

interface UseEntityOptions<T> {
  service: {
    getAll: () => Promise<T[]>;
    create: (data: Omit<T, 'id'>) => Promise<T>;
    update: (id: string, data: Partial<T>) => Promise<T>;
    delete: (id: string) => Promise<void>;
    exportExcel?: () => Promise<void>;
    exportTemplate?: () => Promise<void>;
    importExcel?: (file: File) => Promise<any>;
  };
  storeKey: 'products' | 'customers' | 'suppliers';
}

export const useEntity = <T extends { id: string }>({ service, storeKey }: UseEntityOptions<T>) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { [storeKey]: entities, [`set${storeKey.charAt(0).toUpperCase() + storeKey.slice(1)}`]: setEntities } = useAppStore();

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.getAll();
      setEntities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [service, setEntities]);

  const create = useCallback(async (data: Omit<T, 'id'>) => {
    setError(null);
    try {
      const newEntity = await service.create(data);
      setEntities([...entities as T[], newEntity]);
      return newEntity;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar');
      throw err;
    }
  }, [service, entities, setEntities]);

  const update = useCallback(async (id: string, data: Partial<T>) => {
    setError(null);
    try {
      const updatedEntity = await service.update(id, data);
      setEntities((entities as T[]).map(e => e.id === id ? updatedEntity : e));
      return updatedEntity;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar');
      throw err;
    }
  }, [service, entities, setEntities]);

  const remove = useCallback(async (id: string) => {
    setError(null);
    try {
      await service.delete(id);
      setEntities((entities as T[]).filter(e => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir');
      throw err;
    }
  }, [service, entities, setEntities]);

  const exportExcel = useCallback(async () => {
    if (service.exportExcel) {
      await service.exportExcel();
    }
  }, [service]);

  const exportTemplate = useCallback(async () => {
    if (service.exportTemplate) {
      await service.exportTemplate();
    }
  }, [service]);

  const importExcel = useCallback(async (file: File) => {
    if (service.importExcel) {
      const result = await service.importExcel(file);
      await loadAll(); // Recarrega dados após importação
      return result;
    }
  }, [service, loadAll]);

  return {
    entities: entities as T[],
    loading,
    error,
    loadAll,
    create,
    update,
    remove,
    exportExcel,
    exportTemplate,
    importExcel,
  };
};