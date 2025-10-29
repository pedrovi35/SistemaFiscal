# 🏗️ Arquitetura do Sistema

## 📐 Visão Geral

O Sistema de Obrigações Fiscais segue uma arquitetura **cliente-servidor** com comunicação **RESTful** e **WebSocket** para tempo real.

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   React    │  │ TailwindCSS  │  │ FullCalendar │       │
│  │ TypeScript │  │              │  │              │       │
│  └────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
│  ┌──────────────────────────────────────────────┐         │
│  │         Components & Services                │         │
│  │  - CalendarioFiscal                          │         │
│  │  - ObrigacaoModal                            │         │
│  │  - FiltrosPanel                              │         │
│  │  - API Service (Axios)                       │         │
│  │  - Socket Service (Socket.io-client)         │         │
│  └──────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST + WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                             │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Express   │  │  Socket.io   │  │   SQLite     │       │
│  │ TypeScript │  │              │  │              │       │
│  └────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
│  ┌──────────────────────────────────────────────┐         │
│  │            Camadas da Aplicação              │         │
│  │                                              │         │
│  │  ┌────────────────────────────────────┐    │         │
│  │  │         Routes (Rotas)              │    │         │
│  │  │  - /api/obrigacoes                  │    │         │
│  │  │  - /api/feriados                    │    │         │
│  │  └────────────────────────────────────┘    │         │
│  │                    │                        │         │
│  │  ┌────────────────────────────────────┐    │         │
│  │  │      Controllers (Lógica)          │    │         │
│  │  │  - ObrigacaoController              │    │         │
│  │  │  - FeriadoController                │    │         │
│  │  └────────────────────────────────────┘    │         │
│  │                    │                        │         │
│  │  ┌────────────────────────────────────┐    │         │
│  │  │    Services (Regras de Negócio)    │    │         │
│  │  │  - RecorrenciaService               │    │         │
│  │  │  - FeriadoService                   │    │         │
│  │  └────────────────────────────────────┘    │         │
│  │                    │                        │         │
│  │  ┌────────────────────────────────────┐    │         │
│  │  │      Models (Acesso a Dados)       │    │         │
│  │  │  - ObrigacaoModel                   │    │         │
│  │  │  - Database                         │    │         │
│  │  └────────────────────────────────────┘    │         │
│  └──────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │   BrasilAPI     │
                   │   (Feriados)    │
                   └─────────────────┘
```

## 🎯 Padrões Arquiteturais

### Backend: MVC + Services

**Model-View-Controller** adaptado com camada de serviços:

1. **Routes**: Define endpoints da API
2. **Controllers**: Processa requests/responses HTTP
3. **Services**: Contém lógica de negócio complexa
4. **Models**: Acesso e manipulação de dados

### Frontend: Component-Based

**Arquitetura de Componentes React**:

1. **Components**: UI reutilizável
2. **Services**: Comunicação com backend
3. **Types**: Definições TypeScript compartilhadas
4. **Hooks**: Lógica de estado e efeitos

## 📦 Estrutura de Diretórios

### Backend
```
backend/
├── src/
│   ├── config/           # Configurações (DB, etc)
│   │   └── database.ts
│   ├── controllers/      # Controllers HTTP
│   │   ├── obrigacaoController.ts
│   │   └── feriadoController.ts
│   ├── models/           # Models de dados
│   │   └── obrigacaoModel.ts
│   ├── routes/           # Definição de rotas
│   │   └── index.ts
│   ├── services/         # Lógica de negócio
│   │   ├── feriadoService.ts
│   │   └── recorrenciaService.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   └── server.ts         # Entry point
├── database/             # SQLite database
│   └── fiscal.db
├── package.json
└── tsconfig.json
```

### Frontend
```
frontend/
├── src/
│   ├── components/       # Componentes React
│   │   ├── CalendarioFiscal.tsx
│   │   ├── ObrigacaoModal.tsx
│   │   ├── FiltrosPanel.tsx
│   │   ├── NotificacaoRealTime.tsx
│   │   └── UsuariosOnline.tsx
│   ├── services/         # Serviços API
│   │   ├── api.ts
│   │   └── socket.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── App.tsx           # Componente raiz
│   ├── main.tsx          # Entry point
│   └── index.css         # Estilos globais
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🔄 Fluxo de Dados

