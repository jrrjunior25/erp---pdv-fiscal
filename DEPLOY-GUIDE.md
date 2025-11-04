# 🚀 Guia de Deploy para Produção

## Pré-requisitos

- Servidor Linux (Ubuntu 22.04 LTS recomendado)
- Docker e Docker Compose instalados
- Domínio configurado
- Certificado SSL (Let's Encrypt ou comercial)

## Passo 1: Preparar Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Criar usuário para aplicação
sudo useradd -m -s /bin/bash erp
sudo usermod -aG docker erp
```

## Passo 2: Clonar Projeto

```bash
# Como usuário erp
su - erp
git clone https://github.com/seu-usuario/erp-pdv-fiscal.git
cd erp-pdv-fiscal
```

## Passo 3: Configurar Variáveis de Ambiente

```bash
# Copiar exemplo
cp .env.production.example .env.production

# Gerar secrets
echo "JWT_SECRET=$(openssl rand -hex 64)" >> .env.production
echo "CERT_ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env.production
echo "DB_PASSWORD=$(openssl rand -base64 32)" >> .env.production
echo "REDIS_PASSWORD=$(openssl rand -base64 32)" >> .env.production

# Editar e adicionar suas chaves
nano .env.production
```

## Passo 4: Configurar SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install certbot -y

# Obter certificado
sudo certbot certonly --standalone -d seudominio.com.br -d api.seudominio.com.br

# Copiar certificados
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/seudominio.com.br/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/seudominio.com.br/privkey.pem nginx/ssl/
sudo chown -R erp:erp nginx/ssl
```

## Passo 5: Build e Deploy

```bash
# Carregar variáveis
export $(cat .env.production | xargs)

# Build das imagens
docker-compose -f docker-compose.prod.yml build

# Iniciar serviços
docker-compose -f docker-compose.prod.yml up -d

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Passo 6: Migrar Banco de Dados

```bash
# Executar migrations
docker exec erp_pdv_backend_prod npx prisma migrate deploy

# Seed inicial (apenas primeira vez)
docker exec erp_pdv_backend_prod npx prisma db seed
```

## Passo 7: Verificar Saúde

```bash
# Backend
curl http://localhost:3001/health

# Frontend
curl http://localhost/health

# Verificar containers
docker ps
```

## Passo 8: Configurar Backup Automático

```bash
# Criar script de backup
cat > /home/erp/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/erp/backups"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec erp_pdv_postgres_prod pg_dump -U postgres erp_pdv_prod | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup arquivos
tar -czf $BACKUP_DIR/storage_$DATE.tar.gz backend/storage

# Limpar backups antigos (30 dias)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup concluído: $DATE"
EOF

chmod +x /home/erp/backup.sh

# Adicionar ao crontab (diário às 2h)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/erp/backup.sh >> /home/erp/backup.log 2>&1") | crontab -
```

## Passo 9: Configurar Monitoramento

```bash
# Instalar Prometheus (opcional)
docker run -d --name prometheus \
  -p 9090:9090 \
  -v /home/erp/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Instalar Grafana (opcional)
docker run -d --name grafana \
  -p 3000:3000 \
  grafana/grafana
```

## Passo 10: Configurar Firewall

```bash
# UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Manutenção

### Atualizar Aplicação

```bash
cd /home/erp/erp-pdv-fiscal
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Ver Logs

```bash
# Todos os serviços
docker-compose -f docker-compose.prod.yml logs -f

# Apenas backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Últimas 100 linhas
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Reiniciar Serviços

```bash
# Todos
docker-compose -f docker-compose.prod.yml restart

# Apenas backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Backup Manual

```bash
/home/erp/backup.sh
```

### Restaurar Backup

```bash
# Parar serviços
docker-compose -f docker-compose.prod.yml down

# Restaurar banco
gunzip < backups/db_20240115_020000.sql.gz | docker exec -i erp_pdv_postgres_prod psql -U postgres erp_pdv_prod

# Restaurar arquivos
tar -xzf backups/storage_20240115_020000.tar.gz

# Reiniciar
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Container não inicia

```bash
docker-compose -f docker-compose.prod.yml logs backend
docker inspect erp_pdv_backend_prod
```

### Banco de dados não conecta

```bash
docker exec -it erp_pdv_postgres_prod psql -U postgres
```

### Limpar tudo e recomeçar

```bash
docker-compose -f docker-compose.prod.yml down -v
docker system prune -a
```

## Segurança

1. **Nunca commitar .env.production**
2. **Trocar todas as senhas padrão**
3. **Manter sistema atualizado**
4. **Monitorar logs regularmente**
5. **Fazer backups diários**
6. **Testar restauração de backup mensalmente**

## Suporte

Em caso de problemas:
1. Verificar logs: `docker-compose logs`
2. Verificar saúde: `curl http://localhost:3001/health`
3. Verificar recursos: `docker stats`
4. Consultar documentação: `/docs`
