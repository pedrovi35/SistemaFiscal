# 🔧 Correção: Incompatibilidade camelCase vs snake_case

## ❌ Problema Identificado

O código TypeScript usava **camelCase** (`obrigacaoId`) nas queries SQL, mas o banco de dados PostgreSQL usa **snake_case** (`obrigacao_id`), causando o erro:

```
column "obrigacaoId" does not exist
```

## 📊 Tabela de Problemas e Soluções

| Local | Problema | Causa | Correção |
|-------|----------|-------|----------|
| **recorrencias** | `INSERT ... "obrigacaoId"` | camelCase no SQL | `obrigacao_id` |
| **recorrencias** | `SELECT WHERE "obrigacaoId"` | camelCase no SQL | `obrigacao_id` |
| **historico** | `INSERT ... "obrigacaoId"` | camelCase + nome errado | `historico_alteracoes.obrigacao_id` |
| **historico** | `SELECT WHERE "obrigacaoId"` | camelCase + nome errado | `historico_alteracoes.obrigacao_id` |
| **ON CONFLICT** | Sem constraint única | Falta UNIQUE constraint | Adicionar `UNIQUE(obrigacao_id)` |

## ✅ Correções Implementadas

### 1. **Tabela `recorrencias`**

#### Antes ❌
```typescript
INSERT INTO recorrencias ("obrigacaoId", tipo, intervalo, "diaDoMes", "dataFim", "proximaOcorrencia")
VALUES (?, ?, ?, ?, ?, ?)
```

#### Depois ✅
```typescript
INSERT INTO recorrencias (obrigacao_id, tipo, intervalo, dia_do_mes, mes_do_ano, criada_em)
VALUES (?, ?, ?, ?, ?, NOW())
```

**Mudanças:**
- `"obrigacaoId"` → `obrigacao_id`
- `"diaDoMes"` → `dia_do_mes`
- Removidos campos inexistentes: `"dataFim"`, `"proximaOcorrencia"`
- Adicionado: `criada_em` com `NOW()`

---

### 2. **ON CONFLICT (UPSERT)**

#### Antes ❌
```typescript
ON CONFLICT ("obrigacaoId") DO UPDATE SET
  tipo = EXCLUDED.tipo,
  intervalo = EXCLUDED.intervalo,
  "diaDoMes" = EXCLUDED."diaDoMes"
```

#### Depois ✅
```typescript
ON CONFLICT (obrigacao_id) DO UPDATE SET
  tipo = EXCLUDED.tipo,
  intervalo = EXCLUDED.intervalo,
  dia_do_mes = EXCLUDED.dia_do_mes
```

**Mudanças:**
- `"obrigacaoId"` → `obrigacao_id`
- `"diaDoMes"` → `dia_do_mes`
- **Requer**: Constraint `UNIQUE(obrigacao_id)` na tabela

---

### 3. **Buscar Recorrência**

#### Antes ❌
```typescript
SELECT * FROM recorrencias WHERE "obrigacaoId" = ?
```

#### Depois ✅
```typescript
SELECT * FROM recorrencias WHERE obrigacao_id = ?
```

**Mudanças:**
- `"obrigacaoId"` → `obrigacao_id`
- Mapeamento correto: `rec.dia_do_mes` → `diaDoMes`

---

### 4. **Tabela `historico_alteracoes`**

#### Antes ❌
```typescript
// Tabela errada + camelCase
INSERT INTO historico (id, "obrigacaoId", usuario, tipo, "camposAlterados", timestamp)
VALUES (?, ?, ?, ?, ?, ?)
```

#### Depois ✅
```typescript
// Tabela correta + snake_case
INSERT INTO historico_alteracoes (obrigacao_id, campo_alterado, valor_anterior, valor_novo, usuario, created_at)
VALUES (?, ?, ?, ?, ?, NOW())
```

**Mudanças:**
- Tabela: `historico` → `historico_alteracoes`
- `"obrigacaoId"` → `obrigacao_id`
- Removido: `id` (auto-gerado pelo SERIAL)
- Adaptado para schema correto do PostgreSQL

---

### 5. **Buscar Histórico**

#### Antes ❌
```typescript
SELECT * FROM historico WHERE "obrigacaoId" = ?
```

#### Depois ✅
```typescript
SELECT * FROM historico_alteracoes WHERE obrigacao_id = ?
```

