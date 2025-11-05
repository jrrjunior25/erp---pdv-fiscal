export const USERS_CONSTANTS = {
  CACHE_TTL: 30 * 60 * 1000, // 30 minutos
  
  ROLES: ['ADMIN', 'MANAGER', 'SELLER', 'CASHIER'] as const,
  
  VALIDATION_MESSAGES: {
    NAME_REQUIRED: 'Nome é obrigatório',
    EMAIL_REQUIRED: 'Email é obrigatório',
    PASSWORD_REQUIRED: 'Senha é obrigatória',
    INVALID_EMAIL: 'Email inválido',
    USER_NOT_FOUND: 'Usuário não encontrado',
    EMAIL_EXISTS: 'Email já cadastrado',
  },
  
  SUCCESS_MESSAGES: {
    USER_CREATED: 'Usuário criado com sucesso',
    USER_UPDATED: 'Usuário atualizado com sucesso',
    USER_DELETED: 'Usuário excluído com sucesso',
  },
  
  ERROR_MESSAGES: {
    FETCH_ERROR: 'Erro ao buscar usuários',
    CREATE_ERROR: 'Erro ao criar usuário',
    UPDATE_ERROR: 'Erro ao atualizar usuário',
    DELETE_ERROR: 'Erro ao excluir usuário',
  },
} as const;