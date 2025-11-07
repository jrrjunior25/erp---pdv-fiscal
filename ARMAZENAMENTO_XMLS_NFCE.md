# Armazenamento de XMLs e PDFs das NFC-e

## 📍 Localização dos Arquivos

### 1. Banco de Dados (Principal)
- **Tabela**: `NFe`
- **Campo**: `xml` (String)
- **Vantagens**: Backup automático, consulta rápida, integridade referencial
- **Status**: ✅ Implementado e funcionando

### 2. XMLs - Sistema de Arquivos (Backup)
- **Diretório**: `backend/storage/xmls/`
- **Estrutura**: `YYYY/MM/chave_acesso.xml`
- **Exemplo**: `2025/01/35250112345678901234567890123456789012345678.xml`
- **Status**: ✅ Implementado

### 3. PDFs - Sistema de Arquivos (Organizado por Dia)
- **Diretório**: `backend/storage/pdfs/`
- **Estrutura**: `YYYY/MM/DD/chave_acesso.pdf`
- **Exemplo**: `2025/01/15/35250112345678901234567890123456789012345678.pdf`
- **Status**: ✅ Implementado

## 🔧 Implementação

### Salvamento Automático
Quando uma NFC-e é emitida:
1. XML é gerado pelo `NfceService`
2. XML é salvo no banco de dados (tabela `NFe`)
3. XML é salvo como arquivo físico via `StorageService`
4. PDF é gerado pelo `PdfService` com layout DANFE simplificado
5. PDF é salvo organizado por dia via `StorageService`
6. Se falhar o salvamento em arquivos, continua normalmente (não crítico)

### Recuperação Inteligente
Quando um XML é solicitado:
1. Primeiro tenta recuperar do banco de dados
2. Se não encontrar, tenta recuperar do arquivo físico
3. Retorna erro apenas se não encontrar em nenhum local

## 📂 Estrutura de Diretórios

```
backend/storage/
├── xmls/
│   ├── 2025/
│   │   ├── 01/
│   │   │   ├── 35250112345678901234567890123456789012345678.xml
│   │   │   └── 35250112345678901234567890123456789012345679.xml
│   │   └── 02/
│   └── 2024/
└── pdfs/
    ├── 2025/
    │   ├── 01/
    │   │   ├── 15/  # Dia 15
    │   │   │   ├── 35250112345678901234567890123456789012345678.pdf
    │   │   │   └── 35250112345678901234567890123456789012345679.pdf
    │   │   └── 16/  # Dia 16
    │   │       └── 35250112345678901234567890123456789012345680.pdf
    │   └── 02/
    └── 2024/
```

## 🌐 Endpoints da API

### Listar XMLs Salvos
```http
GET /fiscal/xmls?year=2025&month=1
```

### Listar PDFs Salvos
```http
GET /fiscal/pdfs?year=2025&month=1&day=15
```

**Resposta:**
```json
{
  "period": "15/01/2025",
  "totalPdfs": 8,
  "files": [
    {
      "name": "35250112345678901234567890123456789012345678.pdf",
      "path": "storage/pdfs/2025/01/15/35250112345678901234567890123456789012345678.pdf",
      "key": "35250112345678901234567890123456789012345678"
    }
  ]
}
```

### Obter XML Específico
```http
GET /fiscal/nfce/{id}/xml
```

### Baixar PDF da NFC-e
```http
GET /fiscal/nfce/{id}/pdf
```

### Regenerar PDF
```http
POST /fiscal/nfce/{id}/regenerate-pdf
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
- **XML**: `XML salvo como arquivo: {chave}`
- **PDF**: `PDF salvo: {chave}`
- **Erros**: `Erro ao salvar XML/PDF como arquivo: {erro}`
- **Recuperação**: `XML/PDF recuperado do arquivo: {chave}`
- **Regeneração**: `PDF regenerado: {chave}`

## 🚀 Benefícios

1. **Redundância**: XMLs em banco + arquivos
2. **Performance**: Consulta rápida no banco
3. **Backup**: Arquivos físicos para backup/auditoria
4. **Organização**: XMLs por mês, PDFs por dia
5. **Flexibilidade**: Suporte futuro para S3
6. **Robustez**: Fallback automático entre fontes
7. **Visualização**: PDFs prontos para impressão/visualização
8. **Auditoria**: Fácil localização por data específica

## 🎨 Layout do PDF

O PDF gerado contém:
- **Cabeçalho**: Título "NFC-e - Nota Fiscal de Consumidor Eletrônica"
- **Emitente**: Nome, CNPJ e endereço completo
- **Dados da NFC-e**: Número, série, data/hora, chave de acesso, status
- **Destinatário**: Nome e CPF (se informado)
- **Produtos**: Tabela com descrição, quantidade, valor unitário e total
- **Total Geral**: Valor total da NFC-e em destaque
- **QR Code**: Informações para consulta (texto)
- **Rodapé**: Identificação do sistema gerador

## 📋 Manutenção

### Limpeza de Arquivos Antigos
Recomenda-se criar rotina para arquivar arquivos antigos:
- **XMLs**: Manter últimos 12 meses em acesso rápido
- **PDFs**: Manter últimos 6 meses (maior volume)
- Arquivar anos anteriores em storage frio
- Manter sempre no banco para consultas

### Monitoramento
- Verificar espaço em disco periodicamente
- Monitorar logs de erro no salvamento
- Validar integridade dos arquivos mensalmente
- Acompanhar crescimento do diretório de PDFs