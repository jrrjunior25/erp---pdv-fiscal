const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Adicionando colunas ao banco de dados...\n');

  try {
    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "maxStock" INTEGER`;
    console.log('✅ Coluna maxStock adicionada');

    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "supplierId" TEXT`;
    console.log('✅ Coluna supplierId adicionada');

    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "location" TEXT`;
    console.log('✅ Coluna location adicionada');

    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lastStockIn" TIMESTAMP`;
    console.log('✅ Coluna lastStockIn adicionada');

    await prisma.$executeRaw`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lastStockOut" TIMESTAMP`;
    console.log('✅ Coluna lastStockOut adicionada');

    console.log('\n🎉 Banco de dados atualizado com sucesso!');
    console.log('📝 Execute: npx prisma generate');
    console.log('🚀 Depois: npm run start:dev');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
