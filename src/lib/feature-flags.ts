

export interface FeatureFlags {
  aiFeatures: boolean;
  offlineMode: boolean;
  stockTransfers: boolean;
  realtimeSubscriptions: boolean;
  advancedReports: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  aiFeatures: true,
  offlineMode: true,
  stockTransfers: true,
  realtimeSubscriptions: true,
  advancedReports: false, 
};

export const features = {
  
  getAll(): FeatureFlags {
    return {
      aiFeatures: process.env.NEXT_PUBLIC_FLAG_AI_FEATURES !== 'false' && DEFAULT_FLAGS.aiFeatures,
      offlineMode: process.env.NEXT_PUBLIC_FLAG_OFFLINE_MODE !== 'false' && DEFAULT_FLAGS.offlineMode,
      stockTransfers: process.env.NEXT_PUBLIC_FLAG_STOCK_TRANSFERS !== 'false' && DEFAULT_FLAGS.stockTransfers,
      realtimeSubscriptions: process.env.NEXT_PUBLIC_FLAG_REALTIME_SUBS !== 'false' && DEFAULT_FLAGS.realtimeSubscriptions,
      advancedReports: process.env.NEXT_PUBLIC_FLAG_ADVANCED_REPORTS === 'true' || DEFAULT_FLAGS.advancedReports,
    };
  },

  
  isEnabled(feature: keyof FeatureFlags): boolean {
    const flags = this.getAll();
    return flags[feature];
  }
};
