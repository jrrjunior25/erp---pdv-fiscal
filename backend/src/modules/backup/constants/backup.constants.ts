export const BACKUP_CONSTANTS = {
  BACKUP_TYPES: ['FULL', 'INCREMENTAL'] as const,
  STATUS: ['RUNNING', 'COMPLETED', 'FAILED'] as const,
  
  VALIDATION_MESSAGES: {
    TYPE_REQUIRED: 'Tipo de backup é obrigatório',
    INVALID_TYPE: 'Tipo de backup inválido',
  },
  
  SUCCESS_MESSAGES: {
    BACKUP_STARTED: 'Backup iniciado com sucesso',
    BACKUP_COMPLETED: 'Backup concluído com sucesso',
    RESTORE_COMPLETED: 'Restauração concluída com sucesso',
  },
  
  ERROR_MESSAGES: {
    BACKUP_ERROR: 'Erro ao fazer backup',
    RESTORE_ERROR: 'Erro ao restaurar backup',
    FILE_NOT_FOUND: 'Arquivo de backup não encontrado',
  },
} as const;