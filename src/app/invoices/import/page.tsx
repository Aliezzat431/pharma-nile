'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, Sparkles, Package, Check, X, AlertCircle, Loader2,
  Zap, Save, BadgePlus, Star,
  PenLine, Plus, Trash2, FileUp, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { usePageGSAP } from '@/hooks/usePageGSAP';
import ProductAutocomplete from '@/components/ui/ProductAutocomplete';

interface ExtractedItem {
  product_name: string;
  quantity: number;
  public_price: number;
  purchase_price: number;
  expiry_date: string;
  barcode: string;
  is_new: boolean;
  existing_product_id?: string;
  _status: 'pending' | 'saving' | 'saved' | 'error';
  _checked: boolean;
  _editMode: boolean;
}

const TEAL = 'var(--nile-teal)';
const GOLD = 'var(--royal-gold)';

// ✅ دالة مساعدة للتحقق من الإدخال الرقمي
const isValidNumberInput = (val: string): boolean => {
  return val === '' || val === '.' || /^\d*\.?\d*$/.test(val);
};

// ✅ دالة مساعدة لتحليل الأرقام
const parseNumeric = (val: string): number => {
  if (!val || val.trim() === '' || val === '.') return 0;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

const emptyItem = (): ExtractedItem => ({
  product_name: '',
  quantity: 1,
  public_price: 0,
  purchase_price: 0,
  expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2).toISOString().split('T')[0],
  barcode: '',
  is_new: true,
  _status: 'pending',
  _checked: true,
  _editMode: true,
});

