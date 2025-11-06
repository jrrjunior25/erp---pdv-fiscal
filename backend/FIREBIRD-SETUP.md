# Migração para Firebird

## Pré-requisitos

1. **Instalar Firebird Server**
   - Download: https://firebirdsql.org/en/downloads/
   - Versão recomendada: Firebird 3.0 ou superior
   - Durante instalação, anote a senha do usuário SYSDBA

2. **Criar banco de dados**
   ```sql
   CREATE DATABASE 'C:\dados\erp.fdb'
   USER 'SYSDBA' PASSWORD 'masterkey'
   PAGE_SIZE 4096
   DEFAULT CHARACTER SET UTF8;
   ```

## Configuração

1. **Instalar dependências**
   ```bash
   cd backend
   npm install
   ```

2. **Configurar variáveis de ambiente**
   Edite o arquivo `.env`:
   ```
   DATABASE_URL="firebird://SYSDBA:masterkey@localhost:3050/C:/dados/erp.fdb"
   ```

3. **Gerar schema Prisma**
   ```bash
   npm run db:generate
   ```

4. **Criar tabelas no Firebird**
   ```bash
   npx prisma db push
   ```

## Migração de Dados (Opcional)

Se você já tem dados no SQLite e quer migrar:

```bash
npm install sqlite3
node scripts/migrate-to-firebird.js
```

## Verificação

Teste a conexão:
```bash
npm run start:dev
```

## Notas Importantes

- Firebird usa porta 3050 por padrão
- O caminho do banco deve usar barras normais (/) mesmo no Windows
- Usuário padrão: SYSDBA
- Senha padrão: masterkey (altere em produção!)
- O Prisma criará as tabelas automaticamente com `db push`

## Diferenças SQLite vs Firebird

- Firebird é mais robusto para produção
- Suporta múltiplos usuários simultâneos
- Melhor performance com grandes volumes
- Transações ACID completas
- Stored procedures e triggers nativos
