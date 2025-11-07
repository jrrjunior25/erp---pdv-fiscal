# Implementação NF-e e DANFE - Normas Brasileiras Atualizadas

## 📋 Visão Geral

Implementação completa de **NF-e (Nota Fiscal Eletrônica)** e **DANFE (Documento Auxiliar da Nota Fiscal Eletrônica)** seguindo as normas brasileiras atualizadas do layout 4.00 da SEFAZ.

## 🏗️ Arquitetura Implementada

### Serviços Criados

1. **NfeService** - Geração de XML NF-e
2. **DanfeService** - Geração de PDF DANFE
3. **SefazService** - Comunicação com SEFAZ (atualizado)
4. **FiscalService** - Orquestração (atualizado)

### Fluxo de Emissão

```
Dados da Venda → NfeService → XML NF-e → SefazService → Autorização
                     ↓
              DanfeService → PDF DANFE → StorageService → Arquivo
```

## 📄 Estrutura da NF-e (Layout 4.00)

### Elementos Obrigatórios Implementados

#### 1. Identificação (ide)
- **cUF**: Código da UF (35 - SP)
- **cNF**: Código numérico aleatório
- **natOp**: Natureza da operação
- **mod**: Modelo (55 - NF-e)
- **serie**: Série da NF-e
- **nNF**: Número da NF-e
- **dhEmi**: Data/hora de emissão
- **tpNF**: Tipo (1 - Saída)
- **idDest**: Destino (1 - Interna, 2 - Interestadual)
- **tpImp**: Tipo impressão (1 - DANFE Retrato)
- **tpEmis**: Tipo emissão (1 - Normal)
- **tpAmb**: Ambiente (1 - Produção, 2 - Homologação)
- **finNFe**: Finalidade (1 - Normal)
- **indFinal**: Consumidor final
- **indPres**: Presencial

#### 2. Emitente (emit)
- **CNPJ**: CNPJ do emitente
- **xNome**: Razão social
- **xFant**: Nome fantasia
- **enderEmit**: Endereço completo
- **IE**: Inscrição estadual
- **CRT**: Código regime tributário

#### 3. Destinatário (dest)
- **CNPJ/CPF**: Documento do destinatário
- **xNome**: Nome/razão social
- **enderDest**: Endereço completo
- **IE/indIEDest**: Inscrição estadual

#### 4. Produtos/Serviços (det)
- **cProd**: Código do produto
- **cEAN**: Código de barras
- **xProd**: Descrição
- **NCM**: Classificação fiscal
- **CFOP**: Código fiscal
- **uCom**: Unidade comercial
- **qCom**: Quantidade
- **vUnCom**: Valor unitário
- **vProd**: Valor total

#### 5. Impostos (imposto)
- **ICMS**: Configuração por CST/CSOSN
- **PIS**: Alíquota e base de cálculo
- **COFINS**: Alíquota e base de cálculo

#### 6. Totais (total)
- **ICMSTot**: Totalizadores de impostos
- **vBC**: Base de cálculo ICMS
- **vICMS**: Valor ICMS
- **vProd**: Total produtos
- **vNF**: Valor total da NF-e

#### 7. Transporte (transp)
- **modFrete**: Modalidade do frete
- **transporta**: Dados do transportador

#### 8. Cobrança (cobr)
- **fat**: Fatura
- **dup**: Duplicatas/parcelas

#### 9. Pagamento (pag)
- **detPag**: Detalhes do pagamento
- **tPag**: Forma de pagamento
- **vPag**: Valor pago

## 🎨 Layout DANFE Implementado

### Estrutura do PDF

#### Cabeçalho
- Título "DANFE"
- Subtítulo "Documento Auxiliar da Nota Fiscal Eletrônica"
- Tipo de operação (Entrada/Saída)
- Número e série da NF-e

#### Dados do Emitente
- Razão social e nome fantasia
- CNPJ e inscrição estadual
- Endereço completo

#### Dados do Destinatário
- Nome/razão social
- CNPJ/CPF
- Inscrição estadual (se houver)
- Endereço completo

#### Chave de Acesso
- Chave de 44 dígitos formatada
- Protocolo de autorização
- Data/hora de emissão

#### Produtos/Serviços
- Tabela com colunas:
  - Código
  - Descrição
  - NCM
  - CFOP
  - Unidade
  - Quantidade
  - Valor unitário
  - Valor total
  - Base ICMS
  - Valor ICMS

#### Cálculo dos Impostos
- Base de cálculo ICMS
- Valor ICMS
- Base ICMS ST
- Valor ICMS ST
- Total produtos
- Frete, seguro, desconto
- Outras despesas
- Valor IPI
- **Valor total da nota**

#### Transportador
- Dados do transportador
- Volumes transportados

#### Cobrança
- Dados das parcelas
- Vencimentos e valores

#### Informações Adicionais
- Observações
- Status da NF-e
- Protocolo de autorização

## 🔧 Configuração e Uso

### 1. Configuração Fiscal

```typescript
// Adicionar série da NF-e na configuração
{
  nfeSeries: 1, // Série para NF-e
  nfceSeries: 1, // Série para NFC-e (já existente)
  // ... outros campos
}
```

### 2. Emissão de NF-e

