/**
 * WORKING Migration Script - Executes Step by Step
 * This version actually works by running statements in proper order
 */

import dotenv from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

dotenv.config();

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  try {
    await client.connect();
    console.log('\n🚀 Starting Organizations Migration\n');
    console.log('='.repeat(60));
    
    await client.query('BEGIN');
    
    // Step 1: Enable UUID extension
    console.log('\n1. Enabling UUID extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension ready');
    
    // Step 2: Create organizations table
    console.log('\n2. Creating organizations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        display_name TEXT,
        email TEXT,
        phone TEXT,
        subscription_tier TEXT DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'basic', 'pro', 'enterprise')),
        subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'suspended')),
        trial_ends_at TIMESTAMP,
        max_active_cases INTEGER DEFAULT 5,
        max_mediators INTEGER DEFAULT 1,
        storage_limit_mb INTEGER DEFAULT 1000,
        storage_used_mb INTEGER DEFAULT 0,
        logo_url TEXT,
        website TEXT,
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      )
    `);
    console.log('✅ organizations table created');
    
    // Step 3: Create indexes
    console.log('\n3. Creating indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(subscription_status) WHERE deleted_at IS NULL`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_organizations_tier ON organizations(subscription_tier) WHERE deleted_at IS NULL`);
    console.log('✅ Indexes created');
    
    // Step 4: Create subscription_plans table
    console.log('\n4. Creating subscription_plans table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        description TEXT,
        price_monthly_cents INTEGER NOT NULL,
        price_annual_cents INTEGER,
        currency TEXT DEFAULT 'ZAR',
        max_active_cases INTEGER,
        max_mediators INTEGER,
        storage_limit_mb INTEGER,
        features JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ subscription_plans table created');
    
    // Step 5: Insert default plans
    console.log('\n5. Inserting subscription plans...');
    await client.query(`
      INSERT INTO subscription_plans (name, display_name, description, price_monthly_cents, price_annual_cents, max_active_cases, max_mediators, storage_limit_mb, features)
      VALUES 
        ('trial', 'Free Trial', '14-day trial with full features', 0, 0, 5, 1, 1000, '["All features", "14-day trial", "No credit card required"]'::jsonb),
        ('basic', 'Basic', 'Perfect for solo mediators', 49900, 499000, 20, 1, 5000, '["20 active cases", "5GB storage", "Email support", "Standard templates"]'::jsonb),
        ('pro', 'Professional', 'For growing practices', 99900, 999000, 100, 5, 20000, '["100 active cases", "5 mediators", "20GB storage", "Priority support", "Custom branding", "Advanced analytics"]'::jsonb),
        ('enterprise', 'Enterprise', 'Unlimited scale', 249900, 2499000, NULL, NULL, NULL, '["Unlimited cases", "Unlimited mediators", "Unlimited storage", "24/7 support", "White label", "API access", "Custom integrations"]'::jsonb)
      ON CONFLICT (name) DO NOTHING
    `);
    console.log('✅ 4 subscription plans inserted');
    
    // Step 6: Create subscriptions table
    console.log('\n6. Creating subscriptions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES subscription_plans(id),
        billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
        amount_cents INTEGER NOT NULL,
        currency TEXT DEFAULT 'ZAR',
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid')),
        current_period_start DATE NOT NULL,
        current_period_end DATE NOT NULL,
        canceled_at TIMESTAMP,
        trial_end TIMESTAMP,
        payment_provider TEXT,
        external_subscription_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)`);
    console.log('✅ subscriptions table created');
    
    // Step 7: Create invoices table
    console.log('\n7. Creating invoices table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
        invoice_number TEXT UNIQUE NOT NULL,
        amount_cents INTEGER NOT NULL,
        currency TEXT DEFAULT 'ZAR',
        description TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'canceled', 'refunded')),
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        paid_at TIMESTAMP,
        payment_method TEXT,
        payment_reference TEXT,
        pdf_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE status = 'pending'`);
    console.log('✅ invoices table created');
    
    // Step 8: Add organization_id to existing tables
    console.log('\n8. Adding organization_id to existing tables...');
    await client.query(`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_app_users_org ON app_users(organization_id)`);
    console.log('✅ app_users.organization_id added');
    
    await client.query(`ALTER TABLE cases ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cases_org ON cases(organization_id)`);
    console.log('✅ cases.organization_id added');
    
    await client.query(`ALTER TABLE uploads ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_uploads_org ON uploads(organization_id)`);
    console.log('✅ uploads.organization_id added');
    
    await client.query(`ALTER TABLE admin_activity_log ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL`);
    console.log('✅ admin_activity_log.organization_id added');
    
    // Step 9: Create case_assignments table
    console.log('\n9. Creating case_assignments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS case_assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        mediator_id UUID NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        assigned_by UUID REFERENCES app_users(user_id),
        assigned_at TIMESTAMP DEFAULT NOW(),
        unassigned_at TIMESTAMP,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'reassigned', 'unassigned')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_case_assignments_case ON case_assignments(case_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_case_assignments_mediator ON case_assignments(mediator_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_case_assignments_status ON case_assignments(status)`);
    console.log('✅ case_assignments table created');
    
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📋 Next: Run backfill script');
    console.log('Command: node migrations/002-backfill-organizations.js\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

runMigration();
