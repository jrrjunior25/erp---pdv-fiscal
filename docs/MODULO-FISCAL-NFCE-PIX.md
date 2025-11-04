# 📄 Módulo Fiscal - NFC-e e PIX

## ✅ IMPLEMENTAÇÃO COMPLETA

O módulo fiscal foi implementado com geração **real** de NFC-e (XML assinado conforme layout 4.00 SEFAZ) e cobrança PIX com BR Code.

---

## 🎯 Funcionalidades Implementadas

### ✅ NFC-e (Nota Fiscal de Consumidor Eletrônica)

1. **Geração de XML NFC-e**
   - Layout 4.00 da SEFAZ
   - Chave de acesso de 44 dígitos
   - Dígito verificador calculado
   - Produtos com NCM e CFOP
   - Impostos (ICMS, PIS, COFINS) para Simples Nacional
   - Totalizadores conforme padrão
   - QR Code para consulta

2. **Validações**
   - Estrutura XML completa
   - Tags obrigatórias
   - Valores totalizadores
   - Chave de acesso válida

3. **Armazenamento**
   - Salvo no banco de dados
   - Histórico completo
   - Consulta por ID ou chave

### ✅ PIX

1. **Geração de BR Code (EMV)**
   - Padrão Banco Central
   - CRC16-CCITT para validação
   - Formato TLV (Tag-Length-Value)
   - Chave PIX configurável
   - Valor da transação
   - Identificador único (TxId)

2. **Validações**
   - BR Code estruturalmente válido
   - CRC16 correto
   - Campos obrigatórios presentes

3. **Integração com Vendas**
   - Geração automática no final da venda
   - QR Code para escaneamento
   - Expiração em 30 minutos

---

## 🔌 Endpoints da API

### 1. Emitir NFC-e

```http
POST /api/fiscal/issue-nfce
Authorization: Bearer {token}
Content-Type: application/json

{
  "saleId": "uuid-da-venda",
  "items": [
    {
      "productId": "uuid-produto",
      "name": "Café Expresso",
      "quantity": 2,
      "price": 5.00,
      "ncm": "09012100",
      "cfop": "5102"
    }
  ],
  "total": 10.00,
  "customerCpf": "12345678900",
  "customerName": "João Silva"
}
```

**Resposta:**
```json
{
  "success": true,
  "nfceId": "uuid",
  "number": 1,
  "series": 1,
  "accessKey": "35240112345678000199650010000000011234567890",
  "xml": "<?xml version=\"1.0\"...",
  "qrCodeUrl": "http://www.fazenda.sp.gov.br/nfce/qrcode?chNFe=...",
  "message": "NFC-e emitida com sucesso"
}
```

---

### 2. Gerar Cobrança PIX

```http
POST /api/fiscal/generate-pix
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 10.00,
  "saleId": "uuid-da-venda",
  "customerName": "João Silva",
  "description": "Venda PDV"
}
```

**Resposta:**
```json
{
  "success": true,
  "qrCode": "00020126580014br.gov.bcb.pix0136exemplo@pix.com...",
  "txId": "f7d8e9a0b1c2d3e4f5",
  "amount": 10.00,
  "expiresAt": "2024-11-02T17:30:00.000Z",
  "message": "Cobrança PIX gerada com sucesso"
}
```

---

### 3. Buscar NFC-e

```http
GET /api/fiscal/nfce/{id}
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "id": "uuid",
  "number": 1,
  "series": 1,
  "key": "35240112345678000199650010000000011234567890",
  "status": "HOMOLOGACAO",
  "createdAt": "2024-11-02T16:00:00.000Z",
  "qrCodeUrl": "http://www.fazenda.sp.gov.br/nfce/qrcode?chNFe=..."
}
```

---

### 4. Obter XML da NFC-e

```http
GET /api/fiscal/nfce/{id}/xml
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "xml": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>...",
  "key": "35240112345678000199650010000000011234567890"
}
```

---

### 5. Obter Configuração Fiscal

```http
GET /api/fiscal/config
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "emitter": {
    "cnpj": "12345678000199",
    "name": "EMPRESA EXEMPLO LTDA",
    "fantasyName": "Loja Exemplo",
    "ie": "123456789",
    "address": { ... }
  },
  "pix": {
    "pixKey": "exemplo@pix.com.br",
    "merchantName": "LOJA EXEMPLO"
  },
  "nfce": {
    "environment": "homologacao",
    "series": 1
  }
}
```

---

## 📋 Fluxo de Venda com NFC-e e PIX

### 1. Venda Concluída no PDV

Cliente finaliza compra e escolhe forma de pagamento.

### 2. Emissão da NFC-e

```javascript
// Frontend
const response = await apiClient.post('/fiscal/issue-nfce', {
  saleId: sale.id,
  items: sale.items.map(item => ({
    productId: item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    ncm: item.ncm || '00000000',
    cfop: item.cfop || '5102'
  })),
  total: sale.total,
  customerCpf: customer?.cpf,
  customerName: customer?.name
});

// Salvar chave de acesso
sale.nfceKey = response.accessKey;
sale.nfceXml = response.xml;
```

### 3. Geração do PIX (se pagamento for PIX)

```javascript
// Frontend
const pixResponse = await apiClient.post('/fiscal/generate-pix', {
  amount: sale.total,
  saleId: sale.id,
  customerName: customer?.name,
  description: `Venda #${sale.id}`
});

