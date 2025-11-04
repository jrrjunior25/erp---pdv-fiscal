const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Verificando dados do seed...\n');

  const users = await prisma.user.findMany();
  console.log('=== USUÁRIOS ===');
  users.forEach(user => {
    console.log(`- ${user.name} (${user.email}) - Role: ${user.role} - Ativo: ${user.active}`);
  });

  const productsCount = await prisma.product.count();
  const customersCount = await prisma.customer.count();
  const suppliersCount = await prisma.supplier.count();
  
  console.log('\n=== ESTATÍSTICAS ===');
  console.log(`Total de usuários: ${users.length}`);
  console.log(`Total de produtos: ${productsCount}`);
  console.log(`Total de clientes: ${customersCount}`);
  console.log(`Total de fornecedores: ${suppliersCount}`);
}

main()
  .catch((e) => {
    console.error('Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
