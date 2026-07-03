'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PackageOpen, Save, ArrowLeft, Loader2, Barcode as BarcodeIcon, Tag, Calendar, DollarSign, ListOrdered, Factory, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { treatmentTypes } from '@/lib/unitOptions';
import { createProductWithBatch } from '@/lib/api/createProduct';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema } from '@/lib/validations';
import { z } from 'zod';
import { cn } from '@/lib/utils';

type ProductFormValues = z.infer<typeof productSchema>;

export default function CreateProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiChoices, setAiChoices] = useState<any[]>([]);
  const [showChoices, setShowChoices] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      type: treatmentTypes[0].name,
      company: '',
      unit_conversion: 1,
      barcode: '',
      quantity: 0,
      purchase_price: 0,
      sale_price: 0,
      expiry_date: '',
    }
  });

  const watchType = watch('type');
  const watchName = watch('name');
  
  const selectedTreatmentType = treatmentTypes.find(t => t.name === watchType);
  const showUnitConversion = selectedTreatmentType?.hasConversion;

  const showError = (msg: string) => {
    setFormError(msg);
    setTimeout(() => setFormError(null), 3000);
  };

  const handleAiAutofill = async () => {
    if (!watchName) {
      showError("الرجاء إدخال اسم المنتج أولاً لاستخدام الإكمال الذكي");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai-autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: watchName })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed");

      if (data.choices && data.choices.length > 0) {
        if (data.choices.length === 1) {
          const choice = data.choices[0];
          if (choice.name) setValue('name', choice.name);
          if (choice.company) setValue('company', choice.company);
          if (choice.type) setValue('type', choice.type);
          if (choice.unit_conversion) setValue('unit_conversion', choice.unit_conversion);
        } else {
          setAiChoices(data.choices);
          setShowChoices(true);
        }
      } else {
        showError("لم يتم العثور على نتائج للإكمال الذكي");
      }
    } catch (err: any) {
      showError("خطأ الإكمال الذكي: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseDate = (input: string) => {
    if (!input) return '';
    const parts = input.split(/[\/\-.]/).map(p => p.trim());
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${y}-${m}-${d}`;
    }
    if (parts.length === 2) {
      const m = parts[0].padStart(2, '0');
      const y = parts[1].length === 2 ? `20${parts[1]}` : parts[1];
      return `${y}-${m}-15`;
    }
    return input;
  };

  const onSubmit = async (data: ProductFormValues) => {
    setLoading(true);
    try {
      const { success, error } = await createProductWithBatch({
        name: data.name,
        type: data.type,
        company: data.company || '',
        inventory_method: 'FEFO',
        barcode: data.barcode,
        expiry_date: parseDate(data.expiry_date),
        unit: 'علبة',
        quantity: data.quantity,
        purchase_price: data.purchase_price,
        sale_price: data.sale_price,
        unit_conversion: showUnitConversion ? data.unit_conversion : 1,
        // pharmacy_id intentionally not passed — derived from JWT server-side
      });

      if (success) {
        router.push('/inventory');
      } else {
        showError('فشل في إضافة المنتج: ' + error?.message);
      }
    } catch (err: any) {
      showError('خطأ غير متوقع: ' + err?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12 relative">
      <AnimatePresence>
        {formError && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50">
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="bg-red-500/20 text-red-500 border border-red-500/30 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 backdrop-blur-md font-cairo"
            >
              <AlertCircle className="w-5 h-5" />
              {formError}
            </motion.div>
          </div>
        )}

        {showChoices && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#050505] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <h3 className="text-xl font-bold font-cairo mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00CED1]" />
                اختر المنتج المناسب
              </h3>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                {aiChoices.map((choice, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      if (choice.name) setValue('name', choice.name);
                      if (choice.company) setValue('company', choice.company);
                      if (choice.type) setValue('type', choice.type);
                      if (choice.unit_conversion) setValue('unit_conversion', choice.unit_conversion);
                      setShowChoices(false);
                    }}
                    className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-[#00CED1]/10 hover:border-[#00CED1]/30 cursor-pointer transition-all text-right group"
                  >
                    <div className="font-bold text-lg font-cairo text-white group-hover:text-[#00CED1] transition-colors">{choice.name}</div>
                    <div className="text-sm text-gray-400 font-cairo mt-1">الشركة: {choice.company || 'غير محدد'}</div>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-white/10 rounded-md text-gray-300 font-cairo">{choice.type}</span>
                      {choice.unit_conversion > 1 && (
                        <span className="text-xs px-2 py-1 bg-white/10 rounded-md text-gray-300 font-cairo">تحويل: {choice.unit_conversion}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  type="button"
                  onClick={() => setShowChoices(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-cairo transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 font-cairo">
              إضافة <span className="text-[#D4AF37]">صنف جديد</span>
            </h1>
            <p className="text-gray-400 mt-1 font-cairo">سجل منتجاً جديداً وحدد رصيد أول المدة (التشغيلة الأولى).</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="glass-panel p-8 space-y-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-1 h-full bg-[#00CED1]"></div>
           <h2 className="text-xl font-bold mb-4 flex items-center gap-2 font-cairo">
              <Tag className="w-5 h-5 text-gray-400" />
              البيانات الأساسية للصنف
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">اسم المنتج <span className="text-red-400">*</span></label>
                  <input 
                    {...register('name')}
                    className={cn(
                      "w-full bg-[#050505] border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors font-cairo text-right",
                      errors.name ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-[#00CED1]"
                    )}
                    placeholder="مثال: بانادول إكسترا 500 مجم"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1 font-cairo">{errors.name.message}</p>}
                </div>
                <button 
                  type="button" 
                  disabled={loading}
                  onClick={handleAiAutofill}
                  className="px-4 py-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors flex items-center gap-2 font-cairo disabled:opacity-50 h-[50px] whitespace-nowrap"
                >
                  <Sparkles className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
                  إكمال بالذكاء الاصطناعي
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2 font-cairo">
                  <Factory className="w-4 h-4" /> الشركة المصنعة <span className="text-gray-500 text-xs">(اختياري)</span>
                </label>
                <input 
                  {...register('company')}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors font-cairo text-right"
                  placeholder="مثال: فاركو أو GSK"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">التصنيف (النوع) <span className="text-red-400">*</span></label>
                <select 
                  {...register('type')}
                  className={cn(
                    "w-full bg-[#050505] border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors appearance-none font-cairo",
                    errors.type ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-[#00CED1]"
                  )}
                >
                  {treatmentTypes.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
                {errors.type && <p className="text-red-400 text-xs mt-1 font-cairo">{errors.type.message}</p>}
              </div>

              {showUnitConversion ? (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">
                    معامل التحويل (عدد الأشرطة/الأمبولات بالعلبة) <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="number"
                    min="1"
                    {...register('unit_conversion')}
                    className={cn(
                      "w-full bg-[#050505] border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors font-cairo",
                      errors.unit_conversion ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-[#00CED1]"
                    )}
                  />
                  {errors.unit_conversion && <p className="text-red-400 text-xs mt-1 font-cairo">{errors.unit_conversion.message}</p>}
                </div>
              ) : (
                <div></div>
              )}
           </div>
        </div>

        <div className="glass-panel p-8 space-y-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-1 h-full bg-[#D4AF37]"></div>
           <h2 className="text-xl font-bold mb-4 flex items-center gap-2 font-cairo">
              <ListOrdered className="w-5 h-5 text-gray-400" />
              بيانات أول تشغيلة (Initial Batch)
           </h2>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2 font-cairo">
                  <BarcodeIcon className="w-4 h-4" /> الباركود <span className="text-red-400">*</span>
                </label>
                <input 
                  {...register('barcode')}
                  className={cn(
                    "w-full bg-[#050505] border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors font-cairo",
                    errors.barcode ? "border-red-500" : "border-white/10 focus:border-[#00CED1]"
                  )}
                  placeholder="امسح أو اكتب الباركود..."
                />
                {errors.barcode && <p className="text-red-400 text-xs mt-1 font-cairo">{errors.barcode.message}</p>}
              </div>

              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2 font-cairo">
                  <Calendar className="w-4 h-4" /> تاريخ الانتهاء <span className="text-red-400">*</span>
                </label>
                <input 
                  type="text"
                  {...register('expiry_date')}
                  className={cn(
                    "w-full bg-[#050505] border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors font-cairo",
                    errors.expiry_date ? "border-red-500" : "border-white/10 focus:border-[#00CED1]"
                  )}
                  placeholder="مثال: 05/2027 أو 15/05/2027"
                />
                {errors.expiry_date && <p className="text-red-400 text-xs mt-1 font-cairo">{errors.expiry_date.message}</p>}
              </div>

              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">الكمية (بالعلب) <span className="text-red-400">*</span></label>
                <input 
                  type="number"
                  min="0"
                  {...register('quantity')}
                  className={cn(
                    "w-full bg-[#050505] border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors font-cairo",
                    errors.quantity ? "border-red-500" : "border-white/10 focus:border-[#00CED1]"
                  )}
                />
                {errors.quantity && <p className="text-red-400 text-xs mt-1 font-cairo">{errors.quantity.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2 font-cairo">
                  <DollarSign className="w-4 h-4 text-red-400" /> سعر الشراء (ج.م) <span className="text-red-400">*</span>
                </label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('purchase_price')}
                  className={cn(
                    "w-full bg-[#050505] border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors font-cairo",
                    errors.purchase_price ? "border-red-500" : "border-white/10 focus:border-[#00CED1]"
                  )}
                />
                {errors.purchase_price && <p className="text-red-400 text-xs mt-1 font-cairo">{errors.purchase_price.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2 font-cairo">
                  <DollarSign className="w-4 h-4 text-green-400" /> سعر البيع (ج.م) <span className="text-red-400">*</span>
                </label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('sale_price')}
                  className={cn(
                    "w-full bg-[#050505] border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors font-cairo",
                    errors.sale_price ? "border-red-500" : "border-white/10 focus:border-[#00CED1]"
                  )}
                />
                {errors.sale_price && <p className="text-red-400 text-xs mt-1 font-cairo">{errors.sale_price.message}</p>}
              </div>

           </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            disabled={loading}
            type="submit" 
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#00CED1] to-[#009b9e] text-white font-bold hover:shadow-[0_0_15px_rgba(0,206,209,0.4)] transition-all disabled:opacity-50 font-cairo"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {loading ? 'جاري الحفظ...' : 'تسجيل الصنف والتشغيلة'}
          </button>
        </div>

      </form>
    </div>
  );
}

