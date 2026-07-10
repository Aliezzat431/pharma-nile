/**
 * PharmaNile Auth Metadata Guards
 * Provides safe, type-guaranteed accessors for user profile claims.
 * Encapsulates fallback behaviours including the NULL_UUID pattern for isolation structures.
 */

import { User } from '@supabase/supabase-js';

// The NULL_UUID is a placeholder UUID used when pharmacy context is absent
// to prevent SQL syntax errors in UUID columns and preserve application integrity.
export const NULL_UUID = '00000000-0000-0000-0000-000000000000';

export type SecureUserMetadata = {
  pharmacyId: string;
  chainId: string;
  role: 'chain_admin' | 'admin' | 'manager' | 'staff' | 'developer';
  fullName: string;
};

/**
 * Extracts and validates Supabase User Metadata with strict fallback patterns.
 */
export function getSafeMetadata(user: User | null | undefined): SecureUserMetadata {
  if (!user || !user.user_metadata) {
    return {
      pharmacyId: NULL_UUID,
      chainId: NULL_UUID,
      role: 'staff', // Absolute minimum accessibility default
      fullName: 'Anonymous User'
    };
  }

  const meta = user.user_metadata;
  
  // Safe cast for roles with validated fallback
  let role: SecureUserMetadata['role'] = 'staff';
  const rawRole = meta.role;
  if (['chain_admin', 'admin', 'manager', 'staff', 'developer'].includes(rawRole)) {
    role = rawRole as SecureUserMetadata['role'];
  }

  return {
    pharmacyId: typeof meta.pharmacy_id === 'string' && meta.pharmacy_id ? meta.pharmacy_id : NULL_UUID,
    chainId: typeof meta.chain_id === 'string' && meta.chain_id ? meta.chain_id : NULL_UUID,
    role,
    fullName: typeof meta.full_name === 'string' ? meta.full_name : 'Staff Member'
  };
}

/**
 * Checks if the pharmacy context is missing (equal to NULL_UUID or empty).
 */
export function isPharmacyContextMissing(pharmacyId: string | null | undefined): boolean {
  return !pharmacyId || pharmacyId === NULL_UUID;
}
