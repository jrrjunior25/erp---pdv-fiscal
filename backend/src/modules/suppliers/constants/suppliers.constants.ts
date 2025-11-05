export const SUPPLIERS_CONSTANTS = {
  CACHE_TTL: 20 * 60 * 1000,
  
  VALIDATION_MESSAGES: {
    NAME_REQUIRED: 'Nome é obrigatório',
    CNPJ_REQUIRED: 'CNPJ é obrigatório',
    SUPPLIER_NOT_FOUND: 'Fornecedor não encontrado',
  },
  
  SUCCESS_MESSAGES: {
    SUPPLIER_CREATED: 'Fornecedor criado com sucesso',
    SUPPLIER_UPDATED: 'Fornecedor atualizado com sucesso',
  },
  
  ERROR_MESSAGES: {
    FETCH_ERROR: 'Erro ao buscar fornecedores',
    CREATE_ERROR: 'Erro ao criar fornecedor',
  },
} as const;