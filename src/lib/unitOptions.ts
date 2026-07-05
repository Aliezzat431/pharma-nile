export const treatmentTypes = [
  { id: "syrup_antibiotic", name: "مضاد حيوي شرب", baseUnit: "علبة", hasConversion: false },
  { id: "pill_antibiotic", name: "مضاد حيوي برشام", baseUnit: "علبة", units: ["علبة", "شريط", "قرص"], hasConversion: true },
  { id: "pill_normal", name: "دواء عادي برشام", baseUnit: "علبة", units: ["علبة", "شريط", "قرص"], hasConversion: true },
  { id: "syrup_normal", name: "دواء شرب عادي", baseUnit: "علبة", hasConversion: false },
  { id: "pill_vitamin", name: "فيتامين برشام", baseUnit: "علبة", units: ["علبة", "شريط", "قرص"], hasConversion: true },
  { id: "syrup_vitamin", name: "فيتامين شرب", baseUnit: "علبة", hasConversion: false },
  { id: "oral_drops", name: "نقط فم", baseUnit: "علبة", hasConversion: false },
  { id: "nasal_drops", name: "قطرات أنف", baseUnit: "علبة", hasConversion: false },
  { id: "eye_drops", name: "قطرات عين", baseUnit: "علبة", hasConversion: false },
  { id: "ear_drops", name: "قطرات أذن", baseUnit: "علبة", hasConversion: false },
  { id: "oral_spray", name: "بخاخ فم", baseUnit: "علبة", hasConversion: false },
  { id: "nasal_spray", name: "بخاخ أنف", baseUnit: "علبة", hasConversion: false },
  { id: "ointment", name: "مرهم", baseUnit: "علبة", hasConversion: false },
  { id: "suppository", name: "لبوس", baseUnit: "علبة", units: ["علبة", "شريط", "لبوسة"], hasConversion: true },
  { id: "injection", name: "حقن", baseUnit: "علبة", units: ["علبة", "أمبول"], hasConversion: true },
  { id: "insulin", name: "أنسولين", baseUnit: "علبة", units: ["علبة", "قلم"], hasConversion: true },
  { id: "effervescent", name: "فوار", baseUnit: "علبة", units: ["علبة", "كيس"], hasConversion: true },
  { id: "cosmetics", name: "مستحضرات", baseUnit: "علبة", hasConversion: false },
  { id: "tablet", name: "أقراص", baseUnit: "علبة", units: ["علبة", "شريط", "قرص"], hasConversion: true },
  { id: "capsule", name: "كبسولات", baseUnit: "علبة", units: ["علبة", "شريط", "كبسولة"], hasConversion: true },
];

export const getTypeDisplayName = (typeId: string): string => {
  const found = treatmentTypes.find(t => t.id === typeId);
  return found ? found.name : typeId;
};

export const getMultiplier = (prod: any, selectedUnit: string, customPills: number = 10): number => {
  console.log('🧮 getMultiplier called with:', { prod, selectedUnit, customPills });
  const conv = Number(prod.unit_conversion || prod.unitConversion || 1);
  const baseUnit = prod.unit || "علبة";
  
  if (!selectedUnit || selectedUnit === baseUnit) {
    console.log('🧮 multiplier = 1 (same unit or no unit)');
    return 1;
  }
  
  if (selectedUnit === "شريط") {
    console.log(`🧮 multiplier = ${conv} (strip)`);
    return conv;
  }
  
  if (selectedUnit === "قرص" || selectedUnit === "كبسولة" || selectedUnit === "قطعة" || selectedUnit === "لبوسة") {
    const result = conv * customPills;
    console.log(`🧮 multiplier = ${result} (unit: ${selectedUnit}, conv: ${conv}, pills: ${customPills})`);
    return result;
  }
  
  console.log(`🧮 multiplier = ${conv} (fallback)`);
  return conv;
};

export const typesWithUnits: Record<string, string[]> = {};
treatmentTypes.forEach((type) => {
  const units = (type.hasConversion && type.units) ? type.units : [type.baseUnit];
  typesWithUnits[type.name] = units;
  typesWithUnits[type.id] = units;
});

typesWithUnits['tablet'] = ["علبة", "شريط", "قرص"];
typesWithUnits['drops'] = ["علبة"];
typesWithUnits['suppository'] = ["علبة", "شريط", "لبوسة"];
typesWithUnits['injection'] = ["علبة", "أمبول"];