# 🚀 Guia de Deploy - ERP + PDV Fiscal

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Nginx
- PM2
- Certificado SSL (Let's Encrypt)

---

## 1️⃣ Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y nodejs npm postgresql nginx certbot python3-certbot-nginx

# Instalar PM2
sudo npm install -g pm2
```

---

## 2️⃣ Configurar Banco de Dados

```bash
# Criar banco
sudo -u postgres psql
CREATE DATABASE erp_pdv;
CREATE USER erp_user WITH PASSWORD 'senha_segura';
GRANT ALL PRIVILEGES ON DATABASE erp_pdv TO erp_user;
\q
```

---

## 3️⃣ Deploy Backend

```bash
# Clonar/copiar projeto
cd /var/www
git clone seu-repositorio.git erp-pdv
cd erp-pdv/backend

# Instalar dependências
npm install --production

# Configurar .env
cp .env.example .env
nano .env
```

**.env produção**:
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://erp_user:senha_segura@localhost:5432/erp_pdv"
JWT_SECRET="chave-super-secreta-aleatoria-64-caracteres"
JWT_EXPIRES_IN="7d"
TEST_EMAIL="admin@pdv.com"
TEST_PASSWORD="senha_admin_forte"
STORAGE_TYPE="local"
```

```bash
# Executar migrations
npx prisma migrate deploy

# Seed inicial
npx tsx prisma/seed.ts

# Build
npm run build

# Iniciar com PM2
pm2 start dist/main.js --name erp-backend
pm2 save
pm2 startup
```

---

## 4️⃣ Deploy Frontend

```bash
cd /var/www/erp-pdv/frontend

# Instalar dependências
npm install

# Configurar .env.production
cat > .env.production << EOF
VITE_API_URL=https://api.seu-dominio.com/api
EOF

# Build
npm run build

# Copiar para nginx
sudo mkdir -p /var/www/html/erp-pdv
sudo cp -r dist/* /var/www/html/erp-pdv/
```

---

## 5️⃣ Configurar SSL

```bash
# Obter certificado
sudo certbot --nginx -d seu-dominio.com -d api.seu-dominio.com

# Renovação automática
sudo certbot renew --dry-run
```

---

## 6️⃣ Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/erp-pdv
```

```nginx
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name seu-dominio.com api.seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

# Frontend
server {
    listen 443 ssl http2;
    server_name seu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    root /var/www/html/erp-pdv;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}

# Backend API
server {
    listen 443 ssl http2;
    server_name api.seu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/erp-pdv /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 7️⃣ Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 8️⃣ Backup Automático

```bash
# Criar script de backup
sudo nano /usr/local/bin/backup-erp.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/erp-pdv"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup banco
pg_dump -U erp_user erp_pdv | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup arquivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/erp-pdv/backend/storage

# Manter apenas últimos 7 dias
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup concluído: $DATE"
```

```bash
sudo chmod +x /usr/local/bin/backup-erp.sh

# Agendar backup diário (3h da manhã)
sudo crontab -e
0 3 * * * /usr/local/bin/backup-erp.sh
```

---

## 9️⃣ Monitoramento

```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Logs
pm2 logs erp-backend
pm2 monit
```

---

## 🔟 Comandos Úteis

```bash
# Reiniciar backend
pm2 restart erp-backend

# Ver logs
pm2 logs erp-backend --lines 100

# Status
pm2 status

# Atualizar código
cd /var/www/erp-pdv
git pull
cd backend && npm install && npm run build
pm2 restart erp-backend

# Reiniciar nginx
sudo systemctl restart nginx

# Ver logs nginx
sudo tail -f /var/log/nginx/error.log
```

---

## ✅ Checklist Pós-Deploy

- [ ] Backend respondendo em https://api.seu-dominio.com
- [ ] Frontend acessível em https://seu-dominio.com
- [ ] Login funcionando
- [ ] Banco de dados conectado
- [ ] SSL válido
- [ ] Backup configurado
- [ ] PM2 iniciando automaticamente
- [ ] Firewall ativo
- [ ] Logs sendo gerados

---

## 🔒 Segurança Adicional

```bash
# Fail2ban para proteção contra brute force
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Configurar fail2ban para nginx
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
```

```bash
sudo systemctl restart fail2ban
```

---

## 📊 Monitoramento de Performance

```bash
# Instalar htop
sudo apt install htop

# Monitorar recursos
htop

# Monitorar PostgreSQL
sudo -u postgres psql
SELECT * FROM pg_stat_activity;
```

---

## 🆘 Troubleshooting

### Backend não inicia
```bash
pm2 logs erp-backend
# Verificar .env
# Verificar conexão com banco
```

### Erro 502 Bad Gateway
```bash
# Verificar se backend está rodando
pm2 status
# Verificar logs nginx
sudo tail -f /var/log/nginx/error.log
```

### Banco não conecta
```bash
# Testar conexão
psql -U erp_user -d erp_pdv -h localhost
# Verificar DATABASE_URL no .env
```

---

## 📞 Suporte

- Documentação: `/docs`
- Logs: `pm2 logs`
- Status: `pm2 monit`
