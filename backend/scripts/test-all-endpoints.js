const http = require('http');

let token = '';

const makeRequest = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

async function testEndpoints() {
  console.log('🧪 Testando endpoints da API\n');

  // 1. Login
  console.log('1. POST /api/auth/login');
  const loginRes = await makeRequest('/api/auth/login', 'POST', {
    email: 'admin@pdv.com',
    password: 'adm123'
  });
  console.log(`   Status: ${loginRes.status}`);
  if (loginRes.data.token) {
    token = loginRes.data.token;
    console.log(`   ✓ Token obtido\n`);
  } else {
    console.log(`   ✗ Falha no login\n`);
    return;
  }

  // 2. Products
  console.log('2. GET /api/products');
  const productsRes = await makeRequest('/api/products');
  console.log(`   Status: ${productsRes.status}`);
  console.log(`   Total: ${Array.isArray(productsRes.data) ? productsRes.data.length : 0} produtos\n`);

  // 3. Customers
  console.log('3. GET /api/customers');
  const customersRes = await makeRequest('/api/customers');
  console.log(`   Status: ${customersRes.status}`);
  console.log(`   Total: ${Array.isArray(customersRes.data) ? customersRes.data.length : 0} clientes\n`);

  // 4. Suppliers
  console.log('4. GET /api/suppliers');
  const suppliersRes = await makeRequest('/api/suppliers');
  console.log(`   Status: ${suppliersRes.status}`);
  console.log(`   Total: ${Array.isArray(suppliersRes.data) ? suppliersRes.data.length : 0} fornecedores\n`);

  // 5. Users
  console.log('5. GET /api/users');
  const usersRes = await makeRequest('/api/users');
  console.log(`   Status: ${usersRes.status}`);
  console.log(`   Total: ${Array.isArray(usersRes.data) ? usersRes.data.length : 0} usuários\n`);

  // 6. Sales History
  console.log('6. GET /api/sales/history');
  const salesRes = await makeRequest('/api/sales/history');
  console.log(`   Status: ${salesRes.status}`);
  console.log(`   Total: ${Array.isArray(salesRes.data) ? salesRes.data.length : 0} vendas\n`);

  // 7. Shifts
  console.log('7. GET /api/shifts/current');
  const currentShiftRes = await makeRequest('/api/shifts/current');
  console.log(`   Status: ${currentShiftRes.status}`);
  console.log(`   Turno aberto: ${currentShiftRes.data ? 'Sim' : 'Não'}\n`);

  // 8. Inventory Levels
  console.log('8. GET /api/inventory/levels');
  const inventoryRes = await makeRequest('/api/inventory/levels');
  console.log(`   Status: ${inventoryRes.status}`);
  console.log(`   Total: ${Array.isArray(inventoryRes.data) ? inventoryRes.data.length : 0} níveis\n`);

  // 9. Financials
  console.log('9. GET /api/financials');
  const financialsRes = await makeRequest('/api/financials');
  console.log(`   Status: ${financialsRes.status}`);
  console.log(`   Total: ${Array.isArray(financialsRes.data) ? financialsRes.data.length : 0} movimentações\n`);

  // 10. Purchasing Orders
  console.log('10. GET /api/purchasing/orders');
  const purchasingRes = await makeRequest('/api/purchasing/orders');
  console.log(`   Status: ${purchasingRes.status}`);
  console.log(`   Total: ${Array.isArray(purchasingRes.data) ? purchasingRes.data.length : 0} pedidos\n`);

  // 11. Analytics Dashboard
  console.log('11. GET /api/analytics/dashboard');
  const analyticsRes = await makeRequest('/api/analytics/dashboard');
  console.log(`   Status: ${analyticsRes.status}`);
  if (analyticsRes.data) {
    console.log(`   Produtos: ${analyticsRes.data.totalProducts}`);
    console.log(`   Clientes: ${analyticsRes.data.totalCustomers}`);
    console.log(`   Vendas: ${analyticsRes.data.totalSales}`);
    console.log(`   Receita: R$ ${analyticsRes.data.totalRevenue}\n`);
  }

  console.log('✅ Todos os endpoints testados!');
}

testEndpoints().catch(console.error);
