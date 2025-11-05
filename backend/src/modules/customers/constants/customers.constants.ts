export const CUSTOMERS_CONSTANTS = {
  CACHE_TTL: 15 * 60 * 1000, // 15 minutos
  
  VALIDATION_MESSAGES: {
    NAME_REQUIRED: 'Nome é obrigatório',
    DOCUMENT_INVALID: 'Documento inválido',
    EMAIL_INVALID: 'Email inválido',
    CUSTOMER_NOT_FOUND: 'Cliente não encontrado',
  },
  
  SUCCESS_MESSAGES: {
    CUSTOMER_CREATED: 'Cliente criado com sucesso',
    CUSTOMER_UPDATED: 'Cliente atualizado com sucesso',
    CUSTOMER_DELETED: 'Cliente excluído com sucesso',
  },
  
  ERROR_MESSAGES: {
    FETCH_ERROR: 'Erro ao buscar clientes',
    CREATE_ERROR: 'Erro ao criar cliente',
    UPDATE_ERROR: 'Erro ao atualizar cliente',
    DELETE_ERROR: 'Erro ao excluir cliente',
  },
} as const;