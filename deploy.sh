#!/bin/bash

set -e

echo "🚀 Iniciando deploy do ERP + PDV Fiscal..."

# Verificar se .env existe
if [ ! -f .env.production ]; then
    echo "❌ Arquivo .env.production não encontrado!"
    echo "Copie .env.production.example e configure:"
    echo "cp .env.production.example .env.production"
    exit 1
fi

# Carregar variáveis
export $(cat .env.production | xargs)

echo "📦 Parando containers antigos..."
docker-compose -f docker-compose.prod.yml down

echo "🔨 Construindo imagens..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🗄️ Executando migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

echo "🌱 Executando seed (se necessário)..."
docker-compose -f docker-compose.prod.yml run --rm backend npx tsx prisma/seed.ts || true

echo "🚀 Iniciando containers..."
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Aguardando serviços ficarem prontos..."
sleep 10

echo "🔍 Verificando status..."
docker-compose -f docker-compose.prod.yml ps

echo "✅ Deploy concluído!"
echo ""
echo "📊 Comandos úteis:"
echo "  Ver logs:      docker-compose -f docker-compose.prod.yml logs -f"
echo "  Parar:         docker-compose -f docker-compose.prod.yml down"
echo "  Reiniciar:     docker-compose -f docker-compose.prod.yml restart"
echo "  Status:        docker-compose -f docker-compose.prod.yml ps"
