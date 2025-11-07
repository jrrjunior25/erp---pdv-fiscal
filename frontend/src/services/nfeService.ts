import BaseService from './baseService';

export interface NFEItem {
  productId: string;
  name: string;
  ncm?: string;
  cfop?: string;
  quantity: number;
  price: number;
  cstIcms?: string;
  cstPis?: string;
  cstCofins?: string;
  aliqIcms?: number;
  aliqPis?: number;
  aliqCofins?: number;
  origem?: string;
}

export interface NFERecipient {
  name: string;
  cnpj?: string;
  cpf?: string;
  ie?: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  cityCode: string;
  state: string;
  zipCode: string;
}

export interface NFETransport {
  modality: string;
  carrierCnpj?: string;
  carrierName?: string;
  carrierIe?: string;
}

export interface NFEInstallment {
  number: number;
  dueDate: string;
  value: number;
}

export interface NFEPayment {
  method: string;
  installments?: NFEInstallment[];
}

export interface IssueNFERequest {
  saleId?: string;
  items: NFEItem[];
  total: number;
  recipient: NFERecipient;
  transport?: NFETransport;
  payment: NFEPayment;
  observations?: string;
}

export interface NFEResponse {
  success: boolean;
  nfeId: string;
  number: number;
  series: number;
  accessKey: string;
  xml: string;
  status: string;
  protocol?: string;
  message: string;
}

class NFEService extends BaseService {
  constructor() {
    super();
  }

  async issueNFE(data: IssueNFERequest): Promise<NFEResponse> {
    return this.request('/fiscal/issue-nfe', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getNFE(id: string) {
    return this.request(`/fiscal/nfe/${id}`);
  }

  async getNFEXml(id: string) {
    return this.request(`/fiscal/nfe/${id}/xml`);
  }

  async downloadDANFE(id: string): Promise<void> {
    const response = await fetch(`/api/fiscal/nfe/${id}/danfe`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao baixar DANFE');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DANFE_${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async listSavedPDFs(year?: number, month?: number, day?: number) {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    if (day) params.append('day', day.toString());
    
    return this.request(`/fiscal/pdfs?${params.toString()}`);
  }

  async regenerateNFEPDF(id: string) {
    return this.request(`/fiscal/nfe/${id}/regenerate-pdf`, {
      method: 'POST'
    });
  }

  async checkSefazStatus() {
    return this.request('/fiscal/sefaz/status');
  }
}

export const nfeService = new NFEService();