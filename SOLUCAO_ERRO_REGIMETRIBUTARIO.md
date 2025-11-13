# 🔧 Solução: Erro "column regimeTributario does not exist"

## 📋 Problema

O erro `column "regimeTributario" of relation "clientes" does not exist` ocorre quando o sistema tenta salvar ou atualizar um cliente, mas a coluna `regimeTributario` não existe na tabela `clientes` do banco de dados.

## ✅ Solução Implementada

Foram feitas duas melhorias:

### 1. **Verificação Automática no Backend** (`backend/src/config/database.ts`)

A função `verificarESCorrigirSchema()` foi melhorada para:
- Verificar se a tabela `clientes` existe e criá-la se necessário
- Usar comparação case-insensitive para encontrar colunas existentes
- Criar a coluna `regimeTributario` automaticamente se não existir
- Tratar erros de duplicação de forma mais robusta

**A coluna será criada automaticamente quando o backend reiniciar.**

### 2. **Script SQL Manual** (`fix_regime_tributario.sql`)

Script SQL melhorado que pode ser executado manualmente no Supabase para criar a coluna imediatamente, sem esperar o backend reiniciar.

## 🚀 Como Aplicar a Correção

### Opção 1: Automática (Recomendada)

1. **Reinicie o backend** no Render ou seu servidor
2. A verificação automática criará a coluna na próxima inicialização
3. Verifique os logs do backend para confirmar:
   ```
   ✅ Coluna regimeTributario criada com sucesso
   ```

### Opção 2: Manual (Imediata)

Se você precisa corrigir imediatamente sem reiniciar:

1. Acesse o **SQL Editor** no Supabase
2. Execute o script `fix_regime_tributario.sql`:
   ```sql
   -- O script verifica e cria a coluna se não existir
   -- Veja o arquivo fix_regime_tributario.sql para o código completo
   ```
3. Verifique se a coluna foi criada executando:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_schema = 'public'
   AND table_name = 'clientes' 
   AND LOWER(column_name) = LOWER('regimeTributario');
   ```

## 🔍 Verificação

Após aplicar a correção, você pode verificar se a coluna existe:

```sql
-- Listar todas as colunas da tabela clientes
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'clientes'
ORDER BY ordinal_position;
```

A coluna `regimeTributario` deve aparecer na lista com:
- **column_name**: `regimeTributario`
- **data_type**: `character varying`
- **character_maximum_length**: `50`
- **is_nullable**: `YES`

## 📝 Detalhes Técnicos

### Por que o erro ocorreu?

1. A tabela `clientes` foi criada sem a coluna `regimeTributario`
2. O código do backend tenta inserir/atualizar essa coluna
3. O PostgreSQL retorna erro porque a coluna não existe

### Como foi corrigido?

1. **Verificação case-insensitive**: O PostgreSQL armazena nomes de colunas com aspas duplas de forma case-sensitive. A verificação agora usa `LOWER()` para comparar independente do case.

2. **Tratamento de erros**: Se a coluna já existir durante a criação, o erro é capturado e apenas logado, não interrompendo a inicialização.

3. **Criação da tabela**: Se a tabela não existir, ela é criada com todas as colunas necessárias, incluindo `regimeTributario`.

## 🎯 Próximos Passos

1. ✅ Execute o script SQL ou reinicie o backend
2. ✅ Teste criar um novo cliente com regime tributário
3. ✅ Teste editar um cliente existente
4. ✅ Verifique os logs do backend para confirmar que não há mais erros

## ⚠️ Nota Importante

Se você estiver usando um banco de dados em produção (Render/Supabase), certifique-se de:
- Fazer backup antes de executar scripts SQL
- Testar em ambiente de desenvolvimento primeiro
- Verificar os logs após aplicar a correção

---

**Status**: ✅ Corrigido
**Data**: 2024
**Arquivos Modificados**:
- `backend/src/config/database.ts` - Verificação automática melhorada
- `fix_regime_tributario.sql` - Script SQL melhorado

