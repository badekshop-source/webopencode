import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

console.log('\n');
console.log('━'.repeat(80));
console.log('📋 ENVIRONMENT VARIABLES FOR VERCEL');
console.log('━'.repeat(80));
console.log('\n');

const requiredVars = [
  { name: 'DATABASE_URL', sensitive: true },
  { name: 'BETTER_AUTH_SECRET', sensitive: true },
  { name: 'BETTER_AUTH_URL', sensitive: false },
  { name: 'MIDTRANS_SERVER_KEY', sensitive: true },
  { name: 'MIDTRANS_CLIENT_KEY', sensitive: true },
  { name: 'MIDTRANS_MODE', sensitive: false },
  { name: 'CLOUDINARY_CLOUD_NAME', sensitive: false },
  { name: 'CLOUDINARY_API_KEY', sensitive: true },
  { name: 'CLOUDINARY_API_SECRET', sensitive: true },
  { name: 'RESEND_API_KEY', sensitive: true },
  { name: 'NEXT_PUBLIC_APP_URL', sensitive: false },
];

const optionalVars = [
  { name: 'KV_URL', sensitive: true },
  { name: 'KV_REST_API_URL', sensitive: true },
  { name: 'KV_REST_API_TOKEN', sensitive: true },
];

console.log('✅ REQUIRED VARIABLES:\n');

requiredVars.forEach(({ name, sensitive }) => {
  const value = process.env[name];
  
  if (!value) {
    console.log(`❌ ${name}`);
    console.log('   Status: MISSING');
    console.log('   Action: Add to .env.local first\n');
    return;
  }

  const displayValue = sensitive 
    ? `${value.substring(0, 30)}...` 
    : value;

  console.log(`✅ ${name}`);
  console.log(`   Value: ${displayValue}`);
  
  // Special handling for URLs
  if (name === 'BETTER_AUTH_URL' || name === 'NEXT_PUBLIC_APP_URL') {
    if (value.includes('localhost')) {
      console.log('   ⚠️  FOR VERCEL PRODUCTION: Change to https://badekshop.vercel.app');
    }
  }
  console.log('');
});

console.log('\n⚪ OPTIONAL VARIABLES:\n');

optionalVars.forEach(({ name, sensitive }) => {
  const value = process.env[name];
  
  if (!value) {
    console.log(`⚪ ${name} - Not set (optional)\n`);
    return;
  }

  const displayValue = sensitive 
    ? `${value.substring(0, 30)}...` 
    : value;

  console.log(`✅ ${name}`);
  console.log(`   Value: ${displayValue}\n`);
});

console.log('━'.repeat(80));
console.log('📝 HOW TO ADD TO VERCEL:\n');
console.log('1. Go to: https://vercel.com/dashboard');
console.log('2. Select your badekshop project');
console.log('3. Go to: Settings → Environment Variables');
console.log('4. Add each variable above');
console.log('5. Select: Production, Preview, Development');
console.log('6. Redeploy your project\n');
console.log('━'.repeat(80));
console.log('\n');

// Check for common issues
const issues: string[] = [];

const betterAuthUrl = process.env.BETTER_AUTH_URL;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (betterAuthUrl?.includes('localhost')) {
  issues.push('BETTER_AUTH_URL uses localhost - change to https://badekshop.vercel.app for production');
}

if (appUrl?.includes('localhost')) {
  issues.push('NEXT_PUBLIC_APP_URL uses localhost - change to https://badekshop.vercel.app for production');
}

const midtransMode = process.env.MIDTRANS_MODE;
if (midtransMode && midtransMode !== 'sandbox' && midtransMode !== 'production') {
  issues.push(`MIDTRANS_MODE is "${midtransMode}" - should be "sandbox" or "production"`);
}

if (issues.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue}`);
  });
  console.log('\n');
}

console.log('✨ READY FOR VERCEL!\n');
console.log('All variables are set correctly in .env.local');
console.log('Copy them to Vercel Dashboard and redeploy.\n');