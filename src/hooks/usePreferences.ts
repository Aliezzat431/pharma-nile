import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface SystemPreferences {
  pharmacyName: string;
  email: string;
  phone: string;
  address: string;
  inventoryMethod: 'FEFO' | 'FIFO' | 'LIFO';
  stockAlertThreshold: number;
  taxPercentage: number;
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
  taxPercentage: 14,
  printerSize: '80mm',
  returnDaysLimit: 14,
  emailReports: true,
  expiryAlerts: false
};

const mapDbToPrefs = (data: any): SystemPreferences => ({
  pharmacyName: data.pharmacy_name ?? defaultPreferences.pharmacyName,
  email: data.email ?? defaultPreferences.email,
  phone: data.phone ?? defaultPreferences.phone,
  address: data.address ?? defaultPreferences.address,
  inventoryMethod: (data.inventory_method as any) ?? defaultPreferences.inventoryMethod,
  stockAlertThreshold: data.stock_alert_threshold ?? defaultPreferences.stockAlertThreshold,
  taxPercentage: data.tax_percentage ?? defaultPreferences.taxPercentage,
  printerSize: (data.printer_size as any) ?? defaultPreferences.printerSize,
  returnDaysLimit: data.return_days_limit ?? defaultPreferences.returnDaysLimit,
  emailReports: data.email_reports ?? defaultPreferences.emailReports,
  expiryAlerts: data.expiry_alerts ?? defaultPreferences.expiryAlerts,
});

const mapPrefsToDb = (prefs: Partial<SystemPreferences>) => {
  const db: any = {};
  if (prefs.pharmacyName !== undefined) db.pharmacy_name = prefs.pharmacyName;
  if (prefs.email !== undefined) db.email = prefs.email;
  if (prefs.phone !== undefined) db.phone = prefs.phone;
  if (prefs.address !== undefined) db.address = prefs.address;
  if (prefs.inventoryMethod !== undefined) db.inventory_method = prefs.inventoryMethod;
  if (prefs.stockAlertThreshold !== undefined) db.stock_alert_threshold = prefs.stockAlertThreshold;
  if (prefs.taxPercentage !== undefined) db.tax_percentage = prefs.taxPercentage;
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

  useEffect(() => {
    if (!pharmacyId) {
      // If not logged in, try local storage fallback or just use defaults
      const stored = localStorage.getItem('pharma-preferences');
      if (stored) {
        setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
      }
      setIsLoaded(true);
      return;
    }

    const fetchPrefs = async () => {
      try {
        const { data, error } = await supabase
          .from('pharmacy_settings')
          .select('*')
          .eq('pharmacy_id', pharmacyId)
          .maybeSingle();

        if (data) {
          setPreferences(mapDbToPrefs(data));
        } else if (!error) {
          // If no settings exist yet for this pharmacy, create them
          await supabase.from('pharmacy_settings').insert([{ pharmacy_id: pharmacyId, pharmacy_name: user?.user_metadata?.pharmacy_name || 'صيدليتي' }]);
        }
      } catch (e) {
        console.error('Failed to load preferences from DB', e);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchPrefs();
  }, [pharmacyId]);

  const updatePreference = async <K extends keyof SystemPreferences>(key: K, value: SystemPreferences[K]) => {
    // Update local state immediately
    setPreferences(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('pharma-preferences', JSON.stringify(updated));
      return updated;
    });

    // Sync to DB if available
    if (pharmacyId) {
      try {
        const dbUpdate = mapPrefsToDb({ [key]: value });
        await supabase
          .from('pharmacy_settings')
          .update(dbUpdate)
          .eq('pharmacy_id', pharmacyId);
      } catch (e) {
        console.error('Failed to update preference in DB', e);
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
        await supabase
          .from('pharmacy_settings')
          .update(dbUpdate)
          .eq('pharmacy_id', pharmacyId);
      } catch (e) {
        console.error('Failed to update multiple preferences in DB', e);
      }
    }
  };

  return { preferences, updatePreference, updateMultiplePreferences, isLoaded };
}
