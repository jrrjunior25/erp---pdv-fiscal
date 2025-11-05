import React, { useState, useEffect } from 'react';
import apiClient from '@services/apiClient';
import { sanitizeText } from '@utils/sanitize';

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

type TabType = 'company' | 'fiscal' | 'certificate' | 'pix' | 'customization';

const SettingsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('company');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await apiClient.put('/settings/certificate', {
          certificate: base64,
          password: prompt('Digite a senha do certificado:'),
        });
        showMessage('success', 'Certificado enviado com sucesso!');
        loadSettings();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showMessage('error', 'Erro ao enviar certificado');
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

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-900 text-xl">Carregando configurações...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'company', label: 'Dados da Empresa', icon: '🏢' },
    { id: 'fiscal', label: 'Configurações Fiscais', icon: '📋' },
    { id: 'certificate', label: 'Certificado Digital', icon: '🔒' },
    { id: 'pix', label: 'Configuração PIX', icon: '💳' },
    { id: 'customization', label: 'Personalização', icon: '🎨' },
  ];

  const inputClass = "w-full bg-white border border-gray-300 text-gray-900 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">Dados da Empresa</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>CNPJ</label>
                  <input type="text" value={settings.company.cnpj} onChange={(e) => setSettings({...settings, company: {...settings.company, cnpj: sanitizeText(e.target.value)}})} className={inputClass} placeholder="00.000.000/0000-00" maxLength={18} />
                </div>
                <div>
                  <label className={labelClass}>Inscrição Estadual</label>
                  <input type="text" value={settings.company.ie} onChange={(e) => setSettings({...settings, company: {...settings.company, ie: sanitizeText(e.target.value)}})} className={inputClass} maxLength={20} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Razão Social</label>
                  <input type="text" value={settings.company.name} onChange={(e) => setSettings({...settings, company: {...settings.company, name: sanitizeText(e.target.value)}})} className={inputClass} maxLength={200} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Nome Fantasia</label>
                  <input type="text" value={settings.company.fantasyName} onChange={(e) => setSettings({...settings, company: {...settings.company, fantasyName: sanitizeText(e.target.value)}})} className={inputClass} maxLength={200} />
                </div>
                <div>
                  <label className={labelClass}>Logradouro</label>
                  <input type="text" value={settings.company.street} onChange={(e) => setSettings({...settings, company: {...settings.company, street: sanitizeText(e.target.value)}})} className={inputClass} maxLength={100} />
                </div>
                <div>
                  <label className={labelClass}>Número</label>
                  <input type="text" value={settings.company.number} onChange={(e) => setSettings({...settings, company: {...settings.company, number: e.target.value}})} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Bairro</label>
                  <input type="text" value={settings.company.neighborhood} onChange={(e) => setSettings({...settings, company: {...settings.company, neighborhood: sanitizeText(e.target.value)}})} className={inputClass} maxLength={60} />
                </div>
                <div>
                  <label className={labelClass}>Cidade</label>
                  <input type="text" value={settings.company.city} onChange={(e) => setSettings({...settings, company: {...settings.company, city: sanitizeText(e.target.value)}})} className={inputClass} maxLength={60} />
                </div>
                <div>
                  <label className={labelClass}>Código IBGE da Cidade</label>
                  <input type="text" value={settings.company.cityCode} onChange={(e) => setSettings({...settings, company: {...settings.company, cityCode: e.target.value}})} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Estado (UF)</label>
                  <input type="text" value={settings.company.state} onChange={(e) => setSettings({...settings, company: {...settings.company, state: e.target.value}})} className={inputClass} maxLength={2} />
                </div>
                <div>
                  <label className={labelClass}>CEP</label>
                  <input type="text" value={settings.company.zipCode} onChange={(e) => setSettings({...settings, company: {...settings.company, zipCode: e.target.value}})} className={inputClass} placeholder="00000-000" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fiscal' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Configurações Fiscais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Ambiente</label>
                  <select value={settings.fiscal.environment} onChange={(e) => setSettings({...settings, fiscal: {...settings.fiscal, environment: e.target.value}})} className={inputClass}>
                    <option value="homologacao">Homologação</option>
                    <option value="producao">Produção</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Série NFC-e</label>
                  <input type="number" value={settings.fiscal.nfceSeries} onChange={(e) => setSettings({...settings, fiscal: {...settings.fiscal, nfceSeries: parseInt(e.target.value)}})} className={inputClass} />
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">Certificado Digital</h3>
              <div className="space-y-4">
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
                    O certificado digital é necessário para emissão de NFC-e. Mantenha a senha do certificado em local seguro.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pix' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Configuração PIX</h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Chave PIX</label>
                  <input type="text" value={settings.pix.pixKey} onChange={(e) => setSettings({...settings, pix: {...settings.pix, pixKey: sanitizeText(e.target.value)}})} className={inputClass} placeholder="email@exemplo.com ou telefone ou CNPJ" maxLength={100} />
                </div>
                <div>
                  <label className={labelClass}>Nome do Recebedor</label>
                  <input type="text" value={settings.pix.pixMerchantName} onChange={(e) => setSettings({...settings, pix: {...settings.pix, pixMerchantName: sanitizeText(e.target.value)}})} className={inputClass} maxLength={100} />
                </div>
                <div>
                  <label className={labelClass}>Cidade do Recebedor</label>
                  <input type="text" value={settings.pix.pixMerchantCity} onChange={(e) => setSettings({...settings, pix: {...settings.pix, pixMerchantCity: sanitizeText(e.target.value)}})} className={inputClass} maxLength={60} />
                </div>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Informação:</strong> Estas configurações são usadas para gerar QR Codes PIX nas vendas. 
                    A chave PIX deve estar registrada no seu banco.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customization' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Personalização</h3>
              
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Logomarca da Empresa</h4>
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
                <h4 className="text-lg font-semibold text-gray-900">Papel de Parede do Sistema</h4>
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

export default SettingsManagement;
