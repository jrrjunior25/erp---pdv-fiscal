import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('adm123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pdv.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@pdv.com',
      password: hashedPassword,
      role: 'ADMIN',
      active: true,
      commissionRate: 0,
    },
  });

  console.log('✓ Admin user created:', admin.email);

  // Create manager user
  const managerPassword = await bcrypt.hash('adm123', 10);
  
  const manager = await prisma.user.upsert({
    where: { email: 'gerente@pdv.com' },
    update: {},
    create: {
      name: 'Gerente',
      email: 'gerente@pdv.com',
      password: managerPassword,
      role: 'MANAGER',
      active: true,
      commissionRate: 0,
    },
  });

  console.log('✓ Manager user created:', manager.email);

  // Create cashier user
  const cashierPassword = await bcrypt.hash('adm123', 10);
  
  const cashier = await prisma.user.upsert({
    where: { email: 'caixa@pdv.com' },
    update: {},
    create: {
      name: 'Operador de Caixa',
      email: 'caixa@pdv.com',
      password: cashierPassword,
      role: 'CASHIER',
      active: true,
      commissionRate: 5,
    },
  });

  console.log('✓ Cashier user created:', cashier.email);

  // Create sample products
  const products = [
    { code: 'PROD001', name: 'Produto Exemplo 1', price: 10.99, cost: 5.50, stock: 100, category: 'Categoria A' },
    { code: 'PROD002', name: 'Produto Exemplo 2', price: 25.50, cost: 12.75, stock: 50, category: 'Categoria B' },
    { code: 'PROD003', name: 'Produto Exemplo 3', price: 15.00, cost: 7.50, stock: 75, category: 'Categoria A' },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { code: prod.code },
      update: {},
      create: prod,
    });
  }

  console.log('✓ Sample products created');

  // Create sample customer
  await prisma.customer.upsert({
    where: { document: '12345678900' },
    update: {},
    create: {
      name: 'Cliente Exemplo',
      document: '12345678900',
      email: 'cliente@exemplo.com',
      phone: '(11) 98765-4321',
      loyaltyPoints: 0,
    },
  });

  console.log('✓ Sample customer created');

  // Create sample supplier
  await prisma.supplier.upsert({
    where: { document: '12345678000100' },
    update: {},
    create: {
      name: 'Fornecedor Exemplo LTDA',
      document: '12345678000100',
      email: 'fornecedor@exemplo.com',
      phone: '(11) 3333-4444',
    },
  });

  console.log('✓ Sample supplier created');

  console.log('✅ Seed completed!');
  console.log('\n📝 Credentials:');
  console.log('   Admin   - Email: admin@pdv.com   | Senha: adm123');
  console.log('   Gerente - Email: gerente@pdv.com | Senha: adm123');
  console.log('   Caixa   - Email: caixa@pdv.com   | Senha: adm123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
