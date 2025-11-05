export const AUTH_CONSTANTS = {
  JWT_EXPIRY: '24h',
  
  VALIDATION_MESSAGES: {
    INVALID_CREDENTIALS: 'Credenciais inválidas',
    USER_NOT_FOUND: 'Usuário não encontrado',
    UNAUTHORIZED: 'Não autorizado',
  },
  
  SUCCESS_MESSAGES: {
    LOGIN_SUCCESS: 'Login realizado com sucesso',
    LOGOUT_SUCCESS: 'Logout realizado com sucesso',
  },
  
  ERROR_MESSAGES: {
    LOGIN_ERROR: 'Erro ao fazer login',
    TOKEN_ERROR: 'Erro no token de acesso',
  },
} as const;