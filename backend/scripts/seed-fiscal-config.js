const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedFiscalConfig() {
  console.log('🔧 Criando configuração fiscal inicial...\n');

  try {
    // Verificar se já existe configuração
    const existing = await prisma.fiscalConfig.findFirst();
    
    if (existing) {
      console.log('⚠️  Configuração fiscal já existe!');
      console.log('   ID:', existing.id);
      console.log('   CNPJ:', existing.cnpj);
      console.log('   Nome:', existing.name);
      console.log('\n💡 Use o endpoint PUT /fiscal/config para atualizar.\n');
      return;
    }

    // Criar configuração inicial
    const config = await prisma.fiscalConfig.create({
      data: {
        // DADOS DO EMITENTE (substitua pelos seus dados reais)
        cnpj: '12345678000199',
        name: 'EMPRESA EXEMPLO LTDA',
        fantasyName: 'Loja Exemplo',
        ie: '123456789',
        
        // ENDEREÇO
        street: 'Rua Exemplo',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        cityCode: '3550308', // Código IBGE de São Paulo
        state: 'SP',
        zipCode: '01234567',
        
        // CONFIGURAÇÃO PIX
        pixKey: 'exemplo@email.com.br', // Substitua pela sua chave PIX real
        pixMerchantName: 'LOJA EXEMPLO',
        pixMerchantCity: 'SAO PAULO',
        
        // CONFIGURAÇÃO NFC-E
        environment: 'homologacao', // 'homologacao' ou 'producao'
        nfceSeries: 1,
      },
    });
    
    console.log('✅ Configuração fiscal criada com sucesso!\n');
    console.log('📋 Detalhes:');
    console.log('   ID:', config.id);
    console.log('   CNPJ:', config.cnpj);
    console.log('   Nome:', config.name);
    console.log('   Ambiente:', config.environment);
    console.log('   Série NFC-e:', config.nfceSeries);
    console.log('   Chave PIX:', config.pixKey);
    
    console.log('\n⚠️  PRÓXIMOS PASSOS:');
    console.log('1. Edite este arquivo e substitua pelos seus dados reais');
    console.log('2. Execute novamente: node seed-fiscal-config.js');
    console.log('3. Ou use o endpoint POST /fiscal/config para atualizar via API');
    console.log('4. Faça upload do certificado digital: POST /fiscal/certificate');
    console.log('\n📚 Consulte MODULO-FISCAL-NFCE-PIX.md para mais informações.\n');
    
  } catch (error) {
    console.error('❌ Erro ao criar configuração fiscal:', error.message);
    throw error;
  }
}

seedFiscalConfig()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