### 1. Criação de Obrigação

```
┌──────────┐   1. Evento    ┌──────────────┐
│ Frontend │ ─────────────> │ ObrigacaoModal│
└──────────┘                └──────────────┘
                                    │
                             2. onSave()
                                    │
                                    ▼
                            ┌──────────────┐
                            │   App.tsx    │
                            └──────────────┘
                                    │
                             3. API Call
                                    │
                                    ▼
                            ┌──────────────┐
                            │ api.ts       │
                            │ (Axios POST) │
                            └──────────────┘
                                    │
                             4. HTTP POST
                                    │
                                    ▼
┌──────────┐                ┌──────────────┐
│ Backend  │ <───────────── │ Express      │
└──────────┘   5. Route     └──────────────┘
     │
     │ 6. Controller
     ▼
┌──────────────────┐
│ obrigacaoController│
└──────────────────┘
     │
     │ 7. Validação + Service
     ▼
┌──────────────────┐
│ feriadoService   │ (ajustar data)
│ recorrenciaService│ (validar)
└──────────────────┘
     │
     │ 8. Model
     ▼
┌──────────────────┐
│ obrigacaoModel   │
│ .criar()         │
└──────────────────┘
     │
     │ 9. SQL INSERT
     ▼
┌──────────────────┐
│ SQLite DB        │
└──────────────────┘
     │
     │ 10. Return
     ▼
┌──────────────────┐
│ Controller       │
└──────────────────┘
     │
     │ 11. Emit Socket
     ▼
┌──────────────────┐
│ Socket.io        │ ───┐
└──────────────────┘    │
                        │ 12. Broadcast
                        ▼
              ┌──────────────────┐
              │ Todos os Clientes│
              │ Conectados       │
              └──────────────────┘
                        │
                        │ 13. Update UI
                        ▼
              ┌──────────────────┐
              │ Frontend         │
              │ (Auto refresh)   │
              └──────────────────┘
```

### 2. Colaboração em Tempo Real

```
Cliente A                 Servidor              Cliente B
    │                         │                     │
    │ 1. Conecta WebSocket    │                     │
    │ ───────────────────────>│                     │
    │                         │                     │
    │                         │ 2. Conecta          │
    │                         │<────────────────────│
    │                         │                     │
    │                         │ 3. Broadcast        │
    │<────────────────────────│────────────────────>│
    │   "user:connected"      │                     │
    │                         │                     │
    │ 4. Cria Obrigação      │                     │
    │ ───────────────────────>│                     │
    │     HTTP POST           │                     │
    │                         │                     │
    │                         │ 5. Salva no DB      │
    │                         │ + Emit Socket       │
    │                         │                     │
    │<────────────────────────│────────────────────>│
    │ 6. "obrigacao:created"  │                     │
    │    (Todos recebem)      │                     │
    │                         │                     │
    │ 7. Atualiza UI         │ 8. Atualiza UI      │
    │                         │                     │
```

## 🔌 APIs e Integrações

### API REST (Express)

**Base URL**: `http://localhost:3001/api`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/obrigacoes` | Lista todas |
| GET | `/obrigacoes/:id` | Busca por ID |
| GET | `/obrigacoes/filtrar` | Filtra com query params |
| POST | `/obrigacoes` | Cria nova |
| PUT | `/obrigacoes/:id` | Atualiza |
| DELETE | `/obrigacoes/:id` | Remove |
| GET | `/obrigacoes/:id/historico` | Histórico |
| POST | `/obrigacoes/:id/gerar-proxima` | Gera próxima recorrência |
| GET | `/feriados/:ano` | Lista feriados |
| POST | `/feriados/ajustar-data` | Ajusta data |

### WebSocket (Socket.io)

**URL**: `ws://localhost:3001`

