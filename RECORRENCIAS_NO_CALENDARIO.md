# 🔄 Recorrências no Calendário

## 📋 Visão Geral

Implementação completa para exibir **ocorrências futuras** de obrigações recorrentes diretamente no calendário. Agora você pode visualizar todas as recorrências mensais, bimestrais, trimestrais, semestrais e anuais projetadas nos próximos 12 meses.

## ✨ Funcionalidades Implementadas

### 1. Geração de Eventos Virtuais
- **Arquivo criado**: `frontend/src/utils/recorrenciaUtils.ts`
- Funções para calcular e gerar eventos futuros baseados na configuração de recorrência
- Suporte a todos os tipos de recorrência:
  - 📅 **Mensal**: Gera todo mês
  - 📊 **Bimestral**: A cada 2 meses
  - 📈 **Trimestral**: A cada 3 meses
  - 🔢 **Semestral**: A cada 6 meses
  - 🗓️ **Anual**: Todo ano
  - ⚙️ **Customizada**: Intervalo personalizado

### 2. Visualização no Calendário
- **Arquivo modificado**: `frontend/src/components/CalendarioFiscal.tsx`
- Exibe até **12 meses** de recorrências futuras
- Toggle para ativar/desativar visualização de recorrências
- Diferenciação visual entre eventos reais e virtuais

### 3. Diferenciação Visual

#### Eventos Reais (Já Criados)
- Cores sólidas
- Bordas sólidas
- Editáveis (drag & drop)
- Ícone 🔄 indica recorrência ativa

#### Eventos Virtuais (Futuros)
- Cores mais transparentes (60% opacidade)
- Bordas tracejadas
- **Não editáveis** (protegidos)
- Ícone ⏱️ indica ocorrência futura
- Marcação visual "Futura" na visualização em lista

### 4. Interação com Eventos Virtuais

Ao clicar em um evento virtual:
```
┌─────────────────────────────────────────────────┐
│ Esta é uma ocorrência futura da obrigação       │
│ "DARF - Imposto de Renda"                       │
│                                                  │
│ Data de vencimento: 20/02/2025                  │
│                                                  │
│ Esta obrigação será criada automaticamente      │
│ pelo sistema.                                   │
│                                                  │
│ Deseja visualizar a obrigação original?         │
└─────────────────────────────────────────────────┘
```

## 🎨 Elementos Visuais

### Toggle de Recorrências
```
┌───────────────────────────────────────┐
│ ☐ 🔄 Mostrar Recorrências Futuras     │
└───────────────────────────────────────┘
```
- Localizado no cabeçalho do calendário
- Ativado por padrão
- Permite ocultar eventos futuros quando necessário

### Legenda Adicional
Quando recorrências estão ativas, aparece na legenda:
```
⏱️ Recorrência Futura (12 meses)
```

## 🔧 Implementação Técnica

### Função Principal: `gerarEventosRecorrentesFuturos`

```typescript
/**
 * Gera eventos virtuais (futuros) baseados na recorrência
 * @param obrigacao - Obrigação com recorrência configurada
 * @param mesesFuturos - Número de meses para gerar (padrão: 12)
 * @returns Array de obrigações virtuais
 */
```

**Características:**
- Respeita a configuração `diaDoMes` (dia fixo de vencimento)
- Respeita `dataFim` (data limite da recorrência)
- Gera até 100 ocorrências (limite de segurança)
- IDs virtuais: `{id-original}-recorrencia-{contador}`

### Performance

- ✅ **Memoização**: Usa `useMemo` para evitar recálculos desnecessários
- ✅ **Lazy Loading**: Só gera quando o toggle está ativo
- ✅ **Limite inteligente**: Máximo de 12 meses ou 100 ocorrências

## 📊 Exemplo de Uso

### Cenário: Obrigação Mensal
**Configuração:**
- Tipo: MENSAL
- Dia do mês: 20
- Criada em: 15/01/2025
- Data fim: não definida

