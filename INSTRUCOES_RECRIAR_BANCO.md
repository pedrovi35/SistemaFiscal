# 🔄 INSTRUÇÕES: RECRIAR BANCO DE DADOS COMPLETO

## 🎯 O QUE ESTE SCRIPT FAZ

Este script **REMOVE TUDO** e **RECRIA** o banco de dados do zero com a configuração **CORRETA**.

### ✅ Correções Aplicadas:
- **ID em TEXT (UUID)** ao invés de INTEGER
- **Todas as tabelas** recriadas corretamente
- **Feriados 2024 e 2025** pré-cadastrados
- **Triggers e Views** funcionando
- **Zero erros de tipo de dados**

---

## 🚀 PASSO A PASSO (SIGA EXATAMENTE)

### 1️⃣ ACESSE O SUPABASE

Abra seu navegador e vá para: **https://supabase.com/dashboard**

### 2️⃣ SELECIONE SEU PROJETO

Clique no projeto do **Sistema Fiscal**

### 3️⃣ ABRA O SQL EDITOR

No menu lateral esquerdo, clique em: **"SQL Editor"**

### 4️⃣ COPIE O SCRIPT COMPLETO

- Abra o arquivo **`RECRIAR_BANCO_COMPLETO.sql`** no Cursor
- Selecione **TUDO** (Ctrl + A)
- Copie (Ctrl + C)

### 5️⃣ COLE NO SQL EDITOR

- Volte ao SQL Editor do Supabase
- Cole o script inteiro (Ctrl + V)

### 6️⃣ EXECUTE O SCRIPT

Clique no botão verde **"RUN"** ou pressione **Ctrl + Enter**

### 7️⃣ AGUARDE A EXECUÇÃO

Você verá mensagens como:

```
NOTICE: ✅ Banco de dados limpo com sucesso!
NOTICE: ✅ Tipos ENUM criados com sucesso!
NOTICE: ✅ Tabela CLIENTES criada com UUID!
NOTICE: ✅ Tabela OBRIGAÇÕES criada!
NOTICE: ✅ Tabela RECORRÊNCIAS criada!
NOTICE: ✅ Tabela FERIADOS criada!
NOTICE: ✅ Tabela HISTÓRICO criada!
NOTICE: ✅ Triggers criados!
NOTICE: ✅ Views criadas!
NOTICE: ✅ Functions criadas!
NOTICE: ✅ Feriados inseridos!

================================================
🎉 BANCO DE DADOS RECRIADO COM SUCESSO!
================================================

✅ Tabelas criadas: 5
✅ Tipo da coluna clientes.id: text (deve ser TEXT)
✅ Tipo da coluna obrigacoes.id: text (deve ser TEXT)

================================================
🚀 SISTEMA PRONTO PARA USO!
================================================
```

### 8️⃣ VERIFIQUE O RESULTADO

Na parte inferior do SQL Editor, você verá uma tabela mostrando:

| Tabela Criada | Colunas |
|--------------|---------|
| clientes | 8 |
| feriados | 5 |
| historico | 6 |
| obrigacoes | 17 |
| recorrencias | 8 |

---

## ⚠️ IMPORTANTE - LEIA ANTES DE EXECUTAR

### ⚠️ Este script irá:
- ❌ **DELETAR TODOS OS DADOS EXISTENTES**
- ❌ **REMOVER TODAS AS TABELAS**
- ✅ **RECRIAR TUDO DO ZERO**
- ✅ **INSERIR FERIADOS NACIONAIS**

### 💾 Se você tem dados importantes:
1. Faça backup antes de executar
2. Ou exporte os dados que quer manter

### ✅ Se o banco está vazio ou com problemas:
- **Execute sem medo!**
- Este script resolve tudo

---

## 🧪 TESTAR APÓS A EXECUÇÃO

### 1. Recarregue o Frontend
```bash
# Pressione Ctrl + Shift + R no navegador
# Ou feche e abra novamente
```

### 2. Teste Cadastrar Cliente
- Vá para a tela de **Clientes**
- Clique em **"Novo Cliente"**
- Preencha:
  - Nome: `Teste Empresa Ltda`
  - CNPJ: `12.345.678/0001-90`
  - Email: `teste@empresa.com`
  - Telefone: `(11) 99999-9999`
  - Regime Tributário: `Simples Nacional`
- Clique em **"Salvar"**

### 3. Verifique se:
- ✅ Cliente foi salvo **SEM ERROS**
- ✅ Aparece na lista de clientes
- ✅ Ao recarregar a página (F5), o cliente continua lá
- ✅ Console do navegador **SEM ERROS**

---

## ❌ RESOLVER PROBLEMAS

### Se aparecer erro ao executar o script:

**Erro: "permission denied"**
- ✅ Você precisa ser o dono do projeto no Supabase
- ✅ Verifique se está logado com a conta correta

**Erro: "syntax error"**
- ✅ Certifique-se de copiar o script COMPLETO
- ✅ Não pode faltar nenhuma linha
- ✅ Cole tudo de uma vez

**Erro: "relation does not exist"**
- ✅ Isso é normal se o banco está vazio
- ✅ O script cria tudo do zero
- ✅ Continue a execução

### Se o erro persistir após executar:

1. **Verifique o tipo da coluna id:**

Execute este comando no SQL Editor:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'clientes' AND column_name = 'id';
```

Deve retornar:
```
column_name | data_type
------------+----------
id          | text
```

Se retornar `integer`, o script não foi executado corretamente.

2. **Verifique se as tabelas foram criadas:**

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deve listar: `clientes`, `feriados`, `historico`, `obrigacoes`, `recorrencias`

---

## 🎉 SUCESSO!

Após executar o script e testar, você terá:

✅ Banco de dados **100% correto**  
✅ Tabelas com **UUIDs funcionando**  
✅ Cadastro de clientes **sem erros**  
✅ Persistência de dados **funcionando**  
✅ Sistema **pronto para produção**

---

## 📞 PRÓXIMOS PASSOS

Depois que o banco estiver funcionando:

1. ✅ Cadastre seus clientes reais
2. ✅ Crie obrigações fiscais
3. ✅ Configure recorrências
4. ✅ Use o calendário
5. ✅ Faça deploy no Render

---

**Criado em:** 2024-11-13  
**Arquivo:** `RECRIAR_BANCO_COMPLETO.sql`  
**Versão:** 3.0 - Banco Correto com UUID

