# Correção do Erro 500 - Recorrência Inválida

**Data:** 06/11/2024  
**Problema:** Erro 500 ao criar obrigações devido a formato incorreto da recorrência

## 🔍 Diagnóstico

### Erro Identificado

```
TypeError: Cannot read properties of undefined (reading 'toLowerCase')
POST https://sistemafiscal.onrender.com/api/obrigacoes 500 (Internal Server Error)
```

### Causa Raiz

O frontend estava enviando a recorrência como **string simples** (`'Mensal'`, `'Anual'`, `'Personalizado'`), mas o backend esperava um **objeto** com a estrutura:

```typescript
{
  tipo: TipoRecorrencia,
  intervalo?: number,
  diaDoMes?: number,
  dataFim?: string
}
```

## 🔧 Correções Implementadas

### 1. Frontend - `frontend/src/components/ImpostoModal.tsx`

#### Alterações:

1. **Interface Recorrencia adicionada:**
```typescript
interface Recorrencia {
  tipo: TipoRecorrencia;
  intervalo?: number;
  diaDoMes?: number;
  dataFim?: string;
}
```

2. **Interface Imposto atualizada:**
```typescript
recorrencia?: Recorrencia;  // Era: recorrencia: 'Mensal' | 'Anual' | 'Personalizado'
```

3. **Estado de controle adicionado:**
```typescript
const [tipoRecorrenciaSelecionado, setTipoRecorrenciaSelecionado] = useState<string>(
  imposto?.recorrencia?.tipo || 'MENSAL'
);
```

4. **Handler para mudança de recorrência:**
```typescript
const handleRecorrenciaChange = (tipo: string) => {
  setTipoRecorrenciaSelecionado(tipo);
  setFormData(prev => ({
    ...prev,
    recorrencia: {
      tipo: tipo as TipoRecorrencia,
      diaDoMes: prev.dataVencimento ? new Date(prev.dataVencimento).getDate() : undefined
    }
  }));
};
```

5. **Select de recorrência atualizado:**
```tsx
<select
  value={tipoRecorrenciaSelecionado}
  onChange={(e) => handleRecorrenciaChange(e.target.value)}
>
  <option value="MENSAL">📅 Mensal</option>
  <option value="BIMESTRAL">📆 Bimestral</option>
  <option value="TRIMESTRAL">📊 Trimestral</option>
  <option value="SEMESTRAL">📈 Semestral</option>
  <option value="ANUAL">🗓️ Anual</option>
  <option value="CUSTOMIZADA">⚙️ Personalizada</option>
</select>
```

6. **Campo de intervalo para recorrência customizada:**
```tsx
{tipoRecorrenciaSelecionado === 'CUSTOMIZADA' && (
  <div>
    <label>Intervalo (meses) *</label>
    <input
      type="number"
      min="1"
      value={formData.recorrencia?.intervalo || ''}
      onChange={(e) => setFormData(prev => ({
        ...prev,
        recorrencia: {
          ...prev.recorrencia!,
          intervalo: parseInt(e.target.value)
        }
      }))}
    />
  </div>
)}
```

### 2. Backend - `backend/src/controllers/obrigacaoController.ts`

#### Validação adicionada no método `criar`:

```typescript
// Validar recorrência se existir
if (dados.recorrencia) {
  console.log('🔄 Validando recorrência...');
  
  // Garantir que recorrência é um objeto, não uma string
  if (typeof dados.recorrencia === 'string') {
    console.error('❌ Recorrência deve ser um objeto, não uma string:', dados.recorrencia);
    res.status(400).json({ 
      erro: 'Formato de recorrência inválido. Esperado objeto com propriedade "tipo"' 
    });
    return;
  }
  
  const validacao = recorrenciaService.validarRecorrencia(dados.recorrencia);
  if (!validacao.valido) {
    console.error('❌ Recorrência inválida:', validacao.erro);
    res.status(400).json({ erro: validacao.erro });
    return;
  }
  console.log('✅ Recorrência válida');
}
```

#### Validação adicionada no método `atualizar`:

```typescript
// Validar recorrência se existir
if (dados.recorrencia) {
  // Garantir que recorrência é um objeto, não uma string
  if (typeof dados.recorrencia === 'string') {
    res.status(400).json({ 
      erro: 'Formato de recorrência inválido. Esperado objeto com propriedade "tipo"' 
    });
    return;
  }
  
  const validacao = recorrenciaService.validarRecorrencia(dados.recorrencia);
  if (!validacao.valido) {
    res.status(400).json({ erro: validacao.erro });
    return;
  }
}
```

## 📋 Arquivos Modificados

1. ✅ `frontend/src/components/ImpostoModal.tsx` - Interface e formulário atualizados
2. ✅ `backend/src/controllers/obrigacaoController.ts` - Validação aprimorada

## 🚀 Como Aplicar as Correções

### 1. Compilar o Backend

```bash
cd backend
npm run build
```

### 2. Reiniciar o Backend

```bash
npm start
```

### 3. Frontend (Vite Hot Reload)

As alterações do frontend são aplicadas automaticamente em modo de desenvolvimento.

## ✨ Resultado Esperado

### Requisição Anterior (Incorreta):
```json
{
  "titulo": "IRPJ",
  "recorrencia": "Anual"  // ❌ String simples
}
```

### Requisição Corrigida:
```json
{
  "titulo": "IRPJ",
  "tipo": "FEDERAL",
  "dataVencimento": "2024-12-31",
  "recorrencia": {
    "tipo": "ANUAL",
    "diaDoMes": 31
  },
  "ajusteDataUtil": true,
  "preferenciaAjuste": "proximo"
}
```

## 🎯 Benefícios

1. ✅ Erro 500 eliminado
2. ✅ Validação mais robusta no backend
3. ✅ Mensagens de erro claras para o frontend
4. ✅ Suporte a mais tipos de recorrência (Bimestral, Trimestral, Semestral)
5. ✅ Campo de intervalo customizado para recorrências personalizadas
6. ✅ Melhor UX com descrições dos campos

## 📝 Notas Importantes

- O componente `ObrigacaoModal.tsx` já estava correto e não precisou de alterações
- O componente `ImpostoModal.tsx` era usado apenas para demonstração e foi atualizado
- A validação no backend previne futuros erros de formato
- Todos os tipos de recorrência definidos em `TipoRecorrencia` agora estão disponíveis na UI

## 🔗 Relacionado

- `backend/src/types/index.ts` - Definição de `TipoRecorrencia`
- `backend/src/services/recorrenciaService.ts` - Serviço de validação de recorrência
- `frontend/src/types/index.ts` - Tipos do frontend

