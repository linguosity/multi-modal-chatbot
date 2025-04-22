// Development setup script
// Run this before starting the dev server with Node to disable TLS verification
// Usage: node dev-setup.js && npm run dev

console.log('Setting up development environment...');

// Disable TLS certificate verification for development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
console.log('✅ TLS certificate verification disabled for development');

// You could add more development-specific setup here
// For example, setting up test data, mock services, etc.

console.log('✅ Development setup complete!');
console.log('🚀 Ready to run the application');
console.log('\nRun one of:');
console.log('  npm run dev');
console.log('  yarn dev');
console.log('  pnpm dev\n');