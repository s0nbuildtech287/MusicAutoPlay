const { execSync } = require('child_process');

if (process.env.VERCEL) {
  console.log('✓ Running on Vercel environment. Skipping electron-builder execution.');
  process.exit(0);
}

console.log('Starting desktop build locally...');
try {
  execSync('npx electron-builder --win --x64', { stdio: 'inherit' });
  console.log('✓ Desktop build completed successfully!');
} catch (error) {
  console.error('✗ Desktop build failed:', error.message);
  process.exit(1);
}
