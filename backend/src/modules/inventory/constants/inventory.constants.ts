export const INVENTORY_CONSTANTS = {
  CACHE_TTL: 5 * 60 * 1000,
  LOW_STOCK_THRESHOLD: 5,
  
  VALIDATION_MESSAGES: {
    PRODUCT_REQUIRED: 'Produto é obrigatório',
    QUANTITY_REQUIRED: 'Quantidade é obrigatória',
    INVALID_QUANTITY: 'Quantidade deve ser maior que zero',
  },
  
  SUCCESS_MESSAGES: {
    STOCK_UPDATED: 'Estoque atualizado com sucesso',
    MOVEMENT_CREATED: 'Movimentação criada com sucesso',
  },
  
  ERROR_MESSAGES: {
    FETCH_ERROR: 'Erro ao buscar estoque',
    UPDATE_ERROR: 'Erro ao atualizar estoque',
  },
} as const;