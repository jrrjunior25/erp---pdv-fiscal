export const SETTINGS_CONSTANTS = {
  CACHE_TTL: 5 * 60 * 1000, // 5 minutos
  DEFAULT_NFCE_SERIES: 1,
  DEFAULT_ENVIRONMENT: 'homologacao' as const,
  SUPPORTED_ENVIRONMENTS: ['homologacao', 'producao'] as const,
  
  VALIDATION_MESSAGES: {
    CERTIFICATE_REQUIRED: 'Certificado é obrigatório',
    PASSWORD_REQUIRED: 'Senha é obrigatória',
    FILE_REQUIRED: 'Arquivo é obrigatório',
    SETTINGS_NOT_FOUND: 'Configurações não encontradas',
    INVALID_ENVIRONMENT: 'Ambiente inválido',
  },
  
  SUCCESS_MESSAGES: {
    SETTINGS_UPDATED: 'Configurações atualizadas com sucesso',
    CERTIFICATE_UPLOADED: 'Certificado enviado com sucesso',
    LOGO_UPLOADED: 'Logo atualizado com sucesso',
    WALLPAPER_UPLOADED: 'Papel de parede atualizado com sucesso',
  },
  
  ERROR_MESSAGES: {
    SETTINGS_FETCH_ERROR: 'Erro ao buscar configurações',
    SETTINGS_UPDATE_ERROR: 'Erro ao atualizar configurações',
    CERTIFICATE_UPLOAD_ERROR: 'Erro ao fazer upload do certificado',
    CERTIFICATE_ENCRYPTION_ERROR: 'Falha ao processar certificado',
    LOGO_UPLOAD_ERROR: 'Erro ao fazer upload do logo',
    WALLPAPER_UPLOAD_ERROR: 'Erro ao fazer upload do papel de parede',
  },
} as const;