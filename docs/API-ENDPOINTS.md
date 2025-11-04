# API Endpoints - ERP + PDV Fiscal

## 🚀 Servidor
- **URL Base**: `http://localhost:3000`
- **Banco de Dados**: SQLite (`backend/prisma/dev.db`)
- **Status**: ✅ Todos os endpoints funcionando

## 📊 Dados de Exemplo
- ✅ 3 Usuários cadastrados
- ✅ 6 Produtos cadastrados
- ✅ 3 Clientes cadastrados
- ✅ 2 Fornecedores cadastrados

## 📋 Rotas Disponíveis

### 🏥 Health Check
- `GET /` - Status da API
- `GET /health` - Health check do sistema

### 🔐 Autenticação
Base: `/api/auth`

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@pdv.com",
  "password": "adm123"
}
```

**Usuários de Teste:**
- **Admin**: `admin@pdv.com` / `adm123` (Role: ADMIN)
- **Gerente**: `gerente@pdv.com` / `123456` (Role: MANAGER)
- **Caixa**: `caixa@pdv.com` / `123456` (Role: CASHIER)

### 🤖 Gemini AI
Base: `/api/gemini`

#### Gerar Insights de Negócio
```bash
POST /api/gemini/insights
Authorization: Bearer {token}
Content-Type: application/json

{
  "salesHistory": [],
  "products": []
}
```

#### Consulta de Negócio
```bash
POST /api/gemini/query
Authorization: Bearer {token}
Content-Type: application/json

{
  "query": "Qual produto mais vendido?",
  "salesHistory": [],
  "products": []
}
```

#### Sugerir Nome de Produto
```bash
POST /api/gemini/suggest-name
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentName": "Café",
  "category": "Bebidas"
}
```

#### Parse de Comando de Voz
```bash
POST /api/gemini/parse-command
Authorization: Bearer {token}
Content-Type: application/json

{
  "command": "adicione 2 cafés e 1 pão de queijo",
  "products": []
}
```

## 📊 Banco de Dados

### Modelos Disponíveis
- **User** - Usuários do sistema
- **Product** - Produtos
- **Customer** - Clientes
- **Supplier** - Fornecedores
- **Sale** - Vendas
- **SaleItem** - Itens de venda
- **Purchase** - Compras
- **PurchaseItem** - Itens de compra
- **Shift** - Turnos de caixa
- **NFe** - Notas fiscais eletrônicas
- **FinancialMovement** - Movimentações financeiras

## 🛠️ Comandos Úteis

### Backend
```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run start:dev

# Build de produção
npm run build

# Rodar produção
npm run start:prod

# Gerar Prisma Client
npm run db:generate

# Criar nova migration
npm run db:migrate

# Executar seed
npx prisma db seed

# Abrir Prisma Studio
npx prisma studio
```

## 📝 Notas
- Todas as rotas (exceto `/` e `/health`) usam o prefixo `/api`
- Rotas protegidas requerem token JWT no header `Authorization: Bearer {token}`
- O servidor roda em modo watch e reinicia automaticamente ao salvar arquivos
