# Exemplo de Uso - PDFs das NFC-e

## 🚀 Funcionalidades Implementadas

### 1. Geração Automática de PDF
Quando uma NFC-e é emitida, o sistema automaticamente:
- Gera o XML da NFC-e
- Salva o XML no banco e como arquivo
- **Gera um PDF formatado da NFC-e**
- **Salva o PDF organizado por dia**

### 2. Estrutura de Pastas por Dia
```
storage/pdfs/
├── 2025/
│   ├── 01/
│   │   ├── 15/  ← Dia 15 de Janeiro
│   │   │   ├── 35250112345678901234567890123456789012345678.pdf
│   │   │   └── 35250112345678901234567890123456789012345679.pdf
│   │   ├── 16/  ← Dia 16 de Janeiro
│   │   │   └── 35250112345678901234567890123456789012345680.pdf
│   │   └── 17/  ← Dia 17 de Janeiro
│   └── 02/
└── 2024/
```

## 📋 Exemplos de Uso da API

### Listar PDFs de um Dia Específico
```bash
# Listar PDFs do dia 15/01/2025
GET /fiscal/pdfs?year=2025&month=1&day=15

# Resposta:
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

### Listar PDFs de um Mês Inteiro
```bash
# Listar todos os PDFs de Janeiro/2025
GET /fiscal/pdfs?year=2025&month=1

# Resposta:
{
  "period": "01/2025",
  "totalPdfs": 45,
  "files": [
    {
      "name": "35250112345678901234567890123456789012345678.pdf",
      "path": "storage/pdfs/2025/01/15/35250112345678901234567890123456789012345678.pdf",
      "key": "35250112345678901234567890123456789012345678"
    },
    // ... mais arquivos
  ]
}
```

### Baixar PDF de uma NFC-e Específica
```bash
# Baixar PDF da NFC-e pelo ID
GET /fiscal/nfce/{nfe-id}/pdf

# Headers da resposta:
Content-Type: application/pdf
Content-Disposition: attachment; filename="NFCe_000000001_35250112345678901234567890123456789012345678.pdf"
Cache-Control: no-cache
```

### Regenerar PDF de uma NFC-e
```bash
# Regenerar PDF (útil se houve erro na geração inicial)
POST /fiscal/nfce/{nfe-id}/regenerate-pdf

# Resposta:
{
  "success": true,
  "message": "PDF regenerado com sucesso",
  "key": "35250112345678901234567890123456789012345678"
}
```

## 🎨 Layout do PDF Gerado

O PDF contém todas as informações da NFC-e formatadas de forma legível:

```
┌─────────────────────────────────────────────────────────────┐
│              NFC-e - Nota Fiscal de Consumidor Eletrônica  │
├─────────────────────────────────────────────────────────────┤
│ EMITENTE                                                    │
│ Empresa Exemplo LTDA                                        │
│ CNPJ: 12.345.678/0001-90                                   │
│ Rua das Flores, 123 - Centro, São Paulo/SP                 │
├─────────────────────────────────────────────────────────────┤
│ DADOS DA NFC-e                                              │
│ Número: 000000001                                           │
│ Série: 1                                                    │
│ Data/Hora: 15/01/2025 14:30:00                            │
│ Chave: 35250112345678901234567890123456789012345678        │
│ Status: AUTORIZADA                                          │
├─────────────────────────────────────────────────────────────┤
│ PRODUTOS/SERVIÇOS                                           │
│ Descrição          Qtd    Valor Unit.    Total             │
│ ─────────────────────────────────────────────────────────  │
│ Produto A           2      R$ 10,00      R$ 20,00          │
│ Produto B           1      R$ 15,50      R$ 15,50          │
│ ─────────────────────────────────────────────────────────  │
│                              TOTAL GERAL: R$ 35,50         │
├─────────────────────────────────────────────────────────────┤
│ CONSULTE PELA CHAVE DE ACESSO EM:                          │
│ www.fazenda.sp.gov.br/nfce                                  │
│ Chave: 35250112345678901234567890123456789012345678        │
├─────────────────────────────────────────────────────────────┤
│        Documento gerado automaticamente pelo sistema       │
│                         ERP+PDV                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Configuração e Manutenção

### Espaço em Disco
- **XMLs**: ~2-5 KB por arquivo
- **PDFs**: ~15-30 KB por arquivo
- **Estimativa**: 1000 NFC-e/mês = ~30 MB de PDFs

### Rotina de Limpeza Sugerida
```bash
# Manter PDFs dos últimos 6 meses
# Arquivar PDFs mais antigos
# Exemplo de script de limpeza (executar mensalmente):

# Mover PDFs de mais de 6 meses para pasta de arquivo
find storage/pdfs -name "*.pdf" -mtime +180 -exec mv {} storage/archive/pdfs/ \;
```

### Monitoramento
- Verificar crescimento do diretório `storage/pdfs/`
- Monitorar logs de geração de PDF
- Validar integridade dos arquivos periodicamente

## 🚨 Tratamento de Erros

### Falha na Geração de PDF
- Sistema continua funcionando normalmente
- XML é salvo no banco e como arquivo
- Log de erro é registrado
- PDF pode ser regenerado posteriormente

### PDF Corrompido ou Perdido
- Use o endpoint de regeneração: `POST /fiscal/nfce/{id}/regenerate-pdf`
- Sistema recria o PDF baseado nos dados do banco
- Mantém a mesma estrutura de pastas por data

## 💡 Dicas de Uso

1. **Backup Diário**: Configure backup automático da pasta `storage/pdfs/`
2. **Consulta Rápida**: Use filtros por data para localizar PDFs específicos
3. **Impressão em Lote**: Liste PDFs de um dia e imprima todos de uma vez
4. **Auditoria**: Organize relatórios por período usando a estrutura de pastas
5. **Performance**: PDFs são gerados de forma assíncrona, não impactam a emissão da NFC-e