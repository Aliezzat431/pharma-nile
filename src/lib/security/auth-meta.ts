

import { User } from '@supabase/supabase-js';



export const NULL_UUID = '00000000-0000-0000-0000-000000000000';

export type SecureUserMetadata = {
  pharmacyId: string;
  chainId: string;
  role: 'chain_admin' | 'admin' | 'manager' | 'staff' | 'developer';
  fullName: string;
};


export function getSafeMetadata(user: User | null | undefined): SecureUserMetadata {
  if (!user || !user.user_metadata) {
    return {
      pharmacyId: NULL_UUID,
      chainId: NULL_UUID,
      role: 'staff', 
      fullName: 'Anonymous User'
    };
  }

  const meta = user.user_metadata;
  
  
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


export function isPharmacyContextMissing(pharmacyId: string | null | undefined): boolean {
  return !pharmacyId || pharmacyId === NULL_UUID;
}
