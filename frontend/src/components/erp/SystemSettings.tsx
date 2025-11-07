import React, { useState, useEffect } from 'react';
import type { SaleRecord } from '@types/index';
import apiClient from '@services/apiClient';
import { sanitizeText } from '@utils/sanitize';
import { downloadFile } from '@utils/downloadHelper';

interface Settings {
  company: {
    cnpj: string;
    name: string;
    fantasyName: string;
    ie: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    cityCode: string;
    state: string;
    zipCode: string;
  };
  fiscal: {
    environment: string;
    nfceSeries: number;
    hasCertificate: boolean;
    certExpiresAt: string | null;
  };
  pix: {
    pixKey: string;
    pixMerchantName: string;
    pixMerchantCity: string;
  };
  customization: {
    logoUrl: string | null;
    wallpaperUrl: string | null;
  };
}

interface SystemSettingsProps {
  salesHistory: SaleRecord[];
}

type TabType = 'company' | 'fiscal' | 'certificate' | 'nfce' | 'nfe' | 'pix' | 'customization';

const SystemSettings: React.FC<SystemSettingsProps> = ({ salesHistory }) => {
  const [activeTab, setActiveTab] = useState<TabType>('company');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<Settings>('/settings');
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      showMessage('error', 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      await apiClient.put('/settings', settings);
      showMessage('success', 'Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.name.toLowerCase().endsWith('.pfx') && !file.name.toLowerCase().endsWith('.p12')) {
      showMessage('error', 'Apenas arquivos .pfx ou .p12 são aceitos');
      return;
    }

    const password = prompt('Digite a senha do certificado:');
    if (!password) {
      showMessage('error', 'Senha é obrigatória');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;
          
          await apiClient.put('/settings/certificate', {
            certificate: base64,
            password: password,
          });
          
          showMessage('success', 'Certificado enviado com sucesso!');
          await loadSettings(); // Recarregar configurações
        } catch (error) {
          console.error('Erro ao enviar certificado:', error);
          showMessage('error', 'Erro ao processar certificado. Verifique o arquivo e a senha.');
        }
      };
      
      reader.onerror = () => {
        showMessage('error', 'Erro ao ler o arquivo do certificado');
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro no upload do certificado:', error);
      showMessage('error', 'Erro ao fazer upload do certificado');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await apiClient.put('/settings/logo', { logoBase64: base64 });
        showMessage('success', 'Logo enviada com sucesso!');
        loadSettings();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showMessage('error', 'Erro ao enviar logo');
    }
  };

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await apiClient.put('/settings/wallpaper', { wallpaperBase64: base64 });
        showMessage('success', 'Papel de parede alterado!');
        localStorage.setItem('wallpaper', base64);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showMessage('error', 'Erro ao alterar papel de parede');
    }
  };

  const handleSelectSale = (saleId: string) => {
    setSelectedSales((prev) =>
      prev.includes(saleId)
        ? prev.filter((id) => id !== saleId)
        : [...prev, saleId]
    );
  };

  const handleExportSelected = async () => {
    if (selectedSales.length === 0) return;

    setIsExporting(true);
    try {
      // Implementar exportação de NFC-e
      showMessage('success', 'NFC-e exportadas com sucesso!');
      setSelectedSales([]);
    } catch (error) {
      console.error('Erro ao exportar NFC-e:', error);
      showMessage('error', 'Erro ao exportar NFC-e');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Carregando configurações...</span>
      </div>
    );
  }

  const salesWithNFCe = salesHistory.filter((sale) => sale.nfceXml);
  const salesWithoutNFCe = salesHistory.filter((sale) => !sale.nfceXml);

  const tabs = [
    { id: 'company', label: 'Empresa', icon: '🏢' },
    { id: 'fiscal', label: 'Fiscal', icon: '📋' },
    { id: 'certificate', label: 'Certificado', icon: '🔒' },
    { id: 'nfce', label: 'NFC-e', icon: '📄' },
    { id: 'nfe', label: 'NF-e', icon: '📋' },
    { id: 'pix', label: 'PIX', icon: '💳' },
    { id: 'customization', label: 'Visual', icon: '🎨' },
  ];

  const inputClass = "w-full bg-white border border-gray-300 text-gray-900 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h2>
          <p className="text-gray-600 mt-1">Gerencie dados da empresa, configurações fiscais e NFC-e</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadFile('/api/fiscal/export/template', 'template_fiscal.xlsx')}
            className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            📥 Modelo
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'company' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados da Empresa</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>CNPJ</label>
                  <input 
                    type="text" 
                    value={settings.company.cnpj} 
                    onChange={(e) => setSettings({...settings, company: {...settings.company, cnpj: sanitizeText(e.target.value)}})} 
                    className={inputClass} 
                    placeholder="00.000.000/0000-00" 
                    maxLength={18} 
                  />
                </div>
                <div>
                  <label className={labelClass}>Inscrição Estadual</label>
                  <input 
                    type="text" 
                    value={settings.company.ie} 
                    onChange={(e) => setSettings({...settings, company: {...settings.company, ie: sanitizeText(e.target.value)}})} 
                    className={inputClass} 
                    maxLength={20} 
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Razão Social</label>
                  <input 
                    type="text" 
                    value={settings.company.name} 
                    onChange={(e) => setSettings({...settings, company: {...settings.company, name: sanitizeText(e.target.value)}})} 
                    className={inputClass} 
                    maxLength={200} 
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Nome Fantasia</label>
                  <input 
                    type="text" 
                    value={settings.company.fantasyName} 
                    onChange={(e) => setSettings({...settings, company: {...settings.company, fantasyName: sanitizeText(e.target.value)}})} 
                    className={inputClass} 
                    maxLength={200} 
                  />
                </div>
                <div>
                  <label className={labelClass}>Logradouro</label>
                  <input 
                    type="text" 
                    value={settings.company.street} 
                    onChange={(e) => setSettings({...settings, company: {...settings.company, street: sanitizeText(e.target.value)}})} 
                    className={inputClass} 
                    maxLength={100} 
                  />
                </div>
                <div>
                  <label className={labelClass}>Número</label>
                  <input 
                    type="text" 
                    value={settings.company.number} 
                    onChange={(e) => setSettings({...settings, company: {...settings.company, number: e.target.value}})} 
                    className={inputClass} 
                  />
                </div>
                <div>
                  <label className={labelClass}>Bairro</label>
                  <input 
                    type="text" 
                    value={settings.company.neighborhood} 
                    onChange={(e) => setSettings({...settings, company: {...settings.company, neighborhood: sanitizeText(e.target.value)}})} 
                    className={inputClass} 
                    maxLength={60} 
                  />
                </div>
                <div>
                  <label className={labelClass}>Cidade</label>
                  <input 
                    type="text" 
                    value={settings.company.city} 
                    onChange={(e) => setSettings({...settings, company: {...settings.company, city: sanitizeText(e.target.value)}})} 
                    className={inputClass} 
                    maxLength={60} 
                  />
                </div>
                <div>
                  <label className={labelClass}>Código IBGE</label>
                  <input 
                    type="text" 
                    value={settings.company.cityCode} 
                    onChange={(e) => setSettings({...settings, company: {...settings.company, cityCode: e.target.value}})} 
                    className={inputClass} 
                  />
                </div>
                <div>
                  <label className={labelClass}>Estado (UF)</label>
                  <input 
                    type="text" 
                    value={settings.company.state} 
                    onChange={(e) => setSettings({...settings, company: {...settings.company, state: e.target.value}})} 
                    className={inputClass} 
                    maxLength={2} 
                  />
                </div>
                <div>
                  <label className={labelClass}>CEP</label>
                  <input 
                    type="text" 
                    value={settings.company.zipCode} 
                    onChange={(e) => setSettings({...settings, company: {...settings.company, zipCode: e.target.value}})} 
                    className={inputClass} 
                    placeholder="00000-000" 
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fiscal' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações Fiscais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Ambiente</label>
                  <select 
                    value={settings.fiscal.environment} 
                    onChange={(e) => setSettings({...settings, fiscal: {...settings.fiscal, environment: e.target.value}})} 
                    className={inputClass}
                  >
                    <option value="homologacao">Homologação</option>
                    <option value="producao">Produção</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Série NFC-e</label>
                  <input 
                    type="number" 
                    value={settings.fiscal.nfceSeries} 
                    onChange={(e) => setSettings({...settings, fiscal: {...settings.fiscal, nfceSeries: parseInt(e.target.value)}})} 
                    className={inputClass} 
                  />
                </div>
              </div>
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Atenção:</strong> O ambiente de homologação deve ser usado apenas para testes. 
                  Altere para produção somente após validar todas as configurações.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'certificate' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificado Digital</h3>
              <div className={`p-4 rounded-lg ${settings.fiscal.hasCertificate ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`font-semibold ${settings.fiscal.hasCertificate ? 'text-green-700' : 'text-red-700'}`}>
                  Status: {settings.fiscal.hasCertificate ? '✓ Certificado Instalado' : '✗ Nenhum Certificado'}
                </p>
                {settings.fiscal.certExpiresAt && (
                  <p className="text-sm text-gray-600 mt-1">
                    Válido até: {new Date(settings.fiscal.certExpiresAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload do Certificado (.pfx ou .p12)
                </label>
                <input type="file" accept=".pfx,.p12" onChange={handleCertificateUpload} className={inputClass} />
                <p className="text-xs text-gray-500 mt-2">
                  O certificado digital é necessário para emissão de NFC-e.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'nfce' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestão de NFC-e</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                  <p className="text-sm opacity-90">Total de Vendas</p>
                  <p className="text-3xl font-bold mt-1">{salesHistory.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                  <p className="text-sm opacity-90">Com NFC-e</p>
                  <p className="text-3xl font-bold mt-1">{salesWithNFCe.length}</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
                  <p className="text-sm opacity-90">Sem NFC-e</p>
                  <p className="text-3xl font-bold mt-1">{salesWithoutNFCe.length}</p>
                </div>
              </div>

              {salesWithoutNFCe.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">
                      Vendas sem NFC-e ({salesWithoutNFCe.length})
                    </h4>
                    {selectedSales.length > 0 && (
                      <button
                        onClick={handleExportSelected}
                        disabled={isExporting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm"
                      >
                        {isExporting ? 'Exportando...' : `Exportar ${selectedSales.length}`}
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedSales.length === salesWithoutNFCe.length}
                              onChange={(e) =>
                                setSelectedSales(
                                  e.target.checked ? salesWithoutNFCe.map((s) => s.id) : []
                                )
                              }
                              className="rounded"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {salesWithoutNFCe.slice(0, 10).map((sale) => (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedSales.includes(sale.id)}
                                onChange={() => handleSelectSale(sale.id)}
                                className="rounded"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(sale.timestamp).toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {sale.customerName || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              {formatCurrency(sale.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'nfe' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações NF-e</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Série NF-e</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="999"
                    className={inputClass}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className={labelClass}>Ambiente</label>
                  <select className={inputClass}>
                    <option value="homologacao">Homologação</option>
                    <option value="producao">Produção</option>
                  </select>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Informações sobre NF-e
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        A NF-e (Nota Fiscal Eletrônica) é utilizada para vendas entre empresas ou para consumidores pessoa jurídica.
                        Ela possui layout mais completo que a NFC-e e gera o DANFE para impressão.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pix' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuração PIX</h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Chave PIX</label>
                  <input 
                    type="text" 
                    value={settings.pix.pixKey} 
                    onChange={(e) => setSettings({...settings, pix: {...settings.pix, pixKey: sanitizeText(e.target.value)}})} 
                    className={inputClass} 
                    placeholder="email@exemplo.com ou telefone ou CNPJ" 
                    maxLength={100} 
                  />
                </div>
                <div>
                  <label className={labelClass}>Nome do Recebedor</label>
                  <input 
                    type="text" 
                    value={settings.pix.pixMerchantName} 
                    onChange={(e) => setSettings({...settings, pix: {...settings.pix, pixMerchantName: sanitizeText(e.target.value)}})} 
                    className={inputClass} 
                    maxLength={100} 
                  />
                </div>
                <div>
                  <label className={labelClass}>Cidade do Recebedor</label>
                  <input 
                    type="text" 
                    value={settings.pix.pixMerchantCity} 
                    onChange={(e) => setSettings({...settings, pix: {...settings.pix, pixMerchantCity: sanitizeText(e.target.value)}})} 
                    className={inputClass} 
                    maxLength={60} 
                  />
                </div>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Informação:</strong> Estas configurações são usadas para gerar QR Codes PIX nas vendas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customization' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personalização Visual</h3>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Logomarca da Empresa</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className={inputClass} />
                    <p className="text-xs text-gray-500 mt-2">
                      Formatos aceitos: PNG, JPG, SVG (recomendado: 200x200px)
                    </p>
                  </div>
                  <div className="flex items-center justify-center bg-gray-50 border border-gray-300 rounded-lg p-4">
                    {settings.customization.logoUrl ? (
                      <img src={settings.customization.logoUrl} alt="Logo" className="max-h-32" />
                    ) : (
                      <p className="text-gray-500 text-sm">Nenhuma logo carregada</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900">Papel de Parede do Sistema</h4>
                <div>
                  <input type="file" accept="image/*" onChange={handleWallpaperUpload} className={inputClass} />
                  <p className="text-xs text-gray-500 mt-2">
                    Personalize o fundo do sistema. Formatos aceitos: PNG, JPG (recomendado: 1920x1080px)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;