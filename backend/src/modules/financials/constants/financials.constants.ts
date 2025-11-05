export const FINANCIALS_CONSTANTS = {
  CACHE_TTL: 5 * 60 * 1000,
  
  TRANSACTION_TYPES: ['INCOME', 'EXPENSE'] as const,
  CATEGORIES: ['SALE', 'PURCHASE', 'TAX', 'SALARY', 'RENT', 'OTHER'] as const,
  
  VALIDATION_MESSAGES: {
    AMOUNT_REQUIRED: 'Valor é obrigatório',
    INVALID_AMOUNT: 'Valor deve ser maior que zero',
    DESCRIPTION_REQUIRED: 'Descrição é obrigatória',
    CATEGORY_REQUIRED: 'Categoria é obrigatória',
  },
  
  SUCCESS_MESSAGES: {
    TRANSACTION_CREATED: 'Transação criada com sucesso',
    TRANSACTION_UPDATED: 'Transação atualizada com sucesso',
  },
  
  ERROR_MESSAGES: {
    FETCH_ERROR: 'Erro ao buscar transações',
    CREATE_ERROR: 'Erro ao criar transação',
  },
} as const;