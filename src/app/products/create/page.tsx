'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PackageOpen, Save, ArrowLeft, Loader2, Barcode as BarcodeIcon, Tag, Calendar, DollarSign, ListOrdered, Factory, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { treatmentTypes } from '@/lib/unitOptions';
import { createProductWithBatch } from '@/lib/api/createProduct';

export default function CreateProduct() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiChoices, setAiChoices] = useState<any[]>([]);
  const [showChoices, setShowChoices] = useState(false);

  const [formData, setFormData] = useState({
    // Product
    name: '',
    type: treatmentTypes[0].name,
    company: '',
    unit_conversion: 1,
    inventory_method: 'FEFO',
    
    // Batch
    barcode: '',
    quantity: 0,
    purchase_price: 0,
    selling_price: 0,
    expiry_date: '',
  });

  const selectedTreatmentType = treatmentTypes.find(t => t.name === formData.type);
  const showUnitConversion = selectedTreatmentType?.hasConversion;

  const [formError, setFormError] = useState<string | null>(null);

  const showError = (msg: string) => {
    setFormError(msg);
    setTimeout(() => setFormError(null), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAiAutofill = async () => {
    if (!formData.name) {
      showError("الرجاء إدخال اسم المنتج أولاً لاستخدام الإكمال الذكي");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai-autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: formData.name })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed");

      if (data.choices && data.choices.length > 0) {
        if (data.choices.length === 1) {
          // If only 1 choice, auto-fill directly
          const choice = data.choices[0];
          setFormData(prev => ({
            ...prev,
            name: choice.name || prev.name,
            company: choice.company || prev.company,
            type: choice.type || prev.type,
            unit_conversion: choice.unit_conversion || prev.unit_conversion,
          }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. String Trimming Guard
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      showError('خطأ: يجب إدخال اسم المنتج بشكل صحيح ولا يمكن أن يكون مسافات فارغة.');
      return;
    }

    // 2. Zero or Negative Numbers Protection
    const qty = Number(formData.quantity);
    const pPrice = Number(formData.purchase_price);
    const sPrice = Number(formData.selling_price);
    const uConv = showUnitConversion ? Number(formData.unit_conversion) : 1;

    if (qty <= 0 || pPrice <= 0 || sPrice <= 0 || uConv <= 0) {
      showError('خطأ: الكمية، الأسعار، ومعامل التحويل يجب أن تكون أكبر من صفر.');
      return;
    }

    setLoading(true);

    try {
      const { success, error } = await createProductWithBatch({
        ...formData,
        unit: 'علبة', // Default base unit
        quantity: Number(formData.quantity),
        purchase_price: Number(formData.purchase_price),
        selling_price: Number(formData.selling_price),
        unit_conversion: showUnitConversion ? Number(formData.unit_conversion) : 1,
        pharmacy_id: localStorage.getItem('selected_pharmacy_id') || undefined,
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
                      setFormData(prev => ({
                        ...prev,
                        name: choice.name || prev.name,
                        company: choice.company || prev.company,
                        type: choice.type || prev.type,
                        unit_conversion: choice.unit_conversion || prev.unit_conversion,
                      }));
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

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Product Details Section */}
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
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors font-cairo text-right"
                    placeholder="مثال: بانادول إكسترا 500 مجم"
                  />
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
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors font-cairo text-right"
                  placeholder="مثال: فاركو أو GSK"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">التصنيف (النوع) <span className="text-red-400">*</span></label>
                <select 
                  required
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors appearance-none font-cairo"
                >
                  {treatmentTypes.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              {showUnitConversion ? (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">
                    معامل التحويل (عدد الأشرطة/الأمبولات بالعلبة) <span className="text-red-400">*</span>
                  </label>
                  <input 
                    required
                    type="number"
                    min="1"
                    name="unit_conversion"
                    value={formData.unit_conversion}
                    onChange={handleChange}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors font-cairo"
                  />
                  <p className="text-xs text-gray-500 mt-1 font-cairo">مثال: العلبة بها 3 أشرطة، اكتب 3</p>
                </div>
              ) : (
                <div></div>
              )}
           </div>
        </div>

        {/* Initial Batch Section */}
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
                  required
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors font-cairo"
                  placeholder="امسح أو اكتب الباركود..."
                />
              </div>

              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2 font-cairo">
                  <Calendar className="w-4 h-4" /> تاريخ الانتهاء <span className="text-red-400">*</span>
                </label>
                <input 
                  required
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors [color-scheme:dark] font-cairo"
                />
              </div>

              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-400 mb-2 font-cairo">الكمية (بالعلب) <span className="text-red-400">*</span></label>
                <input 
                  required
                  type="number"
                  min="0"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors font-cairo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2 font-cairo">
                  <DollarSign className="w-4 h-4 text-red-400" /> سعر الشراء (ج.م) <span className="text-red-400">*</span>
                </label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  name="purchase_price"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors font-cairo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2 font-cairo">
                  <DollarSign className="w-4 h-4 text-green-400" /> سعر البيع (ج.م) <span className="text-red-400">*</span>
                </label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleChange}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00CED1] transition-colors font-cairo"
                />
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
