# Scripts de Teste e Utilitários

Esta pasta contém scripts auxiliares para desenvolvimento e testes do backend.

## 📋 Scripts Disponíveis

### Verificação e Testes

#### `check-users.js`
**Propósito**: Verifica usuários cadastrados no banco de dados  
**Uso**: `node scripts/check-users.js`  
**Retorna**: Lista de usuários com emails, roles e status

#### `verify-seed.js`
**Propósito**: Verifica se os dados de seed foram inseridos corretamente  
**Uso**: `node scripts/verify-seed.js`  
**Retorna**: Estatísticas de usuários, produtos, clientes e fornecedores

---

### Testes de Endpoints

#### `test-endpoints-fixed.js` ⭐ **RECOMENDADO**
**Propósito**: Testa todos os endpoints da API (porta 3001 correta)  
**Uso**: `node scripts/test-endpoints-fixed.js`  
**Testa**:
- Login (/auth/login)
- Products (/products)
- Customers (/customers)
- Suppliers (/suppliers)
- Users (/users)
- Sales (/sales/history)
- Shifts (/shifts/current, /shifts/history)
- Inventory (/inventory/levels)
- Financials (/financials)
- Purchase Orders (/purchasing/orders)
- Analytics (/analytics/dashboard)

#### `test-login.js`
**Propósito**: Testa especificamente o fluxo de autenticação  
**Uso**: `node scripts/test-login.js`  
**Verifica**: Hash de senha, usuário ativo, token JWT

#### `test-fiscal-module.js`
**Propósito**: Testa endpoints do módulo fiscal (NFC-e e PIX)  
**Uso**: `node scripts/test-fiscal-module.js`  
**Testa**:
- Emissão de NFC-e
- Geração de PIX
- Status da SEFAZ

#### `test-crud.js`
**Propósito**: Testa operações CRUD básicas  
**Uso**: `node scripts/test-crud.js`  
**Testa**: Create, Read, Update, Delete em produtos

---

### Scripts Legados (⚠️ Desatualizados)

#### `test-all-endpoints.js` ⚠️ **NÃO USAR**
**Problema**: Usa porta 3000 (incorreta)  
**Alternativa**: Use `test-endpoints-fixed.js`

#### `test-api.js` ⚠️ **SIMPLES DEMAIS**
**Problema**: Testa apenas endpoints básicos  
**Alternativa**: Use `test-endpoints-fixed.js`

---

### Utilitários

#### `seed-fiscal-config.js`
**Propósito**: Popula configurações fiscais no banco  
**Uso**: `node scripts/seed-fiscal-config.js`  
**Cria**: FiscalConfig com dados de homologação

#### `generate-modules.js` 🔧 **GERADOR**
**Propósito**: Scaffold de novos módulos NestJS  
**Uso**: `node scripts/generate-modules.js`  
**Gera**: controller.ts, service.ts, module.ts para novo módulo

---

## 🚀 Guia Rápido

### Verificar se tudo está funcionando
```bash
cd backend

# 1. Verificar usuários
node scripts/check-users.js

# 2. Verificar seed
node scripts/verify-seed.js

# 3. Testar todos os endpoints
node scripts/test-endpoints-fixed.js
```

### Testar funcionalidades específicas
```bash
# Testar login
node scripts/test-login.js

# Testar fiscal (NFC-e + PIX)
node scripts/test-fiscal-module.js

# Testar CRUD
node scripts/test-crud.js
```

---

## 📝 Notas

- **Porta correta**: O backend roda em **3001**, não 3000
- **Scripts legados**: Mantidos para referência, mas não devem ser usados
- **Credenciais padrão**: admin@pdv.com / adm123

---

## 🔄 Manutenção

Ao criar novos scripts:
1. Coloque nesta pasta `backend/scripts/`
2. Use porta 3001 para API
3. Documente neste README
4. Use `test-endpoints-fixed.js` como template
