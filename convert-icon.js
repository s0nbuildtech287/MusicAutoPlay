const pngToIco = require('png-to-ico');
const fs = require('fs');

pngToIco('public/favicon.png')
  .then(buf => {
    fs.writeFileSync('public/favicon.ico', buf);
    console.log('✓ favicon.ico created successfully!');
  })
  .catch(err => {
    console.error('✗ Error:', err);
  });
