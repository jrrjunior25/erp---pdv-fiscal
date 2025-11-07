# Armazenamento de XMLs das NFC-e

## 📍 Localização dos XMLs

### 1. Banco de Dados (Principal)
- **Tabela**: `NFe`
- **Campo**: `xml` (String)
- **Vantagens**: Backup automático, consulta rápida, integridade referencial
- **Status**: ✅ Implementado e funcionando

### 2. Sistema de Arquivos (Backup)
- **Diretório**: `backend/storage/xmls/`
- **Estrutura**: `YYYY/MM/chave_acesso.xml`
- **Exemplo**: `2025/01/35250112345678901234567890123456789012345678.xml`
- **Status**: ✅ Implementado

## 🔧 Implementação

### Salvamento Automático
Quando uma NFC-e é emitida:
1. XML é gerado pelo `NfceService`
2. XML é salvo no banco de dados (tabela `NFe`)
3. XML é salvo como arquivo físico via `StorageService`
4. Se falhar o salvamento em arquivo, continua normalmente (não crítico)

### Recuperação Inteligente
Quando um XML é solicitado:
1. Primeiro tenta recuperar do banco de dados
2. Se não encontrar, tenta recuperar do arquivo físico
3. Retorna erro apenas se não encontrar em nenhum local

## 📂 Estrutura de Diretórios

```
backend/storage/xmls/
├── 2025/
│   ├── 01/
│   │   ├── 35250112345678901234567890123456789012345678.xml
│   │   └── 35250112345678901234567890123456789012345679.xml
│   ├── 02/
│   │   └── 35250212345678901234567890123456789012345680.xml
│   └── 03/
└── 2024/
    └── 12/
```

## 🌐 Endpoints da API

### Listar XMLs Salvos
```http
GET /fiscal/xmls?year=2025&month=1
```

**Resposta:**
```json
{
  "period": "01/2025",
  "totalNfes": 15,
  "nfes": [
    {
      "id": "uuid",
      "number": 1,
      "key": "35250112345678901234567890123456789012345678",
      "status": "AUTORIZADA",
      "createdAt": "2025-01-15T10:30:00Z",
      "hasFile": true
    }
  ]
}
```

### Obter XML Específico
```http
GET /fiscal/nfce/{id}/xml
```

## ⚙️ Configuração

### Variáveis de Ambiente
```env
# Tipo de armazenamento (local ou s3)
STORAGE_TYPE=local

# Para S3 (futuro)
AWS_S3_BUCKET=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
```

### Tipo de Storage
- **local**: Salva em `backend/storage/xmls/`
- **s3**: AWS S3 (não implementado ainda)

## 🔒 Segurança

### Validações Implementadas
- Sanitização de nomes de arquivo
- Validação de paths (previne directory traversal)
- Verificação de chave de acesso (44 dígitos)
- Estrutura de diretórios por ano/mês

### Logs
- Salvamento bem-sucedido: `XML salvo como arquivo: {chave}`
- Erro no salvamento: `Erro ao salvar XML como arquivo: {erro}`
- Recuperação de arquivo: `XML recuperado do arquivo: {chave}`

## 🚀 Benefícios

1. **Redundância**: XMLs em banco + arquivos
2. **Performance**: Consulta rápida no banco
3. **Backup**: Arquivos físicos para backup/auditoria
4. **Organização**: Estrutura por ano/mês
5. **Flexibilidade**: Suporte futuro para S3
6. **Robustez**: Fallback automático entre fontes

## 📋 Manutenção

### Limpeza de Arquivos Antigos
Recomenda-se criar rotina para arquivar XMLs antigos:
- Manter últimos 12 meses em acesso rápido
- Arquivar anos anteriores em storage frio
- Manter sempre no banco para consultas

### Monitoramento
- Verificar espaço em disco periodicamente
- Monitorar logs de erro no salvamento
- Validar integridade dos arquivos mensalmente