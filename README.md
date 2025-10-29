# Sistema de Gerenciamento de Obrigações Fiscais

Sistema completo para gerenciamento de obrigações fiscais com colaboração em tempo real.

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

## 🛠️ Stack Tecnológica

### Frontend
- React 18 + TypeScript
- TailwindCSS para estilização
- FullCalendar para interface de calendário
- Socket.io-client para tempo real
- Axios para requisições HTTP

### Backend
- Node.js + Express + TypeScript
- Socket.io para WebSocket
- SQLite para persistência
- Node-cache para otimização
- Integração com API de feriados

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Backend

```bash
cd backend
npm install
npm run dev
```

O servidor iniciará em `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

A aplicação iniciará em `http://localhost:5173`

## 🎯 Como Usar

1. **Adicionar Obrigação**: Clique em "Nova Obrigação" ou clique em um dia no calendário
2. **Editar Obrigação**: Clique em uma obrigação existente no calendário
3. **Arrastar Obrigação**: Arraste e solte para mudar a data
4. **Filtrar**: Use os filtros no topo para visualizar por cliente/responsável
5. **Navegar**: Use as setas para navegar entre meses
6. **Colaboração**: Múltiplos usuários podem editar simultaneamente

## 📋 Tipos de Recorrência

- **Mensal**: Repetição a cada mês
- **Bimestral**: A cada 2 meses
- **Trimestral**: A cada 3 meses
- **Semestral**: A cada 6 meses
- **Anual**: A cada ano
- **Customizada**: Defina intervalos personalizados

## 🏗️ Estrutura do Projeto

```
Sistema Fiscal/
├── backend/          # API REST + WebSocket
│   ├── src/
│   │   ├── config/   # Configurações
│   │   ├── controllers/ # Controladores
│   │   ├── models/   # Modelos de dados
│   │   ├── routes/   # Rotas da API
│   │   ├── services/ # Lógica de negócio
│   │   └── server.ts # Servidor principal
│   └── database/     # Banco de dados SQLite
├── frontend/         # Interface React
│   └── src/
│       ├── components/ # Componentes React
│       ├── services/   # Serviços e API
│       └── types/      # Tipos TypeScript
└── README.md
```

## 🔧 Configuração

### Variáveis de Ambiente (Backend)

Crie um arquivo `.env` na pasta `backend`:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## 📝 API Endpoints

### Obrigações
- `GET /api/obrigacoes` - Lista todas as obrigações
- `GET /api/obrigacoes/:id` - Obtém uma obrigação específica
- `POST /api/obrigacoes` - Cria nova obrigação
- `PUT /api/obrigacoes/:id` - Atualiza obrigação
- `DELETE /api/obrigacoes/:id` - Remove obrigação

### Filtros
- `GET /api/obrigacoes/filtrar?cliente=X&responsavel=Y&mes=MM&ano=YYYY`

### Feriados
- `GET /api/feriados/:ano` - Lista feriados do ano

## 🌐 WebSocket Events

- `obrigacao:created` - Nova obrigação criada
- `obrigacao:updated` - Obrigação atualizada
- `obrigacao:deleted` - Obrigação removida
- `user:connected` - Usuário conectado
- `user:disconnected` - Usuário desconectado

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

## 🎨 Temas

O sistema inicia em **modo escuro** por padrão. Para alternar entre claro/escuro:
- Clique no ícone ☀️/🌙 no header
- Use o atalho `Cmd/Ctrl + D`

## 📄 Licença

MIT

## 👨‍💻 Desenvolvimento

```bash
# Backend (modo desenvolvimento)
cd backend
npm run dev

# Frontend (modo desenvolvimento)
cd frontend
npm run dev

# Build para produção
npm run build
```

---

Desenvolvido com ❤️ para gestão fiscal eficiente

