# 📦 Guia de Instalação Completo

## 🎯 Visão Geral

Este guia detalha todos os passos para instalar e executar o Sistema de Obrigações Fiscais.

## 📋 Pré-requisitos

### Obrigatórios

1. **Node.js 18 ou superior**
   - Download: https://nodejs.org
   - Verificar: `node --version`
   
2. **npm** (vem com Node.js)
   - Verificar: `npm --version`

### Opcional

- **Git** (para clonar repositório)
- **Visual Studio Code** (editor recomendado)

## 🔧 Instalação Passo a Passo

### 1. Preparar o Ambiente

#### Windows PowerShell:
```powershell
# Navegar até a pasta do projeto
cd "C:\Users\ResTIC16\OneDrive\Desktop\Sistema Fiscal"

# Verificar Node.js instalado
node --version
npm --version
```

### 2. Instalar Dependências do Backend

```bash
# Navegar para pasta backend
cd backend

# Instalar dependências
npm install

# Aguardar instalação (pode levar alguns minutos)
```

**Pacotes que serão instalados:**
- express (servidor HTTP)
- socket.io (WebSocket)
- better-sqlite3 (banco de dados)
- axios (requisições HTTP)
- date-fns (manipulação de datas)
- cors (CORS middleware)
- TypeScript e tipos

### 3. Instalar Dependências do Frontend

```bash
# Voltar para raiz
cd ..

# Navegar para pasta frontend
cd frontend

# Instalar dependências
npm install

# Aguardar instalação
```

**Pacotes que serão instalados:**
- react (biblioteca UI)
- vite (build tool)
- @fullcalendar/* (componente calendário)
- socket.io-client (WebSocket cliente)
- tailwindcss (CSS framework)
- lucide-react (ícones)
- TypeScript e tipos

### 4. Verificar Instalação

```bash
# Backend
cd backend
npm list --depth=0

# Frontend
cd frontend
npm list --depth=0
```

## ▶️ Executar o Sistema

### Método 1: Scripts Automáticos (Recomendado)

#### Windows Batch:
```bash
# Na raiz do projeto
start.bat
```

#### PowerShell:
```powershell
# Na raiz do projeto
.\start.ps1
```

### Método 2: Manual (2 Terminais)

#### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

**Aguarde ver:**
```
🚀 ========================================
🚀 Sistema Fiscal - Backend
🚀 ========================================
🚀 Servidor rodando na porta: 3001
✅ Banco de dados inicializado com sucesso!
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

**Aguarde ver:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## 🌐 Acessar o Sistema

Abra seu navegador em:

**Frontend:** http://localhost:5173

## ✅ Testar Instalação

### 1. Teste de Conexão Backend

Abra: http://localhost:3001/health

**Deve retornar:**
```json
{
  "status": "ok",
  "timestamp": "2025-...",
  "service": "Sistema Fiscal API"
}
```

### 2. Teste de Conexão Frontend

Abra: http://localhost:5173

**Deve mostrar:**
- Interface do calendário
- Botão "Nova Obrigação"
- Painel de filtros

### 3. Teste de Funcionalidade

1. Clique em "Nova Obrigação"
2. Preencha:
   - Título: "Teste"
   - Data: Hoje
   - Tipo: Federal
3. Clique em "Criar Obrigação"
4. Veja aparecer no calendário! ✅

### 4. Teste de WebSocket

1. Abra uma **segunda aba** do navegador em http://localhost:5173
2. Crie uma obrigação na **primeira aba**
3. Veja a notificação aparecer na **segunda aba** automaticamente! ✅

## 🔍 Solução de Problemas

### Erro: "Cannot find module"

**Solução:**
```bash
# Reinstalar dependências
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Port 3001 already in use"

**Solução Windows:**
```powershell
# Encontrar processo
netstat -ano | findstr :3001

# Matar processo (substitua PID)
taskkill /PID <número_do_pid> /F
```

### Erro: "Port 5173 already in use"

**Solução:**
```powershell
# Encontrar processo
netstat -ano | findstr :5173

# Matar processo
taskkill /PID <número_do_pid> /F
```

### Erro: "EACCES" ou permissão negada

**Solução:**
```bash
# Limpar cache npm
npm cache clean --force

# Reinstalar
npm install
```

### Erro: "Python not found" (durante instalação)

**Causa:** better-sqlite3 precisa compilar binários

**Solução:**
1. Instale Python 3.x: https://www.python.org/downloads/
2. Instale Visual Studio Build Tools
3. Reinstale: `npm install`

**OU use versão pré-compilada:**
```bash
npm install better-sqlite3 --build-from-source=false
```

### Erro: Database locked

**Solução:**
```bash
# Parar backend
# Deletar banco
cd backend/database
rm fiscal.db fiscal.db-journal

# Reiniciar backend (criará novo banco)
cd ..
npm run dev
```

## 🎨 Personalização

### Mudar Portas

#### Backend:
Edite `backend/.env`:
```env
PORT=3002  # Nova porta
```

#### Frontend:
Edite `frontend/vite.config.ts`:
```typescript
server: {
  port: 5174  // Nova porta
}
```

Não esqueça de atualizar CORS no backend!

### Mudar URL da API

Crie `frontend/.env`:
```env
VITE_API_URL=http://localhost:3002/api
VITE_SOCKET_URL=http://localhost:3002
```

## 📊 Estrutura Após Instalação

```
Sistema Fiscal/
├── backend/
│   ├── node_modules/      ← 200+ MB
│   ├── database/
│   │   └── fiscal.db      ← Criado automaticamente
│   └── dist/              ← Build (após npm run build)
├── frontend/
│   ├── node_modules/      ← 500+ MB
│   └── dist/              ← Build (após npm run build)
└── ...
```

## 🚀 Build para Produção

### Backend:
```bash
cd backend
npm run build
npm start
```

### Frontend:
```bash
cd frontend
npm run build
npm run preview
```

## 📝 Comandos Úteis

### Desenvolvimento
```bash
# Backend
cd backend
npm run dev          # Modo desenvolvimento (hot reload)
npm run build        # Compilar TypeScript
npm start            # Executar versão compilada
npm run typecheck    # Verificar tipos

# Frontend
cd frontend
npm run dev          # Modo desenvolvimento (hot reload)
npm run build        # Build produção
npm run preview      # Preview do build
npm run typecheck    # Verificar tipos
```

### Limpeza
```bash
# Remover node_modules e reinstalar
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### Verificar Versões
```bash
node --version
npm --version
cd backend && npm list --depth=0
cd frontend && npm list --depth=0
```

## 🎓 Próximos Passos

Após instalação bem-sucedida:

1. ✅ Leia o [QUICKSTART.md](QUICKSTART.md)
2. ✅ Explore o [README.md](README.md)
3. ✅ Veja [FEATURES.md](FEATURES.md) para funcionalidades
4. ✅ Entenda [ARCHITECTURE.md](ARCHITECTURE.md) da arquitetura

## 📞 Suporte

Se problemas persistirem:

1. Verifique logs no terminal
2. Verifique console do navegador (F12)
3. Certifique-se que Node.js 18+ está instalado
4. Tente reinstalar dependências
5. Verifique firewall/antivírus

---

**Instalação concluída com sucesso?** 🎉

Comece criando sua primeira obrigação fiscal!

