export const SHIFTS_CONSTANTS = {
  CACHE_TTL: 1 * 60 * 1000,
  
  STATUS: ['OPEN', 'CLOSED'] as const,
  
  VALIDATION_MESSAGES: {
    USER_REQUIRED: 'Usuário é obrigatório',
    SHIFT_NOT_FOUND: 'Turno não encontrado',
    SHIFT_ALREADY_OPEN: 'Já existe um turno aberto',
  },
  
  SUCCESS_MESSAGES: {
    SHIFT_OPENED: 'Turno aberto com sucesso',
    SHIFT_CLOSED: 'Turno fechado com sucesso',
  },
  
  ERROR_MESSAGES: {
    OPEN_ERROR: 'Erro ao abrir turno',
    CLOSE_ERROR: 'Erro ao fechar turno',
  },
} as const;