# 🎓 Copiloto Acadêmico — MVP

> Plataforma inteligente para Educação Física com Google Classroom + IA adaptativa ao perfil VARK + contexto esportivo.

---

## ✨ O que o MVP entrega

| Feature | Status |
|---------|--------|
| Login com Google OAuth 2.0 | ✅ |
| Sincronizar Google Classroom | ✅ |
| Importar disciplinas + materiais + atividades | ✅ |
| Questionário VARK (16 perguntas de Ed. Física) | ✅ |
| IA gerando resumo adaptado ao perfil | ✅ |
| IA gerando flashcards com exemplos esportivos | ✅ |
| IA gerando quiz com cenários esportivos | ✅ |
| IA gerando guia de estudo personalizado | ✅ |
| Dashboard com perfil VARK visual | ✅ |
| Animações com Framer Motion | ✅ |

---

## 🚀 Setup rápido (5 minutos)

### Pré-requisitos
- Node.js 18+
- PostgreSQL rodando localmente
- OpenAI API Key ativa
- Conta Google Cloud com Classroom API habilitada

### Instalar e configurar

```bash
# Windows — execute o script de setup:
.\setup.ps1

# Linux/macOS:
chmod +x setup.sh && ./setup.sh
```

Ou manualmente:

```bash
cd backend && cp .env.example .env && npm install
cd ../frontend && cp .env.example .env && npm install
```

### Banco de dados

```bash
# Crie o banco (uma vez só)
createdb copiloto_academico

# Migrations
cd backend
npx prisma migrate dev --name init
```

### Variáveis de ambiente obrigatórias (`backend/.env`)

```env
DATABASE_URL="postgresql://postgres:SENHA@localhost:5432/copiloto_academico"
JWT_SECRET="string-aleatoria-longa-32-chars"
GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-seu-secret"
OPENAI_API_KEY="sk-proj-sua-chave"
```

### Rodar

```bash
# Terminal 1 — Backend (porta 3000)
cd backend && npm run dev

# Terminal 2 — Frontend (porta 3001)
cd frontend && npm run dev
```

Acesse: **http://localhost:3001**

---

## 🔑 Google Cloud Console — Configuração

### 1. APIs para ativar

No [console.cloud.google.com](https://console.cloud.google.com):
- **Google Classroom API**
- **Google Drive API**
- **Google People API**

### 2. Criar OAuth 2.0 Client ID

1. APIs & Services → Credentials → Create Credentials → **OAuth client ID**
2. Application type: **Web application**
3. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
4. Copie **Client ID** e **Client Secret** para o `.env`

### 3. OAuth Consent Screen

1. OAuth consent screen → **External**
2. Adicione os scopes do Classroom e Drive
3. **Test users** → adicione seu email (obrigatório em desenvolvimento)

> ⚠️ Sem adicionar o email em Test Users, o login vai falhar com "acesso negado"

---

## 🧠 Fluxo da aplicação

```
1. Login Google
   ↓
2. Questionário VARK (obrigatório na 1ª vez)
   → 16 perguntas contextualizadas para Educação Física
   → Perfil salvo: Visual / Auditivo / Leitura-Escrita / Cinestésico
   ↓
3. Dashboard
   → Mostra perfil VARK com barras de pontuação
   → Disciplinas importadas
   → Atividades com prazo
   ↓
4. Sincronizar Classroom
   → Importa disciplinas, materiais e atividades em tempo real
   ↓
5. IA Esportiva (/ai)
   → Seleciona disciplina + tipo de conteúdo
   → IA gera conteúdo adaptado ao seu perfil VARK
   → Todo conteúdo usa exemplos de biomecânica, fisiologia, esporte
```

---

## 🤖 Como a IA funciona

Cada geração usa um **prompt em duas camadas**:

**Camada 1 — Sistema (não muda):**
> "Você é um tutor especializado em Educação Física, biomecânica, anatomia funcional e fisiologia do exercício. Todo conteúdo DEVE incluir exemplos esportivos reais..."

**Camada 2 — Personalização VARK:**
Adapta o conteúdo ao estilo do aluno:
- 👁️ **Visual**: mapas mentais, diagramas, esquemas
- 👂 **Auditivo**: narrativo, conversacional, analogias sonoras
- 📖 **Leitura/Escrita**: textos estruturados, definições precisas
- 🏃 **Cinestésico**: foco em prática, movimento, sensações físicas

---

## 📁 Estrutura

```
copiloto-academico/
├── backend/
│   ├── prisma/schema.prisma       # 7 tabelas MVP
│   └── src/
│       ├── services/
│       │   ├── ai.service.ts      # OpenAI + VARK + esporte
│       │   ├── vark.service.ts    # Cálculo do perfil VARK
│       │   ├── classroom.service.ts
│       │   └── sync.service.ts
│       └── controllers/ + routes/
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── VarkPage.tsx       # Questionário animado
        │   ├── DashboardPage.tsx  # Painel com VARK
        │   ├── AIPage.tsx         # Geração de conteúdo
        │   └── CourseDetailPage.tsx
        └── data/varkQuestions.ts  # 16 perguntas VARK
```

---

## 🔧 Comandos úteis

```bash
# Visualizar banco
cd backend && npx prisma studio

# Resetar banco (cuidado!)
cd backend && npx prisma migrate reset

# Checar TypeScript
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

---

## 🏃 Contexto Esportivo — Exemplos

Quando o material for sobre **joelho**:
> "Explique como o ligamento cruzado anterior trabalha durante uma mudança de direção no futebol, a mecânica de um salto no basquete, e por que corredores de longa distância têm mais risco de síndrome patelofemoral..."

Quando o material for sobre **metabolismo energético**:
> "Compare os sistemas ATP-PC, glicolítico e oxidativo usando exemplos de sprinter (100m), meio-fundista (800m) e maratonista. Explique como um atleta de CrossFit usa os três sistemas em um único treino..."
