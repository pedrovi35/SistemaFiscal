# ⚡ Comandos Rápidos

## 🚀 Início Rápido

```bash
# 1. Instalar dependências (primeira vez)
cd backend && npm install && cd ../frontend && npm install && cd ..

# 2. Executar
start.bat    # Windows Batch
.\start.ps1  # PowerShell
```

## 📦 Instalação

```bash
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

## ▶️ Executar

### Desenvolvimento (Hot Reload)

```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

### Produção

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

## 🔨 Build

```bash
# Backend (compila TypeScript)
cd backend
npm run build

# Frontend (bundle Vite)
cd frontend
npm run build
```

## 🧪 Verificação de Tipos

```bash
# Backend
cd backend
npm run typecheck

# Frontend
cd frontend
npm run typecheck
```

## 🧹 Limpeza

```bash
# Limpar tudo e reinstalar
cd backend
rm -rf node_modules package-lock.json dist
npm install

cd ../frontend
rm -rf node_modules package-lock.json dist
npm install
```

## 🗑️ Resetar Banco de Dados

```bash
# Windows
cd backend\database
del fiscal.db

# Linux/Mac
cd backend/database
rm fiscal.db

# Reiniciar backend para recriar
cd ..
npm run dev
```

## 🔍 Verificar Portas em Uso

### Windows PowerShell

```powershell
# Porta 3001 (Backend)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Porta 5173 (Frontend)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Linux/Mac

```bash
# Porta 3001
lsof -ti:3001 | xargs kill -9

# Porta 5173
lsof -ti:5173 | xargs kill -9
```

## 📊 Informações

```bash
# Versões
node --version
npm --version

# Listar dependências
cd backend && npm list --depth=0
cd frontend && npm list --depth=0

# Tamanho das pastas
du -sh backend/node_modules
du -sh frontend/node_modules
```

## 🌐 URLs Importantes

```
Frontend:     http://localhost:5173
Backend API:  http://localhost:3001/api
Health Check: http://localhost:3001/health
Database:     backend/database/fiscal.db
```

## 🔧 Solução Rápida de Problemas

```bash
# 1. Módulos não encontrados
cd backend && rm -rf node_modules && npm install
cd frontend && rm -rf node_modules && npm install

# 2. Porta ocupada
# Ver comandos acima "Verificar Portas em Uso"

# 3. Banco travado
cd backend/database && rm fiscal.db && cd .. && npm run dev

# 4. Cache corrompido
npm cache clean --force
cd backend && npm install
cd frontend && npm install

# 5. TypeScript errors
cd backend && npm run typecheck
cd frontend && npm run typecheck
```

## 📝 Scripts Disponíveis

### Backend (package.json)

| Script | Comando | Descrição |
|--------|---------|-----------|
| dev | `npm run dev` | Desenvolvimento com hot reload |
| build | `npm run build` | Compilar TypeScript |
| start | `npm start` | Executar compilado |
| typecheck | `npm run typecheck` | Verificar tipos |

### Frontend (package.json)

| Script | Comando | Descrição |
|--------|---------|-----------|
| dev | `npm run dev` | Desenvolvimento com hot reload |
| build | `npm run build` | Build de produção |
| preview | `npm run preview` | Preview do build |
| typecheck | `npm run typecheck` | Verificar tipos |

## 🎯 Workflow Típico

### Desenvolvimento Diário

```bash
# 1. Abrir projeto
cd "C:\Users\ResTIC16\OneDrive\Desktop\Sistema Fiscal"

# 2. Iniciar (escolha um)
start.bat              # Opção 1: Script automático
.\start.ps1            # Opção 2: PowerShell

# OU manual:
cd backend && npm run dev      # Terminal 1
cd frontend && npm run dev     # Terminal 2

# 3. Desenvolver
# - Editar arquivos
# - Salvar (hot reload automático)
# - Testar no navegador

# 4. Parar (Ctrl+C em cada terminal)
```

### Após Mudanças em Dependências

```bash
# Se alguém adicionou novos pacotes
cd backend && npm install
cd frontend && npm install
```

### Deploy/Build

```bash
# 1. Build
cd backend && npm run build
cd frontend && npm run build

# 2. Testar
cd backend && npm start          # Terminal 1
cd frontend && npm run preview   # Terminal 2

# 3. Copiar arquivos
# backend/dist/
# frontend/dist/
```

## 💡 Dicas

### Verificar se está Rodando

```bash
# Backend
curl http://localhost:3001/health

# Frontend
# Abrir http://localhost:5173 no navegador
```

### Logs em Tempo Real

```bash
# Backend mostra logs detalhados no terminal
# Frontend mostra logs no console do navegador (F12)
```

### Recarregar Rápido

```bash
# Backend: Ctrl+C e npm run dev
# Frontend: Salvar qualquer arquivo (hot reload)
```

---

**Comandos mais usados:**

1. `start.bat` - Iniciar tudo
2. `cd backend && npm run dev` - Backend
3. `cd frontend && npm run dev` - Frontend
4. `Ctrl+C` - Parar servidor

**Em caso de problemas:**

1. Reinstalar: `rm -rf node_modules && npm install`
2. Resetar DB: `rm backend/database/fiscal.db`
3. Limpar cache: `npm cache clean --force`

