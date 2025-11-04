const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCRUD() {
  console.log('=== TESTANDO CRUD DOS MÓDULOS ===\n');

  try {
    // Produtos
    console.log('📦 PRODUTOS:');
    const products = await prisma.product.findMany({ take: 3 });
    console.log(`  ✅ READ: ${products.length} produtos encontrados`);
    
    // Clientes
    console.log('\n👥 CLIENTES:');
    const customers = await prisma.customer.findMany({ take: 3 });
    console.log(`  ✅ READ: ${customers.length} clientes encontrados`);
    
    // Fornecedores
    console.log('\n🏭 FORNECEDORES:');
    const suppliers = await prisma.supplier.findMany({ take: 3 });
    console.log(`  ✅ READ: ${suppliers.length} fornecedores encontrados`);
    
    // Usuários
    console.log('\n👤 USUÁRIOS:');
    const users = await prisma.user.findMany({ take: 3 });
    console.log(`  ✅ READ: ${users.length} usuários encontrados`);
    
    // Teste CREATE de produto
    console.log('\n🔧 TESTANDO CREATE:');
    const newProduct = await prisma.product.create({
      data: {
        code: 'TEST-' + Date.now(),
        name: 'Produto de Teste CRUD',
        price: 99.99,
        stock: 10,
      },
    });
    console.log(`  ✅ CREATE: Produto criado - ${newProduct.name}`);
    
    // Teste UPDATE
    const updatedProduct = await prisma.product.update({
      where: { id: newProduct.id },
      data: { price: 149.99 },
    });
    console.log(`  ✅ UPDATE: Preço atualizado para R$ ${updatedProduct.price}`);
    
    // Teste DELETE
    await prisma.product.delete({
      where: { id: newProduct.id },
    });
    console.log(`  ✅ DELETE: Produto removido\n`);
    
    console.log('=== TODOS OS MÓDULOS FUNCIONANDO CORRETAMENTE ===');
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCRUD();
