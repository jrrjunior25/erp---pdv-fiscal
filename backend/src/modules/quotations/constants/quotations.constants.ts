export const QUOTATIONS_CONSTANTS = {
  CACHE_TTL: 5 * 60 * 1000,
  
  STATUS: ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'] as const,
  VALIDITY_DAYS: 30,
  
  VALIDATION_MESSAGES: {
    CUSTOMER_REQUIRED: 'Cliente é obrigatório',
    ITEMS_REQUIRED: 'Itens são obrigatórios',
    VALIDITY_REQUIRED: 'Validade é obrigatória',
  },
  
  SUCCESS_MESSAGES: {
    QUOTATION_CREATED: 'Orçamento criado com sucesso',
    QUOTATION_SENT: 'Orçamento enviado com sucesso',
  },
  
  ERROR_MESSAGES: {
    FETCH_ERROR: 'Erro ao buscar orçamentos',
    CREATE_ERROR: 'Erro ao criar orçamento',
  },
} as const;