# 🗄️ Banco de Dados - Status e Credenciais

## ✅ Status do Banco de Dados

### Verificação Realizada

**Banco de Dados:**
- ✅ Arquivo existe: `backend/prisma/dev.db`
- ✅ Tamanho: 144 KB
- ✅ Schema sincronizado
- ✅ Prisma Client gerado

**Seed:**
- ✅ Executado com sucesso
- ✅ 3 usuários criados
- ✅ 6 produtos criados
- ✅ 3 clientes criados
- ✅ 2 fornecedores criados

---

## 🔐 Credenciais de Acesso

### Usuários Seed

| Usuário | Email | Senha | Role | Ativo |
|---------|-------|-------|------|-------|
| **Admin** | admin@pdv.com | adm123 | ADMIN | ✅ |
| **Gerente** | gerente@pdv.com | 123456 | MANAGER | ✅ |
| **Caixa** | caixa@pdv.com | 123456 | CASHIER | ✅ |

### Para Fazer Login

**Frontend**: http://localhost:3000

Use qualquer uma das credenciais acima:
```
Email: admin@pdv.com
Senha: adm123
```

**Via API** (Postman/Insomnia):
```bash
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@pdv.com",
  "password": "adm123"
}
```

---

## 📦 Dados Iniciais

### Produtos (6)

| Código | Nome | Preço | Estoque | Categoria |
|--------|------|-------|---------|-----------|
| CAFE001 | Café Expresso | R$ 5,00 | 100 | Bebidas |
| CAFE002 | Café com Leite | R$ 6,50 | 80 | Bebidas |
| CAFE003 | Cappuccino | R$ 8,00 | 60 | Bebidas |
| PAO001 | Pão de Queijo | R$ 4,00 | 50 | Alimentos |
| BOLO001 | Bolo de Chocolate | R$ 12,00 | 30 | Alimentos |
| SUCO001 | Suco de Laranja | R$ 7,00 | 40 | Bebidas |

### Clientes (3)

| Nome | CPF | Email | Pontos |
|------|-----|-------|--------|
| João Silva | 123.456.789-00 | joao@email.com | 150 |
| Maria Santos | 987.654.321-00 | maria@email.com | 80 |
| Pedro Oliveira | 456.789.123-00 | pedro@email.com | 200 |

### Fornecedores (2)

| Nome | CNPJ | Email |
|------|------|-------|
| Café Brasil LTDA | 12.345.678/0001-00 | contato@cafebrasil.com |
| Panificadora Pão Quente | 98.765.432/0001-11 | vendas@paoquente.com |

---

## 🛠️ Comandos Úteis

### Ver Dados no Prisma Studio

```bash
cd backend
npx prisma studio
```
**Abre em**: http://localhost:5555 (ou 5557)

Interface gráfica para visualizar e editar dados.

### Resetar Banco de Dados

```bash
cd backend

# Apagar banco e recriar
rm prisma/dev.db
npx prisma db push
npx tsx prisma/seed.ts
```

### Rodar Seed Novamente

```bash
cd backend
npx tsx prisma/seed.ts
```

**Nota**: O seed usa `upsert`, então não duplica dados.

### Verificar Schema

```bash
cd backend
npx prisma db pull
```

### Gerar Prisma Client

```bash
cd backend
npx prisma generate
```

---

## 📊 Estrutura do Banco

### Tabelas Principais

```
User            - Usuários do sistema
Product         - Produtos/itens de venda
Customer        - Clientes
Supplier        - Fornecedores
Sale            - Vendas/NFCe
SaleItem        - Itens da venda
Purchase        - Compras/pedidos
PurchaseItem    - Itens da compra
Shift           - Turnos/caixas
NFe             - Notas fiscais
FinancialMovement - Movimentações financeiras
```

---

## 🔍 Testes de Conexão

### Teste 1: Login API

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pdv.com","password":"adm123"}'
```

**Resposta esperada**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@pdv.com",
    "role": "ADMIN",
    "active": true
  }
}
```

### Teste 2: Listar Produtos

```bash
# Primeiro faça login e pegue o token
TOKEN="seu-token-aqui"

curl -X GET http://localhost:3001/api/products \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada**: Array com 6 produtos

---

## ⚠️ Problemas Comuns

### "Cannot find module @prisma/client"

**Solução**:
```bash
cd backend
npx prisma generate
npm install
```

### "Database does not exist"

**Solução**:
```bash
cd backend
npx prisma db push
npx tsx prisma/seed.ts
```

### "Login não funciona"

**Verificar**:
1. Backend está rodando? (http://localhost:3001)
2. Credenciais corretas? (admin@pdv.com / adm123)
3. Banco tem dados? (npx prisma studio)

**Resetar senha**:
```bash
cd backend
npx tsx prisma/seed.ts
# O seed atualiza as senhas
```

---

## 🔐 Segurança

### Senhas

- Senhas são hasheadas com **bcrypt** (10 rounds)
- Nunca são armazenadas em texto plano
- O seed sempre recria as senhas ao rodar

### JWT

- Secret definido em `.env`: `JWT_SECRET`
- Tokens expiram em **8 horas**
- Renovação automática não implementada

### Ambiente de Desenvolvimento

⚠️ **ATENÇÃO**: As credenciais acima são para **desenvolvimento apenas**.

**Em produção**:
- Altere todas as senhas
- Use senhas fortes
- Configure variáveis de ambiente seguras
- Use banco de dados PostgreSQL/MySQL
- Configure CORS adequadamente

---

## 📝 Arquivo .env

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-key-here"
GEMINI_API_KEY=AIzaSyA9Sy3eybkP40qXIuq8XihcPbA-KfzF9uM
```

**Para produção, altere**:
- `DATABASE_URL` para PostgreSQL/MySQL
- `JWT_SECRET` para um secret forte
- Configure outros secrets conforme necessário

---

## ✅ Checklist de Verificação

- [x] Banco de dados existe (dev.db)
- [x] Schema sincronizado
- [x] Prisma Client gerado
- [x] Seed executado
- [x] 3 usuários criados
- [x] 6 produtos criados
- [x] 3 clientes criados
- [x] 2 fornecedores criados
- [x] Credenciais documentadas
- [x] Backend rodando (porta 3001)
- [ ] Login testado no frontend
- [ ] Prisma Studio aberto (opcional)

---

## 🎯 Próximos Passos

1. **Teste o login no frontend**:
   - Acesse: http://localhost:3000
   - Use: admin@pdv.com / adm123

2. **Explore o Prisma Studio**:
   ```bash
   cd backend
   npx prisma studio
   ```
   Acesse: http://localhost:5555

3. **Teste as funcionalidades**:
   - PDV
   - Gestão de produtos
   - Clientes
   - Relatórios

---

**Banco de dados**: ✅ CONFIGURADO E POPULADO  
**Credenciais**: ✅ DOCUMENTADAS  
**Seed**: ✅ EXECUTADO COM SUCESSO  

**Última verificação**: 02/11/2025 16:32
