const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
let authToken = '';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.cyan}${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}${colors.reset}\n`),
};

async function login() {
  try {
    log.title('1. AUTENTICAÇÃO');
    log.info('Fazendo login...');
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@pdv.com',
      password: 'adm123',
    });
    
    authToken = response.data.access_token || response.data.accessToken || response.data.token;
    
    if (!authToken) {
      log.error('Token não encontrado na resposta');
      console.log('Resposta completa:', JSON.stringify(response.data, null, 2));
      return false;
    }
    
    log.success('Login realizado com sucesso!');
    log.info(`Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    log.error(`Erro no login: ${error.message}`);
    log.warn('Certifique-se que o backend está rodando: npm run start:dev');
    return false;
  }
}

async function checkFiscalConfig() {
  try {
    log.title('2. VERIFICAR CONFIGURAÇÃO FISCAL');
    
    const response = await axios.get(`${API_URL}/fiscal/config`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const config = response.data;
    
    if (!config.emitter) {
      log.warn('Configuração fiscal não encontrada!');
      log.info('Execute: node seed-fiscal-config.js');
      return false;
    }
    
    log.success('Configuração fiscal encontrada!');
    log.info(`CNPJ: ${config.emitter.cnpj}`);
    log.info(`Nome: ${config.emitter.name}`);
    log.info(`Ambiente: ${config.nfce.environment}`);
    log.info(`Série NFC-e: ${config.nfce.series}`);
    log.info(`Certificado: ${config.nfce.hasCertificate ? 'Configurado ✅' : 'Não configurado ❌'}`);
    
    if (config.pix) {
      log.info(`PIX Key: ${config.pix.pixKey}`);
    }
    
    return true;
  } catch (error) {
    log.error(`Erro ao buscar configuração: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function checkSefazStatus() {
  try {
    log.title('3. VERIFICAR STATUS SEFAZ');
    
    const response = await axios.get(`${API_URL}/fiscal/sefaz/status`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    const status = response.data;
    
    if (status.online) {
      log.success(`SEFAZ online: ${status.message}`);
    } else {
      log.warn(`SEFAZ offline: ${status.message}`);
    }
    
    return status.online;
  } catch (error) {
    log.error(`Erro ao verificar SEFAZ: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testPixGeneration() {
  try {
    log.title('4. TESTAR GERAÇÃO DE PIX');
    
    log.info('Gerando PIX de R$ 100,00...');
    
    const response = await axios.post(
      `${API_URL}/fiscal/generate-pix`,
      {
        amount: 100.00,
        description: 'Teste de PIX',
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    
    const pix = response.data;
    
    if (pix.success) {
      log.success('PIX gerado com sucesso!');
      log.info(`TxId: ${pix.txId}`);
      log.info(`Valor: R$ ${pix.amount.toFixed(2)}`);
      log.info(`Expira em: ${new Date(pix.expiresAt).toLocaleString('pt-BR')}`);
      log.info(`QR Code (primeiros 50 chars): ${pix.qrCode.substring(0, 50)}...`);
      return true;
    } else {
      log.error('Falha ao gerar PIX');
      return false;
    }
  } catch (error) {
    log.error(`Erro ao gerar PIX: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testNfceGeneration() {
  try {
    log.title('5. TESTAR GERAÇÃO DE NFC-E (SEM ENVIO)');
    
    log.info('Gerando NFC-e de teste...');
    
    const response = await axios.post(
      `${API_URL}/fiscal/issue-nfce`,
      {
        saleId: 'test-sale-' + Date.now(),
        items: [
          {
            productId: 'test-product-1',
            name: 'Produto Teste',
            quantity: 2,
            price: 50.00,
            ncm: '12345678',
            cfop: '5102',
          }
        ],
        total: 100.00,
        customerCpf: '12345678901',
        customerName: 'Cliente Teste',
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    
    const nfce = response.data;
    
    if (nfce.success || nfce.status === 'SEM_CERTIFICADO') {
      log.success('NFC-e gerada!');
      log.info(`Número: ${nfce.number}`);
      log.info(`Série: ${nfce.series}`);
      log.info(`Chave de Acesso: ${nfce.accessKey}`);
      log.info(`Status: ${nfce.status}`);
      
      if (nfce.protocol) {
        log.success(`Protocolo SEFAZ: ${nfce.protocol}`);
      }
      
      if (nfce.status === 'SEM_CERTIFICADO') {
        log.warn('XML gerado mas não enviado (certificado não configurado)');
        log.info('Para enviar para SEFAZ, configure o certificado: POST /fiscal/certificate');
      }
      
      return true;
    } else {
      log.error(`Falha ao gerar NFC-e: ${nfce.message}`);
      return false;
    }
  } catch (error) {
    log.error(`Erro ao gerar NFC-e: ${error.response?.data?.message || error.message}`);
    if (error.response?.data?.error) {
      log.error(`Detalhes: ${error.response.data.error}`);
    }
    return false;
  }
}

async function runTests() {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║     TESTE DO MÓDULO FISCAL - NFC-e + PIX              ║
╚═══════════════════════════════════════════════════════╝
  `);

  const tests = [
    { name: 'Login', fn: login },
    { name: 'Configuração Fiscal', fn: checkFiscalConfig },
    { name: 'Status SEFAZ', fn: checkSefazStatus },
    { name: 'Geração PIX', fn: testPixGeneration },
    { name: 'Geração NFC-e', fn: testNfceGeneration },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  log.title('RESULTADO DOS TESTES');
  console.log(`Total: ${tests.length}`);
  log.success(`Passou: ${passed}`);
  log.error(`Falhou: ${failed}`);

  if (failed === 0) {
    log.title('🎉 TODOS OS TESTES PASSARAM! 🎉');
    console.log(`
${colors.green}O módulo fiscal está funcionando corretamente!${colors.reset}

Próximos passos:
1. Configure seus dados reais: node seed-fiscal-config.js
2. Faça upload do certificado digital: POST /fiscal/certificate
3. Teste uma venda real pelo PDV

Documentação completa: MODULO-FISCAL-NFCE-PIX.md
    `);
  } else {
    log.title('⚠️ ALGUNS TESTES FALHARAM');
    console.log(`
${colors.yellow}Verifique os erros acima e corrija antes de continuar.${colors.reset}

Dicas:
- Certifique-se que o backend está rodando
- Execute: node seed-fiscal-config.js
- Verifique se o banco de dados foi migrado
- Consulte a documentação: MODULO-FISCAL-NFCE-PIX.md
    `);
  }
}

// Executar testes
runTests().catch((error) => {
  log.error(`Erro fatal: ${error.message}`);
  process.exit(1);
});
