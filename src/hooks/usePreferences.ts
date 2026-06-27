import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface SystemPreferences {
  pharmacyName: string;
  email: string;
  phone: string;
  address: string;
  inventoryMethod: 'FEFO' | 'FIFO' | 'LIFO';
  stockAlertThreshold: number;
  printerSize: '80mm' | '58mm' | 'A4';
  returnDaysLimit: number;
  emailReports: boolean;
  expiryAlerts: boolean;
}

export const defaultPreferences: SystemPreferences = {
  pharmacyName: "صيدلية النيل - الفرع الرئيسي",
  email: "admin@pharmanile.com",
  phone: "+20 100 123 4567",
  address: "القاهرة، مصر - شارع النيل، مبنى رقم ٤٥",
  inventoryMethod: 'FEFO',
  stockAlertThreshold: 20,
  printerSize: '80mm',
  returnDaysLimit: 14,
  emailReports: true,
  expiryAlerts: false
};

const mapDbToPrefs = (data: any): SystemPreferences => {
  // CRITICAL: Numeric values from Postgres can arrive as strings. 
  // We MUST parse them to numbers, ensuring 0 is treated correctly.
  return {
    pharmacyName: data.pharmacy_name ?? defaultPreferences.pharmacyName,
    email: data.email ?? defaultPreferences.email,
    phone: data.phone ?? defaultPreferences.phone,
    address: data.address ?? defaultPreferences.address,
    inventoryMethod: (data.inventory_method as any) ?? defaultPreferences.inventoryMethod,
    stockAlertThreshold: data.stock_alert_threshold !== null && data.stock_alert_threshold !== undefined 
      ? Number(data.stock_alert_threshold) 
      : defaultPreferences.stockAlertThreshold,
    printerSize: (data.printer_size as any) ?? defaultPreferences.printerSize,
    returnDaysLimit: data.return_days_limit !== null && data.return_days_limit !== undefined 
      ? Number(data.return_days_limit) 
      : defaultPreferences.returnDaysLimit,
    emailReports: data.email_reports ?? defaultPreferences.emailReports,
    expiryAlerts: data.expiry_alerts ?? defaultPreferences.expiryAlerts,
  };
};

const mapPrefsToDb = (prefs: Partial<SystemPreferences>) => {
  const db: any = {};
  if (prefs.pharmacyName !== undefined) db.pharmacy_name = prefs.pharmacyName;
  if (prefs.email !== undefined) db.email = prefs.email;
  if (prefs.phone !== undefined) db.phone = prefs.phone;
  if (prefs.address !== undefined) db.address = prefs.address;
  if (prefs.inventoryMethod !== undefined) db.inventory_method = prefs.inventoryMethod;
  if (prefs.stockAlertThreshold !== undefined) db.stock_alert_threshold = prefs.stockAlertThreshold;

  if (prefs.printerSize !== undefined) db.printer_size = prefs.printerSize;
  if (prefs.returnDaysLimit !== undefined) db.return_days_limit = prefs.returnDaysLimit;
  if (prefs.emailReports !== undefined) db.email_reports = prefs.emailReports;
  if (prefs.expiryAlerts !== undefined) db.expiry_alerts = prefs.expiryAlerts;
  return db;
};

export function usePreferences() {
  const { user } = useAuth();
  const pharmacyId = user?.user_metadata?.pharmacy_id;
  const [preferences, setPreferences] = useState<SystemPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchPrefs = useCallback(async () => {
    if (!pharmacyId) return;
    
    try {
      const { data, error } = await supabase
        .from('pharmacy_settings')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const mapped = mapDbToPrefs(data);
        console.log('[Preferences] Loaded from DB:', mapped);
        setPreferences(mapped);
      } else {
        // No settings found, initialize them
        console.log('[Preferences] No settings found, initializing...');
        const initialData = { 
          pharmacy_id: pharmacyId, 
          pharmacy_name: user?.user_metadata?.pharmacy_name || defaultPreferences.pharmacyName 
        };
        const { data: newData, error: insertError } = await supabase
          .from('pharmacy_settings')
          .insert([initialData])
          .select()
          .single();
        
        if (!insertError && newData) {
          setPreferences(mapDbToPrefs(newData));
        }
      }
    } catch (e) {
      console.error('[Preferences] Error fetching:', e);
    } finally {
      setIsLoaded(true);
    }
  }, [pharmacyId, user]);

  useEffect(() => {
    if (!pharmacyId) {
      const stored = localStorage.getItem('pharma-preferences');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPreferences(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('[Preferences] Local storage parse error');
        }
      }
      // If auth is taking too long, we still mark as loaded so the UI doesn't hang
      const timeout = setTimeout(() => setIsLoaded(true), 1500);
      return () => clearTimeout(timeout);
    }

    fetchPrefs();
  }, [pharmacyId, fetchPrefs]);

  const updatePreference = async <K extends keyof SystemPreferences>(key: K, value: SystemPreferences[K]) => {
    // Update local state immediately for snappy UI
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('pharma-preferences', JSON.stringify(updated));
      return updated;
    });

    if (pharmacyId) {
      try {
        const dbUpdate = mapPrefsToDb({ [key]: value });
        console.log(`[Preferences] Syncing ${key} = ${value} to DB...`);
        const { error } = await supabase
          .from('pharmacy_settings')
          .upsert({ pharmacy_id: pharmacyId, ...dbUpdate });
        
        if (error) throw error;
        console.log(`[Preferences] ${key} synced successfully.`);
      } catch (e) {
        console.error(`[Preferences] Failed to sync ${key}:`, e);
      }
    }
  };
  
  const updateMultiplePreferences = async (newPrefsPartial: Partial<SystemPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPrefsPartial };
      localStorage.setItem('pharma-preferences', JSON.stringify(updated));
      return updated;
    });

    if (pharmacyId) {
      try {
        const dbUpdate = mapPrefsToDb(newPrefsPartial);
        const { error } = await supabase
          .from('pharmacy_settings')
          .upsert({ pharmacy_id: pharmacyId, ...dbUpdate });
        
        if (error) throw error;
      } catch (e) {
        console.error('[Preferences] Bulk sync failed:', e);
      }
    }
  };

  return { preferences, updatePreference, updateMultiplePreferences, isLoaded, refresh: fetchPrefs };
}
