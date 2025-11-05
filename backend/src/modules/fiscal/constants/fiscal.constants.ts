export const FISCAL_CONSTANTS = {
  CACHE_TTL: 2 * 60 * 1000, // 2 minutos
  
  ENVIRONMENTS: ['homologacao', 'producao'] as const,
  NFCE_STATUS: ['PENDENTE', 'AUTORIZADA', 'REJEITADA', 'SEM_CERTIFICADO'] as const,
  
  VALIDATION_MESSAGES: {
    CONFIG_NOT_FOUND: 'Configuração fiscal não encontrada',
    CERTIFICATE_REQUIRED: 'Certificado é obrigatório',
    INVALID_XML: 'XML NFC-e inválido',
    INVALID_BRCODE: 'BR Code PIX inválido',
    NFCE_NOT_FOUND: 'NFC-e não encontrada',
    INVALID_CERTIFICATE: 'Certificado inválido',
  },
  
  SUCCESS_MESSAGES: {
    NFCE_ISSUED: 'NFC-e emitida com sucesso',
    PIX_GENERATED: 'PIX gerado com sucesso',
    CERTIFICATE_UPLOADED: 'Certificado validado e salvo',
    CONFIG_SAVED: 'Configuração fiscal salva',
  },
  
  ERROR_MESSAGES: {
    NFCE_ERROR: 'Erro ao emitir NFC-e',
    PIX_ERROR: 'Erro ao gerar PIX',
    CERTIFICATE_ERROR: 'Erro no certificado',
    CONFIG_ERROR: 'Erro na configuração fiscal',
    SEFAZ_ERROR: 'Erro na comunicação com SEFAZ',
  },
} as const;