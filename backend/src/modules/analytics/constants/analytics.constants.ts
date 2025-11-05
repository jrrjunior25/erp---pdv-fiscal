export const ANALYTICS_CONSTANTS = {
  CACHE_TTL: 15 * 60 * 1000,
  
  METRICS: ['SALES', 'REVENUE', 'PRODUCTS', 'CUSTOMERS'] as const,
  PERIODS: ['DAY', 'WEEK', 'MONTH', 'YEAR'] as const,
  
  VALIDATION_MESSAGES: {
    METRIC_REQUIRED: 'Métrica é obrigatória',
    PERIOD_REQUIRED: 'Período é obrigatório',
    INVALID_PERIOD: 'Período inválido',
  },
  
  SUCCESS_MESSAGES: {
    ANALYTICS_GENERATED: 'Análise gerada com sucesso',
  },
  
  ERROR_MESSAGES: {
    FETCH_ERROR: 'Erro ao buscar análises',
    GENERATION_ERROR: 'Erro ao gerar análise',
  },
} as const;