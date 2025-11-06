# ⚡ Quick Start - Deploy em 5 Minutos

## Opção 1: Docker (Recomendado)

```bash
# 1. Configurar variáveis
cp .env.production.example .env.production
nano .env.production

# 2. Deploy
chmod +x deploy.sh
./deploy.sh

# 3. Acessar
# Frontend: http://localhost
# Backend: http://localhost:3001
```

## Opção 2: Manual

```bash
# Backend
cd backend
npm install
cp .env.example .env
nano .env
npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run build
pm2 start dist/main.js --name erp-backend

# Frontend
cd ../frontend
npm install
npm run build
# Copiar dist/ para servidor web
```

## Credenciais Padrão

```
Email: admin@pdv.com
Senha: adm123
```

**⚠️ ALTERE IMEDIATAMENTE EM PRODUÇÃO!**

## Comandos Úteis

```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar
docker-compose -f docker-compose.prod.yml restart

# Parar
docker-compose -f docker-compose.prod.yml down

# Backup
docker exec erp-postgres pg_dump -U erp_user erp_pdv > backup.sql
```

## Troubleshooting

### Porta já em uso
```bash
# Mudar portas no docker-compose.prod.yml
ports:
  - "8080:80"  # Frontend
  - "3002:3001"  # Backend
```

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs postgres
```

### Frontend não carrega
```bash
# Verificar build
docker-compose -f docker-compose.prod.yml logs frontend
# Verificar variável VITE_API_URL no .env.production
```

## Próximos Passos

1. ✅ Configurar SSL (ver HTTPS_SETUP.md)
2. ✅ Configurar backup automático
3. ✅ Configurar monitoramento
4. ✅ Alterar credenciais padrão
5. ✅ Configurar domínio

## Documentação Completa

- **DEPLOY_GUIDE.md** - Guia completo de deploy
- **HTTPS_SETUP.md** - Configuração SSL/TLS
- **COMPLETE_SECURITY_AUDIT.md** - Auditoria de segurança
