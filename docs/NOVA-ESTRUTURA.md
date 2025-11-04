# 🗂️ Nova Estrutura de Pastas - ERP + PDV Fiscal

## 📋 Estrutura Proposta

```
erp-pdv-fiscal/
│
├── 📁 frontend/                    # Aplicação React (raiz do frontend)
│   ├── 📁 src/
│   │   ├── 📁 components/         # Componentes React
│   │   │   ├── 📁 PDV/           # Componentes do PDV
│   │   │   │   ├── ProductGrid.tsx
│   │   │   │   ├── CartDisplay.tsx
│   │   │   │   ├── PaymentModal.tsx
│   │   │   │   ├── PDVHeader.tsx
│   │   │   │   ├── VoiceCommandControl.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── 📁 ERP/           # Componentes do ERP
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── ProductManagement.tsx
│   │   │   │   ├── CustomerManagement.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── 📁 Shared/        # Componentes compartilhados
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── ShortcutHelper.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── 📁 Shifts/        # Componentes de turnos
│   │   │   │   ├── OpenShiftModal.tsx
│   │   │   │   ├── CloseShiftModal.tsx
│   │   │   │   └── ShiftMovementModal.tsx
│   │   │   │
│   │   │   └── 📁 Modals/        # Modais diversos
│   │   │       ├── CustomerSearchModal.tsx
│   │   │       ├── DiscountModal.tsx
│   │   │       └── LoyaltyRedemptionModal.tsx
│   │   │
│   │   ├── 📁 services/          # Serviços e APIs
│   │   │   ├── api/
│   │   │   │   └── apiClient.ts  # Cliente HTTP
│   │   │   ├── auth/
│   │   │   │   ├── authService.ts
│   │   │   │   └── tokenService.ts
│   │   │   ├── geminiService.ts
│   │   │   ├── fiscalService.ts
│   │   │   ├── pixService.ts
│   │   │   └── syncService.ts
│   │   │
│   │   ├── 📁 types/             # TypeScript types
│   │   │   ├── index.ts
│   │   │   ├── pdv.types.ts
│   │   │   ├── erp.types.ts
│   │   │   └── api.types.ts
│   │   │
│   │   ├── 📁 hooks/             # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useProducts.ts
│   │   │   └── useCart.ts
│   │   │
│   │   ├── 📁 utils/             # Utilitários
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── 📁 assets/            # Recursos estáticos
│   │   │   ├── images/
│   │   │   └── styles/
│   │   │
│   │   ├── App.tsx               # Componente principal
│   │   ├── main.tsx              # Entry point
│   │   └── vite-env.d.ts
│   │
│   ├── 📁 public/                # Arquivos públicos
│   │   ├── index.html
│   │   └── favicon.ico
│   │
│   ├── .env.local                # Variáveis de ambiente
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── README.md
│
├── 📁 backend/                    # API NestJS
│   ├── 📁 src/
│   │   ├── 📁 modules/           # Módulos de negócio
│   │   │   ├── 📁 auth/
│   │   │   │   ├── dto/
│   │   │   │   ├── guards/
│   │   │   │   ├── strategies/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.module.ts
│   │   │   │
│   │   │   ├── 📁 products/
│   │   │   │   ├── dto/
│   │   │   │   ├── products.controller.ts
│   │   │   │   ├── products.service.ts
│   │   │   │   └── products.module.ts
│   │   │   │
│   │   │   ├── 📁 customers/
│   │   │   ├── 📁 suppliers/
│   │   │   ├── 📁 sales/
│   │   │   ├── 📁 shifts/
│   │   │   ├── 📁 inventory/
│   │   │   ├── 📁 financials/
│   │   │   ├── 📁 purchasing/
│   │   │   ├── 📁 analytics/
│   │   │   ├── 📁 users/
│   │   │   └── 📁 gemini/
│   │   │
│   │   ├── 📁 common/            # Recursos compartilhados
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── pipes/
│   │   │
│   │   ├── 📁 prisma/            # Prisma ORM
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma.module.ts
│   │   │
│   │   ├── app.controller.ts     # Health checks
│   │   ├── app.module.ts         # Módulo raiz
│   │   └── main.ts               # Bootstrap
│   │
│   ├── 📁 prisma/                # Schema e migrations
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── dev.db                # Banco SQLite
│   │
│   ├── 📁 test/                  # Testes
│   │   ├── e2e/
│   │   └── unit/
│   │
│   ├── .env                      # Variáveis de ambiente
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── README.md
│
├── 📁 docs/                       # Documentação
│   ├── API-ENDPOINTS.md
│   ├── SETUP-GUIDE.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── CONTRIBUTING.md
│
├── 📁 scripts/                    # Scripts utilitários
│   ├── setup.sh
│   ├── test-api.js
│   └── seed-database.js
│
├── 📁 docker/                     # Docker configs
│   ├── docker-compose.yml
│   ├── Dockerfile.frontend
│   └── Dockerfile.backend
│
├── .gitignore                     # Git ignore global
├── README.md                      # Documentação principal
├── package.json                   # Workspace root (opcional)
└── LICENSE
```

