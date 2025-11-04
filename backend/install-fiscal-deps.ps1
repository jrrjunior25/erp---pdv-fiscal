# Script para instalar dependências fiscais

Write-Host "Instalando dependencias para NFC-e e PIX..." -ForegroundColor Cyan

cd backend

# Dependências para NFC-e
npm install --save xml2js xmlbuilder2 node-forge crypto-js

# Dependências para PIX
npm install --save qrcode-pix crc32

# Dependências para requisições HTTP
npm install --save axios

Write-Host "Dependencias instaladas com sucesso!" -ForegroundColor Green
