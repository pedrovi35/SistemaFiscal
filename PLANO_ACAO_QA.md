# 📋 PLANO DE AÇÃO - CORREÇÕES E MELHORIAS
## Sistema Fiscal - QA Report

---

## 🎯 PRIORIDADE IMEDIATA (Hoje)

### 1. Configurar Ambiente de Desenvolvimento

#### Backend
```bash
# 1. Criar arquivo .env
cd backend
cp ENV_TEMPLATE.txt .env

# 2. Editar .env com suas credenciais
# Abra o arquivo .env e configure:
# - DATABASE_URL (Supabase Connection String)
# - PORT (padrão: 3001)
# - NODE_ENV (development)
# - CORS_ORIGIN (http://localhost:5173)
```

#### Frontend
```bash
# 1. Criar arquivo .env
cd frontend
cp ENV_TEMPLATE.txt .env

# 2. Editar .env com URLs
# Abra o arquivo .env e configure:
# - VITE_API_URL=http://localhost:3001
# - VITE_SOCKET_URL=http://localhost:3001
```

### 2. Resolver Política de Execução PowerShell

```powershell
# Execute como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Verifique
Get-ExecutionPolicy
# Deve retornar: RemoteSigned
```

### 3. Commit de Arquivos Pendentes

```bash
# Adicionar novo componente
git add frontend/src/components/ObrigacoesDoDia.tsx

# Adicionar alterações no calendário
git add frontend/src/components/CalendarioFiscal.tsx

# Commit
git commit -m "feat: Adiciona componente ObrigacoesDoDia e atualiza CalendarioFiscal

- Adiciona modal para visualizar obrigações do dia
- Melhora interação com calendário
- Adiciona opção de criar obrigação em data específica"
```

---

## 🔧 SEMANA 1 (Próximos 7 dias)

### Dia 1-2: Testes e Validação

#### Instalar e Configurar Testes

**Backend:**
```bash
cd backend

# Instalar Jest e dependências
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest

# Criar configuração Jest
npx ts-jest config:init

# Criar pasta de testes
mkdir -p src/__tests__
```

**Criar arquivo de teste básico:** `backend/src/__tests__/obrigacao.test.ts`
```typescript
import request from 'supertest';
import { app } from '../server';

describe('Obrigações API', () => {
  it('GET /api/obrigacoes deve retornar lista', async () => {
    const response = await request(app).get('/api/obrigacoes');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('POST /api/obrigacoes deve criar obrigação', async () => {
    const novaObrigacao = {
      titulo: 'Teste QA',
      dataVencimento: '2025-12-31',
      tipo: 'FEDERAL',
      status: 'PENDENTE',
      ajusteDataUtil: false
    };
    
    const response = await request(app)
      .post('/api/obrigacoes')
      .send(novaObrigacao);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

**Frontend:**
```bash
cd frontend

# Instalar Vitest e dependências
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom

# Adicionar script no package.json
# "test": "vitest",
# "test:ui": "vitest --ui"
```

**Criar configuração Vitest:** `frontend/vite.config.ts` (adicionar)
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

### Dia 3-4: Melhorias de Logging

#### Implementar Winston no Backend

```bash
cd backend
npm install winston winston-daily-rotate-file
```

**Criar:** `backend/src/config/logger.ts`
```typescript
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

export default logger;
```

**Substituir console.log por logger:**
```typescript
// Antes
console.log('✅ Conectado ao PostgreSQL');

// Depois
import logger from './config/logger';
logger.info('✅ Conectado ao PostgreSQL');
```

### Dia 5-7: Conectar Clientes Mockados

#### Atualizar App.tsx

```typescript
// Remover mockClientes
// const mockClientes: Cliente[] = [...]

// Adicionar carregamento real
const [clientes, setClientes] = useState<Cliente[]>([]);

const carregarClientes = async () => {
  try {
    const response = await api.get('/clientes');
    setClientes(response.data);
  } catch (error) {
    console.error('Erro ao carregar clientes:', error);
  }
};

useEffect(() => {
  carregarClientes();
}, []);
```

---

## 🚀 SEMANA 2 (Dias 8-14)

### Autenticação Básica

#### Backend - JWT

```bash
cd backend
npm install jsonwebtoken bcryptjs
npm install --save-dev @types/jsonwebtoken @types/bcryptjs
```

**Criar:** `backend/src/middleware/auth.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ erro: 'Token inválido' });
  }
};
```

**Criar rotas de autenticação:**
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

#### Frontend - Context de Autenticação

**Criar:** `frontend/src/contexts/AuthContext.tsx`
```typescript
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Implementação...
  
  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};
```

---

## 📊 SEMANA 3 (Dias 15-21)

### CI/CD Pipeline

#### GitHub Actions

**Criar:** `.github/workflows/ci.yml`
```yaml
name: CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm run typecheck
      - run: cd backend && npm test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm run typecheck
      - run: cd frontend && npm test

  deploy-backend:
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}

  deploy-frontend:
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        run: |
          # Vercel auto-deploys via GitHub integration
          echo "Frontend deployed via Vercel integration"
```

### Monitoramento

#### Sentry

```bash
# Backend
cd backend
npm install @sentry/node @sentry/tracing

