# =============================================================
# Copiloto Acadêmico — Script de Setup Automático (Windows)
# Execute com: .\setup.ps1
# =============================================================

Write-Host "🎓 Copiloto Acadêmico — Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Verifica pré-requisitos
Write-Host "`n📋 Verificando pré-requisitos..." -ForegroundColor Yellow

$nodeVersion = node --version 2>$null
if ($?) {
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ Node.js não encontrado. Instale em https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Backend
Write-Host "`n🔧 Configurando Backend..." -ForegroundColor Yellow

Set-Location backend

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  ✅ Arquivo .env criado a partir de .env.example" -ForegroundColor Green
    Write-Host "  ⚠️  EDITE o arquivo backend/.env com suas credenciais!" -ForegroundColor Yellow
} else {
    Write-Host "  ℹ️  Arquivo .env já existe" -ForegroundColor Blue
}

Write-Host "  📦 Instalando dependências do backend..." -ForegroundColor Gray
npm install --silent
Write-Host "  ✅ Dependências instaladas" -ForegroundColor Green

Write-Host "  🔑 Gerando cliente Prisma..." -ForegroundColor Gray
npx prisma generate --silent 2>$null
Write-Host "  ✅ Cliente Prisma gerado" -ForegroundColor Green

Set-Location ..

# Frontend
Write-Host "`n🎨 Configurando Frontend..." -ForegroundColor Yellow

Set-Location frontend

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  ✅ Arquivo .env criado a partir de .env.example" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  Arquivo .env já existe" -ForegroundColor Blue
}

Write-Host "  📦 Instalando dependências do frontend..." -ForegroundColor Gray
npm install --silent
Write-Host "  ✅ Dependências instaladas" -ForegroundColor Green

Set-Location ..

# Instruções finais
Write-Host "`n✅ Setup concluído!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "`n📌 Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Edite backend/.env com suas credenciais do Google e banco de dados"
Write-Host "  2. Crie o banco PostgreSQL: createdb copiloto_academico"
Write-Host "  3. Execute as migrations: cd backend && npx prisma migrate dev --name init"
Write-Host "  4. Inicie o backend: cd backend && npm run dev"
Write-Host "  5. Inicie o frontend (novo terminal): cd frontend && npm run dev"
Write-Host "  6. Acesse http://localhost:3001" -ForegroundColor Cyan
Write-Host "`n📖 Para mais informações, leia o README.md" -ForegroundColor Gray
