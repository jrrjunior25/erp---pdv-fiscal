export const GEMINI_CONSTANTS = {
  CACHE_TTL: 30 * 60 * 1000, // 30 minutos
  
  ANALYSIS_TYPES: ['SALES', 'PRODUCTS', 'CUSTOMERS', 'TRENDS'] as const,
  
  VALIDATION_MESSAGES: {
    PROMPT_REQUIRED: 'Prompt é obrigatório',
    INVALID_TYPE: 'Tipo de análise inválido',
  },
  
  SUCCESS_MESSAGES: {
    ANALYSIS_COMPLETED: 'Análise concluída com sucesso',
  },
  
  ERROR_MESSAGES: {
    ANALYSIS_ERROR: 'Erro na análise',
    API_ERROR: 'Erro na API do Gemini',
  },
} as const;