const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Verificando usuários no banco de dados...\n');
    
    const users = await prisma.user.findMany();
    
    if (users.length === 0) {
      console.log('PROBLEMA: Nenhum usuário encontrado no banco!');
      console.log('Execute: npm run db:seed ou npx tsx prisma/seed.ts\n');
      return;
    }
    
    console.log(`Total de usuários: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`[${index + 1}] Usuario:`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Nome: ${user.name}`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Ativo: ${user.active ? 'SIM' : 'NAO'}`);
      console.log(`    ID: ${user.id}`);
      console.log(`    Senha Hash: ${user.password.substring(0, 20)}...`);
      console.log('');
    });
    
    console.log('Para testar login:');
    console.log('  Email: admin@pdv.com');
    console.log('  Senha: adm123\n');
    
  } catch (error) {
    console.error('Erro ao verificar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
