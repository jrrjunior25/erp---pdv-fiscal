# Script para verificar e iniciar o banco de dados

Write-Host "=== Verificando Banco de Dados ===" -ForegroundColor Cyan

# Verificar se PostgreSQL está instalado
$pgPath = "C:\Program Files\PostgreSQL\*\bin\psql.exe"
$pgExists = Test-Path $pgPath

if (-not $pgExists) {
    Write-Host "PostgreSQL não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Opções:" -ForegroundColor Yellow
    Write-Host "1. Instalar PostgreSQL: https://www.postgresql.org/download/windows/"
    Write-Host "2. Usar Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres"
    Write-Host "3. Usar SQLite (desenvolvimento): Alterar DATABASE_URL no .env"
    exit 1
}

Write-Host "PostgreSQL encontrado!" -ForegroundColor Green

# Verificar se o serviço está rodando
$service = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($service) {
    if ($service.Status -eq "Running") {
        Write-Host "Serviço PostgreSQL está rodando" -ForegroundColor Green
    } else {
        Write-Host "Iniciando serviço PostgreSQL..." -ForegroundColor Yellow
        Start-Service $service.Name
        Write-Host "Serviço iniciado!" -ForegroundColor Green
    }
} else {
    Write-Host "Serviço PostgreSQL não encontrado. Tentando via Docker..." -ForegroundColor Yellow
    
    # Verificar se Docker está disponível
    $dockerExists = Get-Command docker -ErrorAction SilentlyContinue
    
    if ($dockerExists) {
        Write-Host "Iniciando PostgreSQL via Docker..." -ForegroundColor Yellow
        docker run -d --name erp-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15
        Start-Sleep -Seconds 5
        Write-Host "PostgreSQL iniciado via Docker!" -ForegroundColor Green
    } else {
        Write-Host "Docker não encontrado!" -ForegroundColor Red
        exit 1
    }
}

# Testar conexão
Write-Host ""
Write-Host "Testando conexão com o banco..." -ForegroundColor Cyan

cd backend
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/erp_pdv?schema=public"

# Executar migrations
Write-Host "Executando migrations..." -ForegroundColor Cyan
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "Banco de dados configurado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Erro ao configurar banco de dados" -ForegroundColor Red
    Write-Host "Criando banco de dados..." -ForegroundColor Yellow
    npx prisma db push
}

Write-Host ""
Write-Host "=== Banco de Dados Pronto ===" -ForegroundColor Green
