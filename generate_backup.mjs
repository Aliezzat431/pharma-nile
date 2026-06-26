import fs from 'fs';
import crypto from 'crypto';

function uuidv4() {
  return crypto.randomUUID();
}

function generateBarcode() {
  return '622' + Math.floor(100000000 + Math.random() * 900000000).toString();
}

function generateExpiryDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1 + Math.floor(Math.random() * 3));
  date.setMonth(Math.floor(Math.random() * 12));
  return date.toISOString().split('T')[0];
}

const egyptianMedicines = [
  { name: "Augmentin 1g", type: "Pill Antibiotic", unit: "Box", company: "GSK", unit_conversion: 2, price: 90 },
  { name: "Flumox 1g", type: "Pill Antibiotic", unit: "Box", company: "EIPICO", unit_conversion: 2, price: 52 },
  { name: "Flumox 500mg", type: "Pill Antibiotic", unit: "Box", company: "EIPICO", unit_conversion: 2, price: 40 },
  { name: "Hibiotic 1g", type: "Pill Antibiotic", unit: "Box", company: "Amoun", unit_conversion: 2, price: 95 },
  { name: "Curam 1g", type: "Pill Antibiotic", unit: "Box", company: "Sandoz", unit_conversion: 2, price: 110 }
];

const targetCount = 500;
const backup = {
  products: [],
  batches: [],
  pharmacies: [],
  companies: [],
  customers: [],
  orders: [],
  order_items: [],
  debt_payments: [],
  exported_at: new Date().toISOString()
};

let currentCounter = 1;
const count = 500;

for (let i = 0; i < count; i++) {
  const med = egyptianMedicines[i % egyptianMedicines.length];
  
  const originalName = med.name;
  med.name = `${originalName} #${currentCounter}`;
  if ((i + 1) % egyptianMedicines.length === 0) currentCounter++;

  const product = {
    id: uuidv4(),
    name: med.name,
    type: med.type,
    unit: med.unit,
    unit_conversion: med.unit_conversion,
    company: med.company,
    inventory_method: 'FEFO',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const batch = {
    id: uuidv4(),
    product_id: product.id,
    barcode: generateBarcode(),
    quantity: Math.floor(Math.random() * 40) + 15,
    purchase_price: Math.floor(med.price * 0.8),
    selling_price: med.price,
    expiry_date: generateExpiryDate(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  backup.products.push(product);
  backup.batches.push(batch);

  // revert name for next iteration base
  med.name = originalName;
}

fs.writeFileSync('500_treatments_backup.json', JSON.stringify(backup, null, 2));

console.log(`✅ Successfully generated backup with ${backup.products.length} products and ${backup.batches.length} batches.`);
