import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

@Injectable()
export class GeminiService implements OnModuleInit {
    private ai: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor(private configService: ConfigService) {}

    onModuleInit() {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            console.warn("GEMINI_API_KEY environment variable not set - Gemini features will be disabled");
            return;
        }
        
        try {
            this.ai = new GoogleGenerativeAI(apiKey);
            // Usar modelo mais recente disponível
            this.model = this.ai.getGenerativeModel({ model: "gemini-2.5-flash" });
            console.log("✅ Gemini initialized with model: gemini-2.5-flash");
        } catch (error) {
            console.error("❌ Failed to initialize Gemini:", error.message);
            this.ai = null;
            this.model = null;
        }
    }

    private sanitizeDataForPrompt(data: any[]): string {
        return JSON.stringify(data.slice(0, 50).map(item => {
            const smallItem: Record<string, any> = {};
            for (const key in item) {
                if (typeof item[key] !== 'object' || item[key] === null) {
                    smallItem[key] = item[key];
                }
            }
            return smallItem;
        }));
    }

    async generateBusinessInsights(salesHistory: any[], products: any[]): Promise<string> {
        if (!this.model) {
            return "Serviço Gemini não está configurado. Configure GEMINI_API_KEY para habilitar insights.";
        }
        
        try {
            const prompt = `
                Você é um analista de negócios especialista em varejo. Analise os seguintes dados de vendas e produtos de uma cafeteria e forneça 3 insights acionáveis e concisos em português.
                Dados de Vendas (últimas 50): ${this.sanitizeDataForPrompt(salesHistory)}
                Lista de Produtos: ${this.sanitizeDataForPrompt(products)}
                Exemplo de insight: "Notei que as vendas de Café Espresso aumentam 30% após as 16h. Considere criar um combo de fim de tarde."
                Forneça os insights em uma lista com marcadores.
            `;
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Gemini API Error:', error.message);
            return `Erro ao gerar insights: ${error.message}. Verifique se a API Key é válida e tem permissões adequadas.`;
        }
    }

    async answerBusinessQuery(query: string, salesHistory: any[], products: any[]): Promise<string> {
        if (!this.model) {
            return "Serviço Gemini não está configurado. Configure GEMINI_API_KEY para habilitar respostas.";
        }
        
        try {
            const prompt = `
                Você é um analista de dados. Responda à seguinte pergunta do gerente da loja com base nos dados fornecidos. Seja direto e use os dados para embasar sua resposta em português.
                Pergunta: "${query}"
                Dados de Vendas (últimas 50): ${this.sanitizeDataForPrompt(salesHistory)}
                Lista de Produtos: ${this.sanitizeDataForPrompt(products)}
            `;
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Gemini API Error:', error.message);
            return `Erro ao processar consulta: ${error.message}`;
        }
    }

    async suggestProductName(currentName: string, category: string): Promise<string> {
        if (!this.model) {
            return currentName; // Retorna o nome original se não houver modelo
        }
        
        try {
            const prompt = `
                Sugira um nome de produto mais criativo e vendedor para uma cafeteria, baseado no nome atual e na categoria. Retorne apenas o novo nome, sem aspas ou texto adicional.
                Nome Atual: "${currentName}"
                Categoria: "${category}"
            `;
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error('Gemini API Error:', error.message);
            return currentName; // Fallback para o nome original
        }
    }

    async parseAddToCartCommand(command: string, products: any[]): Promise<{ productName: string, quantity: number }[]> {
        const productNames = products.map(p => p.name).join(', ');
        const prompt = `
            Analise o seguinte comando de voz de um operador de caixa e extraia os produtos e suas respectivas quantidades.
            Comando: "${command}"
            Lista de produtos disponíveis para referência: ${productNames}.
            Responda apenas com um array JSON contendo objetos com productName (string) e quantity (number).
        `;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse Gemini response:", e);
            return [];
        }
    }
}
