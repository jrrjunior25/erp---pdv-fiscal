# 💳 Configuração PIX - Legislação Brasileira

## 📋 Padrão BR Code (EMV)

O sistema gera QR Codes PIX seguindo o **padrão EMV** definido pelo Banco Central do Brasil.

### Estrutura do BR Code

```
00 02 01                    - Payload Format Indicator
26 XX [Merchant Account]    - Merchant Account Information
52 04 0000                  - Merchant Category Code
53 03 986                   - Transaction Currency (BRL)
54 XX [Valor]               - Transaction Amount
58 02 BR                    - Country Code
59 XX [Nome]                - Merchant Name
60 XX [Cidade]              - Merchant City
62 XX [TxId]                - Additional Data
63 04 [CRC]                 - CRC16-CCITT
```

## 🔧 Configuração

### 1. Adicionar Chave PIX no .env

```env
# Chave PIX (CPF, CNPJ, Email, Telefone ou Chave Aleatória)
PIX_KEY=12345678000190

# Nome do Estabelecimento (máx 25 caracteres)
PIX_MERCHANT_NAME=MINHA LOJA LTDA

# Cidade do Estabelecimento (máx 15 caracteres)
PIX_MERCHANT_CITY=SAO PAULO
```

### 2. Tipos de Chave PIX Aceitos

**CPF:**
```env
PIX_KEY=12345678901
```

**CNPJ:**
```env
PIX_KEY=12345678000190
```

**Email:**
```env
PIX_KEY=pagamentos@minhaloja.com.br
```

**Telefone:**
```env
PIX_KEY=+5511999999999
```

**Chave Aleatória:**
```env
PIX_KEY=123e4567-e89b-12d3-a456-426614174000
```

## 🎯 Como Funciona

### 1. Geração Automática na Venda

Quando o pagamento é PIX, o sistema:
1. Gera BR Code automaticamente
2. Cria QR Code visual
3. Retorna para exibição no PDV
4. Expira em 30 minutos

### 2. Exemplo de Uso

```typescript
// No backend (automático)
const pixResult = await pixService.generatePixCharge({
  amount: 150.00,
  merchantName: 'MINHA LOJA',
  merchantCity: 'SAO PAULO',
  pixKey: '12345678000190',
  description: 'Venda #123',
  txId: 'VENDA123'
});

// Retorna:
{
  qrCode: "00020126...6304ABCD",  // BR Code
  txId: "VENDA123",
  amount: 150.00,
  expiresAt: "2024-01-15T15:30:00Z"
}
```

## 📱 Exibição no Frontend

O QR Code é gerado usando a biblioteca `qrcode.react`:

```tsx
import QRCode from 'qrcode.react';

<QRCode 
  value={pixResult.qrCode} 
  size={256}
  level="M"
/>
```

## ✅ Validação

O sistema valida:
- ✅ Formato do BR Code
- ✅ CRC16-CCITT correto
- ✅ Campos obrigatórios
- ✅ Tamanho dos campos

```typescript
const isValid = pixService.validateBRCode(brCode);
```

## 🔍 Decodificação

Para debug, é possível decodificar um BR Code:

```typescript
const info = pixService.decodeBRCode(brCode);
// Retorna: { amount: 150.00, merchantName: 'MINHA LOJA', merchantCity: 'SAO PAULO' }
```

## 📊 Campos do BR Code

| Tag | Nome | Tamanho | Obrigatório | Exemplo |
|-----|------|---------|-------------|---------|
| 00 | Payload Format | 2 | Sim | 01 |
| 26 | Merchant Account | Variável | Sim | br.gov.bcb.pix |
| 52 | MCC | 4 | Sim | 0000 |
| 53 | Currency | 3 | Sim | 986 (BRL) |
| 54 | Amount | Variável | Sim | 150.00 |
| 58 | Country | 2 | Sim | BR |
| 59 | Merchant Name | Máx 25 | Sim | MINHA LOJA |
| 60 | Merchant City | Máx 15 | Sim | SAO PAULO |
| 62 | Additional Data | Variável | Não | TxId |
| 63 | CRC | 4 | Sim | ABCD |

## 🔐 Segurança

### CRC16-CCITT

O sistema calcula automaticamente o CRC16 usando:
- Polinômio: 0x1021
- Valor inicial: 0xFFFF
- Padrão CCITT

### Normalização

Strings são normalizadas:
- Remove acentos
- Converte para maiúsculas
- Remove caracteres especiais
- Mantém apenas A-Z, 0-9 e espaços

## 🧪 Testar PIX

### 1. Gerar QR Code de Teste

```bash
curl -X POST http://localhost:3001/fiscal/pix/generate \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10.00,
    "merchantName": "TESTE",
    "merchantCity": "SAO PAULO",
    "pixKey": "12345678000190"
  }'
```

### 2. Validar BR Code

```bash
curl -X POST http://localhost:3001/fiscal/pix/validate \
  -H "Content-Type: application/json" \
  -d '{
    "brCode": "00020126...6304ABCD"
  }'
```

## 📖 Referências

- [Manual PIX - Banco Central](https://www.bcb.gov.br/estabilidadefinanceira/pix)
- [Especificação EMV QR Code](https://www.emvco.com/emv-technologies/qrcodes/)
- [Padrão BR Code](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf)

## ⚠️ Importante

1. **Chave PIX Real**: Configure sua chave PIX real no `.env`
2. **Homologação**: Teste em ambiente de homologação primeiro
3. **Webhook**: Implemente webhook para confirmar pagamentos
4. **Timeout**: QR Codes expiram em 30 minutos
5. **Conciliação**: Implemente rotina de conciliação bancária

## 🔄 Integração com PSP

Para produção, integre com um PSP (Provedor de Serviços de Pagamento):

- **Mercado Pago**
- **PagSeguro**
- **Cielo**
- **Stone**
- **Banco do Brasil**
- **Itaú**

Eles fornecem:
- Webhook de confirmação
- Conciliação automática
- Estorno
- Split de pagamento
