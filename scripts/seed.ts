// scripts/seed.ts
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(connectionString);

const productDescription = `Speed: 4G/LTE/5G
Valid for 30 Days
Free Activation at Our Counter`;

const productFeatures = [
  "Speed: 4G/LTE/5G",
  "Valid for 30 Days", 
  "Free Activation at Our Counter"
];

const seedData = async () => {
  console.log('Seeding data...\n');

  // 1. Create Admin User
  const adminEmail = 'badekshop@gmail.com';
  const adminPassword = 'bali2026';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const adminId = '00000000-0000-0000-0000-000000000001';

  // Check if admin exists
  const existingAdmin = await sql`SELECT id FROM profiles WHERE email = ${adminEmail}`;
  
  if (existingAdmin.length === 0) {
    // Create better-auth user
    await sql`
      INSERT INTO "user" (id, email, name, email_verified, created_at, updated_at)
      VALUES (${adminId}, ${adminEmail}, 'BadekShop Admin', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `;

    // Create better-auth account with password
    await sql`
      INSERT INTO account (id, user_id, account_id, provider_id, password, created_at, updated_at)
      VALUES ('acc-admin-001', ${adminId}, ${adminEmail}, 'credential', ${hashedPassword}, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `;

    // Create profile
    await sql`
      INSERT INTO profiles (id, email, name, role, created_at, updated_at)
      VALUES (${adminId}, ${adminEmail}, 'BadekShop Admin', 'admin', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `;

    console.log('✓ Admin user created');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log(`  Note: Login at http://localhost:3000/admin/login\n`);
  } else {
    console.log('✓ Admin user already exists\n');
  }

  // 2. Create Products
  const products = [
    // eSIM Products
    {
      name: 'Bali Unlimited 3 Days',
      category: 'esim',
      duration: 3,
      price: 150000,
      stock: 999,
      features: productFeatures,
    },
    {
      name: 'Bali Unlimited 7 Days',
      category: 'esim',
      duration: 7,
      price: 300000,
      stock: 999,
      features: productFeatures,
    },
    {
      name: 'Bali Unlimited 14 Days',
      category: 'esim',
      duration: 14,
      price: 500000,
      stock: 999,
      features: productFeatures,
    },
    {
      name: 'Bali Unlimited 30 Days',
      category: 'esim',
      duration: 30,
      price: 850000,
      stock: 999,
      features: productFeatures,
    },
    // SIM Card Products
    {
      name: 'Nano SIM 7 Days',
      category: 'sim_card',
      size: 'nano',
      duration: 7,
      price: 250000,
      stock: 100,
      features: productFeatures,
    },
    {
      name: 'Nano SIM 14 Days',
      category: 'sim_card',
      size: 'nano',
      duration: 14,
      price: 450000,
      stock: 100,
      features: productFeatures,
    },
    {
      name: 'Nano SIM 30 Days',
      category: 'sim_card',
      size: 'nano',
      duration: 30,
      price: 750000,
      stock: 100,
      features: productFeatures,
    },
  ];

  for (const product of products) {
    // Check if product exists
    const existing = await sql`SELECT id FROM products WHERE name = ${product.name}`;
    
    if (existing.length === 0) {
      await sql`
        INSERT INTO products (
          name, 
          description, 
          category, 
          duration, 
          size, 
          price, 
          stock, 
          is_active,
          features,
          created_at, 
          updated_at
        )
        VALUES (
          ${product.name},
          ${productDescription},
          ${product.category},
          ${product.duration || null},
          ${product.size || null},
          ${product.price},
          ${product.stock},
          true,
          ${JSON.stringify(product.features)},
          NOW(),
          NOW()
        )
      `;
      console.log(`✓ Created: ${product.name} - Rp ${product.price.toLocaleString('id-ID')}`);
    } else {
      console.log(`✓ Already exists: ${product.name}`);
    }
  }

  // 3. Create Default Refund Policy
  const existingPolicy = await sql`SELECT id FROM refund_policies WHERE name = 'default_policy'`;
  
  if (existingPolicy.length === 0) {
    await sql`
      INSERT INTO refund_policies (
        name,
        description,
        is_enabled,
        admin_fee_type,
        admin_fee_value,
        auto_refund_on_expiry,
        auto_refund_on_rejection,
        auto_refund_on_cancellation,
        created_at,
        updated_at
      )
      VALUES (
        'default_policy',
        'Default refund policy for all orders',
        true,
        'percentage',
        5,
        false,
        false,
        false,
        NOW(),
        NOW()
      )
    `;
    console.log('\n✓ Default refund policy created (5% admin fee)');
  } else {
    console.log('\n✓ Default refund policy already exists');
  }

  console.log('\n✅ Seed data completed!');
  console.log('\n--- Login Credentials ---');
  console.log(`Admin URL: http://localhost:3000/admin/login`);
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log('-------------------------\n');
};

seedData().catch(console.error);
