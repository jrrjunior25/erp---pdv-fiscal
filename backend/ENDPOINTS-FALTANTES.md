# Endpoints Faltantes

## Já Implementados ✅
- GET /api/products
- GET /api/customers
- GET /api/suppliers
- GET /api/users
- GET /api/sales/history
- GET /api/shifts/history
- GET /api/shifts/current
- GET /api/inventory/levels
- GET /api/inventory/movements
- GET /api/financials
- GET /api/purchasing/orders
- GET /api/analytics/dashboard
- POST /api/auth/login

## Faltam Implementar 🔲

### Shifts
- POST /api/shifts/open
- POST /api/shifts/close
- POST /api/shifts/movement

### Sales
- POST /api/sales (precisa retornar { saleRecord, updatedShift })

### Financials
- POST /api/financials/settle-debt/:customerId
- PATCH /api/financials/transactions/:transactionId/status

### Purchasing
- PATCH /api/purchasing/orders/:orderId/status

### Inventory
- POST /api/inventory/count
- POST /api/inventory/import-nfe

### Users (CRUD completo)
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id
