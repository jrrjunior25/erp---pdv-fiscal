export const COMMISSIONS_CONSTANTS = {
  CACHE_TTL: 10 * 60 * 1000,
  
  DEFAULT_RATE: 0.05, // 5%
  STATUS: ['PENDING', 'PAID', 'CANCELLED'] as const,
  
  VALIDATION_MESSAGES: {
    SALE_REQUIRED: 'Venda é obrigatória',
    SELLER_REQUIRED: 'Vendedor é obrigatório',
    RATE_REQUIRED: 'Taxa é obrigatória',
    INVALID_RATE: 'Taxa deve estar entre 0 e 1',
  },
  
  SUCCESS_MESSAGES: {
    COMMISSION_CREATED: 'Comissão criada com sucesso',
    COMMISSION_PAID: 'Comissão paga com sucesso',
  },
  
  ERROR_MESSAGES: {
    FETCH_ERROR: 'Erro ao buscar comissões',
    CREATE_ERROR: 'Erro ao criar comissão',
    PAY_ERROR: 'Erro ao pagar comissão',
  },
} as const;