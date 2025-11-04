# ✅ Checklist para Produção - ERP + PDV Fiscal

## 🔴 CRÍTICO - Segurança

### 1. Variáveis de Ambiente
- [ ] **Remover .env do repositório** - Arquivo .env está commitado com credenciais reais
- [ ] **Gerar novo JWT_SECRET** - Usar: `openssl rand -hex 64`
- [ ] **Gerar novo CERT_ENCRYPTION_KEY** - Usar: `openssl rand -hex 32`
- [ ] **Proteger GEMINI_API_KEY** - Não commitar chaves de API
- [ ] **Configurar variáveis no servidor de produção**

### 2. Banco de Dados
- [ ] **Migrar de SQLite para PostgreSQL em produção**
- [ ] **Configurar backup automático do PostgreSQL** (já implementado para SQLite)
- [ ] **Configurar replicação do banco** (opcional mas recomendado)
- [ ] **Implementar política de retenção de dados**

### 3. HTTPS/SSL
- [ ] **Configurar certificado SSL** (Let's Encrypt ou comercial)
- [ ] **Forçar HTTPS em produção**
- [ ] **Configurar HSTS headers**
- [ ] **Atualizar CORS para domínio de produção**

## 🟡 IMPORTANTE - Infraestrutura

### 4. Frontend
- [ ] **Criar Dockerfile para frontend**
- [ ] **Configurar build de produção otimizado**
- [ ] **Configurar variáveis de ambiente de produção**
- [ ] **Implementar CDN para assets estáticos** (opcional)
- [ ] **Configurar cache de assets**

### 5. Monitoramento
- [ ] **Implementar logging centralizado** (Winston já configurado)
- [ ] **Configurar alertas de erro**
- [ ] **Implementar APM** (Application Performance Monitoring)
- [ ] **Configurar health checks** (já existe /health)
- [ ] **Implementar métricas de negócio**

### 6. Performance
- [ ] **Configurar Redis para cache** (já configurado no docker-compose)
- [ ] **Implementar rate limiting** (Throttler já configurado)
- [ ] **Otimizar queries do banco**
- [ ] **Configurar compressão gzip/brotli**
- [ ] **Implementar lazy loading no frontend**

## 🟢 RECOMENDADO - Qualidade

### 7. Testes
- [ ] **Implementar testes unitários**
- [ ] **Implementar testes de integração**
- [ ] **Implementar testes E2E**
- [ ] **Configurar CI/CD pipeline**
- [ ] **Configurar code coverage mínimo**

### 8. Documentação
- [ ] **Documentar API com Swagger/OpenAPI**
- [ ] **Criar manual do usuário**
- [ ] **Documentar processo de deploy**
- [ ] **Criar runbook de operações**
- [ ] **Documentar disaster recovery**

### 9. Compliance Fiscal
- [ ] **Validar integração NFC-e em produção**
- [ ] **Testar emissão de notas fiscais**
- [ ] **Configurar certificado digital A1**
- [ ] **Validar com SEFAZ homologação**
- [ ] **Obter autorização SEFAZ produção**

## 📋 Arquivos Necessários

### Criar:
```
/frontend/Dockerfile
/frontend/.env.production
/nginx.conf (se usar nginx)
/.github/workflows/deploy.yml (CI/CD)
/docker-compose.prod.yml
/SECURITY.md
/CONTRIBUTING.md
```

## 🚀 Deploy Recomendado

### Opção 1: AWS (já tem buildspec.yml)
- Elastic Beanstalk (backend)
- S3 + CloudFront (frontend)
- RDS PostgreSQL (banco)
- ElastiCache Redis (cache)

### Opção 2: Docker Compose
- VPS com Docker
- Nginx como reverse proxy
- PostgreSQL container
- Redis container
- Certbot para SSL

### Opção 3: Kubernetes
- EKS/GKE/AKS
- Helm charts
- Ingress controller
- Managed database

## 🔧 Comandos de Deploy

### Build Frontend
```bash
cd frontend
npm run build
# Output: dist/
```

### Build Backend
```bash
cd backend
npm run build
# Output: dist/
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## ⚠️ Antes de Ir para Produção

1. **Fazer backup completo do banco de dados**
2. **Testar em ambiente de staging**
3. **Validar todas as funcionalidades críticas**
4. **Preparar plano de rollback**
5. **Notificar usuários sobre manutenção**
6. **Ter equipe de suporte disponível**

## 📊 Métricas para Monitorar

- Tempo de resposta da API
- Taxa de erro (< 1%)
- Uptime (> 99.9%)
- Uso de CPU/Memória
- Espaço em disco
- Número de vendas/hora
- Tempo de emissão de NFC-e

## 🔐 Segurança Adicional

- [ ] Implementar 2FA para administradores
- [ ] Configurar WAF (Web Application Firewall)
- [ ] Implementar auditoria de ações
- [ ] Configurar backup offsite
- [ ] Implementar disaster recovery plan
- [ ] Realizar pentest de segurança
- [ ] Configurar DDoS protection

## 📝 Compliance LGPD

- [ ] Implementar política de privacidade
- [ ] Configurar consentimento de dados
- [ ] Implementar direito ao esquecimento
- [ ] Configurar logs de acesso a dados pessoais
- [ ] Nomear DPO (Data Protection Officer)
