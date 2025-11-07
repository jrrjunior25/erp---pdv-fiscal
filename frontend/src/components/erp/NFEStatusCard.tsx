import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { nfeService } from '../../services/nfeService';

interface NFEStats {
  total: number;
  authorized: number;
  pending: number;
  rejected: number;
}

export const NFEStatusCard: React.FC = () => {
  const [stats, setStats] = useState<NFEStats>({
    total: 0,
    authorized: 0,
    pending: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Implementar endpoint para estatísticas de NF-e
      // const data = await nfeService.getStats();
      // setStats(data);
      
      // Mock data por enquanto
      setStats({
        total: 45,
        authorized: 42,
        pending: 2,
        rejected: 1
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas de NF-e:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">NF-e</h3>
        <FileText className="w-5 h-5 text-blue-500" />
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total</span>
          <span className="text-lg font-semibold text-gray-900">{stats.total}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-gray-600">Autorizadas</span>
          </div>
          <span className="text-sm font-medium text-green-600">{stats.authorized}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="text-sm text-gray-600">Pendentes</span>
          </div>
          <span className="text-sm font-medium text-yellow-600">{stats.pending}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-sm text-gray-600">Rejeitadas</span>
          </div>
          <span className="text-sm font-medium text-red-600">{stats.rejected}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full" 
            style={{ width: `${(stats.authorized / stats.total) * 100}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {((stats.authorized / stats.total) * 100).toFixed(1)}% autorizadas
        </p>
      </div>
    </div>
  );
};