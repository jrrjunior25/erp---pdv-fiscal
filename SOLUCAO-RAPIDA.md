# ✅ Solução Rápida - Turno Já Aberto

## Problema
Erro: "Já existe um turno aberto (#5) pelo usuário Operador de Caixa"

## Solução Imediata

### Opção 1: Fechar o Turno Aberto (Recomendado)

1. Acesse o ERP (não o PDV)
2. Vá em "Turnos Ativos"
3. Feche o turno #5

### Opção 2: Via API (Rápido)

```bash
# Obter o turno atual
curl http://localhost:3001/api/shifts/current

# Fechar o turno (substitua o ID)
curl -X POST http://localhost:3001/api/shifts/close \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"closingBalance": 100}'
```

### Opção 3: Direto no Banco (Emergência)

```sql
-- Ver turnos abertos
SELECT * FROM "Shift" WHERE status = 'OPEN';

-- Fechar turno
UPDATE "Shift" 
SET status = 'CLOSED', "closedAt" = NOW(), "closingCash" = "openingCash"
WHERE status = 'OPEN';
```

## Melhorias Implementadas

O sistema agora mostra mensagens claras quando há turno aberto!
