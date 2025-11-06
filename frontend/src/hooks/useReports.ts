import { useState, useEffect } from 'react';
import apiClient from '@services/apiClient';

interface ReportFilters {
  startDate: string;
  endDate: string;
  type: 'sales' | 'financial' | 'inventory';
}

export const useReports = (filters: ReportFilters) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`/reports/${filters.type}`, {
        params: {
          start: filters.startDate,
          end: filters.endDate
        }
      });
      setData(response);
    } catch (err) {
      setError('Erro ao carregar relatório');
      console.error('Report error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'excel' | 'pdf') => {
    try {
      const response = await fetch(`/api/reports/${filters.type}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...filters, format })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio_${filters.type}_${Date.now()}.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Export error:', error);
      return false;
    }
  };

  useEffect(() => {
    loadReport();
  }, [filters.startDate, filters.endDate, filters.type]);

  return { data, loading, error, loadReport, exportReport };
};