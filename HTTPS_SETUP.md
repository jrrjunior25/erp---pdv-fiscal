# Configuração HTTPS para Produção

## Backend (NestJS)

### 1. Gerar Certificado SSL

```bash
# Desenvolvimento (self-signed)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Produção: Use Let's Encrypt
sudo certbot certonly --standalone -d seu-dominio.com
```

### 2. Configurar NestJS

Editar `backend/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as https from 'https';

async function bootstrap() {
  const httpsOptions = process.env.NODE_ENV === 'production' ? {
    key: fs.readFileSync('/etc/letsencrypt/live/seu-dominio.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/seu-dominio.com/fullchain.pem'),
  } : undefined;

  const app = httpsOptions 
    ? await NestFactory.create(AppModule, { httpsOptions })
    : await NestFactory.create(AppModule);

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
```

### 3. Atualizar .env

```bash
NODE_ENV=production
PORT=443
HTTPS_ENABLED=true
SSL_KEY_PATH=/etc/letsencrypt/live/seu-dominio.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/seu-dominio.com/fullchain.pem
```

## Frontend (React)

### 1. Atualizar API URL

Editar `frontend/src/services/apiClient.ts`:

```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.seu-dominio.com/api'
  : 'http://localhost:3001/api';
```

### 2. Configurar Variáveis de Ambiente

Criar `frontend/.env.production`:

```bash
VITE_API_URL=https://api.seu-dominio.com/api
```

## Nginx (Proxy Reverso)

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

## Content Security Policy

Adicionar no backend `main.ts`:

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

## Comandos de Deploy

```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Copiar para servidor
scp -r dist/* user@servidor:/var/www/frontend/

# 3. Reiniciar backend
pm2 restart backend

# 4. Reiniciar nginx
sudo systemctl restart nginx
```
