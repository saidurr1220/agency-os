const http = require('http');

const req = http.get('http://localhost:3000', (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response length:', data.length);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

req.setTimeout(5000, () => {
  console.error('Timeout');
  req.destroy();
  process.exit(1);
});
