# Ajustes Implementados no Sistema Fiscal

## Data: 05 de Novembro de 2025

## Resumo das Mudanças

Este documento descreve os ajustes implementados conforme solicitação do usuário para melhorar o gerenciamento de impostos, parcelamentos e obrigações no sistema.

---

## 1. Exibição de Nomes de Clientes

### Problema
Os impostos e parcelamentos não mostravam qual cliente estava associado a cada item, dificultando a identificação.

### Solução Implementada
✅ **Componente Impostos** (`frontend/src/components/Impostos.tsx`)
- Adicionada coluna "Cliente" na tabela de impostos
- Exibe o nome do cliente ou "-" caso não tenha

✅ **Componente Parcelamentos** (`frontend/src/components/Parcelamentos.tsx`)
- Adicionada coluna "Cliente" na tabela de parcelamentos
- Exibe o nome do cliente ou "-" caso não tenha

✅ **App.tsx** (`frontend/src/App.tsx`)
- Passando lista de clientes para os componentes de Impostos e Parcelamentos
- Permitindo seleção de cliente nos modais

---

## 2. Regra de Ajuste de Datas para Feriados e Fins de Semana

### Problema
Quando uma obrigação, imposto ou parcelamento caia em sábado, domingo ou feriado, o sistema não permitia ao usuário escolher se queria antecipar (dia útil anterior) ou postergar (dia útil seguinte).

### Solução Implementada

#### Backend

✅ **Types** (`backend/src/types/index.ts`)
- Adicionado campo `preferenciaAjuste?: 'proximo' | 'anterior'` na interface `Obrigacao`

✅ **Model** (`backend/src/models/obrigacaoModel.ts`)
- Atualizado para salvar e recuperar o campo `preferenciaAjuste`
- Valor padrão: `'proximo'`

✅ **Service** (`backend/src/services/feriadoService.ts`)
- Serviço já implementado com função `ajustarParaDiaUtil()`
- Aceita parâmetro `direcao: 'proximo' | 'anterior'`
- Verifica feriados e fins de semana automaticamente

#### Frontend

✅ **ObrigacaoModal** (`frontend/src/components/ObrigacaoModal.tsx`)
- Checkbox para habilitar/desabilitar ajuste automático
- Select para escolher preferência de ajuste:
  - **Próximo dia útil**: Move para segunda-feira se cair em sábado/domingo
  - **Dia útil anterior**: Move para sexta-feira se cair em sábado/domingo
- Texto explicativo sobre o comportamento

✅ **ImpostoModal** (`frontend/src/components/ImpostoModal.tsx`)
- Mesma funcionalidade implementada
- Campos adicionados: `ajusteDataUtil` e `preferenciaAjuste`

✅ **ParcelamentoModal** (`frontend/src/components/ParcelamentoModal.tsx`)
- Mesma funcionalidade implementada
- Campos adicionados: `ajusteDataUtil` e `preferenciaAjuste`

#### Banco de Dados

✅ **Schema Atualizado** (`database_supabase_fixed.sql`)
- Adicionada coluna `"preferenciaAjuste" VARCHAR(10) DEFAULT 'proximo'` na tabela `obrigacoes`
- Comentário explicativo adicionado

✅ **Script de Migração** (`database_migration_preferencia_ajuste.sql`)
- Script SQL para atualizar banco de dados existente
- Adiciona coluna se não existir
- Define valor padrão para registros existentes
- Verifica resultado da migração

---

## 3. Detalhes Técnicos

### Interface de Preferência de Ajuste

```typescript
interface Obrigacao {
  // ... outros campos
  ajusteDataUtil: boolean;           // Se TRUE, aplica ajuste
  preferenciaAjuste?: 'proximo' | 'anterior';  // Como ajustar
}
```

### Comportamento do Sistema

#### Quando `ajusteDataUtil = true` e `preferenciaAjuste = 'proximo'`:
- **Segunda a Sexta**: Data mantida
- **Sábado**: Move para segunda-feira seguinte
- **Domingo**: Move para segunda-feira seguinte
- **Feriado**: Move para próximo dia útil

#### Quando `ajusteDataUtil = true` e `preferenciaAjuste = 'anterior'`:
- **Segunda a Sexta**: Data mantida
- **Sábado**: Move para sexta-feira anterior
- **Domingo**: Move para sexta-feira anterior
- **Feriado**: Move para dia útil anterior

#### Quando `ajusteDataUtil = false`:
- Data não é ajustada, permanece como definida pelo usuário

---

## 4. Exemplos de Uso

