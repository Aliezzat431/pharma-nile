import re
import uuid
from datetime import datetime

def parse_date(date_str):
    date_str = date_str.strip()
    # Try DD/MM/YYYY
    try:
        dt = datetime.strptime(date_str, '%d/%m/%Y')
        return dt.strftime('%Y-%m-%d')
    except ValueError:
        pass
    
    # Try MM/YYYY
    try:
        dt = datetime.strptime(date_str, '%m/%Y')
        return dt.strftime('%Y-%m-01')
    except ValueError:
        pass
    
    # Try MM/YY
    try:
        dt = datetime.strptime(date_str, '%m/%y')
        return dt.strftime('20%y-%m-01')
    except ValueError:
        pass
    
    # Default fallback
    return '2027-01-01'

def generate_sql():
    with open('filler.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    pharmacy_id = "00000000-0000-0000-0000-000000000001"
    
    sql_header = f"""
-- Seed Data for Pharmacy
INSERT INTO pharmacies (id, name, address, phone, is_active)
VALUES ('{pharmacy_id}', 'صيدلية النيل النموذجية', 'القاهرة، مصر', '0123456789', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pharmacy_settings (pharmacy_id, pharmacy_name, inventory_method)
VALUES ('{pharmacy_id}', 'صيدلية النيل النموذجية', 'FEFO')
ON CONFLICT (pharmacy_id) DO NOTHING;
"""
    
    sql_body = []
    
    # Skip header lines
    # Line 0: مستحضرات
    # Line 1: الاسم،الباركود،التاريخ،السعر
    for line in lines[2:]:
        line = line.strip()
        if not line: continue
        
        # Remove leading comma if exists
        if line.startswith(','):
            line = line[1:]
            
        parts = [p.strip() for p in line.split(',')]
        if len(parts) < 4: continue
        
        name = parts[0]
        barcode = parts[1]
        expiry_raw = parts[2]
        sale_price = float(parts[3])
        company = parts[4] if len(parts) > 4 else "غير محدد"
        
        product_id = str(uuid.uuid4())
        expiry_date = parse_date(expiry_raw)
        purchase_price = round(sale_price * 0.8, 2)
        
        # Product insert
        sql_body.append(f"INSERT INTO products (id, pharmacy_id, name, barcode, company_name, price, category) VALUES ('{product_id}', '{pharmacy_id}', '{name}', '{barcode}', '{company}', {sale_price}, 'مستحضرات');")
        
        # Batch insert (assume 2 initial quantity)
        sql_body.append(f"INSERT INTO batches (product_id, pharmacy_id, barcode, batch_number, quantity, expiry_date, purchase_price, sale_price) VALUES ('{product_id}', '{pharmacy_id}', '{barcode}', 'B-{barcode[-4:] if len(barcode)>4 else '001'}', 2, '{expiry_date}', {purchase_price}, {sale_price});")

    with open('seed_data.sql', 'w', encoding='utf-8') as f:
        f.write(sql_header)
        f.write("\n".join(sql_body))

if __name__ == "__main__":
    generate_sql()
