# Módulo de Configurações

## Visão Geral
Módulo profissional para gerenciamento de configurações do sistema ERP/PDV, incluindo dados da empresa, configurações fiscais, PIX e personalização.

## Funcionalidades

### 🏢 Configurações da Empresa
- CNPJ, Razão Social, Nome Fantasia
- Inscrição Estadual
- Endereço completo
- Validação de dados

### 📋 Configurações Fiscais
- Ambiente (Homologação/Produção)
- Série NFCe
- Upload e gerenciamento de certificado digital
- Status e validade do certificado

### 💳 Configurações PIX
- Chave PIX
- Nome do comerciante
- Cidade do comerciante

### 🎨 Personalização
- Upload de logo
- Upload de papel de parede
- URLs de recursos

## Endpoints

### GET /settings
Retorna todas as configurações do sistema.

### PUT /settings
Atualiza configurações do sistema.
```json
{
  "company": {
    "cnpj": "12345678000199",
    "name": "Empresa LTDA"
  },
  "fiscal": {
    "environment": "homologacao",
    "nfceSeries": 1
  },
  "pix": {
    "pixKey": "empresa@email.com"
  }
}
```

### PUT /settings/certificate
Upload de certificado digital.
```json
{
  "certificate": "base64_certificate",
  "password": "senha_certificado",
  "expiresAt": "2024-12-31"
}
```

### PUT /settings/logo
Upload de logo da empresa.

### PUT /settings/wallpaper
Upload de papel de parede.

### GET /settings/certificate/status
Verifica status do certificado digital.

## Características Técnicas

### ✅ Cache Inteligente
- Cache de 5 minutos para configurações
- Invalidação automática em atualizações
- Melhora performance significativamente

### 🔒 Segurança
- Criptografia de senhas de certificado
- Validação de dados com class-validator
- Guards JWT para autenticação

### 📝 Validação
- DTOs tipados para todas as operações
- Validação automática de entrada
- Mensagens de erro padronizadas

### 🏗️ Arquitetura
- Separação clara de responsabilidades
- Interfaces tipadas
- Constantes centralizadas
- Logging estruturado

### 🚀 Performance
- Cache em memória
- Operações assíncronas
- Queries otimizadas

## Estrutura de Arquivos
```
settings/
├── constants/
│   └── settings.constants.ts
├── dto/
│   └── settings.dto.ts
├── interfaces/
│   └── settings.interface.ts
├── settings.controller.ts
├── settings.service.ts
├── settings.module.ts
└── README.md
```

## Melhorias Implementadas

1. **Tipagem Completa**: Interfaces e DTOs para type safety
2. **Cache Inteligente**: Reduz consultas desnecessárias ao banco
3. **Validação Robusta**: class-validator para entrada de dados
4. **Tratamento de Erros**: Mensagens padronizadas e logging
5. **Segurança**: Criptografia de dados sensíveis
6. **Documentação**: README completo e código autodocumentado
7. **Constantes**: Valores centralizados para fácil manutenção
8. **Performance**: Operações otimizadas e cache eficiente