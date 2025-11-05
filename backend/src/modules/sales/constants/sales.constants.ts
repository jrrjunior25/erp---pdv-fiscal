export const SALES_CONSTANTS = {
  CACHE_TTL: 5 * 60 * 1000, // 5 minutos
  
  PAYMENT_METHODS: ['DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'BOLETO'] as const,
  SALE_STATUS: ['PENDING', 'COMPLETED', 'CANCELLED'] as const,
  
  VALIDATION_MESSAGES: {
    SHIFT_REQUIRED: 'Turno é obrigatório',
    ITEMS_REQUIRED: 'Itens são obrigatórios',
    PAYMENT_METHOD_REQUIRED: 'Método de pagamento é obrigatório',
    PRODUCT_ID_REQUIRED: 'ID do produto é obrigatório',
    SALE_NOT_FOUND: 'Venda não encontrada',
  },
  
  SUCCESS_MESSAGES: {
    SALE_CREATED: 'Venda criada com sucesso',
    SALE_UPDATED: 'Venda atualizada com sucesso',
    SALE_CANCELLED: 'Venda cancelada com sucesso',
    NFCE_GENERATED: 'NFC-e gerada com sucesso',
    PIX_GENERATED: 'PIX gerado com sucesso',
  },
  
  ERROR_MESSAGES: {
    FETCH_ERROR: 'Erro ao buscar vendas',
    CREATE_ERROR: 'Erro ao criar venda',
    UPDATE_ERROR: 'Erro ao atualizar venda',
    CANCEL_ERROR: 'Erro ao cancelar venda',
    NFCE_ERROR: 'Erro ao gerar NFC-e',
    PIX_ERROR: 'Erro ao gerar PIX',
  },
} as const;