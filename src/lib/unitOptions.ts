
export const treatmentTypes = [
  { id: "syrup_antibiotic",  name: "مضاد حيوي شرب",    baseUnit: "علبة", hasConversion: false },
  { id: "pill_antibiotic",   name: "مضاد حيوي برشام",  baseUnit: "علبة", units: ["علبة", "شريط", "قرص"], hasConversion: true },

  { id: "pill_normal",       name: "دواء عادي برشام",  baseUnit: "علبة", units: ["علبة", "شريط", "قرص"], hasConversion: true },
  { id: "syrup_normal",      name: "دواء شرب عادي",    baseUnit: "علبة", hasConversion: false },

  { id: "pill_vitamin",      name: "فيتامين برشام",    baseUnit: "علبة", units: ["علبة", "شريط", "قرص"], hasConversion: true },
  { id: "syrup_vitamin",     name: "فيتامين شرب",      baseUnit: "علبة", hasConversion: false },

  { id: "oral_drops",        name: "نقط فم",           baseUnit: "علبة", hasConversion: false },
  { id: "nasal_drops",       name: "نقط أنف",          baseUnit: "علبة", hasConversion: false },
  { id: "eye_drops",         name: "نقط عين",          baseUnit: "علبة", hasConversion: false },

  { id: "oral_spray",        name: "بخاخ فم",          baseUnit: "علبة", hasConversion: false },
  { id: "nasal_spray",       name: "بخاخ أنف",         baseUnit: "علبة", hasConversion: false },

  { id: "ointment",          name: "مرهم",             baseUnit: "علبة", hasConversion: false },
  { id: "suppository",       name: "لبوس",             baseUnit: "علبة", units: ["علبة", "شريط", "لبوسة"], hasConversion: true },

  { id: "injection",         name: "حقن",              baseUnit: "علبة", units: ["علبة", "أمبول"], hasConversion: true },
  { id: "insulin",           name: "أنسولين",          baseUnit: "علبة", units: ["علبة", "قلم"],   hasConversion: true },

  { id: "effervescent",      name: "فوار",             baseUnit: "علبة", units: ["علبة", "كيس"],   hasConversion: true },

  { id: "cosmetics",         name: "مستحضرات",        baseUnit: "علبة", hasConversion: false }
];

export const typesWithUnits = treatmentTypes.reduce((acc: Record<string, string[]>, type) => {
  acc[type.name] = (type.hasConversion && type.units)
    ? type.units
    : [type.baseUnit];
  return acc;
}, {});

export const getMultiplier = (prod: any, selectedUnit: string, customPills = 10) => {
    const conv = Number(prod.unit_conversion || prod.unitConversion || 1);
    const baseUnit = prod.unit || "علبة";
    
    if (!selectedUnit || selectedUnit === baseUnit) return 1; // 1 Box
    
    if (selectedUnit === "شريط") return conv; // Number of strips

    if (selectedUnit === "قرص" || selectedUnit === "كبسولة" || selectedUnit === "قطعة" || selectedUnit === "لبوسة") {
        return conv * customPills; // Number of strips * pills per strip
    }

    return conv;
};

