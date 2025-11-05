export const PRODUCTS_CONSTANTS = {
  CACHE_TTL: 10 * 60 * 1000, // 10 minutos
  
  VALIDATION_MESSAGES: {
    NAME_REQUIRED: 'Nome é obrigatório',
    BARCODE_REQUIRED: 'Código de barras é obrigatório',
    PRICE_REQUIRED: 'Preço é obrigatório',
    INVALID_PRICE: 'Preço deve ser maior que zero',
    PRODUCT_NOT_FOUND: 'Produto não encontrado',
    FILE_REQUIRED: 'Arquivo é obrigatório',
  },
  
  SUCCESS_MESSAGES: {
    PRODUCT_CREATED: 'Produto criado com sucesso',
    PRODUCT_UPDATED: 'Produto atualizado com sucesso',
    PRODUCT_DELETED: 'Produto excluído com sucesso',
    EXCEL_EXPORTED: 'Produtos exportados com sucesso',
    EXCEL_IMPORTED: 'Produtos importados com sucesso',
  },
  
  ERROR_MESSAGES: {
    FETCH_ERROR: 'Erro ao buscar produtos',
    CREATE_ERROR: 'Erro ao criar produto',
    UPDATE_ERROR: 'Erro ao atualizar produto',
    DELETE_ERROR: 'Erro ao excluir produto',
    EXPORT_ERROR: 'Erro ao exportar produtos',
    IMPORT_ERROR: 'Erro ao importar produtos',
  },
} as const;