# Frontend
cd frontend
npm install @sentry/react @sentry/tracing
```

**Backend:** `backend/src/config/sentry.ts`
```typescript
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { Express } from 'express';

export const initSentry = (app: Express) => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
};
```

---

## 🔐 SEMANA 4 (Dias 22-28)

### Segurança Avançada

#### 1. Auditoria de Segurança

```bash
# Verificar vulnerabilidades
cd backend && npm audit
cd frontend && npm audit

# Corrigir automaticamente
npm audit fix

# Se houver vulnerabilidades críticas
npm audit fix --force
```

#### 2. Implementar Validação de Input

```bash
cd backend
npm install joi
npm install --save-dev @types/joi
```

**Criar:** `backend/src/validators/obrigacao.validator.ts`
```typescript
import Joi from 'joi';

export const criarObrigacaoSchema = Joi.object({
  titulo: Joi.string().required().min(3).max(200),
  descricao: Joi.string().optional().max(1000),
  dataVencimento: Joi.date().required(),
  tipo: Joi.string().required().valid('FEDERAL', 'ESTADUAL', 'MUNICIPAL', 'TRABALHISTA', 'PREVIDENCIARIA', 'OUTRO'),
  status: Joi.string().required().valid('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'ATRASADA', 'CANCELADA'),
  cliente: Joi.string().optional(),
  empresa: Joi.string().optional(),
  responsavel: Joi.string().optional(),
  ajusteDataUtil: Joi.boolean().default(false),
});
```

#### 3. Rate Limiting por Usuário

```bash
cd backend
npm install express-rate-limit redis
npm install --save-dev @types/redis
```

---

## 📱 TESTES ADICIONAIS

### Teste de Responsividade

```bash
# Instalar ferramentas de teste
npm install -g @playwright/test

# Inicializar Playwright
npx playwright install
```

**Criar:** `e2e/responsive.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1920, height: 1080 },
];

viewports.forEach(({ name, width, height }) => {
  test(`Layout responsivo - ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('http://localhost:5173');
    
    // Verificar se elementos principais estão visíveis
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    
    // Tirar screenshot
    await page.screenshot({ path: `screenshots/${name}.png` });
  });
});
```

### Teste de Performance

```bash
# Instalar Lighthouse CI
npm install -g @lhci/cli

# Criar configuração
```

**Criar:** `lighthouserc.json`
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:5173"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["warn", {"minScore": 0.9}],
        "categories:seo": ["warn", {"minScore": 0.8}]
      }
    }
  }
}
```

---

## 🎨 MELHORIAS DE UX

### Implementar Loading States

**Criar:** `frontend/src/components/ObrigacaoSkeleton.tsx`
```typescript
export const ObrigacaoSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
  </div>
);
```

### Adicionar Toast Messages Melhoradas

```bash
cd frontend
npm install react-hot-toast
```

**Atualizar notificações:**
```typescript
import toast from 'react-hot-toast';

// Uso
toast.success('✓ Obrigação criada!');
toast.error('✗ Erro ao salvar');
toast.loading('Carregando...');
```

---

## 📈 MÉTRICAS E MONITORAMENTO

### Google Analytics

```bash
cd frontend
npm install react-ga4
```

**Configurar:** `frontend/src/analytics.ts`
```typescript
import ReactGA from 'react-ga4';

export const initAnalytics = () => {
  ReactGA.initialize(import.meta.env.VITE_GA_TRACKING_ID);
};

export const trackPageView = (path: string) => {
  ReactGA.send({ hitType: 'pageview', page: path });
};

export const trackEvent = (category: string, action: string, label?: string) => {
  ReactGA.event({ category, action, label });
};
```

---

## ✅ CHECKLIST DE CONCLUSÃO

### Antes de Deploy para Produção

- [ ] Todos os testes passando
- [ ] Auditoria de segurança sem vulnerabilidades críticas
- [ ] Variáveis de ambiente configuradas
- [ ] .env no .gitignore
- [ ] Logs estruturados implementados
- [ ] Monitoramento configurado (Sentry)
- [ ] CI/CD pipeline funcionando
- [ ] Testes de carga executados
- [ ] Backups configurados
- [ ] Documentação atualizada
- [ ] Performance testada (Lighthouse > 90)
- [ ] Acessibilidade verificada
- [ ] Mobile testado
- [ ] HTTPS configurado
- [ ] Rate limiting ativo
- [ ] Autenticação implementada (se necessário)

---

## 🆘 SUPORTE E RECURSOS

### Links Úteis

- **TypeScript:** https://www.typescriptlang.org/docs/
- **React:** https://react.dev/
- **Express:** https://expressjs.com/
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Supabase:** https://supabase.com/docs
- **Render:** https://render.com/docs
- **Vercel:** https://vercel.com/docs

### Comandos Rápidos

```bash
# Backend
cd backend
npm run dev          # Desenvolvimento
npm run build        # Build
npm start            # Produção
npm run typecheck    # Verificar tipos

# Frontend
cd frontend
npm run dev          # Desenvolvimento
npm run build        # Build
npm run preview      # Preview do build
npm run typecheck    # Verificar tipos

# Testes
npm test             # Executar testes
npm run test:watch   # Testes em watch mode
npm run test:coverage # Cobertura de testes
```

---

**Última Atualização:** 07/11/2025  
**Próxima Revisão:** 14/11/2025


