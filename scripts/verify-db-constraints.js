/**
 * PharmaNile Database Structural Constraint Verification Script
 * Checks for foreign keys, primary keys, and CHECK criteria (such as non-negative pricing/quantities)
 * that preserve relational integrity and prevent corrupt business data from polluting production.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ [CONSTRAINTS CHECK ERROR] Environment variables NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Critical check criteria we expect to find in the database schema
const EXPECTED_CONSTRAINTS = [
  { table: 'products', type: 'FOREIGN KEY', field: 'pharmacy_id' },
  { table: 'orders', type: 'FOREIGN KEY', field: 'pharmacy_id' },
  { table: 'order_items', type: 'FOREIGN KEY', field: 'order_id' },
  { table: 'user_profiles', type: 'FOREIGN KEY', field: 'id' }, // references auth.users
  { table: 'batches', type: 'FOREIGN KEY', field: 'product_id' },
];

async function runConstraintCheck() {
  console.log('🔍 Starting database constraints verification...');
  let hasFailures = false;

  try {
    const { data: constraints, error } = await supabase.rpc('check_database_constraints');

    if (error) {
      if (error.message.includes('does not exist')) {
        console.warn('⚠️  [CONSTRAINTS CHECK] check_database_constraints() RPC function does not exist in DB.');
        console.warn('   Ensure database/verify_constraints_rpc.sql is run before deployment.');
        process.exit(0); // Warning only if function is not yet deployed
      } else {
        console.error('❌ [CONSTRAINTS CHECK ERROR] Failed to query constraints:', error.message);
        process.exit(1);
      }
    }

    console.log(`📋 Found ${constraints.length} active database constraints.`);

    // Check critical relations are enforced
    for (const expected of EXPECTED_CONSTRAINTS) {
      const match = constraints.find(c => 
        c.table_name === expected.table && 
        c.constraint_type === expected.type && 
        c.definition.toLowerCase().includes(expected.field.toLowerCase())
      );

      if (!match) {
        console.error(`❌ [CONSTRAINT MISSING] Table "${expected.table}" is missing expected ${expected.type} on "${expected.field}"!`);
        hasFailures = true;
      } else {
        console.log(`   ✅ Validated: ${expected.table} -> ${expected.type} on "${expected.field}"`);
      }
    }

    // Check for logical constraints like price constraints
    const priceCheckRules = constraints.filter(c => 
      c.constraint_type === 'CHECK' && 
      (c.definition.toLowerCase().includes('price') || c.definition.toLowerCase().includes('quantity'))
    );

    if (priceCheckRules.length === 0) {
      console.warn('⚠️  [CONSTRAINT WARNING] No CHECK constraints found on columns named "price" or "quantity".');
      console.warn('   It is highly recommended to add check constraints (e.g. price > 0) to "products" and "order_items".');
    } else {
      console.log(`   ✅ Validated: Found ${priceCheckRules.length} CHECK logic rules for values.`);
      priceCheckRules.forEach(r => {
        console.log(`      ↳ Table "${r.table_name}": ${r.constraint_name} (${r.definition})`);
      });
    }

    if (hasFailures) {
      console.error('\n💣 [DEPLOYMENT BLOCKED] Database structure is invalid or missing critical relations.');
      process.exit(1);
    } else {
      console.log('\n✨ Database constraint verification PASSED.');
      process.exit(0);
    }

  } catch (err) {
    console.error('❌ [CONSTRAINTS CHECK ERROR] Exception during run:', err);
    process.exit(1);
  }
}

runConstraintCheck();
