export const RETURNS_CONSTANTS = {
  CACHE_TTL: 5 * 60 * 1000,
  
  REASONS: ['DEFECTIVE', 'WRONG_ITEM', 'CUSTOMER_CHANGE', 'DAMAGED', 'OTHER'] as const,
  STATUS: ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'] as const,
  
  VALIDATION_MESSAGES: {
    SALE_REQUIRED: 'Venda é obrigatória',
    REASON_REQUIRED: 'Motivo é obrigatório',
    ITEMS_REQUIRED: 'Itens são obrigatórios',
  },
  
  SUCCESS_MESSAGES: {
    RETURN_CREATED: 'Devolução criada com sucesso',
    RETURN_PROCESSED: 'Devolução processada com sucesso',
  },
  
  ERROR_MESSAGES: {
    FETCH_ERROR: 'Erro ao buscar devoluções',
    CREATE_ERROR: 'Erro ao criar devolução',
  },
} as const;