**Eventos do Servidor → Cliente:**
- `obrigacao:created`
- `obrigacao:updated`
- `obrigacao:deleted`
- `user:connected`
- `user:disconnected`
- `users:list`
- `obrigacao:being-edited`
- `obrigacao:editing-stopped`

**Eventos do Cliente → Servidor:**
- `user:register`
- `obrigacao:editing`
- `obrigacao:stop-editing`
- `obrigacao:change`

### API Externa

**BrasilAPI** - Feriados Nacionais
- URL: `https://brasilapi.com.br/api/feriados/v1/{ano}`
- Cache: 24 horas
- Fallback: Banco de dados local

## 💾 Modelo de Dados

### Tabela: obrigacoes
```sql
CREATE TABLE obrigacoes (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  dataVencimento TEXT NOT NULL,
  dataVencimentoOriginal TEXT NOT NULL,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL,
  cliente TEXT,
  empresa TEXT,
  responsavel TEXT,
  ajusteDataUtil INTEGER NOT NULL DEFAULT 1,
  cor TEXT,
  criadoEm TEXT NOT NULL,
  atualizadoEm TEXT NOT NULL,
  criadoPor TEXT
)
```

### Tabela: recorrencias
```sql
CREATE TABLE recorrencias (
  obrigacaoId TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  intervalo INTEGER,
  diaDoMes INTEGER,
  dataFim TEXT,
  proximaOcorrencia TEXT,
  FOREIGN KEY (obrigacaoId) REFERENCES obrigacoes(id)
)
```

### Tabela: historico
```sql
CREATE TABLE historico (
  id TEXT PRIMARY KEY,
  obrigacaoId TEXT NOT NULL,
  usuario TEXT NOT NULL,
  tipo TEXT NOT NULL,
  camposAlterados TEXT,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (obrigacaoId) REFERENCES obrigacoes(id)
)
```

### Tabela: feriados
```sql
CREATE TABLE feriados (
  data TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL
)
```

## 🔐 Segurança

### Backend
- ✅ CORS configurado para frontend específico
- ✅ Validação de entrada em todos os endpoints
- ✅ Prepared statements (SQL injection protection)
- ✅ Error handling centralizado
- ✅ Logs estruturados

### Frontend
- ✅ Type safety com TypeScript
- ✅ Sanitização de dados antes de envio
- ✅ Validação de formulários
- ✅ Tratamento de erros de API

### Melhorias Futuras
- 🔄 Autenticação JWT
- 🔄 Rate limiting
- 🔄 HTTPS obrigatório
- 🔄 Criptografia de dados sensíveis

## 🚀 Performance

### Backend
- ✅ Índices no banco de dados
- ✅ Cache de feriados (NodeCache)
- ✅ Queries otimizadas
- ✅ Connection pooling (SQLite)

### Frontend
- ✅ Code splitting com Vite
- ✅ Lazy loading de componentes
- ✅ Debounce em filtros
- ✅ Memoização de componentes pesados

### WebSocket
- ✅ Reconnection automática
- ✅ Heartbeat para manter conexão
- ✅ Broadcast eficiente (rooms)

## 📊 Monitoramento

### Logs
- ✅ Conexões/desconexões
- ✅ Erros capturados
- ✅ Operações CRUD
- ✅ Performance de queries

### Health Check
- Endpoint: `GET /health`
- Retorna status do servidor e timestamp

---

Esta arquitetura foi projetada para ser:
- ✅ **Escalável**: Fácil adicionar novos recursos
- ✅ **Manutenível**: Código organizado e limpo
- ✅ **Testável**: Camadas desacopladas
- ✅ **Performática**: Otimizações em todas as camadas

