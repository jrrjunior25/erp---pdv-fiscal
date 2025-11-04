# 🎨 GUIA DE DESIGN PROFISSIONAL - ERP + PDV FISCAL

## 📋 Visão Geral

Sistema de design unificado baseado nos melhores softwares brasileiros:
- **Bling** - Simplicidade e clareza
- **Omie** - Organização e hierarquia
- **Conta Azul** - Modernidade e usabilidade

---

## 🎨 Paleta de Cores

### Cores Primárias
```css
Azul Principal: #2563eb (Primary-600)
Azul Hover: #1d4ed8 (Primary-700)
Azul Claro: #dbeafe (Primary-100)
```

### Cores de Status
```css
Sucesso: #10b981 (Verde)
Aviso: #f59e0b (Amarelo)
Erro: #ef4444 (Vermelho)
Info: #3b82f6 (Azul)
```

### Cores Neutras
```css
Texto Principal: #111827 (Gray-900)
Texto Secundário: #6b7280 (Gray-500)
Borda: #e5e7eb (Gray-200)
Background: #f9fafb (Gray-50)
```

---

## 📦 Componentes Base

### 1. Cards
```tsx
import Card from '@components/shared/Card';

<Card 
  title="Título do Card"
  subtitle="Subtítulo opcional"
  actions={<button>Ação</button>}
>
  Conteúdo
</Card>
```

### 2. Botões
```tsx
// Primário
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
  Botão Primário
</button>

// Secundário
<button className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-semibold border border-gray-300">
  Botão Secundário
</button>

// Sucesso
<button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold">
  Confirmar
</button>

// Perigo
<button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold">
  Excluir
</button>
```

### 3. Inputs
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Nome do Campo
  </label>
  <input
    type="text"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
    placeholder="Digite aqui..."
  />
</div>
```

### 4. Badges (Status)
```tsx
// Sucesso
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
  Ativo
</span>

// Aviso
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
  Pendente
</span>

// Erro
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
  Inativo
</span>
```

### 5. Tabelas
```tsx
<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Coluna
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 text-sm text-gray-900">
          Conteúdo
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### 6. Cards de Estatísticas
```tsx
<div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 border border-blue-500 shadow-lg">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-blue-100 text-sm font-medium">Total de Vendas</p>
      <p className="text-3xl font-bold text-white mt-2">1.234</p>
      <p className="text-blue-200 text-xs mt-1">+12% vs mês anterior</p>
    </div>
    <div className="bg-blue-500/30 p-3 rounded-lg">
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    </div>
  </div>
</div>
```

---

## 📐 Layout Padrão

### Estrutura de Página
```tsx
<div className="min-h-screen bg-gray-50">
  {/* Header */}
  <div className="bg-white border-b border-gray-200 px-6 py-4">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Título da Página</h1>
        <p className="text-sm text-gray-500 mt-1">Descrição da página</p>
      </div>
      <div className="flex items-center gap-3">
        <button>Ação 1</button>
        <button>Ação 2</button>
      </div>
    </div>
  </div>

  {/* Content */}
  <div className="p-6 space-y-6">
    {/* Estatísticas */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Cards de estatísticas */}
    </div>

    {/* Filtros */}
    <Card title="Filtros">
      {/* Campos de filtro */}
    </Card>

    {/* Tabela/Conteúdo Principal */}
    <Card title="Dados" noPadding>
      {/* Tabela */}
    </Card>
  </div>
</div>
```

---

## 🎯 Padrões de UX

### 1. Feedback Visual
- **Loading**: Spinner azul com texto
- **Sucesso**: Toast verde com ícone de check
- **Erro**: Toast vermelho com ícone de X
- **Confirmação**: Modal com botões claros

### 2. Hierarquia de Informação
1. Título principal (text-2xl font-bold)
2. Subtítulo (text-sm text-gray-500)
3. Cards de estatísticas (destaque visual)
4. Filtros (card separado)
5. Dados principais (tabela/grid)

### 3. Espaçamento
- Entre seções: `space-y-6` (1.5rem)
- Dentro de cards: `p-6` (1.5rem)
- Entre elementos: `gap-4` (1rem)
- Margens pequenas: `mb-2` (0.5rem)

### 4. Responsividade
```tsx
// Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// Flex responsivo
<div className="flex flex-col md:flex-row gap-4">

// Ocultar em mobile
<div className="hidden md:block">

// Mostrar apenas em mobile
<div className="block md:hidden">
```

---

## 🔄 Checklist de Atualização

Para cada módulo, aplicar:

- [ ] Substituir background escuro por `bg-gray-50`
- [ ] Usar Card component para containers
- [ ] Adicionar cards de estatísticas no topo
- [ ] Implementar filtros em card separado
- [ ] Atualizar tabelas com novo estilo
- [ ] Usar badges para status
- [ ] Adicionar ícones SVG
- [ ] Implementar hover states
- [ ] Adicionar transições suaves
- [ ] Testar responsividade

---

## 📱 Módulos a Atualizar

### Prioridade Alta
1. ✅ SalesHistory (já atualizado)
2. ⏳ ProductManagement
3. ⏳ CustomerManagement
4. ⏳ Dashboard
5. ⏳ FinancialsManagement

### Prioridade Média
6. ⏳ SupplierManagement
7. ⏳ InventoryManagement
8. ⏳ ShiftHistory
9. ⏳ CommissionsManagement
10. ⏳ SettingsManagement

### Prioridade Baixa
11. ⏳ QuotationsManagement
12. ⏳ ReturnsManagement
13. ⏳ PurchaseOrderManagement

---

## 🎨 Exemplos de Cores por Contexto

### Vendas
- Primária: Azul (#2563eb)
- Sucesso: Verde (#10b981)

### Financeiro
- Receita: Verde (#10b981)
- Despesa: Vermelho (#ef4444)
- Saldo: Azul (#2563eb)

### Estoque
- Disponível: Verde (#10b981)
- Baixo: Amarelo (#f59e0b)
- Esgotado: Vermelho (#ef4444)

### Status Geral
- Ativo/Aprovado: Verde
- Pendente: Amarelo
- Inativo/Rejeitado: Vermelho
- Processando: Azul

---

## 💡 Dicas Importantes

1. **Consistência**: Use sempre os mesmos espaçamentos e cores
2. **Hierarquia**: Destaque o que é mais importante
3. **Feedback**: Sempre dê retorno visual ao usuário
4. **Performance**: Use transições suaves mas rápidas
5. **Acessibilidade**: Contraste adequado e textos legíveis

---

**Última atualização:** 04/11/2024
**Versão:** 1.0
