# 🚀 Guia de Início Rápido

Este guia vai te ajudar a ter o Sistema de Obrigações Fiscais funcionando em minutos!

## 📋 Pré-requisitos

- **Node.js 18+** instalado
- **npm** ou **yarn**
- Terminal/PowerShell

## ⚡ Instalação Rápida

### 1️⃣ Instalar Dependências do Backend

```bash
cd backend
npm install
```

### 2️⃣ Instalar Dependências do Frontend

```bash
cd frontend
npm install
```

## 🎬 Executar o Sistema

### Opção 1: Executar Manualmente (2 Terminais)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Aguarde aparecer: `🚀 Servidor rodando na porta: 3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Aguarde aparecer: `Local: http://localhost:5173`

### Opção 2: Script Único (Windows)

Crie um arquivo `start.bat` na raiz do projeto:

```batch
@echo off
echo Iniciando Sistema Fiscal...
start cmd /k "cd backend && npm run dev"
timeout /t 3
start cmd /k "cd frontend && npm run dev"
echo Sistema iniciado!
```

Execute:
```bash
start.bat
```

### Opção 3: Script PowerShell

Crie um arquivo `start.ps1`:

```powershell
Write-Host "Iniciando Sistema Fiscal..." -ForegroundColor Green

# Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Aguardar 3 segundos
Start-Sleep -Seconds 3

# Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Sistema iniciado!" -ForegroundColor Green
```

Execute:
```powershell
.\start.ps1
```

## 🌐 Acessar o Sistema

Após iniciar, abra seu navegador em:

**Frontend:** http://localhost:5173

**API Backend:** http://localhost:3001/health

## ✅ Testar se Está Funcionando

1. **Abra** http://localhost:5173 no navegador
2. **Clique** em "Nova Obrigação"
3. **Preencha** os dados:
   - Título: "Teste DARF"
   - Data: Escolha uma data
   - Tipo: Federal
4. **Clique** em "Criar Obrigação"
5. **Veja** a obrigação aparecer no calendário! 🎉

## 🔧 Problemas Comuns

### Porta em Uso

Se aparecer erro de porta ocupada:

**Backend (porta 3001):**
```bash
# Windows PowerShell
netstat -ano | findstr :3001
taskkill /PID [número_do_pid] /F
```

**Frontend (porta 5173):**
```bash
# Windows PowerShell
netstat -ano | findstr :5173
taskkill /PID [número_do_pid] /F
```

### Erro de Módulos

Se aparecer erro de módulos não encontrados:

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Banco de Dados

O banco SQLite é criado automaticamente em:
```
backend/database/fiscal.db
```

Para resetar o banco, apenas delete este arquivo e reinicie o backend.

## 🎯 Próximos Passos

Agora que o sistema está funcionando:

1. ✅ **Crie obrigações** fiscais
2. ✅ **Arraste e solte** no calendário para mudar datas
3. ✅ **Configure recorrências** mensais, trimestrais, etc
4. ✅ **Use os filtros** para organizar por cliente/empresa
5. ✅ **Abra em múltiplas abas** para testar colaboração em tempo real!

## 📚 Documentação Completa

Para mais detalhes, consulte o [README.md](README.md)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique se Node.js 18+ está instalado: `node --version`
2. Verifique se as portas 3001 e 5173 estão livres
3. Verifique os logs no terminal para erros específicos
4. Tente reinstalar as dependências

---

**Desenvolvido com ❤️ para facilitar a gestão fiscal**

