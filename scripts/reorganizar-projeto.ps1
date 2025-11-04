# Script para reorganizar estrutura do projeto
# ERP + PDV Fiscal

Write-Host "🗂️  Reorganizando estrutura do projeto..." -ForegroundColor Cyan
Write-Host ""

$rootPath = Get-Location

# 1. Criar nova estrutura de pastas do Frontend
Write-Host "📁 Criando estrutura do frontend..." -ForegroundColor Yellow

$frontendDirs = @(
    "frontend",
    "frontend/src",
    "frontend/src/components",
    "frontend/src/components/PDV",
    "frontend/src/components/ERP", 
    "frontend/src/components/Shared",
    "frontend/src/components/Shifts",
    "frontend/src/components/Modals",
    "frontend/src/services",
    "frontend/src/services/api",
    "frontend/src/services/auth",
    "frontend/src/types",
    "frontend/src/hooks",
    "frontend/src/utils",
    "frontend/src/assets",
    "frontend/public"
)

foreach ($dir in $frontendDirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

# 2. Criar estrutura de pastas organizacionais
Write-Host "📁 Criando estrutura organizacional..." -ForegroundColor Yellow

$orgDirs = @(
    "docs",
    "scripts",
    "docker"
)

foreach ($dir in $orgDirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

# 3. Mover arquivos do Frontend
Write-Host "📦 Movendo arquivos do frontend..." -ForegroundColor Yellow

# Mover componentes
if (Test-Path "components") {
    Get-ChildItem -Path "components" -File | ForEach-Object {
        Copy-Item $_.FullName "frontend/src/components/Shared/" -Force
    }
}

# Mover services
if (Test-Path "services") {
    Copy-Item "services/apiClient.ts" "frontend/src/services/api/" -Force -ErrorAction SilentlyContinue
    Copy-Item "services/authService.ts" "frontend/src/services/auth/" -Force -ErrorAction SilentlyContinue
    Copy-Item "services/tokenService.ts" "frontend/src/services/auth/" -Force -ErrorAction SilentlyContinue
    
    Get-ChildItem -Path "services" -Filter "*.ts" | Where-Object { 
        $_.Name -notlike "*auth*" -and $_.Name -ne "apiClient.ts" 
    } | ForEach-Object {
        Copy-Item $_.FullName "frontend/src/services/" -Force
    }
}

# Mover arquivos raiz do frontend
$frontendRootFiles = @(
    "App.tsx",
    "index.tsx",
    "types.ts",
    "constants.tsx",
    "tsconfig.json",
    "vite.config.ts",
    "package.json",
    "package-lock.json",
    ".env.local"
)

foreach ($file in $frontendRootFiles) {
    if (Test-Path $file) {
        if ($file -like "*.tsx" -or $file -eq "types.ts" -or $file -eq "constants.tsx") {
            Copy-Item $file "frontend/src/" -Force
        } else {
            Copy-Item $file "frontend/" -Force
        }
    }
}

# Mover index.html
if (Test-Path "index.html") {
    Copy-Item "index.html" "frontend/public/" -Force
}

# 4. Mover documentação
Write-Host "📄 Movendo documentação..." -ForegroundColor Yellow

$docFiles = @(
    "API-ENDPOINTS.md",
    "SETUP-COMPLETE.md",
    "FRONTEND-STATUS.md",
    "TODAS-AS-APIS-IMPLEMENTADAS.md",
    "NOVA-ESTRUTURA.md"
)

foreach ($file in $docFiles) {
    if (Test-Path $file) {
        Copy-Item $file "docs/" -Force
    }
}

# 5. Mover scripts
Write-Host "🔧 Movendo scripts..." -ForegroundColor Yellow

if (Test-Path "test-frontend.html") {
    Copy-Item "test-frontend.html" "scripts/" -Force
}

if (Test-Path "backend/test-all-endpoints.js") {
    Copy-Item "backend/test-all-endpoints.js" "scripts/" -Force
}

if (Test-Path "backend/verify-seed.js") {
    Copy-Item "backend/verify-seed.js" "scripts/" -Force
}

# 6. Mover Docker
Write-Host "🐳 Movendo configurações Docker..." -ForegroundColor Yellow

if (Test-Path "docker-compose.yml") {
    Copy-Item "docker-compose.yml" "docker/" -Force
}

if (Test-Path "backend/docker-compose.yml") {
    Copy-Item "backend/docker-compose.yml" "docker/docker-compose.backend.yml" -Force
}

# 7. Reorganizar backend (já está bem organizado)
Write-Host "📦 Reorganizando backend..." -ForegroundColor Yellow

if (Test-Path "backend/src") {
    $backendModules = Get-ChildItem -Path "backend/src" -Directory | Where-Object { 
        $_.Name -ne "prisma" -and $_.Name -ne "common"
    }
    
    if (-not (Test-Path "backend/src/modules")) {
        New-Item -ItemType Directory -Path "backend/src/modules" -Force | Out-Null
    }
    
    foreach ($module in $backendModules) {
        if ($module.Name -ne "modules") {
            Copy-Item $module.FullName "backend/src/modules/" -Recurse -Force
        }
    }
}

# 8. Criar README atualizado para frontend
Write-Host "📝 Criando README do frontend..." -ForegroundColor Yellow

$frontendReadme = @"
# Frontend - ERP + PDV Fiscal

## 🚀 Tecnologias

- React 19
- TypeScript
- Vite
- TailwindCSS

## 📦 Instalação

``````bash
npm install
``````

## 🔧 Desenvolvimento

``````bash
npm run dev
``````

Acesse: http://localhost:3001

## 🏗️ Build

``````bash
npm run build
``````

## 📁 Estrutura

- \`src/components/PDV/\` - Componentes do PDV
- \`src/components/ERP/\` - Componentes do ERP
- \`src/components/Shared/\` - Componentes compartilhados
- \`src/services/\` - Serviços e APIs
- \`src/types/\` - TypeScript types
- \`src/hooks/\` - Custom hooks
- \`src/utils/\` - Utilitários

## 🔐 Credenciais de Teste

- Admin: admin@pdv.com / adm123
- Gerente: gerente@pdv.com / 123456
- Caixa: caixa@pdv.com / 123456
"@

Set-Content -Path "frontend/README.md" -Value $frontendReadme -Force

# 9. Atualizar README principal
Write-Host "📝 Atualizando README principal..." -ForegroundColor Yellow

$mainReadme = @"
# 🏪 ERP + PDV Fiscal

Sistema completo de Ponto de Venda (PDV) e ERP com emissão de NFC-e.

## 📁 Estrutura do Projeto

``````
erp-pdv-fiscal/
├── frontend/          # Aplicação React
├── backend/           # API NestJS
├── docs/             # Documentação
├── scripts/          # Scripts utilitários
└── docker/           # Configurações Docker
``````

## 🚀 Quick Start

### Frontend
``````bash
cd frontend
npm install
npm run dev
``````

### Backend
``````bash
cd backend
npm install
npm run start:dev
``````

## 📚 Documentação

Veja a pasta \`docs/\` para documentação completa:

- [API Endpoints](docs/API-ENDPOINTS.md)
- [Setup Guide](docs/SETUP-COMPLETE.md)
- [Frontend Status](docs/FRONTEND-STATUS.md)
- [Todas as APIs](docs/TODAS-AS-APIS-IMPLEMENTADAS.md)

## 🔐 Credenciais Padrão

- **Admin**: admin@pdv.com / adm123
- **Gerente**: gerente@pdv.com / 123456
- **Caixa**: caixa@pdv.com / 123456

## 🌐 URLs

- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- Prisma Studio: http://localhost:5555

## 📦 Tecnologias

### Frontend
- React 19 + TypeScript
- Vite
- TailwindCSS

### Backend
- NestJS
- Prisma ORM
- SQLite
- JWT Auth
- Google Gemini AI

## 📄 Licença

MIT
"@

Set-Content -Path "README.md" -Value $mainReadme -Force

# 10. Criar arquivo de configuração do TypeScript para frontend
Write-Host "⚙️  Criando configurações..." -ForegroundColor Yellow

$frontendTsConfig = @"
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@services/*": ["src/services/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"],
      "@hooks/*": ["src/hooks/*"]
    },
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
"@

Set-Content -Path "frontend/tsconfig.json" -Value $frontendTsConfig -Force

Write-Host ""
Write-Host "✅ Reorganização concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Verifique os arquivos copiados" -ForegroundColor White
Write-Host "2. Teste o frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "3. Teste o backend: cd backend && npm run start:dev" -ForegroundColor White
Write-Host "4. Se tudo funcionar, delete as pastas antigas:" -ForegroundColor White
Write-Host "   - components/" -ForegroundColor Yellow
Write-Host "   - services/" -ForegroundColor Yellow
Write-Host "   - caminho/" -ForegroundColor Yellow
Write-Host "   - api/" -ForegroundColor Yellow
Write-Host "   - arquivos .md da raiz" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Faça backup antes de deletar!" -ForegroundColor Red
