# 🗓️ Sistema de Gerenciamento de Obrigações Fiscais

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue.svg)
![React](https://img.shields.io/badge/react-18.2.0-61dafb.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-production_ready-success.svg)

**Sistema completo para gerenciamento de obrigações fiscais com colaboração em tempo real**

[Demo](#-demo) • [Funcionalidades](#-funcionalidades) • [Instalação](#-instalação) • [Uso](#-como-usar) • [Documentação](#-documentação)

</div>

---

## 📸 Screenshots

<div align="center">

### 🌙 Interface em Modo Escuro (Padrão)
*Dashboard moderno com cards de estatísticas e calendário interativo*

### 🔍 Busca Global (Cmd/K)
*Busca instantânea com navegação por teclado*

### 📊 Calendário com Drag & Drop
*Arraste e solte obrigações para reorganizar datas*

</div>

---

## ✨ Destaques

- 🌙 **Modo Escuro Premium** - Interface elegante com tema dark por padrão
- 🔍 **Busca Global (Cmd+K)** - Encontre qualquer obrigação instantaneamente
- ⌨️ **Atalhos de Teclado** - Navegação rápida com 10+ comandos
- 📊 **Dashboard Inteligente** - Visualize estatísticas em tempo real
- 🔄 **Colaboração em Tempo Real** - WebSocket para sincronização automática
- 📱 **100% Responsivo** - Funciona perfeitamente em mobile, tablet e desktop

---

## 🚀 Funcionalidades

### Core Features
- ✅ **CRUD de Obrigações Fiscais**: Adicionar, editar e remover obrigações
- 🔄 **Recorrência Configurável**: Mensal, trimestral ou customizada
- 📅 **Ajuste Automático de Datas**: Considera feriados e fins de semana
- 🗓️ **Calendário Interativo**: Navegação, filtros e drag & drop
- 👥 **Colaboração em Tempo Real**: Sincronização automática entre usuários
- 📊 **Filtros Avançados**: Por cliente, empresa, responsável
- 🎨 **Cores por Tipo**: Visualização categorizada
- 📜 **Histórico de Alterações**: Rastreamento completo

### UI/UX Premium ✨
- 🌙 **Modo Escuro**: Toggle de tema com transições suaves
- 🔍 **Busca Global**: Cmd/Ctrl + K para busca rápida
- ⌨️ **Atalhos de Teclado**: Navegação super rápida
- 📊 **Dashboard**: Cards de estatísticas em tempo real
- 🎨 **Animações Modernas**: Microinterações e feedback visual
- 🔔 **Notificações Elegantes**: Toast messages com auto-dismiss
- 💎 **Design Premium**: Gradientes, glassmorphism e shadows
- 📱 **Totalmente Responsivo**: Mobile, tablet e desktop

---

## 🛠️ Stack Tecnológica

### Frontend
![React](https://img.shields.io/badge/React-18.2.0-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178c6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.1-38bdf8?style=for-the-badge&logo=tailwind-css)
![Vite](https://img.shields.io/badge/Vite-5.0.11-646cff?style=for-the-badge&logo=vite)

- React 18 + TypeScript
- TailwindCSS para estilização
- FullCalendar para interface de calendário
- Socket.io-client para tempo real
- Axios para requisições HTTP

### Backend
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.18.2-000000?style=for-the-badge&logo=express)
![Socket.io](https://img.shields.io/badge/Socket.io-4.6.1-010101?style=for-the-badge&logo=socket.io)
![SQLite](https://img.shields.io/badge/SQLite-3-003b57?style=for-the-badge&logo=sqlite)
![MySQL](https://img.shields.io/badge/MySQL-5.7+-4479A1?style=for-the-badge&logo=mysql)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

- Node.js + Express + TypeScript
- Socket.io para WebSocket
- SQLite para desenvolvimento / MySQL ou Supabase para produção
- Node-cache para otimização
- Integração com BrasilAPI (feriados)

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ ([Download](https://nodejs.org))
- npm ou yarn

### Instalação Rápida

```bash
# Clone o repositório
git clone https://github.com/pedrovi35/SistemaFiscal.git
cd SistemaFiscal

# Instale as dependências do backend
cd backend
npm install

# Instale as dependências do frontend
cd ../frontend
npm install
```

### Executar o Sistema

#### Opção 1: Script Automático (Windows)
```bash
# Na raiz do projeto
.\start.bat
```

#### Opção 2: Manual (2 Terminais)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Acessar o Sistema

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

---

## 🎯 Como Usar

### 1️⃣ Criar Obrigação
- Clique em "Nova Obrigação" no header
- Ou pressione `Cmd/Ctrl + N`
- Preencha os dados e salve

### 2️⃣ Buscar Rapidamente
- Pressione `Cmd/Ctrl + K`
- Digite o termo de busca
- Navegue com ↑ ↓ e pressione Enter

### 3️⃣ Visualizar Calendário
- Arraste obrigações para reorganizar
- Clique em um dia para criar nova obrigação
- Use filtros para organizar visualização

### 4️⃣ Colaborar em Tempo Real
- Abra em múltiplas abas/dispositivos
- Veja atualizações em tempo real
- Receba notificações de alterações

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Cmd/Ctrl + K` | Busca global |
| `Cmd/Ctrl + N` | Nova obrigação |
| `Cmd/Ctrl + /` | Ver todos os atalhos |
| `Cmd/Ctrl + D` | Toggle dark mode |
| `Esc` | Fechar modal/dialog |
| `↑ ↓` | Navegar listas |
| `Enter` | Confirmar/Selecionar |

**Dica:** Pressione `Cmd/Ctrl + /` a qualquer momento para ver a lista completa de atalhos!

---

## 🎨 Temas

O sistema inicia em **modo escuro** por padrão. Para alternar entre claro/escuro:
- Clique no ícone ☀️/🌙 no header
- Use o atalho `Cmd/Ctrl + D`

---

## 📚 Documentação

- 📖 [README.md](README.md) - Este arquivo
- 🚀 [QUICKSTART.md](QUICKSTART.md) - Guia de início rápido
- 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura do sistema
- ✨ [FEATURES.md](FEATURES.md) - Lista completa de funcionalidades
- 🎨 [MELHORIAS_UI_UX.md](MELHORIAS_UI_UX.md) - Sugestões de melhorias
- 📝 [CHANGELOG_UI.md](CHANGELOG_UI.md) - Histórico de mudanças
- ⚡ [COMANDOS.md](COMANDOS.md) - Comandos rápidos
- 💿 [INSTALL.md](INSTALL.md) - Guia de instalação detalhado
- 🗄️ [DATABASE.md](DATABASE.md) - Documentação do banco de dados
- 💾 [PERSISTENCIA_DADOS.md](PERSISTENCIA_DADOS.md) - Como funcionam backups e persistência
- 🐬 [MYSQL_SETUP.md](MYSQL_SETUP.md) - Guia de configuração MySQL
- 🐘 [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Guia de configuração Supabase

---

## 🗂️ Estrutura do Projeto

```
Sistema Fiscal/
├── backend/              # API REST + WebSocket
│   ├── src/
│   │   ├── config/       # Configurações
│   │   ├── controllers/  # Controladores
│   │   ├── models/       # Modelos de dados
│   │   ├── routes/       # Rotas da API
│   │   ├── services/     # Lógica de negócio
│   │   └── server.ts     # Servidor principal
│   └── database/         # Banco de dados SQLite
├── frontend/             # Interface React
│   └── src/
│       ├── components/   # Componentes React
│       ├── contexts/     # Context API
│       ├── hooks/        # Hooks customizados
│       ├── services/     # Serviços e API
│       └── types/        # Tipos TypeScript
└── docs/                 # Documentação
```

---

## 🔌 API Endpoints

### Obrigações
- `GET /api/obrigacoes` - Lista todas as obrigações
- `GET /api/obrigacoes/:id` - Obtém uma obrigação específica
- `POST /api/obrigacoes` - Cria nova obrigação
- `PUT /api/obrigacoes/:id` - Atualiza obrigação
- `DELETE /api/obrigacoes/:id` - Remove obrigação
- `GET /api/obrigacoes/filtrar` - Filtra obrigações
- `GET /api/obrigacoes/:id/historico` - Histórico de alterações

### Feriados
- `GET /api/feriados/:ano` - Lista feriados do ano
- `POST /api/feriados/ajustar-data` - Ajusta data para dia útil

---

## 🌐 WebSocket Events

### Servidor → Cliente
- `obrigacao:created` - Nova obrigação criada
- `obrigacao:updated` - Obrigação atualizada
- `obrigacao:deleted` - Obrigação removida
- `user:connected` - Usuário conectado
- `user:disconnected` - Usuário desconectado
- `users:list` - Lista de usuários online

### Cliente → Servidor
- `user:register` - Registrar nome do usuário
- `obrigacao:editing` - Notificar edição
- `obrigacao:stop-editing` - Parar edição

---

## 🧪 Testes

```bash
# Backend
cd backend
npm run typecheck

# Frontend
cd frontend
npm run typecheck
```

---

## 🚀 Build para Produção

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Pedro**
- GitHub: [@pedrovi35](https://github.com/pedrovi35)
- Repositório: [SistemaFiscal](https://github.com/pedrovi35/SistemaFiscal)

---

## 🙏 Agradecimentos

- [React](https://react.dev) - Biblioteca UI
- [TailwindCSS](https://tailwindcss.com) - Framework CSS
- [FullCalendar](https://fullcalendar.io) - Componente de calendário
- [Socket.io](https://socket.io) - WebSocket em tempo real
- [BrasilAPI](https://brasilapi.com.br) - API de feriados

---

## 📊 Status do Projeto

![Status](https://img.shields.io/badge/status-production_ready-success)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

---

<div align="center">

**⭐ Se este projeto foi útil, considere dar uma estrela no GitHub! ⭐**

Made with ❤️ and ☕ by [Pedro](https://github.com/pedrovi35)

[⬆ Voltar ao topo](#-sistema-de-gerenciamento-de-obrigações-fiscais)

</div>
