import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GTINProductInfo {
  gtin: string;
  description: string;
  brand?: string;
  ncm?: string;
  thumbnail?: string;
}

export interface NCMSuggestion {
  ncm: string;
  description: string;
  confidence: number;
}

@Injectable()
export class ProductEnrichmentService {
  private readonly logger = new Logger(ProductEnrichmentService.name);
  private gtinApiUrl = 'https://api.cosmos.bluesoft.com.br/gtins'; // API pública brasileira
  private geminiApiKey: string;

  constructor(private configService: ConfigService) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
  }

  /**
   * Busca informações do produto por código de barras (GTIN/EAN)
   * usando API pública brasileira
   */
  async searchByBarcode(barcode: string): Promise<GTINProductInfo | null> {
    try {
      this.logger.log(`[searchByBarcode] Buscando produto por GTIN: ${barcode}`);
      
      // Tenta API pública Cosmos (Bluesoft) - Endpoint correto
      try {
        // API Cosmos aceita GTIN sem formatação especial
        const response = await axios.get(`https://api.cosmos.bluesoft.com.br/gtins/${barcode}`, {
          timeout: 10000,
          headers: {
            'User-Agent': 'ERP-PDV-Fiscal/1.0',
          },
        });

        this.logger.log(`[searchByBarcode] Resposta da API Cosmos: ${JSON.stringify(response.data)}`);

        if (response.data) {
          const product = {
            gtin: barcode,
            description: response.data.description || response.data.nome || response.data.name || null,
            brand: response.data.brand?.name || response.data.marca || response.data.brand || null,
            ncm: response.data.ncm?.code || response.data.ncm?.full_description || null,
            thumbnail: response.data.thumbnail || response.data.imagem || null,
          };
          
          this.logger.log(`[searchByBarcode] Produto encontrado: ${product.description}`);
          return product;
        }
      } catch (apiError) {
        if (apiError.response) {
          this.logger.warn(`[searchByBarcode] API Cosmos retornou erro ${apiError.response.status}: ${apiError.response.statusText}`);
        } else {
          this.logger.warn(`[searchByBarcode] Erro ao conectar na API Cosmos: ${apiError.message}`);
        }
      }

      // Fallback: Usar Gemini AI para sugerir baseado no código
      this.logger.log(`[searchByBarcode] Tentando fallback com Gemini AI`);
      if (this.geminiApiKey) {
        return await this.suggestProductByBarcodeWithAI(barcode);
      }

      this.logger.warn(`[searchByBarcode] Nenhuma fonte retornou dados para ${barcode}`);
      return null;
    } catch (error) {
      this.logger.error(`[searchByBarcode] Erro ao buscar produto: ${error.message}`);
      return null;
    }
  }

  /**
   * Usa Gemini AI para sugerir informações do produto baseado no código de barras
   */
  private async suggestProductByBarcodeWithAI(barcode: string): Promise<GTINProductInfo | null> {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const prompt = `Com base no código de barras EAN/GTIN: ${barcode}, sugira:
1. Nome/Descrição provável do produto (seja específico se reconhecer o prefixo)
2. Marca provável (se aplicável)
3. Categoria do produto

Responda em formato JSON:
{
  "description": "nome do produto",
  "brand": "marca",
  "category": "categoria"
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extrai JSON da resposta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          gtin: barcode,
          description: data.description || null,
          brand: data.brand || null,
          ncm: null,
        };
      }

      return null;
    } catch (error) {
      console.error('[ProductEnrichment] Erro ao usar IA:', error.message);
      return null;
    }
  }

  /**
   * Busca NCM e CST apropriados baseado na descrição do produto usando IA
   */
  async suggestFiscalDataByDescription(description: string, category?: string): Promise<{
    ncm?: string;
    ncmDescription?: string;
    cstIcms?: string;
    cstPis?: string;
    cstCofins?: string;
    cfop?: string;
    origem?: string;
  } | null> {
    if (!this.geminiApiKey) {
      console.log('[ProductEnrichment] Gemini API key não configurada');
      return null;
    }

    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const categoryInfo = category ? ` da categoria "${category}"` : '';
      const prompt = `Você é um especialista em tributação brasileira. Para o produto "${description}"${categoryInfo}, sugira:

1. NCM (Nomenclatura Comum do Mercosul) - 8 dígitos mais apropriado
2. Descrição do NCM
3. CST ICMS mais comum para esse tipo de produto (considerando empresa tributada normalmente)
4. CST PIS mais comum (01 para tributado normalmente)
5. CST COFINS mais comum (01 para tributado normalmente)
6. CFOP padrão para venda (5102 dentro do estado, 6102 fora do estado)
7. Origem da mercadoria (0 para nacional, 1 para importado)

Responda APENAS com JSON válido no formato:
{
  "ncm": "código de 8 dígitos",
  "ncmDescription": "descrição do NCM",
  "cstIcms": "código",
  "cstPis": "código",
  "cstCofins": "código",
  "cfop": "5102",
  "origem": "0"
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('[ProductEnrichment] Resposta da IA:', text);

      // Extrai JSON da resposta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          ncm: data.ncm || null,
          ncmDescription: data.ncmDescription || null,
          cstIcms: data.cstIcms || null,
          cstPis: data.cstPis || null,
          cstCofins: data.cstCofins || null,
          cfop: data.cfop || '5102',
          origem: data.origem || '0',
        };
      }

      return null;
    } catch (error) {
      console.error('[ProductEnrichment] Erro ao sugerir dados fiscais:', error.message);
      return null;
    }
  }



  /**
   * Busca NCM específico baseado em palavras-chave
   */
  async searchNCM(keywords: string): Promise<NCMSuggestion[]> {
    if (!this.geminiApiKey) {
      return [];
    }

    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const prompt = `Liste os 3 códigos NCM mais apropriados para: "${keywords}"

Responda APENAS com um array JSON:
[
  {
    "ncm": "código de 8 dígitos",
    "description": "descrição completa do NCM",
    "confidence": 0.9
  }
]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extrai JSON da resposta
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];
    } catch (error) {
      console.error('[ProductEnrichment] Erro ao buscar NCM:', error.message);
      return [];
    }
  }

  /**
   * Enriquece dados do produto combinando busca por barcode e sugestões fiscais
   */
  async enrichProductData(data: {
    barcode?: string;
    name?: string;
    category?: string;
  }): Promise<any> {
    this.logger.log(`[enrichProductData] Iniciando com: ${JSON.stringify(data)}`);
    const enrichedData: any = {};

    // Estratégia 1: Se tem código de barras, busca informações
    if (data.barcode) {
      this.logger.log(`[enrichProductData] Estratégia 1: Buscando por barcode: ${data.barcode}`);
      const productInfo = await this.searchByBarcode(data.barcode);
      this.logger.log(`[enrichProductData] Resultado barcode: ${JSON.stringify(productInfo)}`);
      if (productInfo && productInfo.description) {
        enrichedData.name = productInfo.description;
        enrichedData.brand = productInfo.brand;
        if (productInfo.ncm) {
          enrichedData.ncm = productInfo.ncm;
        }
      }
    }

    // Estratégia 2: Busca dados fiscais com IA (sempre executa se tiver descrição)
    const description = data.name || enrichedData.name;
    if (description) {
      this.logger.log(`[enrichProductData] Estratégia 2: Buscando dados fiscais para: ${description}`);
      const fiscalData = await this.suggestFiscalDataByDescription(
        description,
        data.category,
      );
      this.logger.log(`[enrichProductData] Resultado fiscal: ${JSON.stringify(fiscalData)}`);
      if (fiscalData) {
        // Mescla dados fiscais, mas não sobrescreve NCM se já tiver um mais específico
        if (!enrichedData.ncm || !fiscalData.ncm) {
          Object.assign(enrichedData, fiscalData);
        } else {
          // Mantém NCM da API, mas pega outros dados fiscais da IA
          const { ncm, ...otherFiscalData } = fiscalData;
          Object.assign(enrichedData, otherFiscalData);
        }
      }
    }

    this.logger.log(`[enrichProductData] Retornando: ${JSON.stringify(enrichedData)}`);
    return enrichedData;
  }
}
