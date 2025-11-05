export const REPORTS_CONSTANTS = {
  REPORT_TYPES: ['SALES', 'PRODUCTS', 'CUSTOMERS', 'FINANCIAL'] as const,
  FORMATS: ['PDF', 'EXCEL', 'CSV'] as const,
  PERIODS: ['TODAY', 'YESTERDAY', 'WEEK', 'MONTH', 'CUSTOM'] as const,
  
  VALIDATION_MESSAGES: {
    INVALID_PERIOD: 'Período inválido',
    INVALID_FORMAT: 'Formato inválido',
    START_DATE_REQUIRED: 'Data inicial é obrigatória',
    END_DATE_REQUIRED: 'Data final é obrigatória',
  },
  
  SUCCESS_MESSAGES: {
    REPORT_GENERATED: 'Relatório gerado com sucesso',
    REPORT_PRINTED: 'Relatório enviado para impressão',
  },
  
  ERROR_MESSAGES: {
    GENERATION_ERROR: 'Erro ao gerar relatório',
    PRINT_ERROR: 'Erro ao imprimir relatório',
    NO_DATA: 'Nenhum dado encontrado para o período',
  },
} as const;