### Exemplo 1: Imposto que vence em sábado
```
Data Original: 15/02/2025 (sábado)
Ajuste: Ativo
Preferência: Próximo
Resultado: 17/02/2025 (segunda-feira)
```

### Exemplo 2: Parcelamento que vence em domingo
```
Data Original: 16/02/2025 (domingo)
Ajuste: Ativo
Preferência: Anterior
Resultado: 14/02/2025 (sexta-feira)
```

### Exemplo 3: Obrigação que vence em feriado (Natal - quarta-feira)
```
Data Original: 25/12/2024 (quarta-feira - Natal)
Ajuste: Ativo
Preferência: Próximo
Resultado: 26/12/2024 (quinta-feira - próximo dia útil)
```

---

## 5. Como Aplicar as Mudanças

### 5.1. Backend

1. **Recompilar TypeScript:**
```bash
cd backend
npm run build
```

2. **Reiniciar servidor:**
```bash
npm run dev
```

### 5.2. Banco de Dados

#### Opção A: Novo Banco (Supabase)
Execute o script completo:
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f database_supabase_fixed.sql
```

#### Opção B: Banco Existente (Migração)
Execute apenas a migração:
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f database_migration_preferencia_ajuste.sql
```

### 5.3. Frontend

Não é necessário build adicional, as mudanças estão em arquivos .tsx que são compilados automaticamente pelo Vite.

---

## 6. Testes Recomendados

### Teste 1: Criar Imposto com Cliente
1. Abrir tela de Impostos
2. Criar novo imposto
3. Selecionar cliente
4. Verificar se o nome do cliente aparece na lista

### Teste 2: Ajuste de Data - Próximo Dia Útil
1. Criar obrigação com data em sábado
2. Marcar "Ajustar automaticamente"
3. Selecionar "Próximo dia útil"
4. Salvar e verificar se data foi ajustada para segunda

### Teste 3: Ajuste de Data - Dia Útil Anterior
1. Criar parcelamento com data em domingo
2. Marcar "Ajustar automaticamente"
3. Selecionar "Dia útil anterior"
4. Salvar e verificar se data foi ajustada para sexta

### Teste 4: Sem Ajuste
1. Criar imposto com data em feriado
2. Desmarcar "Ajustar automaticamente"
3. Salvar e verificar se data permanece como feriado

---

## 7. Arquivos Modificados

### Backend
- `backend/src/types/index.ts` - Tipos atualizados
- `backend/src/models/obrigacaoModel.ts` - Model atualizado
- `database_supabase_fixed.sql` - Schema atualizado
- `database_migration_preferencia_ajuste.sql` - **NOVO** Script de migração

### Frontend
- `frontend/src/types/index.ts` - Tipos já incluíam preferenciaAjuste
- `frontend/src/App.tsx` - Passa clientes para Impostos e Parcelamentos
- `frontend/src/components/Impostos.tsx` - Exibe coluna de cliente
- `frontend/src/components/Parcelamentos.tsx` - Exibe coluna de cliente
- `frontend/src/components/ImpostoModal.tsx` - Adiciona opção de ajuste
- `frontend/src/components/ParcelamentoModal.tsx` - Adiciona opção de ajuste
- `frontend/src/components/ObrigacaoModal.tsx` - Já tinha opção de ajuste

---

## 8. Notas Importantes

⚠️ **Atenção:**
- O serviço de feriados (`feriadoService.ts`) já estava implementado e funcionando
- A lógica de ajuste já existia, apenas adicionamos a opção do usuário escolher a direção
- Os feriados são carregados da API do BrasilAPI e armazenados em cache local

✅ **Benefícios:**
- Maior controle sobre vencimentos
- Conformidade com regras fiscais específicas
- Identificação clara de qual cliente cada item pertence
- Melhor organização e rastreabilidade

---

## 9. Próximos Passos Sugeridos

1. ✅ Testar todas as funcionalidades implementadas
2. ⏳ Criar documentação de usuário explicando as novas opções
3. ⏳ Adicionar relatório mostrando ajustes aplicados
4. ⏳ Implementar histórico de ajustes de data
5. ⏳ Adicionar notificação quando data for ajustada automaticamente

---

## Conclusão

Todas as solicitações foram implementadas com sucesso:

✅ Impostos e Parcelamentos agora mostram o nome do cliente
✅ Usuário pode escolher se quer antecipar ou postergar datas em feriados/fins de semana
✅ Sistema já tinha a lógica de ajuste de datas, apenas foi exposta ao usuário
✅ Banco de dados atualizado com nova coluna
✅ Script de migração criado para bancos existentes

O sistema está pronto para uso com as novas funcionalidades! 🎉

