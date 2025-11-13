# 🔧 Correção de Erro 500 ao Cadastrar Cliente

## 📋 Problema Identificado

O sistema estava retornando erro 500 (Internal Server Error) ao tentar cadastrar um novo cliente através do endpoint `POST /api/clientes`.

### Causa Raiz

O problema principal estava relacionado à incompatibilidade entre o tipo de dados usado no código e o tipo esperado pelo PostgreSQL:

1. **Campo `ativo`**: O código estava enviando valores `1` ou `0` (INTEGER), mas o PostgreSQL espera `true` ou `false` (BOOLEAN)
2. **Falta de validação**: Dados não eram validados adequadamente antes da inserção
3. **Tratamento de erros**: Erros não eram logados com detalhes suficientes para diagnóstico
4. **CNPJ**: CNPJ formatado não era limpo antes de verificar duplicidade

## ✅ Correções Implementadas

### 1. Correção do Tipo BOOLEAN no Model (`backend/src/models/clienteModel.ts`)

**Antes:**
```typescript
cliente.ativo ? 1 : 0  // ❌ INTEGER
```

**Depois:**
```typescript
const ativo = cliente.ativo !== undefined ? Boolean(cliente.ativo) : true;  // ✅ BOOLEAN
```

**Arquivos corrigidos:**
- `criar()`: Agora usa `Boolean()` para converter para true/false
- `atualizar()`: Converte `ativo` para boolean antes de inserir
- `listarAtivos()`: Busca usando `true` em vez de `1`
- `deletar()`: Usa `false` em vez de `0`

### 2. Validação e Limpeza de Dados

**Melhorias implementadas:**
- ✅ Validação de nome obrigatório com verificação de string vazia
- ✅ Limpeza de strings (trim) em todos os campos
- ✅ Conversão de strings vazias para `null`
- ✅ Limpeza de CNPJ (remoção de formatação) antes de armazenar
- ✅ Validação de tipo de dados antes de processar

**Código:**
```typescript
// Validar e limpar dados
const nome = (cliente.nome || '').trim();
if (!nome) {
  throw new Error('Nome é obrigatório');
}

// Converter strings vazias para null e limpar valores
const cnpj = cliente.cnpj?.trim() || null;
const email = cliente.email?.trim() || null;
const telefone = cliente.telefone?.trim() || null;
const regimeTributario = cliente.regimeTributario?.trim() || null;
```

### 3. Melhorias no Controller (`backend/src/controllers/clienteController.ts`)

**Validações adicionadas:**
- ✅ Validação de nome obrigatório com verificação de tipo
- ✅ Limpeza de CNPJ antes de verificar duplicidade
- ✅ Tratamento de erros específicos do PostgreSQL
- ✅ Mensagens de erro mais descritivas

**Código de tratamento de erros:**
```typescript
if (error.code === '23505') { // Violação de constraint única
  mensagemErro = 'CNPJ já cadastrado';
  statusCode = 409;
} else if (error.code === '23502') { // Violação de NOT NULL
  mensagemErro = 'Campo obrigatório não fornecido';
  statusCode = 400;
}
```

### 4. Logs Detalhados para Diagnóstico

**Logs implementados:**
- ✅ Log detalhado de erros com código, constraint, tabela e coluna
- ✅ Log dos dados recebidos antes do processamento
- ✅ Stack trace em ambiente de desenvolvimento

**Exemplo de log:**
```typescript
console.error('Erro detalhado ao criar cliente:', {
  message: error.message,
  code: error.code,
  detail: error.detail,
  constraint: error.constraint,
  table: error.table,
  column: error.column,
  dadosRecebidos: { ... }
});
```

### 5. Correção na Busca por CNPJ

**Melhoria:**
- ✅ CNPJ é limpo (sem formatação) antes de buscar
- ✅ CNPJ é armazenado sem formatação no banco para facilitar buscas
- ✅ Busca simplificada usando apenas CNPJ limpo

## 🧪 Como Testar

### 1. Teste de Cadastro Básico

```bash
curl -X POST https://sistemafiscal.onrender.com/api/clientes \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Empresa Teste LTDA",
    "cnpj": "12.345.678/0001-90",
    "email": "contato@teste.com",
    "telefone": "(11) 99999-9999",
    "ativo": true,
    "regimeTributario": "Simples Nacional"
  }'
```

### 2. Teste de Validação

```bash
# Teste sem nome (deve retornar 400)
curl -X POST https://sistemafiscal.onrender.com/api/clientes \
  -H "Content-Type: application/json" \
  -d '{
    "cnpj": "12.345.678/0001-90"
  }'
```

### 3. Teste de CNPJ Duplicado

```bash
# Primeiro cadastro
curl -X POST https://sistemafiscal.onrender.com/api/clientes \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Empresa 1",
    "cnpj": "12345678000190"
  }'

# Tentativa de cadastro duplicado (deve retornar 409)
curl -X POST https://sistemafiscal.onrender.com/api/clientes \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Empresa 2",
    "cnpj": "12.345.678/0001-90"
  }'
```

## 📝 Checklist de Verificação

Após o deploy, verifique:

- [ ] Cadastro de cliente funciona sem erro 500
- [ ] Validação de nome obrigatório funciona
- [ ] CNPJ duplicado retorna erro 409
- [ ] Campos opcionais podem ser omitidos
- [ ] Campo `ativo` é salvo como boolean no banco
- [ ] Logs mostram detalhes de erros quando ocorrem

## 🚀 Próximos Passos

1. **Fazer deploy das correções:**
   ```bash
   cd backend
   npm run build
   git add .
   git commit -m "Correção: Erro 500 ao cadastrar cliente - ajuste tipo BOOLEAN e validações"
   git push
   ```

2. **Aguardar deploy no Render** (pode levar alguns minutos)

3. **Testar o cadastro** através do frontend

4. **Verificar logs** no Render para confirmar que não há mais erros

## 🔍 Códigos de Erro PostgreSQL

Para referência futura, códigos de erro comuns do PostgreSQL:

- `23505`: Violação de constraint única (UNIQUE)
- `23502`: Violação de NOT NULL
- `23503`: Violação de chave estrangeira (FOREIGN KEY)
- `42P01`: Tabela não existe
- `42703`: Coluna não existe

## 📚 Arquivos Modificados

1. `backend/src/models/clienteModel.ts`
   - Correção do tipo BOOLEAN em todos os métodos
   - Validação e limpeza de dados
   - Logs detalhados de erros

2. `backend/src/controllers/clienteController.ts`
   - Validações melhoradas
   - Tratamento de erros específicos
   - Limpeza de CNPJ antes de processar

## ⚠️ Notas Importantes

1. **CNPJ sem formatação**: O CNPJ é armazenado sem formatação no banco (apenas números) para facilitar buscas. O frontend deve formatar ao exibir.

2. **Campo ativo**: Sempre use `true` ou `false` (boolean), nunca `1` ou `0` (integer) ao trabalhar com PostgreSQL.

3. **Validação no frontend**: O frontend já valida os dados antes de enviar, mas o backend também valida para garantir segurança.

4. **Logs em produção**: Em produção, detalhes sensíveis não são expostos nos logs, apenas em desenvolvimento.

