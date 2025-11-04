const http = require('http');

const data = JSON.stringify({
  email: 'admin@pdv.com',
  password: 'adm123'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Testando login do admin...\n');

const req = http.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Response:', JSON.parse(body));
  });
});

req.on('error', (error) => {
  console.error('Erro:', error);
});

req.write(data);
req.end();
