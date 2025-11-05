# 🔒 Guia Completo - Certificado SSL com Let's Encrypt

## O que é o Certbot?

Certbot é uma ferramenta gratuita que obtém certificados SSL do **Let's Encrypt** (autoridade certificadora gratuita).

## Comando Explicado

```bash
sudo certbot certonly --standalone -d seudominio.com.br -d api.seudominio.com.br
```

### Detalhamento:

- **sudo** - Executa como administrador (necessário para portas 80/443)
- **certbot** - Ferramenta do Let's Encrypt
- **certonly** - Apenas obtém o certificado (não configura automaticamente)
- **--standalone** - Usa servidor web temporário próprio do Certbot
- **-d seudominio.com.br** - Domínio principal (frontend)
- **-d api.seudominio.com.br** - Subdomínio (backend API)

## ⚠️ Pré-requisitos IMPORTANTES

### 1. DNS Configurado
Antes de executar, configure os registros DNS:

```
Tipo A:
seudominio.com.br        → IP_DO_SERVIDOR (ex: 192.168.1.100)
api.seudominio.com.br    → IP_DO_SERVIDOR (ex: 192.168.1.100)
```

**Como verificar se DNS está propagado:**
```bash
# Linux/Mac
nslookup seudominio.com.br
nslookup api.seudominio.com.br

# Windows
nslookup seudominio.com.br
```

### 2. Portas Abertas
O Certbot precisa das portas **80** e **443** livres:

```bash
# Verificar se portas estão livres
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Se houver algo rodando, pare temporariamente
sudo systemctl stop nginx
sudo systemctl stop apache2
```

### 3. Firewall Configurado
```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 📋 Passo a Passo Completo

### Passo 1: Instalar Certbot

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install certbot -y
```

**CentOS/RHEL:**
```bash
sudo yum install certbot -y
```

**Windows (WSL):**
```bash
# Instalar WSL primeiro, depois:
sudo apt update
sudo apt install certbot -y
```

### Passo 2: Parar Serviços Web (se houver)

```bash
# Nginx
sudo systemctl stop nginx

# Apache
sudo systemctl stop apache2

# Docker containers
docker-compose down
```

### Passo 3: Executar Certbot

```bash
sudo certbot certonly --standalone \
  -d seudominio.com.br \
  -d api.seudominio.com.br \
  --email seu-email@exemplo.com \
  --agree-tos \
  --no-eff-email
```

**Parâmetros adicionais:**
- `--email` - Seu email para notificações de renovação
- `--agree-tos` - Aceita termos de serviço automaticamente
- `--no-eff-email` - Não compartilha email com EFF

### Passo 4: Verificar Certificados

```bash
# Certificados ficam em:
ls -la /etc/letsencrypt/live/seudominio.com.br/

# Arquivos gerados:
# cert.pem       - Certificado do domínio
# chain.pem      - Cadeia de certificados
# fullchain.pem  - Certificado + cadeia (USE ESTE)
# privkey.pem    - Chave privada (MANTENHA SEGURO)
```

### Passo 5: Copiar Certificados para Projeto

```bash
# Criar diretório
mkdir -p ~/erp-pdv-fiscal/nginx/ssl

# Copiar certificados
sudo cp /etc/letsencrypt/live/seudominio.com.br/fullchain.pem ~/erp-pdv-fiscal/nginx/ssl/
sudo cp /etc/letsencrypt/live/seudominio.com.br/privkey.pem ~/erp-pdv-fiscal/nginx/ssl/

# Ajustar permissões
sudo chown $USER:$USER ~/erp-pdv-fiscal/nginx/ssl/*
chmod 644 ~/erp-pdv-fiscal/nginx/ssl/fullchain.pem
chmod 600 ~/erp-pdv-fiscal/nginx/ssl/privkey.pem
```

## 🔄 Renovação Automática

Certificados Let's Encrypt expiram em **90 dias**.

### Configurar Renovação Automática

```bash
# Testar renovação (dry-run)
sudo certbot renew --dry-run

# Adicionar ao crontab (verifica diariamente)
sudo crontab -e

# Adicionar linha:
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

### Renovação Manual

```bash
# Parar serviços
sudo systemctl stop nginx

# Renovar
sudo certbot renew

# Copiar novos certificados
sudo cp /etc/letsencrypt/live/seudominio.com.br/fullchain.pem ~/erp-pdv-fiscal/nginx/ssl/
sudo cp /etc/letsencrypt/live/seudominio.com.br/privkey.pem ~/erp-pdv-fiscal/nginx/ssl/

# Reiniciar
sudo systemctl start nginx
```

## 🌐 Alternativa: Certbot com Nginx (Mais Fácil)

Se você já tem Nginx rodando:

```bash
# Instalar plugin nginx
sudo apt install python3-certbot-nginx -y

# Obter e configurar automaticamente
sudo certbot --nginx -d seudominio.com.br -d api.seudominio.com.br
```

Isso configura SSL automaticamente no Nginx!

## 🐳 Com Docker

Se usar Docker, use o método **webroot**:

```bash
# 1. Criar diretório para validação
mkdir -p ~/erp-pdv-fiscal/certbot/www

# 2. Obter certificado
sudo certbot certonly --webroot \
  -w ~/erp-pdv-fiscal/certbot/www \
  -d seudominio.com.br \
  -d api.seudominio.com.br

# 3. Certificados em: /etc/letsencrypt/live/seudominio.com.br/
```

## ❌ Problemas Comuns

### Erro: "Port 80 already in use"
```bash
# Descobrir o que está usando
sudo lsof -i :80

# Parar o serviço
sudo systemctl stop nginx
```

### Erro: "DNS problem: NXDOMAIN"
```bash
# DNS não está configurado ou não propagou
# Aguarde 5-30 minutos após configurar DNS
# Verifique:
nslookup seudominio.com.br
```

### Erro: "Connection refused"
```bash
# Firewall bloqueando
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Erro: "Too many certificates"
```bash
# Limite: 5 certificados/semana por domínio
# Aguarde 7 dias ou use --staging para testes
sudo certbot certonly --staging --standalone -d seudominio.com.br
```

## 🧪 Testar em Staging (Desenvolvimento)

Para testes sem limite de requisições:

```bash
sudo certbot certonly --staging --standalone \
  -d seudominio.com.br \
  -d api.seudominio.com.br
```

## 📱 Certificado Wildcard (Todos os Subdomínios)

```bash
# Requer validação DNS
sudo certbot certonly --manual --preferred-challenges dns \
  -d seudominio.com.br \
  -d *.seudominio.com.br
```

Você precisará adicionar registro TXT no DNS.

## ✅ Verificar Certificado Instalado

```bash
# Verificar validade
openssl x509 -in /etc/letsencrypt/live/seudominio.com.br/cert.pem -text -noout

# Testar HTTPS
curl -I https://seudominio.com.br

# Verificar online
# https://www.ssllabs.com/ssltest/
```

## 🔐 Segurança

```bash
# Permissões corretas
sudo chmod 755 /etc/letsencrypt/live
sudo chmod 755 /etc/letsencrypt/archive
sudo chmod 600 /etc/letsencrypt/archive/*/privkey*.pem

# Backup dos certificados
sudo tar -czf letsencrypt-backup.tar.gz /etc/letsencrypt/
```

## 📞 Suporte

- Documentação: https://certbot.eff.org/
- Comunidade: https://community.letsencrypt.org/
- Status: https://letsencrypt.status.io/
