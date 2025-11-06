# Migração para PostgreSQL

## Instalação PostgreSQL

### Windows
1. Download: https://www.postgresql.org/download/windows/
2. Instalar PostgreSQL 14 ou superior
3. Durante instalação, definir senha do usuário `postgres`
4. Porta padrão: 5432

### Docker (alternativa)
```bash
docker run --name postgres-erp -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=erp_pdv -p 5432:5432 -d postgres:14
```

## Configuração

1. **Criar banco de dados**
   ```sql
   CREATE DATABASE erp_pdv;
   ```

2. **Configurar .env**
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/erp_pdv"
   ```

3. **Instalar dependências**
   ```bash
   npm install
   ```

4. **Criar tabelas**
   ```bash
   npx prisma db push
   ```

5. **Seed inicial**
   ```bash
   npx prisma db seed
   ```

## Migração de Dados SQLite

```bash
npm install sqlite3
node scripts/migrate-to-postgresql.js
```

## Verificação

```bash
npm run start:dev
```

## Vantagens PostgreSQL

- Suporte completo do Prisma
- Alta performance e escalabilidade
- ACID completo
- JSON nativo
- Full-text search
- Replicação e backup robustos
- Comunidade ativa
