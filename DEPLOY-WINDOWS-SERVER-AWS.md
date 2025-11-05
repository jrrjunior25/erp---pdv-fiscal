# 🪟 Deploy Backend em Windows Server AWS

## 📋 Pré-requisitos no Windows Server

### 1. Instalar Node.js
```powershell
# Baixar e instalar Node.js 20 LTS
# https://nodejs.org/en/download/

# Verificar instalação
node --version
npm --version
```

### 2. Instalar Git
```powershell
# Baixar e instalar Git
# https://git-scm.com/download/win

# Verificar
git --version
```

### 3. Instalar PostgreSQL (Recomendado para Produção)
```powershell
# Baixar PostgreSQL 15
# https://www.postgresql.org/download/windows/

# Durante instalação:
# - Porta: 5432
# - Senha: [ANOTE A SENHA]
# - Criar database: erp_pdv_prod
```

**OU usar SQLite (mais simples, mas não recomendado para produção)**

## 🚀 Passo a Passo de Deploy

### Passo 1: Conectar no Windows Server AWS

**Via RDP (Remote Desktop):**
1. Abra "Conexão de Área de Trabalho Remota"
2. IP: `seu-ip-aws.compute.amazonaws.com`
3. Usuário: `Administrator`
4. Senha: Obtenha no console AWS (EC2 > Connect > Get Password)

### Passo 2: Configurar Security Group AWS

No console AWS EC2:
```
Inbound Rules:
- RDP:  3389  (Seu IP)
- HTTP: 80    (0.0.0.0/0)
- HTTPS: 443  (0.0.0.0/0)
- Custom: 3001 (0.0.0.0/0) - Backend API
```

### Passo 3: Clonar Projeto

```powershell
# Abrir PowerShell como Administrador
cd C:\

# Clonar repositório
git clone https://github.com/seu-usuario/erp-pdv-fiscal.git
cd erp-pdv-fiscal\backend
```

### Passo 4: Configurar Variáveis de Ambiente

```powershell
# Criar arquivo .env
notepad .env
```

**Conteúdo do .env:**
```env
# SQLite (Simples)
DATABASE_URL="file:./dev.db"

# OU PostgreSQL (Recomendado)
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/erp_pdv_prod?schema=public"

# JWT Secret (gerar novo)
JWT_SECRET="cole_aqui_resultado_do_comando_abaixo"

# Gemini AI
GEMINI_API_KEY="sua_chave_gemini"

# Encryption
CERT_ENCRYPTION_KEY="cole_aqui_resultado_do_comando_abaixo"

# Environment
NODE_ENV=production
FRONTEND_URL=http://SEU_IP_AWS:5173

# Logs
LOG_LEVEL=info
```

**Gerar secrets:**
```powershell
# JWT_SECRET (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# CERT_ENCRYPTION_KEY (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Passo 5: Instalar Dependências

```powershell
cd C:\erp-pdv-fiscal\backend

# Instalar dependências
npm install

# Gerar Prisma Client
npx prisma generate

# Executar migrations
npx prisma migrate deploy

# Seed inicial (primeira vez)
npx prisma db seed
```

### Passo 6: Build do Backend

```powershell
# Build para produção
npm run build

# Verificar pasta dist
dir dist
```

### Passo 7: Testar Backend

```powershell
# Iniciar em modo produção
npm run start:prod

# Testar em outro PowerShell
curl http://localhost:3001/health
```

### Passo 8: Configurar como Serviço Windows

**Opção 1: PM2 (Recomendado)**

```powershell
# Instalar PM2 globalmente
npm install -g pm2
npm install -g pm2-windows-service

# Configurar PM2 como serviço
pm2-service-install

# Iniciar aplicação
cd C:\erp-pdv-fiscal\backend
pm2 start npm --name "erp-backend" -- run start:prod

# Salvar configuração
pm2 save

# Configurar para iniciar com Windows
pm2 startup
```

**Opção 2: NSSM (Node Service Manager)**

```powershell
# Baixar NSSM
# https://nssm.cc/download

# Instalar serviço
nssm install ERPBackend "C:\Program Files\nodejs\node.exe"
nssm set ERPBackend AppDirectory "C:\erp-pdv-fiscal\backend"
nssm set ERPBackend AppParameters "dist\main.js"
nssm set ERPBackend DisplayName "ERP PDV Backend"
nssm set ERPBackend Description "Backend do sistema ERP + PDV Fiscal"
nssm set ERPBackend Start SERVICE_AUTO_START

# Iniciar serviço
nssm start ERPBackend

