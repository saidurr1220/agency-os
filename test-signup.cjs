const http = require('http');

const postData = JSON.stringify({
  name: 'Test User',
  email: 'testsignup456@test.com',
  password: 'TestPass123!'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/sign-up/email',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

req.setTimeout(30000, () => {
  console.error('Timeout');
  req.destroy();
  process.exit(1);
});

req.write(postData);
req.end();
