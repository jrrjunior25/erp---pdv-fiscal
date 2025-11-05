export const PURCHASING_CONSTANTS = {
  CACHE_TTL: 10 * 60 * 1000,
  
  STATUS: ['PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED'] as const,
  
  VALIDATION_MESSAGES: {
    SUPPLIER_REQUIRED: 'Fornecedor é obrigatório',
    ITEMS_REQUIRED: 'Itens são obrigatórios',
    QUANTITY_REQUIRED: 'Quantidade é obrigatória',
  },
  
  SUCCESS_MESSAGES: {
    ORDER_CREATED: 'Pedido criado com sucesso',
    ORDER_APPROVED: 'Pedido aprovado com sucesso',
  },
  
  ERROR_MESSAGES: {
    FETCH_ERROR: 'Erro ao buscar pedidos',
    CREATE_ERROR: 'Erro ao criar pedido',
  },
} as const;