export default function InvoiceImportPage() {
  const { user } = useAuth();
  const pharmacyId = user?.user_metadata?.pharmacy_id;

  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [phase, setPhase] = useState<'upload' | 'review' | 'done'>('upload');

  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setScanError('يرجى رفع صورة (JPG, PNG, WEBP)');
      return;
    }
    setSelectedFile(file);
    let url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanError(null);
    setItems([]);
    setPhase('upload');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleScan = async () => {
    if (!selectedFile || !pharmacyId) return;
    setScanning(true);
    setScanError(null);
    setItems([]);

    try {
      const fd = new FormData();
      fd.append('invoice', selectedFile);

      const res = await fetch('/api/invoice-scan', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'فشل تحليل الفاتورة');

      const rawItems: any[] = data.items || [];

      const enriched: ExtractedItem[] = await Promise.all(
        rawItems.map(async (item) => {
          let existing = null;

          if (item.barcode && item.barcode.length > 5) {
            const { data: byBarcode } = await supabase
              .from('products')
              .select('id, name, barcode')
              .eq('pharmacy_id', pharmacyId)
              .eq('barcode', item.barcode.trim())
              .maybeSingle();
            
            if (byBarcode) existing = byBarcode;
          }

          if (!existing && item.product_name && item.product_name.trim().length > 2) {
            const { data: byName } = await supabase
              .from('products')
              .select('id, name, barcode')
              .eq('pharmacy_id', pharmacyId)
              .ilike('name', `%${item.product_name.trim()}%`)
              .limit(1)
              .maybeSingle();
            
            if (byName) existing = byName;
          }

          return {
            ...item,
            is_new: !existing,
            existing_product_id: existing?.id,
            product_name: existing?.name || item.product_name,
            public_price: item.public_price ?? 0,
            purchase_price: item.purchase_price ?? 0,
            _status: 'pending' as const,
            _checked: true,
            _editMode: false,
          };
        })
      );

      setItems(enriched);
      setPhase('review');
    } catch (err: any) {
      setScanError(err.message || 'حدث خطأ أثناء تحليل الفاتورة');
    } finally {
      setScanning(false);
    }
  };

  const addManualRow = () => {
    setItems(prev => [...prev, emptyItem()]);
    setPhase('review');
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ExtractedItem, value: any) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const toggleCheck = (idx: number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, _checked: !it._checked } : it));
  };

  const toggleAll = (val: boolean) => {
    setItems(prev => prev.map(it => ({ ...it, _checked: val })));
  };

  const lookupProduct = async (idx: number, name: string) => {
    if (!pharmacyId || name.trim().length < 2) return;
    const { data: existing } = await supabase
      .from('products')
      .select('id, name')
      .eq('pharmacy_id', pharmacyId)
      .ilike('name', `%${name}%`)
      .limit(1)
      .maybeSingle();

    setItems(prev => prev.map((it, i) => i === idx ? {
      ...it,
      is_new: !existing,
      existing_product_id: existing?.id,
    } : it));
  };

  const handleSaveAll = async () => {
    if (!pharmacyId) return;
    const toSave = items.filter(it => it._checked && it._status === 'pending');
    if (toSave.length === 0) return;

    setSaving(true);
    let saved = 0;

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

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item._checked || item._status !== 'pending') continue;
      if (!item.product_name.trim()) continue;

      setItems(prev => prev.map((it, idx) => idx === i ? { ...it, _status: 'saving' } : it));

      try {
        let productId = item.existing_product_id;
        const finalQuantity = Number(item.quantity) || 1;
        const finalPublicPrice = Number(item.public_price) || 0;
        const finalPurchasePrice = Number(item.purchase_price) || 0;

        let finalExpiry = parseDate(item.expiry_date);
        if (!finalExpiry || finalExpiry === 'Unknown' || isNaN(Date.parse(finalExpiry))) {
          finalExpiry = new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0];
        }

        if (item.is_new || !productId) {
          const { data: newProduct, error: prodErr } = await supabase
            .from('products')
            .insert([{
              pharmacy_id: pharmacyId,
              name: item.product_name,
              type: 'أقراص',
              unit: 'علبة',
              unit_conversion: 1,
              inventory_method: 'FEFO',
            }])
            .select('id')
            .single();

          if (prodErr) throw prodErr;
          productId = newProduct.id;
        }

        const { error: batchErr } = await supabase
          .from('batches')
          .insert([{
            pharmacy_id: pharmacyId,
            product_id: productId,
            barcode: item.barcode || `INV-${Date.now()}-${i}`,
            quantity: finalQuantity,
            purchase_price: finalPurchasePrice,
            sale_price: finalPublicPrice,
            expiry_date: finalExpiry,
          }]);

        if (batchErr) throw batchErr;

        setItems(prev => prev.map((it, idx) => idx === i ? { ...it, _status: 'saved' } : it));
        saved++;
      } catch (err: any) {
        console.error(`Error saving ${item.product_name}:`, err);
        setItems(prev => prev.map((it, idx) => idx === i ? { ...it, _status: 'error' } : it));
      }
    }

    setSavedCount(prev => prev + saved);
    setSaving(false);
    if (saved === toSave.length) setPhase('done');
  };

  const resetAll = () => {
    setPhase('upload');
    setItems([]);
    setPreviewUrl(null);
    setSelectedFile(null);
    setSavedCount(0);
    setScanError(null);
  };

  const checkedCount = items.filter(it => it._checked && it._status === 'pending').length;
  const newCount = items.filter(it => it.is_new).length;

  const pageRef = usePageGSAP();

  return (
    <div ref={pageRef} className="w-full max-w-7xl mx-auto pb-12">
      <header data-gsap="fade-up" className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, var(--nile-teal), var(--royal-gold))' }}>
            <FileUp className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-cairo nile-gradient-text">
              استيراد فاتورة
            </h1>
            <p className="text-gray-400 font-cairo text-sm mt-0.5">
              استيراد المنتجات يدوياً أو عبر الذكاء الاصطناعي
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={() => { setMode('ai'); resetAll(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-cairo font-bold text-sm transition-all ${
              mode === 'ai'
                ? 'text-black shadow-lg'
                : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
            style={mode === 'ai' ? {
              background: 'linear-gradient(135deg, var(--nile-teal), var(--royal-gold))',
              boxShadow: '0 0 20px rgba(0,206,209,0.3)',
            } : {}}
          >
            <Sparkles className="w-4 h-4" />
            استيراد بالذكاء الاصطناعي
          </button>
          <button
            onClick={() => { setMode('manual'); resetAll(); addManualRow(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-cairo font-bold text-sm transition-all ${
              mode === 'manual'
                ? 'text-black shadow-lg'
                : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
            style={mode === 'manual' ? {
              background: 'linear-gradient(135deg, var(--nile-teal), var(--royal-gold))',
              boxShadow: '0 0 20px rgba(0,206,209,0.3)',
            } : {}}
          >
            <PenLine className="w-4 h-4" />
            إدخال يدوي
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {mode === 'ai' ? (
          <motion.div
            key="ai"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[70vh]"
          >
            <ItemsPanel
              items={items}
              scanning={scanning}
              phase={phase}
              saving={saving}
              savedCount={savedCount}
              checkedCount={checkedCount}
              newCount={newCount}
              pharmacyId={pharmacyId}
              onToggleCheck={toggleCheck}
              onToggleAll={toggleAll}
              onUpdateItem={updateItem}
              onSetItems={setItems}
              onSaveAll={handleSaveAll}
              onReset={resetAll}
              onRemoveItem={removeItem}
            />

            <div className="flex flex-col gap-5 order-1 lg:order-2">
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
                className={`glass-panel p-6 flex flex-col items-center justify-center relative overflow-hidden transition-all cursor-pointer min-h-[320px]
                  ${dragOver ? 'border-[var(--nile-teal)] bg-[var(--nile-teal)]/5' : 'hover:border-white/20'}
                `}
              >
                <div className={`absolute inset-0 rounded-[2rem] transition-opacity pointer-events-none ${dragOver ? 'opacity-100' : 'opacity-0'}`}
                     style={{ background: 'radial-gradient(ellipse at center, rgba(0,206,209,0.08) 0%, transparent 70%)' }} />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />

                {!selectedFile ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center relative shadow-[0_0_40px_rgba(0,206,209,0.15)]"
                         style={{ background: 'linear-gradient(135deg, rgba(0,206,209,0.1), rgba(212,175,55,0.1))' }}>
                      <Upload className="w-8 h-8 text-[var(--nile-teal)] relative z-10" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg font-cairo text-white mb-1">
                        اسحب وأفلت صورة الفاتورة هنا
                      </p>
                      <p className="text-sm font-cairo text-gray-500">
                        أو اضغط لتصفح الملفات (PNG, JPG)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-[250px] rounded-2xl overflow-hidden border border-white/10 group">
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center backdrop-blur-sm">
                      <p className="font-cairo text-white font-bold flex items-center gap-2">
                        <Edit3 className="w-5 h-5" />
                        تغيير الصورة
                      </p>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl!} alt="Invoice" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              <AnimatePresence>
                {scanError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="glass-card p-4 flex items-start gap-3 border-red-500/30"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-400 font-cairo text-sm">خطأ في التحليل</p>
                      <p className="text-gray-400 text-xs font-cairo mt-0.5">{scanError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleScan}
                disabled={!selectedFile || scanning || phase === 'done'}
                className="w-full py-4 rounded-2xl font-bold font-cairo text-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:cursor-not-allowed"
                style={{
                  background: (!selectedFile || scanning || phase === 'done')
                    ? 'rgba(255,255,255,0.05)'
                    : 'linear-gradient(135deg, var(--nile-teal) 0%, var(--royal-gold) 100%)',
                  color: (!selectedFile || scanning || phase === 'done') ? '#666' : '#000',
                  boxShadow: (selectedFile && !scanning && phase !== 'done')
                    ? '0 0 32px rgba(0,206,209,0.4)'
                    : 'none',
                }}
              >
                {scanning ? (
                  <><Loader2 className="w-6 h-6 animate-spin" />جاري التحليل...</>
                ) : (
                  <><Zap className="w-6 h-6" />استخراج الأصناف بالذكاء الاصطناعي</>
                )}
              </button>

              <div className="glass-panel p-5">
                <h3 className="font-bold font-cairo text-sm mb-4 text-gray-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
                  كيف يعمل النظام؟
                </h3>
                <div className="space-y-3">
                  {[
                    { step: '01', text: 'ارفع صورة واضحة لفاتورة المورد' },
                    { step: '02', text: 'الذكاء الاصطناعي يقرأ ويستخرج الأسماء، الكميات، والأسعار' },
                    { step: '03', text: 'النظام يكشف تلقائياً إن كان المنتج جديداً أم موجوداً' },
                    { step: '04', text: 'راجع البيانات، عدّل إن لزم، ثم احفظ في المخزون' },
                  ].map(s => (
                    <div key={s.step} className="flex items-start gap-3">
                      <span className="text-xs font-mono font-bold flex-shrink-0 w-6 mt-0.5" style={{ color: TEAL }}>{s.step}</span>
                      <p className="text-xs font-cairo text-gray-400">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(0,206,209,0.1)', border: '1px solid rgba(0,206,209,0.3)' }}>
                <PenLine className="w-5 h-5" style={{ color: TEAL }} />
              </div>
              <div className="flex-1">
                <p className="font-bold font-cairo text-sm text-white">إدخال يدوي للفاتورة</p>
                <p className="text-xs font-cairo text-gray-400 mt-0.5">
                  أضف الأصناف سطراً بسطر — النظام يتحقق تلقائياً إن كان الصنف موجوداً في المخزون
                </p>
              </div>
              <button
                onClick={addManualRow}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold font-cairo text-sm text-black transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, var(--nile-teal), var(--royal-gold))', boxShadow: '0 0 16px rgba(0,206,209,0.3)' }}
              >
                <Plus className="w-4 h-4" /> إضافة صنف
              </button>
            </div>

            {items.length === 0 ? (
              <div className="glass-panel p-16 flex flex-col items-center justify-center gap-4 text-center opacity-60">
                <Package className="w-14 h-14 text-gray-600" />
                <p className="font-cairo text-gray-400">اضغط "إضافة صنف" لبدء إدخال بيانات الفاتورة</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3 flex-wrap mb-1">
                  <div className="glass-card px-3 py-2 flex items-center gap-2 text-xs font-cairo">
                    <BadgePlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">{newCount}</span>
                    <span className="text-gray-500">منتج جديد</span>
                  </div>
                  <div className="glass-card px-3 py-2 flex items-center gap-2 text-xs font-cairo">
                    <Star className="w-3.5 h-3.5" style={{ color: GOLD }} />
                    <span className="font-bold" style={{ color: GOLD }}>{items.length - newCount}</span>
                    <span className="text-gray-500">موجود مسبقاً</span>
                  </div>
                  <div className="glass-card px-3 py-2 flex items-center gap-2 text-xs font-cairo">
                    <Check className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-blue-400 font-bold">{checkedCount}</span>
                    <span className="text-gray-500">محدد للحفظ</span>
                  </div>
                  <div className="mr-auto flex items-center gap-3">
                    <button onClick={() => toggleAll(true)} className="text-xs text-gray-400 hover:text-white font-cairo transition-colors">تحديد الكل</button>
                    <button onClick={() => toggleAll(false)} className="text-xs text-gray-400 hover:text-red-400 font-cairo transition-colors">إلغاء الكل</button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {items.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`glass-card p-4 relative overflow-hidden transition-all
                        ${item._checked ? 'border-white/10' : 'opacity-50 border-white/5'}
                        ${item._status === 'saved' ? 'border-emerald-500/30' : ''}
                        ${item._status === 'error' ? 'border-red-500/30' : ''}
                        ${item._status === 'saving' ? 'animate-pulse' : ''}
                      `}
                    >
                      <div className={`absolute top-0 right-0 w-1.5 h-full ${item.is_new ? 'bg-emerald-500' : 'bg-blue-500'}`} />

                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleCheck(idx)}
                          disabled={item._status !== 'pending'}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all
                            ${item._checked
                              ? (item.is_new ? 'border-emerald-500 bg-emerald-500/20' : 'border-blue-500 bg-blue-500/20')
                              : 'border-white/10 bg-white/5'}`}
                        >
                          {item._checked && <Check className="w-4 h-4" style={{ color: item.is_new ? '#10b981' : '#3b82f6' }} />}
                        </button>

                        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                          <div className="col-span-2 md:col-span-3 lg:col-span-2">
                            <label className="text-[10px] text-gray-500 font-cairo block mb-1">اسم المنتج</label>
                            <ProductAutocomplete
                              value={item.product_name}
                              disabled={item._status !== 'pending'}
                              pharmacyId={pharmacyId}
                              onChange={(v) => updateItem(idx, 'product_name', v)}
                              onSelect={(prod) => {
                                updateItem(idx, 'product_name', prod ? prod.name : item.product_name);
                                setItems(prev => prev.map((it, i) => i === idx ? {
                                  ...it,
                                  is_new: !prod,
                                  existing_product_id: prod?.id,
                                } : it));
                              }}
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-500 font-cairo block mb-1">الباركود</label>
                            <input
                              type="text"
                              value={item.barcode}
                              disabled={item._status !== 'pending'}
                              placeholder="باركود الصنف..."
                              onChange={e => updateItem(idx, 'barcode', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--nile-teal)]/50 font-mono"
                            />
                          </div>

                          {/* ✅ حقل الكمية - مُصحّح */}
                          <div>
                            <label className="text-[10px] text-gray-500 font-cairo block mb-1">الكمية</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.quantity || ''}
                              disabled={item._status !== 'pending'}
                              onChange={e => {
                                const val = e.target.value;
                                if (val === '' || /^\d+$/.test(val)) {
                                  updateItem(idx, 'quantity', val === '' ? 0 : parseInt(val, 10));
                                }
                              }}
                              placeholder="1"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--nile-teal)]/50"
                            />
                          </div>

                          {/* ✅ حقل سعر الشراء - مُصحّح */}
                          <div>
                            <label className="text-[10px] text-gray-500 font-cairo block mb-1">سعر الشراء</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.purchase_price || ''}
                              disabled={item._status !== 'pending'}
                              onChange={e => {
                                const val = e.target.value;
                                if (isValidNumberInput(val)) {
                                  updateItem(idx, 'purchase_price', parseNumeric(val));
                                }
                              }}
                              placeholder="0.00"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--nile-teal)]/50"
                            />
                          </div>

                          {/* ✅ حقل سعر البيع - مُصحّح */}
                          <div>
                            <label className="text-[10px] text-gray-500 font-cairo block mb-1">سعر البيع</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.public_price || ''}
                              disabled={item._status !== 'pending'}
                              onChange={e => {
                                const val = e.target.value;
                                if (isValidNumberInput(val)) {
                                  updateItem(idx, 'public_price', parseNumeric(val));
                                }
                              }}
                              placeholder="0.00"
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--nile-teal)]/50"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-gray-500 font-cairo block mb-1">تاريخ الانتهاء</label>
                            <input
                              type="text"
                              value={item.expiry_date}
                              disabled={item._status !== 'pending'}
                              onChange={e => updateItem(idx, 'expiry_date', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--nile-teal)]/50"
                              placeholder="MM/YYYY"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-2 ml-1 pt-5 flex-shrink-0">
                          {item._status === 'saved'  && <Check className="w-5 h-5 text-emerald-400" />}
                          {item._status === 'error'  && <X className="w-5 h-5 text-red-400" />}
                          {item._status === 'saving' && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
                          {item._status === 'pending' && (
                            <button
                              onClick={() => removeItem(idx)}
                              className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <button
                  onClick={addManualRow}
                  className="w-full py-3 rounded-xl border border-dashed border-white/10 text-gray-500 hover:text-white hover:border-[var(--nile-teal)]/50 font-cairo text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" /> إضافة صنف آخر
                </button>
              </div>
            )}

            {phase === 'review' && checkedCount > 0 && (
              <div className="pt-2">
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="w-full py-3.5 rounded-2xl font-bold font-cairo text-base flex items-center justify-center gap-3 transition-all active:scale-95"
                  style={{
                    background: saving ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${TEAL}, rgba(0,206,209,0.7))`,
                    color: saving ? '#666' : '#000',
                    boxShadow: saving ? 'none' : '0 0 24px rgba(0,206,209,0.3)',
                  }}
                >
                  {saving ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />جاري الحفظ...</>
                  ) : (
                    <><Save className="w-5 h-5" />حفظ {checkedCount} صنف في المخزون</>
                  )}
                </button>
              </div>
            )}

            {phase === 'done' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-8 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg font-cairo text-emerald-400">تم الحفظ بنجاح!</h3>
                <p className="text-gray-400 text-sm font-cairo mt-1">
                  تم إضافة <span className="font-bold text-white">{savedCount}</span> صنف إلى المخزون
                </p>
                <button
                  onClick={resetAll}
                  className="mt-4 px-6 py-2 rounded-xl text-xs font-bold font-cairo bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
                >
                  بدء فاتورة جديدة
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ItemsPanelProps {
  items: ExtractedItem[];
  scanning: boolean;
  phase: 'upload' | 'review' | 'done';
  saving: boolean;
  savedCount: number;
  checkedCount: number;
  newCount: number;
  pharmacyId: string | undefined;
  onToggleCheck: (idx: number) => void;
  onToggleAll: (val: boolean) => void;
  onUpdateItem: (idx: number, field: keyof ExtractedItem, value: any) => void;
  onSetItems: (updater: (prev: ExtractedItem[]) => ExtractedItem[]) => void;
  onSaveAll: () => Promise<void>;
  onReset: () => void;
  onRemoveItem: (idx: number) => void;
}

function ItemsPanel({
  items, scanning, phase, saving, savedCount, checkedCount, newCount,
  pharmacyId,
  onToggleCheck, onToggleAll, onUpdateItem, onSetItems, onSaveAll, onReset, onRemoveItem
}: ItemsPanelProps) {
  
  if (phase === 'upload' && !scanning) {
    return (
      <div className="glass-panel p-8 flex flex-col items-center justify-center text-center order-2 lg:order-1 opacity-50 min-h-[400px]">
        <Package className="w-16 h-16 text-gray-600 mb-4" />
        <p className="font-cairo text-lg text-gray-400 font-bold">بانتظار الفاتورة</p>
        <p className="font-cairo text-xs text-gray-500 mt-1 max-w-xs">
          قم برفع صورة الفاتورة على اليسار وضغط زر التحليل لبدء استخراج البيانات ومراجعتها هنا
        </p>
      </div>
    );
  }

  if (scanning) {
    return (
      <div className="glass-panel p-8 flex flex-col items-center justify-center text-center order-2 lg:order-1 min-h-[400px]">
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-[var(--nile-teal)] animate-spin" />
          <Sparkles className="w-5 h-5 absolute text-[var(--royal-gold)] animate-pulse" />
        </div>
        <p className="font-cairo text-lg text-white font-bold animate-pulse">جاري قراءة الأصناف...</p>
        <p className="font-cairo text-xs text-gray-400 mt-1 max-w-xs">
          يستغرق محرك الذكاء الاصطناعي بضع ثوانٍ لقراءة بنية الجداول وتحليل أسماء الأدوية بدقة
        </p>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-8 flex flex-col items-center justify-center text-center order-2 lg:order-1 min-h-[400px]"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
          <Check className="w-8 h-8" />
        </div>
        <h3 className="font-bold font-cairo text-xl text-emerald-400">اكتمل استيراد البيانات!</h3>
        <p className="font-cairo text-sm text-gray-400 mt-2 max-w-sm">
          تم معالجة الفاتورة بنجاح وحفظ <span className="text-white font-bold">{savedCount}</span> صنف في دفعات المخازن المقابلة.
        </p>
        <button 
          onClick={onReset}
          className="mt-6 px-6 py-2.5 rounded-xl font-cairo text-xs font-bold text-black transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, var(--nile-teal), var(--royal-gold))' }}
        >
          استيراد فاتورة جديدة
        </button>
      </motion.div>
    );
  }

  return (
    <div className="glass-panel p-5 flex flex-col gap-4 order-2 lg:order-1 min-h-[500px]">
      <div className="flex justify-between items-center border-b border-white/5 pb-3 flex-wrap gap-2">
        <div>
          <h2 className="font-bold font-cairo text-white text-base">الأصناف المستخرجة ({items.length})</h2>
          <p className="text-[11px] font-cairo text-gray-500 mt-0.5">يرجى التحقق من صحة الحقول والأسعار المقروءة</p>
        </div>
        <div className="flex gap-2 text-xs">
          <button onClick={() => onToggleAll(true)} className="text-gray-400 hover:text-white font-cairo transition-colors">تحديد الكل</button>
          <span className="text-gray-700">|</span>
          <button onClick={() => onToggleAll(false)} className="text-gray-400 hover:text-red-400 font-cairo transition-colors">إلغاء الكل</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 text-center">
          <span className="block text-emerald-400 text-sm font-bold font-mono">{newCount}</span>
          <span className="text-[10px] text-gray-500 font-cairo">أصناف جديدة</span>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 text-center">
          <span className="block text-blue-400 text-sm font-bold font-mono">{items.length - newCount}</span>
          <span className="text-[10px] text-gray-500 font-cairo">منتجات مطابقة</span>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 text-center">
          <span className="block text-[var(--nile-teal)] text-sm font-bold font-mono">{checkedCount}</span>
          <span className="text-[10px] text-gray-500 font-cairo">محدد للحفظ</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[55vh] space-y-3 pr-1 custom-scrollbar">
        <AnimatePresence initial={false}>
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={`p-3.5 rounded-xl border relative transition-all bg-black/20
                ${item._checked ? 'border-white/10' : 'opacity-40 border-transparent'}
                ${item._status === 'saved' ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : ''}
                ${item._status === 'error' ? 'border-red-500/30 bg-red-500/[0.02]' : ''}
              `}
            >
              <div className="flex items-start gap-2.5">
                <button
                  onClick={() => onToggleCheck(idx)}
                  disabled={item._status === 'saved' || item._status === 'saving'}
                  className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
                    ${item._checked 
                      ? 'border-[var(--nile-teal)] bg-[var(--nile-teal)]/10 text-[var(--nile-teal)]' 
                      : 'border-white/10'
                    }`}
                >
                  {item._checked && <Check className="w-3.5 h-3.5" />}
                </button>

                <div className="flex-1 min-w-0">
                  {item._editMode ? (
                    <ProductAutocomplete
                      value={item.product_name}
                      pharmacyId={pharmacyId}
                      disabled={item._status === 'saved' || item._status === 'saving'}
                      onChange={(v) => onUpdateItem(idx, 'product_name', v)}
                      onSelect={(prod) => {
                        onSetItems(prev => prev.map((it, i) => i === idx ? {
                          ...it,
                          product_name: prod ? prod.name : it.product_name,
                          is_new: !prod,
                          existing_product_id: prod?.id,
                        } : it));
                      }}
                      className="mb-2"
                    />
                  ) : (
                    <h4 className="text-sm font-bold text-white font-cairo truncate flex items-center gap-2">
                      {item.product_name || <span className="text-gray-600 font-normal italic">بدون اسم</span>}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-normal ${item.is_new ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {item.is_new ? 'جديد' : 'مطابق'}
                      </span>
                    </h4>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {/* ✅ حقل الكمية - مُصحّح */}
                    <div>
                      <span className="text-[9px] text-gray-500 font-cairo block">الكمية</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.quantity || ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '' || /^\d+$/.test(val)) {
                            onUpdateItem(idx, 'quantity', val === '' ? 0 : parseInt(val, 10));
                          }
                        }}
                        disabled={item._status === 'saved'}
                        className="w-full bg-white/5 border border-white/5 rounded px-1.5 py-0.5 text-xs text-white font-mono"
                        placeholder="1"
                      />
                    </div>

                    {/* ✅ حقل سعر الشراء - مُصحّح */}
                    <div>
                      <span className="text-[9px] text-gray-500 font-cairo block">سعر الشراء</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.purchase_price || ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (isValidNumberInput(val)) {
                            onUpdateItem(idx, 'purchase_price', parseNumeric(val));
                          }
                        }}
                        disabled={item._status === 'saved'}
                        className="w-full bg-white/5 border border-white/5 rounded px-1.5 py-0.5 text-xs text-white font-mono"
                        placeholder="0.00"
                      />
                    </div>

                    {/* ✅ حقل سعر البيع - مُصحّح */}
                    <div>
                      <span className="text-[9px] text-gray-500 font-cairo block">سعر البيع</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.public_price || ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (isValidNumberInput(val)) {
                            onUpdateItem(idx, 'public_price', parseNumeric(val));
                          }
                        }}
                        disabled={item._status === 'saved'}
                        className="w-full bg-white/5 border border-white/5 rounded px-1.5 py-0.5 text-xs text-white font-mono"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <span className="text-[9px] text-gray-500 font-cairo block">الصلاحية</span>
                      <input
                        type="text"
                        value={item.expiry_date}
                        onChange={e => onUpdateItem(idx, 'expiry_date', e.target.value)}
                        disabled={item._status === 'saved'}
                        className="w-full bg-white/5 border border-white/5 rounded px-1.5 py-0.5 text-[11px] text-white"
                        placeholder="MM/YYYY"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-2 self-stretch flex-shrink-0 pl-1">
                  {item._status === 'pending' && (
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => onUpdateItem(idx, '_editMode', !item._editMode)} 
                        className={`p-1 rounded transition-colors ${item._editMode ? 'text-[var(--nile-teal)] bg-white/5' : 'text-gray-500 hover:text-white'}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => onRemoveItem(idx)} 
                        className="p-1 text-gray-600 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {item._status === 'saving' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                  {item._status === 'saved' && <Check className="w-4 h-4 text-emerald-400" />}
                  {item._status === 'error' && <X className="w-4 h-4 text-red-400" />}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {checkedCount > 0 && (
        <button
          onClick={onSaveAll}
          disabled={saving}
          className="w-full py-3 rounded-xl font-bold font-cairo text-sm text-black flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          style={{
            background: 'linear-gradient(135deg, var(--nile-teal), var(--nile-teal)/80)',
            boxShadow: '0 4px 20px rgba(0,206,209,0.2)'
          }}
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" />جاري الترحيل للمخزون...</>
          ) : (
            <><Save className="w-4 h-4" />اعتماد وحفظ الأصناف المحددة</>
          )}
        </button>
      )}
    </div>
  );
}
