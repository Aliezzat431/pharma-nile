// ============================================================
// src/lib/unitOptions.tsx
// ============================================================

export const treatmentTypes = [
  { id: "syrup_antibiotic",  name: "مضاد حيوي شرب",    baseUnit: "علبة", hasConversion: false },
  { id: "pill_antibiotic",   name: "مضاد حيوي برشام",  baseUnit: "علبة", units: ["علبة", "شريط", "قرص"], hasConversion: true },
  { id: "pill_normal",       name: "دواء عادي برشام",  baseUnit: "علبة", units: ["علبة", "شريط", "قرص"], hasConversion: true },
  { id: "syrup_normal",      name: "دواء شرب عادي",    baseUnit: "علبة", hasConversion: false },
  { id: "pill_vitamin",      name: "فيتامين برشام",    baseUnit: "علبة", units: ["علبة", "شريط", "قرص"], hasConversion: true },
  { id: "syrup_vitamin",     name: "فيتامين شرب",      baseUnit: "علبة", hasConversion: false },
  { id: "oral_drops",        name: "نقط فم",           baseUnit: "علبة", hasConversion: false },
  { id: "nasal_drops",       name: "قطرات أنف",        baseUnit: "علبة", hasConversion: false },
  { id: "eye_drops",         name: "قطرات عين",        baseUnit: "علبة", hasConversion: false },
  { id: "ear_drops",         name: "قطرات أذن",        baseUnit: "علبة", hasConversion: false },
  { id: "oral_spray",        name: "بخاخ فم",          baseUnit: "علبة", hasConversion: false },
  { id: "nasal_spray",       name: "بخاخ أنف",         baseUnit: "علبة", hasConversion: false },
  { id: "ointment",          name: "مرهم",             baseUnit: "علبة", hasConversion: false },
  { id: "suppository",       name: "لبوس",             baseUnit: "علبة", units: ["علبة", "شريط", "لبوسة"], hasConversion: true },
  { id: "injection",         name: "حقن",              baseUnit: "علبة", units: ["علبة", "أمبول"], hasConversion: true },
  { id: "insulin",           name: "أنسولين",          baseUnit: "علبة", units: ["علبة", "قلم"], hasConversion: true },
  { id: "effervescent",      name: "فوار",             baseUnit: "علبة", units: ["علبة", "كيس"], hasConversion: true },
  { id: "cosmetics",         name: "مستحضرات",         baseUnit: "علبة", hasConversion: false },
  { id: "tablet",            name: "أقراص",            baseUnit: "علبة", units: ["علبة", "شريط", "قرص"], hasConversion: true },
  { id: "capsule",           name: "كبسولات",          baseUnit: "علبة", units: ["علبة", "شريط", "كبسولة"], hasConversion: true },
];

// ✅ دالة للحصول على الاسم العربي للنوع
export const getTypeDisplayName = (typeId: string): string => {
  // معالجة الأنواع التي قد تكون بالعربي بالفعل
  const arabicTypes = ['لبوس', 'قطرات عين', 'قطرات أنف', 'قطرات أذن', 'أقراص', 'كبسولات'];
  if (arabicTypes.includes(typeId)) {
    return typeId;
  }
  
  // البحث في list الأنواع
  const found = treatmentTypes.find(t => t.id === typeId);
  if (found) {
    return found.name;
  }
  
  // معالجة الحالات الخاصة
  const typeMap: Record<string, string> = {
    'ear_drops': 'قطرات أذن',
    'eye_drops': 'قطرات عين',
    'nasal_drops': 'قطرات أنف',
    'suppository': 'لبوس',
    'tablet': 'أقراص',
    'capsule': 'كبسولات',
    'injection': 'حقن',
    'ointment': 'مرهم',
    'syrup': 'شراب',
    'drops': 'نقط',
    'spray': 'بخاخ',
    'cream': 'كريم',
    'gel': 'جل',
    'powder': 'بودرة',
    'solution': 'محلول'
  };
  
  return typeMap[typeId] || typeId;
};

// ✅ دالة getMultiplier - لحساب مضاعف الوحدة
export const getMultiplier = (prod: any, selectedUnit: string, customPills = 10): number => {
  const conv = Number(prod.unit_conversion || prod.unitConversion || 1);
  const baseUnit = prod.unit || "علبة";
  
  if (!selectedUnit || selectedUnit === baseUnit) return 1; // 1 Box
  
  if (selectedUnit === "شريط") return conv; // Number of strips

  if (selectedUnit === "قرص" || selectedUnit === "كبسولة" || selectedUnit === "قطعة" || selectedUnit === "لبوسة") {
    return conv * customPills; // Number of strips * pills per strip
  }

  return conv;
};

// ✅ typesWithUnits - للتوافق مع الكود القديم
export const typesWithUnits: Record<string, string[]> = {};

// بناء typesWithUnits من treatmentTypes
treatmentTypes.forEach((type) => {
  const units = (type.hasConversion && type.units)
    ? type.units
    : [type.baseUnit];
  
  // تسجيل بالاسم العربي و ID
  typesWithUnits[type.name] = units;
  typesWithUnits[type.id] = units;
});

// Aliases and fallbacks for imported types from files
typesWithUnits['tablet'] = ["علبة", "شريط", "قرص"];
typesWithUnits['drops'] = ["علبة"];
typesWithUnits['suppository'] = ["علبة", "شريط", "لبوسة"];
typesWithUnits['injection'] = ["علبة", "أمبول"];