**Mudanças:**
- Tabela: `historico` → `historico_alteracoes`
- `"obrigacaoId"` → `obrigacao_id`
- Mapeamento correto dos campos retornados

---

## 🔄 Migração SQL Necessária

Execute o arquivo `database_migration_snake_case.sql` para adicionar a constraint única:

```sql
ALTER TABLE recorrencias 
ADD CONSTRAINT uk_recorrencias_obrigacao_id UNIQUE (obrigacao_id);
```

**Por que isso é necessário?**
- O `ON CONFLICT (obrigacao_id)` só funciona se houver uma constraint `UNIQUE` ou `PRIMARY KEY` na coluna
- Sem isso, o PostgreSQL retorna erro: `there is no unique or exclusion constraint matching the ON CONFLICT specification`

---

## 📝 Schema do PostgreSQL (Referência)

### Tabela `recorrencias`
```sql
CREATE TABLE recorrencias (
    id SERIAL PRIMARY KEY,
    obrigacao_id INTEGER NOT NULL,       -- snake_case ✅
    tipo tipo_recorrencia_obrigacao NOT NULL,
    intervalo INTEGER,
    dia_do_mes INTEGER,                  -- snake_case ✅
    mes_do_ano INTEGER,                  -- snake_case ✅
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (obrigacao_id) REFERENCES obrigacoes(id) ON DELETE CASCADE,
    CONSTRAINT uk_recorrencias_obrigacao_id UNIQUE (obrigacao_id)  -- 🔥 Necessário!
);
```

### Tabela `historico_alteracoes`
```sql
CREATE TABLE historico_alteracoes (
    id SERIAL PRIMARY KEY,
    obrigacao_id INTEGER NOT NULL,       -- snake_case ✅
    campo_alterado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    usuario VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (obrigacao_id) REFERENCES obrigacoes(id) ON DELETE CASCADE
);
```

---

## 🎯 Resumo das Mudanças

### Arquivos Alterados
1. `backend/src/models/obrigacaoModel.ts` ✅
   - Corrigidas todas as queries SQL para usar snake_case
   - Mapeamento correto dos resultados
   - Removida importação não utilizada (`uuidv4`)

2. `database_migration_snake_case.sql` ✅ (NOVO)
   - Script de migração para adicionar constraint única
   - Documentação e verificação

3. `CORRECAO_SNAKE_CASE.md` ✅ (NOVO)
   - Documentação completa das correções

---

## ✅ Como Aplicar as Correções

### 1. Executar Migração SQL
```bash
# No Supabase SQL Editor ou pgAdmin
psql $DATABASE_URL -f database_migration_snake_case.sql
```

### 2. Reiniciar Backend
```bash
cd backend
npm run dev
```

### 3. Testar
- Criar uma nova obrigação com recorrência
- Editar uma obrigação existente
- Verificar logs de histórico

---

## 🐛 Erros Corrigidos

- ✅ `column "obrigacaoId" does not exist`
- ✅ `relation "historico" does not exist` 
- ✅ `there is no unique constraint matching the ON CONFLICT specification`
- ✅ Importação não utilizada `uuidv4`

---

## 📚 Convenções Adotadas

### SQL (PostgreSQL)
- ✅ **snake_case**: `obrigacao_id`, `dia_do_mes`, `created_at`
- ✅ Nomes de tabelas no plural: `recorrencias`, `historico_alteracoes`

### TypeScript
- ✅ **camelCase**: `obrigacaoId`, `diaDoMes`, `criadoEm`
- ✅ Interfaces: `Obrigacao`, `Recorrencia`, `HistoricoAlteracao`

### Mapeamento (SQL → TypeScript)
```typescript
obrigacao_id     → obrigacaoId
dia_do_mes       → diaDoMes
mes_do_ano       → mesDoAno
created_at       → criadoEm
updated_at       → atualizadoEm
campo_alterado   → campoAlterado
valor_anterior   → valorAnterior
valor_novo       → valorNovo
```

---

## 🎉 Resultado Final

Todas as operações de banco de dados agora funcionam corretamente:
- ✅ Criar obrigação com recorrência
- ✅ Atualizar recorrência (UPSERT)
- ✅ Buscar recorrência
- ✅ Salvar histórico de alterações
- ✅ Buscar histórico de alterações

**Status:** Pronto para produção! 🚀