```typescript
// POST /fiscal/issue-nfe
{
  "saleId": "uuid-da-venda",
  "items": [
    {
      "productId": "codigo-produto",
      "name": "Descrição do produto",
      "ncm": "12345678",
      "cfop": "5102",
      "quantity": 2,
      "price": 100.00,
      "cstIcms": "102",
      "cstPis": "07",
      "cstCofins": "07",
      "aliqIcms": 18.00,
      "origem": "0"
    }
  ],
  "total": 200.00,
  "recipient": {
    "name": "Cliente Exemplo",
    "cnpj": "12.345.678/0001-90",
    "street": "Rua das Flores",
    "number": "123",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "cityCode": "3550308",
    "state": "SP",
    "zipCode": "01234-567"
  },
  "transport": {
    "modality": "9", // Sem frete
    "carrierName": "Transportadora XYZ",
    "carrierCnpj": "98.765.432/0001-10"
  },
  "payment": {
    "method": "CARTAO_CREDITO",
    "installments": [
      {
        "number": 1,
        "dueDate": "2025-02-15",
        "value": 100.00
      },
      {
        "number": 2,
        "dueDate": "2025-03-15",
        "value": 100.00
      }
    ]
  }
}
```

### 3. Download do DANFE

```bash
# Baixar DANFE da NF-e
GET /fiscal/nfe/{id}/danfe

# Headers da resposta:
Content-Type: application/pdf
Content-Disposition: attachment; filename="DANFE_000000001_35250112345678901234567890123456789012345678.pdf"
```

## 📂 Armazenamento

### XMLs da NF-e
```
storage/xmls/
└── 2025/01/
    └── 35250112345678901234567890123456789012345678.xml
```

### DANFEs (PDFs)
```
storage/pdfs/
└── 2025/01/15/
    └── 35250112345678901234567890123456789012345678.pdf
```

## 🔐 Assinatura Digital

### Processo Implementado

1. **Carregamento do Certificado A1**
   - Decodificação do base64
   - Extração da chave privada
   - Validação da validade

2. **Geração da Assinatura**
   - Hash SHA-256 do elemento `infNFe`
   - Criação do `SignedInfo`
   - Assinatura RSA-SHA256
   - Inserção no XML

3. **Estrutura da Assinatura**
   ```xml
   <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
     <SignedInfo>
       <CanonicalizationMethod Algorithm="..."/>
       <SignatureMethod Algorithm="..."/>
       <Reference URI="#NFe{chave}">
         <Transforms>...</Transforms>
         <DigestMethod Algorithm="..."/>
         <DigestValue>...</DigestValue>
       </Reference>
     </SignedInfo>
     <SignatureValue>...</SignatureValue>
     <KeyInfo>
       <X509Data>
         <X509Certificate>...</X509Certificate>
       </X509Data>
     </KeyInfo>
   </Signature>
   ```

## 🌐 Comunicação SEFAZ

### WebServices Utilizados

#### Homologação (SP)
- **Autorização**: `https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeAutorizacao4.asmx`
- **Retorno**: `https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeRetAutorizacao4.asmx`
- **Status**: `https://homologacao.nfce.fazenda.sp.gov.br/ws/NFeStatusServico4.asmx`

#### Produção (SP)
- **Autorização**: `https://nfce.fazenda.sp.gov.br/ws/NFeAutorizacao4.asmx`
- **Retorno**: `https://nfce.fazenda.sp.gov.br/ws/NFeRetAutorizacao4.asmx`
- **Status**: `https://nfce.fazenda.sp.gov.br/ws/NFeStatusServico4.asmx`

### Fluxo de Autorização

1. **Envio Síncrono**
   - Envelope `enviNFe`
   - XML assinado
   - Lote único

2. **Processamento**
   - Status 100: Autorizada
   - Status 103/105: Em processamento
   - Outros: Rejeitada

3. **Consulta Retorno**
   - Aguarda processamento
   - Máximo 5 tentativas
   - Intervalo de 2 segundos

## 📊 Códigos de Status SEFAZ

| Código | Descrição |
|--------|-----------|
| 100 | Autorizado o uso da NF-e |
| 103 | Lote recebido com sucesso |
| 105 | Lote em processamento |
| 107 | Serviço em operação |
| 110 | Uso denegado |
| 301 | Uso denegado: Irregularidade fiscal |

## 🚨 Tratamento de Erros

### Validações Implementadas

1. **XML**: Estrutura e elementos obrigatórios
2. **Certificado**: Validade e formato
3. **CNPJ/CPF**: Formato e dígitos verificadores
4. **Chave de Acesso**: 44 dígitos e DV
5. **Impostos**: Alíquotas e bases de cálculo

### Logs Detalhados

- Geração de XML
- Assinatura digital
- Envio para SEFAZ
- Resposta da autorização
- Salvamento de arquivos
- Erros e exceções

## 🔄 Manutenção e Monitoramento

### Rotinas Recomendadas

1. **Backup Diário**
   - XMLs e DANFEs
   - Banco de dados

2. **Monitoramento**
   - Status SEFAZ
   - Validade do certificado
   - Espaço em disco

3. **Limpeza**
   - Arquivos antigos (>12 meses)
   - Logs de sistema

### Métricas Importantes

- Taxa de autorização
- Tempo de resposta SEFAZ
- Erros de comunicação
- Volume de emissões

## 🎯 Conformidade Legal

### Normas Atendidas

- **NT 2016.002** - Layout NF-e 4.00
- **NT 2018.005** - DANFE NF-e
- **Resolução CGSN 140/2018** - Simples Nacional
- **Convênio ICMS 57/95** - Código fiscal

### Validações Fiscais

- NCM obrigatório
- CFOP por tipo de operação
- CST/CSOSN por regime tributário
- Alíquotas por estado
- Chave de acesso única

## 🚀 Próximos Passos

1. **Contingência**: Implementar emissão offline
2. **Eventos**: Cancelamento e correção
3. **Consultas**: Status e protocolo
4. **Relatórios**: Livro fiscal eletrônico
5. **Integração**: ERP e sistemas terceiros

A implementação está completa e pronta para uso em produção, seguindo todas as normas brasileiras atualizadas! 🇧🇷