import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('gemini')
export class GeminiController {
    constructor(private readonly geminiService: GeminiService) {}

    @Post('insights')
    async getInsights(@Body() body: { salesHistory: any[], products: any[] }) {
        try {
            const insights = await this.geminiService.generateBusinessInsights(body.salesHistory || [], body.products || []);
            return { insights };
        } catch (error) {
            console.error('Gemini insights error:', error);
            return { insights: 'Erro ao gerar insights. Verifique se a API Key do Gemini está configurada.' };
        }
    }

    @Post('query')
    async getQueryAnswer(@Body() body: { query: string, salesHistory: any[], products: any[] }) {
        try {
            const answer = await this.geminiService.answerBusinessQuery(body.query || '', body.salesHistory || [], body.products || []);
            return { answer };
        } catch (error) {
            console.error('Gemini query error:', error);
            return { answer: 'Erro ao processar consulta. Verifique se a API Key do Gemini está configurada.' };
        }
    }

    @Post('parse-command')
    async parseCommand(@Body() body: { command: string, products: any[] }) {
        try {
            const items = await this.geminiService.parseAddToCartCommand(body.command || '', body.products || []);
            return { items };
        } catch (error) {
            console.error('Gemini parse command error:', error);
            return { items: [] };
        }
    }
}
