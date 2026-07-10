'use client';

import React, { useState, useCallback } from 'react';
import { 
  FileUp, Upload, CheckCircle2, AlertCircle, ChevronLeft,
  X, Plus, Loader2, Table as TableIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import GlassTable from '@/components/ui/GlassTable';

import { treatmentTypes } from '@/lib/unitOptions';

interface ParsedItem {
  name: string;
  barcode: string;
  expiry: string;
  sale_price: number;
  purchase_price: number;
  company: string;
  type?: string; 
  typeName?: string; 
  unit_quantity?: number;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export default function ImportInventoryPage() {
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [category, setCategory] = useState('مستحضرات');
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  const parseFile = async (file: File) => {
    console.group('📂 [File Parsing]');
    console.log('File:', file.name, 'Size:', file.size);
    setIsParsing(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      console.log(`Lines found: ${lines.length}`);
      
      if (lines.length < 2) {
        console.warn('File too short, aborting.');
        setItems([]);
        setIsParsing(false);
        console.groupEnd();
        return;
      }

      const rawCategoryName = lines[0]; 
      let finalCategory = 'مستحضرات';
      let defaultTypeId = 'cosmetics'; 

      
      const matchedType = treatmentTypes.find(t => 
        rawCategoryName.includes(t.name) || 
        rawCategoryName.toLowerCase().includes(t.id.toLowerCase())
      );

      if (matchedType) {
        finalCategory = matchedType.name;
        defaultTypeId = matchedType.id;
      } else {
        
        if (rawCategoryName.includes('عين')) {
            finalCategory = 'نقط عين';
            defaultTypeId = 'eye_drops';
        } else if (rawCategoryName.includes('أنف')) {
            finalCategory = 'نقط أنف';
            defaultTypeId = 'nasal_drops';
        } else if (rawCategoryName.includes('لبوس')) {
            finalCategory = 'لبوس';
            defaultTypeId = 'suppository';
        } else if (rawCategoryName.includes('حقن')) {
            finalCategory = 'حقن';
            defaultTypeId = 'injection';
        }
      }
      
      setCategory(finalCategory);
      console.log('Mapped Category:', finalCategory, '| Type ID:', defaultTypeId);

      const parsed: ParsedItem[] = [];

      for (let i = 1; i < lines.length; i++) {
        let line = lines[i];
        line = line.replace(/^[،,]+|[،,]+$/g, '');
        const parts = line.split(/[،,]/).map(p => p.trim());
        
        if (parts.length >= 4) {
          const salePrice = parseFloat(parts[3]);
          if (isNaN(salePrice)) {
            console.warn(`Line ${i + 1}: Invalid price "${parts[3]}"`);
            continue;
          }

          parsed.push({
            name: parts[0],
            barcode: parts[1],
            expiry: parts[2],
            sale_price: salePrice,
            purchase_price: Number((salePrice * 0.75).toFixed(2)),
            company: parts[4] || 'غير محدد',
            unit_quantity: parseInt(parts[5]) || 1, 
            type: defaultTypeId, 
            typeName: finalCategory, 
            status: 'pending'
          });
        }
      }

      console.log(`✅ Parsed ${parsed.length} items successfully`);
      if (parsed.length > 0) console.log('Sample item:', parsed[0]);
      setItems(parsed);
    } catch (err) {
      console.error('❌ Parse error:', err);
    } finally {
      setIsParsing(false);
      console.groupEnd();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) parseFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) parseFile(e.target.files[0]);
  };

  const startImport = async () => {
    console.group('🚀 [Start Import]');
    
    if (!user?.user_metadata?.pharmacy_id) {
      console.error('❌ No pharmacy_id in user metadata!');
      alert('خطأ: لا يوجد معرف للصيدلية في بيانات المستخدم!');
      console.groupEnd();
      return;
    }
    
    setIsImporting(true);
    setImportProgress(0);
    const pharmacyId = user.user_metadata.pharmacy_id;

    try {
      const formattedItems = items.map(item => {
        let formattedExpiry = item.expiry;
        const dateParts = item.expiry.split(/[\/\-.]/).map(p => p.trim());
        
        if (dateParts.length === 3) {
          const day = dateParts[0].padStart(2, '0');
          const month = dateParts[1].padStart(2, '0');
          const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
          formattedExpiry = `${year}-${month}-${day}`;
        } else if (dateParts.length === 2) {
          const month = dateParts[0].padStart(2, '0');
          const year = dateParts[1].length === 2 ? `20${dateParts[1]}` : dateParts[1];
          formattedExpiry = `${year}-${month}-15`;
        }

        return {
          name: item.name,
          barcode: item.barcode,
          expiry_date: formattedExpiry,
          sale_price: item.sale_price,
          purchase_price: item.purchase_price,
          company: item.company,
          type: item.type || 'cosmetics', 
          unit_quantity: item.unit_quantity || 1
        };
      });

      console.log(`📦 Sending ${formattedItems.length} items to RPC`);

      const { data, error } = await supabase.rpc('bulk_import_inventory', {
        p_pharmacy_id: pharmacyId,
        p_category: category,
        p_items: formattedItems
      });

      if (error) {
        console.error('❌ RPC Error:', error);
        throw error;
      }

      if (data?.errors && data.errors.length > 0) {
        console.warn('⚠️ Partial failures:', data.errors);
        const errorMap = new Map();
        data.errors.forEach((err: any) => {
          errorMap.set(err.barcode, err.error);
        });

        setItems(prev => prev.map(it => {
          const errMsg = errorMap.get(it.barcode);
          if (errMsg) {
            return { ...it, status: 'error', error: errMsg };
          }
          return { ...it, status: 'success' };
        }));

        setImportProgress(100);
        alert('حدثت بعض الأخطاء أثناء استيراد الأصناف. يرجى مراجعة الجدول.');
      } else {
        setItems(prev => prev.map(it => ({ ...it, status: 'success' })));
        setImportProgress(100);
        
        setTimeout(() => {
          console.log('Redirecting to /inventory...');
          router.push('/inventory');
        }, 1500);
      }

    } catch (err: any) {
      console.error('❌ Import Failed:', err);
      setItems(prev => prev.map(it => ({ ...it, status: 'error', error: err.message })));
    } finally {
      setIsImporting(false);
      console.groupEnd();
    }
  };

  const columns: any[] = [
    { header: 'الصنف', accessor: (it: ParsedItem) => it.name },
    { 
      header: 'النوع', 
      accessor: (it: ParsedItem) => it.typeName || treatmentTypes.find(t => t.id === it.type)?.name || it.type 
    },
    { header: 'الباركود', accessor: (it: ParsedItem) => it.barcode },
    { header: 'تاريخ الصلاحية', accessor: (it: ParsedItem) => it.expiry },
    { header: 'الوحدة/علبة', accessor: (it: ParsedItem) => it.unit_quantity },
    { header: 'سعر البيع', accessor: (it: ParsedItem) => `${it.sale_price} ج.م` },
    { 
      header: 'الحالة', 
      accessor: (it: ParsedItem) => (
        <div className="flex flex-col">
          <span className={it.status === 'success' ? 'text-green-400' : it.status === 'error' ? 'text-red-400' : 'text-gray-400'}>
            {it.status === 'success' ? 'تم بنجاح' : it.status === 'error' ? 'خطأ في الإدخال' : 'بانتظار البدء'}
          </span>
          {it.error && <span className="text-[10px] text-red-500/80 max-w-[150px] truncate">{it.error}</span>}
        </div>
      ) 
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 min-h-screen pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-4 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-cairo">العودة للمخزون</span>
          </button>
          <h1 className="text-4xl font-bold font-cairo tracking-tight">استيراد <span className="nile-gradient-text">المخزون</span></h1>
          <p className="text-gray-500 font-cairo text-lg">ارفع ملف نصي (.txt) لتعبئة المخزون بسرعة.</p>
        </div>

        {items.length > 0 && !isImporting && (
          <button 
            onClick={startImport}
            className="px-8 py-3 bg-[#00CED1] text-black rounded-2xl font-bold font-cairo flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#00CED1]/20"
          >
            <Plus className="w-5 h-5" />
            <span>بدء الاستيراد ({items.length} صنف)</span>
          </button>
        )}
      </header>

      {!items.length ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative border-2 border-dashed rounded-3xl p-20 flex flex-col items-center justify-center gap-6 transition-all cursor-pointer
            ${dragActive ? 'border-[#00CED1] bg-[#00CED1]/5 scale-[1.02]' : 'border-white/10 hover:border-white/20 bg-white/[0.02]'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input type="file" id="file-upload" className="hidden" accept=".txt" onChange={handleFileChange} />
          <div className="p-6 rounded-full bg-[#00CED1]/10 text-[#00CED1]">
            <Upload className="w-12 h-12" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold font-cairo">اسحب الملف هنا</h3>
            <p className="text-gray-500 font-cairo">أو اضغط لاختيار ملف من جهازك</p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {isImporting && (
            <div className="glass-card p-6 border-[#00CED1]/10">
              <div className="space-y-4">
                <div className="flex justify-between items-center font-cairo">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#00CED1]" />
                    جاري الاستيراد...
                  </span>
                  <span className="font-bold">{importProgress}%</span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${importProgress}%` }}
                    className="h-full bg-gradient-to-r from-[#00CED1] to-[#D4AF37]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="glass-panel p-2">
            <GlassTable columns={columns} data={items} emptyMessage="لا توجد بيانات للمعالجة" />
          </div>

          <div className="flex justify-center">
            <button 
              onClick={() => setItems([])}
              className="text-gray-500 hover:text-red-400 font-cairo text-sm flex items-center gap-2 transition-colors"
            >
              <X className="w-4 h-4" />
              إلغاء الكل والبدء من جديد
            </button>
          </div>
        </div>
      )}

      {!items.length && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="glass-card p-6 border-white/5">
                <h4 className="font-bold font-cairo mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    التنسيق المطلوب للملف
                </h4>
                <div className="space-y-2 text-sm text-gray-500 font-mono bg-black/20 p-4 rounded-xl border border-white/5">
                    <p>الفئة (مثلاً: اللبوس)</p>
                    <p>الاسم،الباركود،التاريخ،السعر،الشركة،عدد_الشرائط</p>
                    <p>Panadol,6221032...,10/2026,45.00,GSK,10</p>
                </div>
            </div>
            <div className="glass-card p-6 border-white/5">
                <h4 className="font-bold font-cairo mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-[#D4AF37]" />
                    ملاحظات هامة
                </h4>
                <ul className="space-y-2 text-sm text-gray-500 font-cairo list-disc list-inside">
                    <li>يتم تحديد نوع المنتج تلقائياً بناءً على اسم الفئة.</li>
                    <li>إذا لم يتم تحديد عدد الشرائط، سيتم اعتباره 1.</li>
                    <li>يتم حساب سعر الشراء تلقائياً بنسبة 75% من سعر البيع.</li>
                </ul>
            </div>
         </div>
      )}
    </div>
  );
}