# Verificar status
nssm status ERPBackend
```

**Opção 3: Task Scheduler (Mais Simples)**

```powershell
# Criar script de inicialização
notepad C:\erp-pdv-fiscal\start-backend.bat
```

**Conteúdo do start-backend.bat:**
```batch
@echo off
cd C:\erp-pdv-fiscal\backend
npm run start:prod
```

Depois:
1. Abra "Agendador de Tarefas"
2. Criar Tarefa Básica
3. Nome: "ERP Backend"
4. Gatilho: "Quando o computador iniciar"
5. Ação: "Iniciar programa"
6. Programa: `C:\erp-pdv-fiscal\start-backend.bat`

### Passo 9: Configurar Firewall Windows

```powershell
# Abrir porta 3001
New-NetFirewallRule -DisplayName "ERP Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# Verificar regra
Get-NetFirewallRule -DisplayName "ERP Backend"
```

### Passo 10: Configurar IIS como Reverse Proxy (Opcional)

**Instalar IIS:**
```powershell
# Instalar IIS
Install-WindowsFeature -name Web-Server -IncludeManagementTools

# Instalar URL Rewrite e ARR
# Baixar de: https://www.iis.net/downloads/microsoft/url-rewrite
# Baixar de: https://www.iis.net/downloads/microsoft/application-request-routing
```

**Configurar Reverse Proxy:**
1. Abra IIS Manager
2. Selecione o site
3. URL Rewrite > Add Rule > Reverse Proxy
4. Server: `localhost:3001`
5. Aplicar

## 📊 Monitoramento

### Ver Logs PM2
```powershell
pm2 logs erp-backend
pm2 monit
```

### Ver Logs NSSM
```powershell
# Logs em:
C:\erp-pdv-fiscal\backend\logs\
```

### Verificar Serviço
```powershell
# PM2
pm2 status

# NSSM
nssm status ERPBackend

# Task Scheduler
Get-ScheduledTask -TaskName "ERP Backend"
```

## 🔄 Atualizar Aplicação

```powershell
# Parar serviço
pm2 stop erp-backend
# OU
nssm stop ERPBackend

# Atualizar código
cd C:\erp-pdv-fiscal\backend
git pull

# Instalar dependências
npm install

# Build
npm run build

# Migrations
npx prisma migrate deploy

# Reiniciar
pm2 restart erp-backend
# OU
nssm start ERPBackend
```

## 🔐 SSL/HTTPS no Windows

### Opção 1: IIS com Let's Encrypt

```powershell
# Instalar Win-ACME
# https://www.win-acme.com/

# Executar
wacs.exe

# Seguir wizard para obter certificado
```

### Opção 2: Cloudflare (Mais Fácil)

1. Adicione domínio no Cloudflare
2. Configure DNS apontando para IP AWS
3. SSL/TLS > Full
4. Cloudflare gerencia SSL automaticamente

## 📦 Backup Automático Windows

```powershell
# Criar script de backup
notepad C:\erp-pdv-fiscal\backup.ps1
```

**Conteúdo do backup.ps1:**
```powershell
$date = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "C:\erp-pdv-fiscal\backups"

# Criar diretório
New-Item -ItemType Directory -Force -Path $backupDir

# Backup banco SQLite
Copy-Item "C:\erp-pdv-fiscal\backend\prisma\dev.db" "$backupDir\db_$date.db"

# Backup PostgreSQL
# pg_dump -U postgres -d erp_pdv_prod > "$backupDir\db_$date.sql"

# Limpar backups antigos (30 dias)
Get-ChildItem $backupDir -Filter "*.db" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} | Remove-Item

Write-Host "Backup concluído: $date"
```

**Agendar backup:**
```powershell
# Criar tarefa agendada (diária às 2h)
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\erp-pdv-fiscal\backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "ERP Backup" -Description "Backup diário do ERP"
```

## 🎯 Checklist Final

- [ ] Node.js instalado
- [ ] PostgreSQL instalado e configurado
- [ ] Projeto clonado
- [ ] .env configurado com secrets seguros
- [ ] Dependências instaladas
- [ ] Build executado
- [ ] Migrations aplicadas
- [ ] Serviço Windows configurado
- [ ] Firewall configurado
- [ ] Security Group AWS configurado
- [ ] Backup automático configurado
- [ ] Testado: `http://SEU_IP:3001/health`

## 🆘 Troubleshooting

### Backend não inicia
```powershell
# Ver logs
pm2 logs erp-backend --lines 100

# Testar manualmente
cd C:\erp-pdv-fiscal\backend
npm run start:prod
```

### Erro de porta em uso
```powershell
# Ver o que está usando porta 3001
netstat -ano | findstr :3001

# Matar processo
taskkill /PID [PID_NUMBER] /F
```

### Erro de permissão
```powershell
# Executar PowerShell como Administrador
# Verificar permissões da pasta
icacls C:\erp-pdv-fiscal
```

### Banco não conecta
```powershell
# PostgreSQL
# Verificar se está rodando
Get-Service -Name postgresql*

# Iniciar se necessário
Start-Service postgresql-x64-15
```

## 📞 Suporte AWS

- Console: https://console.aws.amazon.com/
- Documentação: https://docs.aws.amazon.com/
- Suporte: https://aws.amazon.com/support/