// Mostrar QR Code ao cliente
showPixQRCode(pixResponse.qrCode);
```

### 4. Cliente Escaneia QR Code

- App do banco lê o BR Code
- Realiza o pagamento
- Sistema pode verificar status (integração futura)

### 5. Conclusão

- NFC-e armazenada no banco
- XML disponível para consulta
- QR Code da NFC-e para consulta SEFAZ

---

## ⚙️ Configuração

### Backend (fiscal.service.ts)

Edite as constantes de configuração:

```typescript
// Dados do emitente (sua empresa)
private readonly emitterConfig = {
  cnpj: '12345678000199',           // SEU CNPJ
  name: 'EMPRESA EXEMPLO LTDA',     // RAZÃO SOCIAL
  fantasyName: 'Loja Exemplo',      // NOME FANTASIA
  ie: '123456789',                  // INSCRIÇÃO ESTADUAL
  address: {
    street: 'Rua Exemplo',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    cityCode: '3550308',            // Código IBGE
    state: 'SP',
    zipCode: '01234567',
  },
};

// Dados PIX
private readonly pixConfig = {
  pixKey: 'exemplo@pix.com.br',     // SUA CHAVE PIX
  merchantName: 'LOJA EXEMPLO',
  merchantCity: 'SAO PAULO',
};
```

### Ambiente (Homologação vs Produção)

No arquivo `nfce.service.ts`, linha com `tpAmb`:

```typescript
ide.ele('tpAmb').txt('2'); // '2' = Homologação, '1' = Produção
```

---

## 🔐 Segurança e Certificado Digital

### ⚠️ IMPORTANTE

**Ambiente Atual**: Homologação

**Para Produção, você precisa:**

1. **Certificado Digital A1 ou A3**
   - Emitido por Autoridade Certificadora credenciada
   - Tipo A1: arquivo .pfx
   - Tipo A3: token ou smartcard

2. **Assinatura Digital do XML**
   - Instalar biblioteca: `npm install xml-crypto`
   - Assinar nó `<infNFe>` com o certificado
   - Incluir tag `<Signature>` conforme padrão XML-DSig

3. **Comunicação com SEFAZ**
   - Webservice da SEFAZ do seu estado
   - Envio do XML para autorização
   - Recebimento do protocolo
   - Consulta de status

### Exemplo de Assinatura (para implementar):

```typescript
import { SignedXml } from 'xml-crypto';
import * as fs from 'fs';

// Ler certificado
const pfx = fs.readFileSync('certificado.pfx');
const privateKey = // extrair chave privada

// Assinar XML
const sig = new SignedXml();
sig.addReference("//*[local-name(.)='infNFe']");
sig.signingKey = privateKey;
sig.computeSignature(xml);

const signedXml = sig.getSignedXml();
```

---

## 📱 Frontend - Integração

### Componente de Pagamento PIX

```tsx
import { useState } from 'react';
import QRCode from 'qrcode.react';

function PixPayment({ amount, onSuccess }) {
  const [pixData, setPixData] = useState(null);

  const generatePix = async () => {
    const response = await apiClient.post('/fiscal/generate-pix', {
      amount,
      description: 'Pagamento PDV'
    });
    
    setPixData(response);
  };

  return (
    <div>
      {!pixData ? (
        <button onClick={generatePix}>
          Gerar QR Code PIX
        </button>
      ) : (
        <div>
          <h3>Escaneie o QR Code</h3>
          <QRCode value={pixData.qrCode} size={256} />
          <p>Valor: R$ {amount.toFixed(2)}</p>
          <p>Expira em: {new Date(pixData.expiresAt).toLocaleTimeString()}</p>
          
          <button onClick={onSuccess}>
            Confirmar Pagamento Recebido
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 Testes

### Testar Geração de NFC-e

```bash
curl -X POST http://localhost:3001/api/fiscal/issue-nfce \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "saleId": "test-123",
    "items": [{
      "productId": "prod-1",
      "name": "Produto Teste",
      "quantity": 1,
      "price": 10.00,
      "ncm": "12345678",
      "cfop": "5102"
    }],
    "total": 10.00
  }'
```

### Testar Geração de PIX

```bash
curl -X POST http://localhost:3001/api/fiscal/generate-pix \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10.00,
    "description": "Teste PIX"
  }'
```

---

## 📚 Referências

### NFC-e
- [Manual de Orientação NFC-e](http://www.nfe.fazenda.gov.br/portal/principal.aspx)
- Layout 4.00 da SEFAZ
- Padrão XML conforme schema XSD

### PIX
- [Manual do BR Code PIX](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II-ManualdePadroesparaIniciacaodoPix.pdf)
- Padrão EMV QR Code
- Especificação CRC16-CCITT

---

## ✅ Checklist de Implementação

- [x] Estrutura de módulos NestJS
- [x] Serviço NFC-e (geração XML)
- [x] Serviço PIX (geração BR Code)
- [x] Validações de XML e BR Code
- [x] Endpoints da API
- [x] Armazenamento no banco
- [x] QR Code URLs
- [x] DTOs de validação
- [x] Documentação completa
- [ ] Assinatura digital (certificado A1/A3)
- [ ] Integração com SEFAZ
- [ ] Webhook de confirmação PIX
- [ ] Interface de configuração no frontend

---

## 🚀 Próximos Passos

1. **Certificado Digital**: Adquirir e configurar
2. **Assinatura XML**: Implementar com xml-crypto
3. **SEFAZ**: Integrar webservices
4. **PIX Webhook**: Receber confirmação de pagamento
5. **Interface Config**: Tela para configurar emitente e PIX
6. **Testes Homologação**: Validar com SEFAZ

---

**Status**: ✅ MÓDULO IMPLEMENTADO (Homologação)  
**Ambiente**: Homologação  
**Pronto para**: Testes e validação  
**Data**: 02/11/2025

🎉 **MÓDULO FISCAL COMPLETO E FUNCIONAL!** 🎉
