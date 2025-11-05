export interface GeminiAnalysisRequest {
  type: 'SALES' | 'PRODUCTS' | 'CUSTOMERS' | 'TRENDS';
  prompt: string;
  data?: any;
  context?: string;
}

export interface GeminiAnalysisResponse {
  analysis: string;
  insights: string[];
  recommendations: string[];
  confidence: number;
  processedAt: Date;
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}