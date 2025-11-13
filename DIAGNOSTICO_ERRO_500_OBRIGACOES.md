# 🔍 Diagnóstico: Erro 500 ao Listar Obrigações

## ❌ Problema
```
GET https://sistemafiscal.onrender.com/api/obrigacoes 500 (Internal Server Error)
```

## ✅ Correções Implementadas

### 1. Logs Detalhados
- Adicionados logs detalhados no controller e no model
- Logs mostram exatamente onde o erro está ocorrendo
- Incluem mensagem, stack trace e código de erro

### 2. Verificação de Tabela
- Verificação se a tabela `obrigacoes` existe antes de executar a query
- Mensagem de erro clara se a tabela não existir

### 3. Tratamento de Recorrência
- Busca de recorrência agora é mais robusta
- Verifica se a tabela `recorrencias` existe antes de consultar
- Não quebra a listagem se houver erro ao buscar recorrência

### 4. Mapeamento Melhorado
- Tratamento de erros melhorado no mapeamento de obrigações
- Continua processando outras obrigações mesmo se uma falhar

## 🔧 Como Diagnosticar

### Passo 1: Verificar Logs do Backend

No Render, acesse os logs do serviço backend e procure por:
- `📋 Iniciando listagem de obrigações...`
- `🔍 Verificando se a tabela obrigacoes existe...`
- `❌ Erro ao listar obrigações:`

### Passo 2: Verificar se a Tabela Existe

Execute no SQL Editor do Supabase:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'obrigacoes';
```

**Se não retornar nada:**
- A tabela não existe
- Execute o script `RECRIAR_BANCO_COMPLETO.sql` no Supabase

### Passo 3: Verificar Estrutura da Tabela

Execute no SQL Editor do Supabase:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'obrigacoes'
ORDER BY ordinal_position;
```

**Verifique se existem as colunas:**
- `id` (TEXT ou UUID)
- `titulo` (VARCHAR)
- `data_vencimento` (DATE ou TIMESTAMP)
- `tipo` (VARCHAR ou ENUM)
- `status` (VARCHAR ou ENUM)
- `created_at` ou `criadoEm` (TIMESTAMP)
- `updated_at` ou `atualizadoEm` (TIMESTAMP)

### Passo 4: Testar Query Diretamente

Execute no SQL Editor do Supabase:

```sql
SELECT * FROM obrigacoes ORDER BY data_vencimento ASC LIMIT 5;
```

**Se der erro:**
- A estrutura da tabela está incorreta
- Execute o script `RECRIAR_BANCO_COMPLETO.sql`

**Se retornar dados:**
- O problema está no código de mapeamento
- Verifique os logs do backend para ver qual campo está causando problema

## 🚀 Solução Rápida

### Se a tabela não existe:

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo `RECRIAR_BANCO_COMPLETO.sql`
4. Execute o script
5. Aguarde alguns segundos
6. Teste novamente a API

### Se a tabela existe mas está vazia:

Isso é normal! A API deve retornar um array vazio `[]` sem erro.

### Se a tabela existe mas a estrutura está incorreta:

1. Execute o script `RECRIAR_BANCO_COMPLETO.sql` (ele remove e recria tudo)
2. **ATENÇÃO:** Isso apagará todos os dados existentes!

## 📊 Logs Esperados (Sucesso)

Quando funcionando corretamente, você verá nos logs:

```
📋 Iniciando listagem de obrigações...
🔍 Verificando se a tabela obrigacoes existe...
✅ Tabela obrigacoes encontrada
🔍 Executando query: SELECT * FROM obrigacoes...
📊 0 registros retornados do banco
✅ 0 obrigações mapeadas com sucesso
✅ 0 obrigações encontradas
```

## 🔍 Logs de Erro Comuns

### Erro 1: Tabela não existe
```
❌ Tabela obrigacoes não encontrada no banco de dados!
```
**Solução:** Execute `RECRIAR_BANCO_COMPLETO.sql`

### Erro 2: Erro de conexão
```
❌ Erro ao listar obrigações no model:
📋 Código: ECONNREFUSED
```
**Solução:** Verifique a `DATABASE_URL` no Render

### Erro 3: Erro de mapeamento
```
❌ Erro ao mapear obrigação ID xxx:
📋 Mensagem: Cannot read property 'xxx' of undefined
```
**Solução:** Verifique a estrutura da tabela e compare com o código

## 📝 Próximos Passos

1. **Verifique os logs do Render** após fazer o deploy
2. **Execute os testes SQL** acima no Supabase
3. **Compartilhe os logs** se o erro persistir

## ✅ Arquivos Modificados

- `backend/src/controllers/obrigacaoController.ts` - Logs detalhados
- `backend/src/models/obrigacaoModel.ts` - Verificações e tratamento de erros melhorado

