# 🔧 CORREÇÕES PRIORITÁRIAS

## 🔴 CRÍTICAS (Fazer AGORA)

### 1. Remover Logs de Debug Sensíveis

**Arquivos a corrigir:**
- `backend/src/modules/auth/guards/jwt-auth.guard.ts`
- `backend/src/modules/auth/strategies/jwt.strategy.ts`

**Ação:** Condicionar logs ao ambiente de desenvolvimento

---

### 2. Proteger Chaves de API

**Arquivo:** `backend/.env`

**Ação:**
1. Criar `.env.example` sem valores reais
2. Adicionar `.env` ao `.gitignore`
3. Nunca commitar chaves reais

---

### 3. Configurar CORS Corretamente

**Arquivo:** `backend/src/main.ts`

**Mudar de:**
```typescript
cors: { origin: '*' }
```

**Para:**
```typescript
cors: { 
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://seu-dominio.com' 
    : 'http://localhost:5173'
}
```

---

## 🟡 IMPORTANTES (Fazer esta semana)

### 4. Atualizar .env

**Arquivo:** `backend/.env`

**Remover linha obsoleta:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/erp_pdv?schema=public"
```

---

### 5. Remover Arquivo de Teste

**Arquivo:** `frontend/test-token.html`

**Ação:** Deletar ou mover para pasta de testes

---

### 6. Adicionar Validação de Ambiente

**Criar:** `backend/src/config/env.validation.ts`

```typescript
export function validateEnv() {
  const required = ['JWT_SECRET', 'NODE_ENV'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
```

---

## 🟢 MELHORIAS (Fazer próximo mês)

### 7. Implementar Testes

**Criar estrutura:**
```
backend/
  test/
    unit/
    integration/
    e2e/
```

---

### 8. Adicionar Swagger

**Instalar:**
```bash
npm install @nestjs/swagger swagger-ui-express
```

---

### 9. Preparar para PostgreSQL em Produção

**Manter ambos os schemas:**
- SQLite para desenvolvimento
- PostgreSQL para produção

---

## ✅ CHECKLIST DE DEPLOY

Antes de fazer deploy em produção:

- [ ] Remover todos os console.log de debug
- [ ] Configurar variáveis de ambiente de produção
- [ ] Testar com PostgreSQL
- [ ] Configurar HTTPS
- [ ] Implementar rate limiting
- [ ] Configurar backup automático
- [ ] Adicionar monitoramento
- [ ] Testar todos os fluxos críticos
- [ ] Documentar processo de deploy
- [ ] Criar plano de rollback

---

**Prioridade:** 🔴 Crítico > 🟡 Importante > 🟢 Melhoria
