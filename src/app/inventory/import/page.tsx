'use client';

import React, { useState, useCallback } from 'react';
import { 
  FileUp, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft,
  X,
  Plus,
  Loader2,
  Table as TableIcon,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import GlassTable from '@/components/ui/GlassTable';

// تحديث الـ Interface لاستقبال النوع والكمية الداخلية
interface ParsedItem {
  name: string;
  barcode: string;
  expiry: string;
  sale_price: number;
  purchase_price: number;
  company: string;
  type?: string;       // جديد: نوع المنتج (أقراص، لبوس، نقط...)
  unit_quantity?: number; // جديد: عدد الشرائط أو الوحدات داخل العلبة
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
    setIsParsing(true);
    const text = await file.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    if (lines.length < 2) {
      setItems([]);
      setIsParsing(false);
      return;
    }

    const categoryName = lines[0]; 
    setCategory(categoryName);
    const parsed: ParsedItem[] = [];

    // تحديد النوع الافتراضي بناءً على اسم الفئة
    let defaultType = 'tablet';
    if (categoryName.includes('لبوس')) defaultType = 'suppository';
    else if (categoryName.includes('نقط')) defaultType = 'drops';
    else if (categoryName.includes('حقن')) defaultType = 'injection';

    // Start from line 2 (index 1) assuming line 1 is category
    for (let i = 1; i < lines.length; i++) {
      let line = lines[i];
      line = line.replace(/^[،,]+|[،,]+$/g, '');

      const parts = line.split(/[،,]/).map(p => p.trim());
      
      // نتوقع 5 أعمدة كحد أدنى، وعمود سادس اختياري للكمية الداخلية
      if (parts.length >= 4) {
        const salePrice = parseFloat(parts[3]);
        if (isNaN(salePrice)) continue;

        parsed.push({
          name: parts[0],
          barcode: parts[1],
          expiry: parts[2],
          sale_price: salePrice,
          purchase_price: Number((salePrice * 0.75).toFixed(2)), // نسبة تقريبية لسعر الشراء
          company: parts[4] || 'غير محدد',
          // التعامل مع العمود السادس (عدد الشرائط)
          unit_quantity: parseInt(parts[5]) || 1, 
          type: defaultType,
          status: 'pending'
        });
      }
    }

    setItems(parsed);
    setIsParsing(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseFile(e.target.files[0]);
    }
  };

  const startImport = async () => {
    if (!user?.user_metadata?.pharmacy_id) return;
    setIsImporting(true);
    setImportProgress(0);

    const pharmacyId = user.user_metadata.pharmacy_id;

    try {
        // تنسيق التواريخ وإعداد البيانات للإرسال
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
        ...item,
        expiry_date: formattedExpiry,
        // تأكد من إرسال هذه الحقول بالتحديد
        type: item.type || 'tablet',
        unit_quantity: item.unit_quantity || 1,
        // تأكد أن المفتاح هنا هو sale_price ليتوافق مع الدالة
        sale_price: item.sale_price 
    };
});

        // استدعاء دالة الاستيراد الذكي
        const { data, error } = await supabase.rpc('bulk_import_inventory', {
            p_pharmacy_id: pharmacyId,
            p_category: category,
            p_items: formattedItems
        });

        if (error) throw error;

        // تحديث الحالة إلى نجاح
        setItems(prev => prev.map(it => ({ ...it, status: 'success' })));
        setImportProgress(100);
        
        setTimeout(() => {
            router.push('/inventory');
        }, 1500);

    } catch (err: any) {
        console.error(err);
        setItems(prev => prev.map(it => ({ ...it, status: 'error', error: err.message })));
    } finally {
        setIsImporting(false);
    }
  };

  // تحديث الأعمدة لعرض النوع والكمية الداخلية
  const columns: any[] = [
    { header: 'الصنف', accessor: (it: ParsedItem) => it.name },
    { header: 'النوع', accessor: (it: ParsedItem) => it.type === 'suppository' ? 'لبوس' : it.type === 'drops' ? 'نقط' : 'أقراص' },
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
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept=".txt"
            onChange={handleFileChange}
          />
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
            <GlassTable 
              columns={columns}
              data={items}
              emptyMessage="لا توجد بيانات للمعالجة"
            />
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

      {/* Instructions */}
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