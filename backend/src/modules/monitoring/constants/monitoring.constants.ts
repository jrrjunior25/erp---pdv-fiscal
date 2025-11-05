export const MONITORING_CONSTANTS = {
  CACHE_TTL: 1 * 60 * 1000, // 1 minuto
  
  METRICS: ['CPU', 'MEMORY', 'DISK', 'DATABASE', 'API'] as const,
  STATUS: ['HEALTHY', 'WARNING', 'CRITICAL'] as const,
  
  THRESHOLDS: {
    CPU: 80,
    MEMORY: 85,
    DISK: 90,
  },
  
  SUCCESS_MESSAGES: {
    HEALTH_CHECK_OK: 'Sistema saudável',
  },
  
  ERROR_MESSAGES: {
    HEALTH_CHECK_ERROR: 'Erro na verificação de saúde',
    METRIC_ERROR: 'Erro ao coletar métrica',
  },
} as const;