import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

// Load env manually
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql_conn = neon(connectionString);
const db = drizzle(sql_conn, { schema });

async function runMigration() {
  console.log('Running migration: add pickup_reminder_sent column...');

  try {
    // Add pickup_reminder_sent column to orders
    await db.execute(sql`
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pickup_reminder_sent" boolean DEFAULT false;
    `);

    console.log('✅ Migration completed successfully');
    console.log('✅ Added pickup_reminder_sent column to orders table');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

runMigration();
