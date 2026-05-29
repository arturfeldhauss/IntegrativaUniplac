#!/bin/bash
# =============================================================
# Copiloto Acadêmico — Script de Setup Automático (macOS/Linux)
# Execute com: chmod +x setup.sh && ./setup.sh
# =============================================================

echo "🎓 Copiloto Acadêmico — Setup"
echo "============================================"

# Backend
echo ""
echo "🔧 Configurando Backend..."
cd backend

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "  ✅ Arquivo .env criado. EDITE com suas credenciais!"
fi

echo "  📦 Instalando dependências..."
npm install --silent

echo "  🔑 Gerando cliente Prisma..."
npx prisma generate 2>/dev/null
echo "  ✅ Backend pronto"

cd ..

# Frontend
echo ""
echo "🎨 Configurando Frontend..."
cd frontend

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "  ✅ Arquivo .env criado"
fi

echo "  📦 Instalando dependências..."
npm install --silent
echo "  ✅ Frontend pronto"

cd ..

echo ""
echo "✅ Setup concluído!"
echo "============================================"
echo ""
echo "📌 Próximos passos:"
echo "  1. Edite backend/.env com suas credenciais"
echo "  2. cd backend && npx prisma migrate dev --name init"
echo "  3. npm run dev (no diretório backend)"
echo "  4. npm run dev (no diretório frontend, em outro terminal)"
echo "  5. Acesse http://localhost:3001"