---

## 🎯 Benefícios da Nova Estrutura

### ✅ **Separação Clara**
- Frontend e Backend em pastas separadas
- Fácil de navegar e entender
- Permite deploy independente

### ✅ **Organização por Domínio**
- Componentes agrupados por funcionalidade (PDV, ERP, Shared)
- Módulos backend bem estruturados
- Código mais fácil de manter

### ✅ **Escalabilidade**
- Fácil adicionar novos módulos
- Estrutura preparada para crescimento
- Padrão de projeto consistente

### ✅ **Documentação Centralizada**
- Pasta `docs/` com toda documentação
- Fácil de encontrar informações
- Organizado por tipo de documento

### ✅ **DevOps Ready**
- Scripts separados em pasta própria
- Docker configs organizados
- Fácil de automatizar CI/CD

---

## 📦 Estrutura Atual vs Nova

### ❌ Atual (Desorganizada)
```
erp-+-pdv-fiscal/
├── backend/
├── components/          ← Misturado na raiz
├── services/            ← Misturado na raiz
├── App.tsx              ← Misturado na raiz
├── types.ts             ← Misturado na raiz
├── *.md                 ← Docs na raiz
└── ...muitos arquivos   ← Confuso
```

### ✅ Nova (Organizada)
```
erp-pdv-fiscal/
├── frontend/
│   └── src/
│       ├── components/  ← Frontend separado
│       ├── services/
│       └── types/
├── backend/
│   └── src/
│       └── modules/     ← Backend organizado
├── docs/                ← Docs separados
└── scripts/             ← Scripts separados
```

---

## 🔧 Mudanças nos Imports

### Frontend - Antes:
```typescript
import apiClient from './services/apiClient';
import { Product } from './types';
```

### Frontend - Depois:
```typescript
import apiClient from '@/services/api/apiClient';
import { Product } from '@/types';
```

### Backend - Antes:
```typescript
import { ProductsService } from '../products/products.service';
```

### Backend - Depois:
```typescript
import { ProductsService } from '@/modules/products/products.service';
```

---

## 📝 Arquivos de Configuração Necessários

### `frontend/tsconfig.json` - Path Mapping
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@services/*": ["src/services/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

### `backend/tsconfig.json` - Path Mapping
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@modules/*": ["src/modules/*"],
      "@common/*": ["src/common/*"]
    }
  }
}
```

---

## 🚀 Plano de Migração

### Fase 1: Preparação
1. ✅ Criar nova estrutura de pastas
2. ✅ Atualizar configurações (tsconfig, vite, nest)
3. ✅ Criar aliases de importação

### Fase 2: Migração Frontend
1. Mover componentes para `frontend/src/components/`
2. Organizar por categoria (PDV, ERP, Shared)
3. Mover services para `frontend/src/services/`
4. Mover types para `frontend/src/types/`
5. Atualizar imports

### Fase 3: Migração Backend
1. Reorganizar módulos em `backend/src/modules/`
2. Criar pasta `common/` para código compartilhado
3. Atualizar imports

### Fase 4: Documentação
1. Mover docs para `docs/`
2. Mover scripts para `scripts/`
3. Atualizar README principal

### Fase 5: Testes
1. Testar frontend
2. Testar backend
3. Verificar builds
4. Atualizar CI/CD se houver

---

## ⚠️ Atenção

**NÃO faça a migração manualmente!**
Use o script de migração automatizado para evitar erros.

**Backup antes de migrar!**
Faça backup do projeto atual antes de iniciar.

---

## 🎯 Resultado Final

- ✅ Frontend totalmente separado
- ✅ Backend bem organizado
- ✅ Docs centralizados
- ✅ Scripts separados
- ✅ Fácil de navegar
- ✅ Pronto para produção