**Resultado no Calendário:**
```
Jan 2025: 20/01 (real - já criada)
Fev 2025: 20/02 (virtual - futura) ⏱️
Mar 2025: 20/03 (virtual - futura) ⏱️
Abr 2025: 20/04 (virtual - futura) ⏱️
... até Jan 2026
```

### Cenário: Obrigação Trimestral
**Configuração:**
- Tipo: TRIMESTRAL
- Dia do mês: 15
- Criada em: 10/01/2025

**Resultado no Calendário:**
```
Jan 2025: 15/01 (real - já criada)
Abr 2025: 15/04 (virtual - futura) ⏱️
Jul 2025: 15/07 (virtual - futura) ⏱️
Out 2025: 15/10 (virtual - futura) ⏱️
Jan 2026: 15/01 (virtual - futura) ⏱️
```

## 🎯 Benefícios

### Para Usuários
1. **Visão Completa**: Veja todas as obrigações futuras de uma vez
2. **Planejamento**: Antecipe datas importantes com 12 meses de antecedência
3. **Clareza Visual**: Diferencie facilmente eventos reais de futuros
4. **Flexibilidade**: Ative/desative a visualização conforme necessário

### Para o Sistema
1. **Não Polui o Banco**: Eventos virtuais não são salvos
2. **Geração Automática Continua**: O job diário continua criando as obrigações
3. **Performance Otimizada**: Memoização e cálculos eficientes
4. **Manutenibilidade**: Código modular e bem documentado

## 🔍 Validações e Segurança

### Proteções Implementadas
- ✅ Eventos virtuais **não são editáveis**
- ✅ Drag & drop desabilitado para eventos futuros
- ✅ Alerta informativo ao clicar
- ✅ Limite de 100 ocorrências por segurança
- ✅ Validação de datas (não ultrapassa `dataFim`)

## 📱 Responsividade

A funcionalidade é totalmente responsiva:
- **Desktop**: Toggle e legendas visíveis
- **Tablet**: Layout adaptado
- **Mobile**: Funcionalidade completa mantida

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras Possíveis
1. Permitir configurar número de meses exibidos (6, 12, 24)
2. Filtro por tipo de recorrência
3. Exportar previsão de recorrências (PDF/Excel)
4. Notificações sobre próximas ocorrências
5. Dashboard com estatísticas de recorrências

## 🐛 Troubleshooting

### Problema: Recorrências não aparecem
**Solução:**
1. Verifique se o toggle está ativado
2. Confirme que a obrigação tem `recorrencia.ativo !== false`
3. Verifique se não ultrapassou a `dataFim`

### Problema: Muitos eventos no calendário
**Solução:**
- Desative o toggle temporariamente
- Ou reduza o período de visualização no calendário

### Problema: Performance lenta
**Solução:**
- Verifique o número de obrigações com recorrência
- Considere otimizar filtros antes de aplicar recorrências

## 📝 Notas de Implementação

- **Data de criação vazia**: Eventos virtuais têm `criadoEm: ''` para identificação
- **IDs virtuais**: Formato `{id-original}-recorrencia-{contador}`
- **Função de verificação**: `isEventoVirtual()` identifica eventos futuros
- **Memoização**: `useMemo` recalcula apenas quando `obrigacoes` ou `mostrarRecorrencias` mudam

## ✅ Checklist de Implementação

- [x] Criar função de geração de eventos virtuais
- [x] Modificar CalendarioFiscal para usar eventos virtuais
- [x] Adicionar diferenciação visual (opacidade, bordas tracejadas)
- [x] Implementar toggle de ativação/desativação
- [x] Adicionar legenda explicativa
- [x] Proteger eventos virtuais (não editáveis)
- [x] Implementar interação ao clicar (alerta informativo)
- [x] Otimizar performance (memoização)
- [x] Validar com linter (sem erros)
- [x] Documentar funcionalidade

## 📖 Arquivos Modificados/Criados

### Criados
- `frontend/src/utils/recorrenciaUtils.ts` - Utilitários de recorrência

### Modificados
- `frontend/src/components/CalendarioFiscal.tsx` - Calendário principal

---

**Data de Implementação**: 08/11/2025  
**Versão**: 2.0  
**Status**: ✅ Implementado e Testado


