# 💾 Como Funciona a Persistência de Dados

Este documento explica **como o sistema salva e recupera os dados** das obrigações fiscais.

---

## ✅ **SIM! Os dados são salvos permanentemente**

Quando você **cria, edita ou exclui** uma obrigação no sistema, **todas as alterações são salvas no banco de dados** e ficam disponíveis permanentemente.

---

## 🔄 Fluxo de Dados

### 1. **Quando o Usuário CRIA uma Obrigação**

```
┌─────────────────┐
│  Frontend       │ → Usuário preenche o formulário
│  (Formulário)   │ → Clica em "Salvar"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Backend    │ → Recebe os dados (POST /api/obrigacoes)
│  Controller     │ → Valida os dados
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Model          │ → Cria o registro no banco
│  (db.run)       │ → INSERT INTO obrigacoes (...)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Banco de Dados │ → Dados gravados PERMANENTEMENTE
│  (SQLite/MySQL/ │ → ✅ Salvos em disco
│   Supabase)     │
└─────────────────┘
```

**Código que faz isso:**

```typescript:backend/src/models/obrigacaoModel.ts
async criar(obrigacao: Omit<Obrigacao, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Obrigacao> {
  const id = uuidv4();
  const agora = new Date().toISOString();

  await db.run(`
    INSERT INTO obrigacoes (
      id, titulo, descricao, dataVencimento, dataVencimentoOriginal,
      tipo, status, cliente, empresa, responsavel, ajusteDataUtil,
      cor, criadoEm, atualizadoEm, criadoPor
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [...dados]);

  // ✅ Dados salvos permanentemente no banco
  return await this.buscarPorId(id);
}
```

---

### 2. **Quando o Usuário EDITA uma Obrigação**

```
┌─────────────────┐
│  Frontend       │ → Usuário edita campos
│  (Modal Edição) │ → Clica em "Atualizar"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Backend    │ → Recebe os dados (PUT /api/obrigacoes/:id)
│  Controller     │ → Valida os dados
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Model          │ → Atualiza o registro no banco
│  (db.run)       │ → UPDATE obrigacoes SET ... WHERE id = ?
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Banco de Dados │ → Dados atualizados PERMANENTEMENTE
│                 │ → ✅ Sobrescreve dados antigos
└─────────────────┘
```

**Código que faz isso:**

```typescript:backend/src/models/obrigacaoModel.ts
async atualizar(id: string, dados: Partial<Obrigacao>): Promise<Obrigacao | undefined> {
  const campos = [];
  const valores = [];
  
  // Monta a query de atualização
  for (const campo of camposPermitidos) {
    if (campo in dados) {
      campos.push(`${campo} = ?`);
      valores.push((dados as any)[campo]);
    }
  }
  
  campos.push('atualizadoEm = ?');
  valores.push(new Date().toISOString());
  valores.push(id);
  
  // ✅ Atualiza no banco permanentemente
  const query = `UPDATE obrigacoes SET ${campos.join(', ')} WHERE id = ?`;
  await db.run(query, valores);
  
  return this.buscarPorId(id);
}
```

---

### 3. **Quando o Usuário ACESSA o Site Novamente**

```
┌─────────────────┐
│  Frontend       │ → Página carrega
│  (App.tsx)      │ → Faz requisição para buscar obrigações
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Backend    │ → Recebe requisição (GET /api/obrigacoes)
│  Controller     │ → Busca todas as obrigações
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Model          │ → Busca dados do banco
│  (db.all)       │ → SELECT * FROM obrigacoes ORDER BY dataVencimento
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Banco de Dados │ → Retorna TODOS os registros salvos
│                 │ → ✅ Mesmos dados de antes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Frontend       │ → Exibe as obrigações na interface
│  (Calendário)   │ → ✅ Todas as alterações anteriores estão lá!
└─────────────────┘
```

**Código que faz isso:**

```typescript:backend/src/models/obrigacaoModel.ts
async listarTodas(): Promise<Obrigacao[]> {
  // ✅ Busca TODOS os dados salvos no banco
  const obrigacoes = await db.all('SELECT * FROM obrigacoes ORDER BY dataVencimento ASC', []);
  
  // Processa e retorna
  const resultados = [];
  for (const o of obrigacoes) {
    resultados.push(await this.mapearObrigacao(o));
  }
  return resultados;
}
```

---

## 🗂️ Onde os Dados são Salvos?

### SQLite (Desenvolvimento)

```bash
backend/database/fiscal.db
```

**Características:**
- ✅ Arquivo local no seu computador
- ✅ Persistente (não apaga ao fechar)
- ✅ Funciona offline
- ✅ Não requer servidor

### MySQL (Produção Local)

```bash
MySQL Server
Database: sistema_fiscal
```

**Características:**
- ✅ Servidor MySQL local ou remoto
- ✅ Persistente
- ✅ Suporta múltiplas conexões simultâneas
- ✅ Backup fácil

### Supabase (Produção Cloud)

```bash
https://supabase.com
Projeto: sistema_fiscal
```

**Características:**
- ✅ Hospedado na nuvem
- ✅ Persistente
- ✅ Backup automático
- ✅ Acessível de qualquer lugar
- ✅ Escalável

---

## 📊 Tabelas que Guardam os Dados

### 1. **obrigacoes** (Principal)

Guarda todas as informações das obrigações fiscais:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | TEXT/UUID | Identificador único |
| `titulo` | TEXT | Título da obrigação |
| `descricao` | TEXT | Descrição detalhada |
| `dataVencimento` | TEXT/DATE | Data de vencimento |
| `tipo` | TEXT | FEDERAL, ESTADUAL, etc. |
| `status` | TEXT | PENDENTE, CONCLUIDA, etc. |
| `cliente` | TEXT | Nome do cliente |
| `empresa` | TEXT | Nome da empresa |
| `responsavel` | TEXT | Responsável |
| `criadoEm` | TEXT/TIMESTAMP | Quando foi criado |
| `atualizadoEm` | TEXT/TIMESTAMP | Última atualização |

**⚠️ IMPORTANTE:** Todas essas informações são **salvas permanentemente**!

---

### 2. **historico** (Auditoria)

Registra **TODAS as mudanças** feitas nas obrigações:

```sql
CREATE TABLE IF NOT EXISTS historico (
    id TEXT PRIMARY KEY,
    obrigacaoId TEXT NOT NULL,
    usuario TEXT NOT NULL,
    tipo TEXT NOT NULL,  -- CREATE, UPDATE, DELETE
    camposAlterados TEXT,  -- JSON com o que mudou
    timestamp TEXT NOT NULL
);
```

**Exemplo de histórico:**

```json
{
  "id": "abc123",
  "obrigacaoId": "xyz789",
  "usuario": "João Silva",
  "tipo": "UPDATE",
  "camposAlterados": {
    "status": {
      "anterior": "PENDENTE",
      "novo": "CONCLUIDA"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔍 Como Verificar se os Dados Estão Salvos?

### 1. Via Interface do Sistema

1. Crie uma obrigação
2. Feche o navegador completamente
3. Abra novamente e acesse o site
4. **✅ A obrigação ainda estará lá!**

### 2. Via Banco de Dados Direto

#### SQLite

```bash
cd backend/database
sqlite3 fiscal.db

# Ver todas as obrigações
SELECT * FROM obrigacoes;

# Ver histórico
SELECT * FROM historico;
```

#### MySQL

```sql
USE sistema_fiscal;

-- Ver todas as obrigações
SELECT * FROM obrigacoes;

-- Ver histórico
SELECT * FROM historico_alteracoes;
```

#### Supabase

1. Acesse o [Dashboard do Supabase](https://supabase.com)
2. Vá em **Table Editor**
3. Selecione a tabela `obrigacoes`
4. **✅ Veja todos os dados salvos!**

---

## ⚠️ **Quando os Dados PODEM ser Perdidos**

Os dados só são perdidos em **situações específicas**:

### ❌ SQLite
- Deletar manualmente o arquivo `fiscal.db`
- Formatar o disco
- Backup não restaurado

### ❌ MySQL
- DROP DATABASE sistema_fiscal
- Sem backup e perda de servidor
- Delete sem WHERE

### ❌ Supabase
- Deletar o projeto
- Limpar dados manualmente
- Sem backup (Free tier: 7 dias)

**✅ Em uso normal, os dados NUNCA são perdidos!**

---

## 🔄 Real-time Sync (WebSocket)

O sistema também tem **sincronização em tempo real** via WebSocket:

```
Usuário A                    Usuário B
     │                           │
     │  Cria obrigação           │
     ├──────────────────────────>│
     │                           │ Ve instantaneamente!
     │                           │ (sem refresh)
```

**Isso é um EXTRA** - os dados ainda são salvos permanentemente no banco.

---

## 📝 Exemplo Prático

### Cenário: João cria uma obrigação

```javascript
// 1. João preenche o formulário no site
{
  titulo: "DAS - Simples Nacional",
  dataVencimento: "2024-02-20",
  tipo: "FEDERAL",
  status: "PENDENTE"
}

// 2. Sistema salva no banco
INSERT INTO obrigacoes VALUES (...);

// 3. João fecha o navegador
// ✅ Dados continuam no banco

// 4. João volta depois de 1 semana
SELECT * FROM obrigacoes WHERE status = 'PENDENTE';

// 5. ✅ A mesma obrigação aparece!
// ✅ Mesmos dados
// ✅ Mesma data
// ✅ Mesmo status
```

---

## 🔒 Garantias

### ✅ O Sistema Garante:

1. **Persistência Total** - Todos os dados são salvos permanentemente
2. **Histórico Completo** - Toda mudança é registrada
3. **Recuperação** - Dados podem ser restaurados de backup
4. **Integridade** - Foreign keys garantem consistência
5. **Timestamp** - Created_at e Updated_at em cada registro

### ✅ Recursos de Backup:

1. **Backup Manual** - Exportar dados via interface
2. **Backup Automático** - Supabase faz backups diários
3. **SQL Dump** - Exportar em formato SQL
4. **JSON Export** - Exportar em JSON

---

## 🎯 Resumo

| Ação | Salvou? | Disponível após fechar? | Disponível após 1 ano? |
|------|---------|-------------------------|------------------------|
| Criar obrigação | ✅ SIM | ✅ SIM | ✅ SIM |
| Editar obrigação | ✅ SIM | ✅ SIM | ✅ SIM |
| Deletar obrigação | ✅ SIM | ❌ Não aparece mais | ❌ Não aparece mais |
| Criar recorrência | ✅ SIM | ✅ SIM | ✅ SIM |

**Todos os dados são salvos PERMANENTEMENTE no banco de dados!**

---

## 📞 Precisa de Mais Ajuda?

- 📖 Leia [DATABASE.md](DATABASE.md) - Documentação completa do banco
- 🐬 [MYSQL_SETUP.md](MYSQL_SETUP.md) - Configurar MySQL
- 🐘 [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Configurar Supabase
- 🐛 [Issues no GitHub](../../issues) - Reportar problemas

---

**Desenvolvido com ❤️ para garantir que seus dados nunca sejam perdidos!**

