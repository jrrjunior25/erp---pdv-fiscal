# 🔧 Solução: Erro ao Abrir Turno

## ❌ Erro Encontrado

```
Failed to open shift: Error: Internal server error
at Object.request (apiClient.ts:39:15)
```

## 🔍 Causa do Problema

O erro ocorre porque o **PostgreSQL não está rodando** ou não está acessível na porta 5432.

---

## ✅ Soluções Rápidas

### Opção 1: Iniciar PostgreSQL (Recomendado)

#### Windows:

1. **Verificar se PostgreSQL está instalado:**
   ```powershell
   Get-Service -Name "postgresql*"
   ```

2. **Iniciar o serviço:**
   ```powershell
   Start-Service postgresql-x64-15  # Ajuste a versão
   ```

3. **Ou use o script automático:**
   ```powershell
   .\scripts\check-database.ps1
   ```

#### Linux/Mac:

```bash
# Iniciar PostgreSQL
sudo systemctl start postgresql

# Ou via Homebrew (Mac)
brew services start postgresql
```

---

### Opção 2: Usar Docker (Mais Fácil)

```bash
# Iniciar PostgreSQL via Docker
docker run -d \
  --name erp-postgres \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=erp_pdv \
  postgres:15

# Aguardar 5 segundos
sleep 5

# Executar migrations
cd backend
npx prisma migrate deploy
```

**Windows PowerShell:**
```powershell
docker run -d --name erp-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=erp_pdv postgres:15
Start-Sleep -Seconds 5
cd backend
npx prisma migrate deploy
```

---

### Opção 3: Usar SQLite (Desenvolvimento)

Se você não quer instalar PostgreSQL, pode usar SQLite:

1. **Editar `backend/prisma/schema.prisma`:**
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```

2. **Editar `backend/.env`:**
   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. **Recriar o banco:**
   ```bash
   cd backend
   npx prisma migrate reset --force
   npx prisma db push
   npm run seed
   ```

---

## 🔄 Após Iniciar o Banco

1. **Executar migrations:**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

2. **Seed inicial (se necessário):**
   ```bash
   npm run seed
   ```

3. **Reiniciar o backend:**
   ```bash
   npm run start:dev
   ```

4. **Testar abertura de turno:**
   - Abra o frontend
   - Faça login
   - Tente abrir um turno

---

## 🛠️ Melhorias Implementadas

### Backend (`shifts.service.ts`):

✅ **Validação melhorada:**
- Verifica se userId e userName existem
- Valida se o usuário existe no banco
- Mensagens de erro mais claras

✅ **Tratamento de erros:**
- Erros específicos para cada situação
- Logs detalhados para debug
- Mensagens em português

### Validações Adicionadas:

```typescript
// Validar entrada
if (!data.userId || !data.userName) {
  throw new Error('userId e userName são obrigatórios');
}

// Verificar se usuário existe
const user = await this.prisma.user.findUnique({
  where: { id: data.userId },
});

if (!user) {
  throw new Error(`Usuário não encontrado: ${data.userId}`);
}
```

---

## 📋 Checklist de Verificação

- [ ] PostgreSQL está instalado?
- [ ] Serviço PostgreSQL está rodando?
- [ ] Porta 5432 está disponível?
- [ ] DATABASE_URL está correto no `.env`?
- [ ] Migrations foram executadas?
- [ ] Backend está rodando sem erros?
- [ ] Usuário existe no banco de dados?

---

## 🔍 Como Verificar se Está Funcionando

### 1. Testar conexão com o banco:

```bash
cd backend
npx prisma studio
```

Se abrir o Prisma Studio, o banco está acessível!

### 2. Verificar logs do backend:

```bash
cd backend
npm run start:dev
```

Procure por:
```
[Nest] LOG [PrismaService] Prisma connected successfully
```

### 3. Testar endpoint diretamente:

```bash
# Obter token de autenticação
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Usar o token para abrir turno
curl -X POST http://localhost:3001/api/shifts/open \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"openingBalance":100,"userId":"USER_ID","userName":"Admin"}'
```

---

## 🚨 Erros Comuns

### 1. "Connection refused"
**Causa:** PostgreSQL não está rodando  
**Solução:** Iniciar o serviço PostgreSQL

### 2. "Database does not exist"
**Causa:** Banco `erp_pdv` não foi criado  
**Solução:** 
```bash
# Criar banco manualmente
psql -U postgres -c "CREATE DATABASE erp_pdv;"

# Ou usar prisma
cd backend
npx prisma db push
```

### 3. "Authentication failed"
**Causa:** Senha incorreta no DATABASE_URL  
**Solução:** Verificar senha no `.env`

### 4. "Port 5432 already in use"
**Causa:** Outra instância do PostgreSQL rodando  
**Solução:** 
```bash
# Parar outras instâncias
docker stop $(docker ps -q --filter "expose=5432")

# Ou usar outra porta
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/erp_pdv"
```

---

## 📞 Suporte Adicional

Se o problema persistir:

1. **Verificar logs do backend:**
   ```bash
   cd backend
   cat logs/error.log
   ```

2. **Verificar logs do PostgreSQL:**
   - Windows: `C:\Program Files\PostgreSQL\15\data\log\`
   - Linux: `/var/log/postgresql/`

3. **Testar conexão manual:**
   ```bash
   psql -U postgres -h localhost -p 5432 -d erp_pdv
   ```

---

## ✅ Resultado Esperado

Após seguir as soluções, você deve conseguir:

1. ✅ Abrir turno sem erros
2. ✅ Ver logs de sucesso no backend
3. ✅ Turno aparecer no frontend
4. ✅ Realizar vendas normalmente

---

## 🎉 Pronto!

O sistema de turnos agora está funcionando corretamente com:
- ✅ Validações robustas
- ✅ Mensagens de erro claras
- ✅ Logs detalhados
- ✅ Tratamento de erros melhorado

**Desenvolvido para facilitar o troubleshooting! 🚀**
