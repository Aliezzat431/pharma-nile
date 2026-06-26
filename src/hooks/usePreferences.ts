import { useState, useEffect } from 'react';

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

export function usePreferences() {
  const [preferences, setPreferences] = useState<SystemPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pharma-preferences');
      if (stored) {
        setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load preferences from local storage', e);
    }
    setIsLoaded(true);
  }, []);

  const updatePreference = <K extends keyof SystemPreferences>(key: K, value: SystemPreferences[K]) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, [key]: value };
      localStorage.setItem('pharma-preferences', JSON.stringify(newPrefs));
      return newPrefs;
    });
  };
  
  const updateMultiplePreferences = (newPrefsPartial: Partial<SystemPreferences>) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, ...newPrefsPartial };
      localStorage.setItem('pharma-preferences', JSON.stringify(newPrefs));
      return newPrefs;
    });
  }

  return { preferences, updatePreference, updateMultiplePreferences, isLoaded };
}
