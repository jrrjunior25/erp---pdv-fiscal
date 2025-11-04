const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('Testando login...\n');
    
    const email = 'admin@pdv.com';
    const password = 'adm123';
    
    console.log(`Buscando usuário: ${email}`);
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('ERRO: Usuário não encontrado!\n');
      return;
    }
    
    console.log(`Usuário encontrado: ${user.name}`);
    console.log(`Ativo: ${user.active}`);
    console.log(`Role: ${user.role}\n`);
    
    console.log(`Testando senha: ${password}`);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      console.log('✓ SENHA CORRETA!\n');
      console.log('Login deveria funcionar com:');
      console.log(`  Email: ${email}`);
      console.log(`  Senha: ${password}\n`);
    } else {
      console.log('✗ SENHA INCORRETA!\n');
      console.log('A senha no banco não corresponde a "adm123"');
      console.log('Execute o seed novamente: npx tsx prisma/seed.ts\n');
    }
    
    // Testar também se o backend está acessível
    console.log('Testando endpoint de login...');
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).catch(err => {
      console.log('ERRO: Backend não está respondendo!');
      console.log('Certifique-se de que o backend está rodando na porta 3001\n');
      return null;
    });
    
    if (response) {
      console.log(`Status HTTP: ${response.status}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('✓ LOGIN API FUNCIONOU!');
        console.log('Token recebido:', data.token ? 'SIM' : 'NÃO');
        console.log('User:', data.user ? data.user.name : 'N/A');
      } else {
        console.log('✗ LOGIN API FALHOU!');
        console.log('Resposta:', data);
      }
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
