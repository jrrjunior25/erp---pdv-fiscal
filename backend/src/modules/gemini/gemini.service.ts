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
        this.ai = new GoogleGenerativeAI(apiKey);
        this.model = this.ai.getGenerativeModel({ model: "gemini-1.5-flash" });
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
    }

    async answerBusinessQuery(query: string, salesHistory: any[], products: any[]): Promise<string> {
        if (!this.model) {
            return "Serviço Gemini não está configurado. Configure GEMINI_API_KEY para habilitar respostas.";
        }
        const prompt = `
            Você é um analista de dados. Responda à seguinte pergunta do gerente da loja com base nos dados fornecidos. Seja direto e use os dados para embasar sua resposta em português.
            Pergunta: "${query}"
            Dados de Vendas (últimas 50): ${this.sanitizeDataForPrompt(salesHistory)}
            Lista de Produtos: ${this.sanitizeDataForPrompt(products)}
        `;
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }

    async suggestProductName(currentName: string, category: string): Promise<string> {
        const prompt = `
            Sugira um nome de produto mais criativo e vendedor para uma cafeteria, baseado no nome atual e na categoria. Retorne apenas o novo nome, sem aspas ou texto adicional.
            Nome Atual: "${currentName}"
            Categoria: "${category}"
        `;
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
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
        } catch (error) {
            return [];
        }

        try {
            const text = response.text();
            return JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse Gemini response:", e);
            return [];
        }
    }
}
