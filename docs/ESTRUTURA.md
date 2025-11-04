# 📁 Estrutura do Projeto - Detalhada

## Visão Geral

O projeto foi reorganizado seguindo as melhores práticas de desenvolvimento, com separação clara entre frontend e backend.

---

## 🎨 Frontend (React + Vite)

### Estrutura de Pastas

```
frontend/
├── src/
│   ├── components/              # Todos os componentes React
│   │   ├── pdv/                # Componentes específicos do PDV
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── CartDisplay.tsx
│   │   │   ├── PaymentModal.tsx
│   │   │   ├── PDVHeader.tsx
│   │   │   ├── VoiceCommandControl.tsx
│   │   │   └── Barcode.tsx
│   │   │
│   │   ├── erp/                # Componentes específicos do ERP
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ProductManagement.tsx
│   │   │   ├── CustomerManagement.tsx
│   │   │   ├── SupplierManagement.tsx
│   │   │   ├── InventoryManagement.tsx
│   │   │   ├── Financials.tsx
│   │   │   ├── PurchaseOrderManagement.tsx
│   │   │   ├── SalesHistory.tsx
│   │   │   ├── ShiftHistory.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   └── ...outros componentes ERP
│   │   │
│   │   ├── shared/             # Componentes compartilhados
│   │   │   ├── Login.tsx
│   │   │   ├── ShortcutHelper.tsx
│   │   │   ├── GeminiAnalyzer.tsx
│   │   │   └── HomologationPanel.tsx
│   │   │
│   │   └── modals/             # Modais diversos
│   │       ├── CustomerSearchModal.tsx
│   │       ├── DiscountModal.tsx
│   │       ├── LoyaltyRedemptionModal.tsx
│   │       ├── OpenShiftModal.tsx
│   │       ├── CloseShiftModal.tsx
│   │       └── ShiftMovementModal.tsx
│   │
│   ├── services/               # Serviços e integrações
│   │   ├── apiClient.ts       # Cliente HTTP base
│   │   ├── authService.ts     # Serviço de autenticação
│   │   ├── fiscalService.ts   # Serviço fiscal (NFC-e, NF-e)
│   │   ├── geminiService.ts   # Integração com Google Gemini
│   │   ├── pixService.ts      # Integração PIX
│   │   ├── syncService.ts     # Sincronização offline
│   │   └── tokenService.ts    # Gestão de tokens JWT
│   │
│   ├── types/                  # Definições TypeScript
│   │   └── index.ts           # Tipos globais do sistema
│   │
│   ├── hooks/                  # Custom React Hooks
│   │   └── (vazio - pronto para uso)
│   │
│   ├── utils/                  # Utilitários e helpers
│   │   └── constants.ts       # Constantes globais
│   │
│   ├── App.tsx                # Componente raiz da aplicação
│   └── main.tsx               # Entry point do React
│
├── public/                     # Arquivos públicos
│   └── test-frontend.html     # Página de teste
│
├── index.html                  # HTML principal
├── vite.config.ts             # Configuração do Vite
├── tsconfig.json              # Configuração TypeScript
├── package.json               # Dependências frontend
└── .env.local                 # Variáveis de ambiente

```

### Path Aliases Configurados

```typescript
@/          -> ./src/
@components -> ./src/components/
@services   -> ./src/services/
@types      -> ./src/types/
@utils      -> ./src/utils/
@hooks      -> ./src/hooks/
```

### Exemplo de Importação

```typescript
// ❌ Antes (importações relativas)
import Login from '../../components/Login';
import { Product } from '../../types';
import apiClient from '../../services/apiClient';

// ✅ Agora (path aliases)
import Login from '@components/shared/Login';
import { Product } from '@types/index';
import apiClient from '@services/apiClient';
```

---

## 🔧 Backend (NestJS + Prisma)

### Estrutura de Pastas

```
backend/
├── src/
│   ├── modules/                # Módulos de domínio
│   │   ├── auth/              # Autenticação e autorização
│   │   │   ├── dto/
│   │   │   ├── guards/
│   │   │   ├── strategies/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── products/          # Gestão de produtos
│   │   │   ├── dto/
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   └── products.module.ts
│   │   │
│   │   ├── customers/         # Gestão de clientes
│   │   ├── suppliers/         # Gestão de fornecedores
│   │   ├── sales/            # Vendas e PDV
│   │   ├── shifts/           # Turnos e caixas
│   │   ├── inventory/        # Controle de estoque
│   │   ├── financials/       # Gestão financeira
│   │   ├── purchasing/       # Ordens de compra
│   │   ├── analytics/        # Relatórios e analytics
│   │   ├── users/            # Usuários do sistema
│   │   └── gemini/           # Integração com IA
│   │
│   ├── prisma/                # Prisma ORM
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   │
│   ├── app.controller.ts      # Controller raiz (health check)
│   ├── app.module.ts          # Módulo raiz
│   └── main.ts                # Bootstrap da aplicação
│
├── prisma/                     # Schema e migrations
│   ├── migrations/            # Migrações do banco
│   ├── schema.prisma          # Schema do Prisma
│   ├── seed.ts               # Seed de dados
│   └── dev.db                # Banco SQLite (dev)
│
├── test/                       # Testes
├── package.json               # Dependências backend
├── tsconfig.json             # Configuração TypeScript
└── .env                       # Variáveis de ambiente
```

### Importações no Backend

```typescript
// ✅ Importação entre módulos
import { ProductsService } from '../modules/products/products.service';
import { AuthGuard } from '../modules/auth/guards/jwt-auth.guard';
```

---

## 📚 Documentação

```
docs/
├── API-ENDPOINTS.md          # Documentação das APIs
├── SETUP-COMPLETE.md         # Guia de setup
├── FRONTEND-STATUS.md        # Status do frontend
├── NOVA-ESTRUTURA.md         # Documento sobre estrutura
├── README-FINAL.md           # Readme final
├── TODAS-AS-APIS-IMPLEMENTADAS.md
└── ESTRUTURA.md              # Este arquivo
```

---

## 🛠️ Scripts Utilitários

```
scripts/
├── update-imports.py         # Atualiza imports do frontend
├── update-backend-imports.py # Atualiza imports do backend
└── reorganizar-projeto.ps1   # Script de reorganização (histórico)
```

---

## 🗂️ Raiz do Projeto

```
erp-pdv-fiscal/
├── frontend/              # Aplicação React
├── backend/               # API NestJS
├── docs/                  # Documentação
├── scripts/               # Scripts utilitários
├── .gitignore            # Git ignore
└── README.md             # README principal
```

---

## 🎯 Benefícios da Nova Estrutura

### ✅ Separação Clara
- Frontend e backend completamente separados
- Fácil navegação e localização de arquivos
- Deploy independente de cada parte

### ✅ Organização Modular
- Componentes organizados por funcionalidade (PDV, ERP, Shared)
- Backend com módulos bem definidos
- Fácil manutenção e escalabilidade

### ✅ Imports Limpos
- Path aliases para importações mais legíveis
- Sem importações relativas confusas (../../..)
- Melhor IDE autocomplete

### ✅ Documentação Centralizada
- Toda documentação em uma pasta específica
- Fácil encontrar informações
- Organizado por tipo

### ✅ Pronto para Produção
- Estrutura profissional
- Fácil adicionar CI/CD
- Preparado para crescimento do projeto

---

## 📝 Próximos Passos

1. **Testes**: Adicionar testes unitários e E2E
2. **Docker**: Criar Docker configs organizados
3. **CI/CD**: Configurar pipeline de deploy
4. **Monorepo**: Considerar usar pnpm workspaces/turborepo
