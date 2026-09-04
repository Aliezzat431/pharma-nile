import React, { useState } from 'react';
import { PlusCircle, X, Barcode, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBatch } from '@/lib/api/products';
import { treatmentTypes } from '@/lib/unitOptions';

interface InventoryItem {
 id: string;
 name: string;
 type: string;
 company: string;
 total_quantity: number;
 current_price: number;
 batches: any[];
}

interface Props {
 isOpen: boolean;
 onClose: () => void;
 items: InventoryItem[];
 fetchInventory: () => void;
 setInventoryError: (msg: string | null) => void;
}

const getTypeDisplayName = (typeId: string): string => {
 const found = treatmentTypes.find(t => t.id === typeId);
 return found ? found.name : typeId;
};

export function InventoryQuickBatchModal({ isOpen, onClose, items, fetchInventory, setInventoryError }: Props) {
 const [quickAddSearch, setQuickAddSearch] = useState('');
 const [quickAddResults, setQuickAddResults] = useState<InventoryItem[]>([]);
 const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
 const [quickBatch, setQuickBatch] = useState({
 barcode: '',
 quantity: 1,
 purchase_price: 0,
 sale_price: 0,
 expiry_date: '',
 });

 const handleQuickBatchAddBySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
 const val = e.target.value;
 setQuickAddSearch(val);
 if (!val.trim()) {
 setQuickAddResults([]);
 return;
 }
 const results = items.filter(i => 
 i.name.toLowerCase().includes(val.toLowerCase()) || 
 i.batches.some(b => b.barcode && b.barcode.includes(val))
 ).slice(0, 5);
 setQuickAddResults(results);
 };

 const handleSelectProductForBatch = (product: InventoryItem) => {
 setSelectedProduct(product);
 setQuickBatch({
 barcode: '',
 quantity: 1,
 purchase_price: product.batches[0]?.purchase_price || 0,
 sale_price: product.current_price || product.batches[0]?.sale_price || 0,
 expiry_date: '',
 });
 setQuickAddSearch('');
 setQuickAddResults([]);
 };

 const submitQuickBatch = async () => {
 if (!selectedProduct || !quickBatch.quantity || !quickBatch.expiry_date) {
 setInventoryError('الرجاء إكمال البيانات المطلوبة');
 return;
 }
 try {
 await createBatch({
 product_id: selectedProduct.id,
 ...quickBatch
 });
 onClose();
 setSelectedProduct(null);
 setQuickAddSearch('');
 setQuickAddResults([]);
 fetchInventory();
 } catch (err: any) {
 setInventoryError(err.message || 'خطأ في إضافة التشغيلة');
 }
 };

 const handleClose = () => {
 onClose();
 setSelectedProduct(null);
 setQuickAddSearch('');
 setQuickAddResults([]);
 };

 return (
 <AnimatePresence>
 {isOpen && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="bg-[#050505] border border-[var(--glass-border)] rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 w-1 h-full bg-[var(--royal-gold)]"></div>
 
 <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between">
 <div>
 <h3 className="text-xl font-bold font-cairo flex items-center gap-2">
 <PlusCircle className="w-5 h-5 text-[var(--royal-gold)]" />
 توريد كمية جديدة
 </h3>
 <p className="text-xs text-gray-400 font-cairo mt-1">أضف تشغيلة جديدة لصنف موجود بالفعل في نظامك</p>
 </div>
 <button 
 onClick={handleClose}
 className="p-2 rounded-lg bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-heavy)] text-gray-400 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-6 space-y-6">
 {!selectedProduct ? (
 <div className="space-y-4">
 <div className="relative">
 <Barcode className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
 <input
 type="text"
 autoFocus
 placeholder="ابحث باسم المنتج أو الباركود..."
 value={quickAddSearch}
 onChange={handleQuickBatchAddBySearch}
 className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl py-4 pr-12 pl-4 text-white focus:border-[var(--royal-gold)] outline-none transition-all font-cairo"
 />
 </div>

 <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
 {quickAddResults.map(p => (
 <div 
 key={p.id}
 onClick={() => handleSelectProductForBatch(p)}
 className="p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-surface)] hover:bg-[var(--royal-gold)]/10 hover:border-[var(--royal-gold)]/30 cursor-pointer transition-all flex items-center justify-between group"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-[var(--glass-surface)] flex items-center justify-center group-hover:bg-[var(--royal-gold)]/20 transition-colors">
 <Tag className="w-5 h-5 text-gray-400 group-hover:text-[var(--royal-gold)]" />
 </div>
 <div>
 <p className="font-bold text-white font-cairo">{p.name}</p>
 <p className="text-[10px] text-gray-500 font-cairo">{getTypeDisplayName(p.type)} - {p.company}</p>
 </div>
 </div>
 <div className="text-left">
 <p className="text-sm font-bold text-[var(--royal-gold)]">{p.total_quantity} قطعة</p>
 <p className="text-[10px] text-gray-500 font-cairo">الرصيد الحالي</p>
 </div>
 </div>
 ))}
 {quickAddSearch && quickAddResults.length === 0 && (
 <div className="text-center py-8">
 <p className="text-gray-500 font-cairo">لم يتم العثور على نتائج</p>
 </div>
 )}
 </div>
 </div>
 ) : (
 <div className="space-y-6">
 <div className="p-4 rounded-xl bg-[var(--royal-gold)]/10 border border-[var(--royal-gold)]/20 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Tag className="w-5 h-5 text-[var(--royal-gold)]" />
 <div>
 <p className="font-bold text-white font-cairo">{selectedProduct.name}</p>
 <p className="text-xs text-[var(--royal-gold)]/80 font-cairo">{getTypeDisplayName(selectedProduct.type)} - {selectedProduct.company}</p>
 </div>
 </div>
 <button 
 onClick={() => setSelectedProduct(null)}
 className="text-xs text-gray-400 hover:text-white underline font-cairo"
 >
 تغيير المنتج
 </button>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs text-gray-400 font-cairo">الباركود (اختياري)</label>
 <input 
 type="text"
 value={quickBatch.barcode}
 onChange={(e) => setQuickBatch({...quickBatch, barcode: e.target.value})}
 className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-white focus:border-[var(--royal-gold)] outline-none"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs text-gray-400 font-cairo">الكمية الموردة</label>
 <input 
 type="number"
 value={quickBatch.quantity}
 onChange={(e) => setQuickBatch({...quickBatch, quantity: Number(e.target.value)})}
 className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-white focus:border-[var(--royal-gold)] outline-none"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs text-gray-400 font-cairo">سعر الشراء</label>
 <input 
 type="number"
 step="0.01"
 value={quickBatch.purchase_price}
 onChange={(e) => setQuickBatch({...quickBatch, purchase_price: Number(e.target.value)})}
 className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-white focus:border-[var(--royal-gold)] outline-none"
 />
 </div>
 <div className="space-y-2">
 <label className="text-xs text-gray-400 font-cairo">سعر البيع</label>
 <input 
 type="number"
 step="0.01"
 value={quickBatch.sale_price}
 onChange={(e) => setQuickBatch({...quickBatch, sale_price: Number(e.target.value)})}
 className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-white focus:border-[var(--royal-gold)] outline-none"
 />
 </div>
 <div className="col-span-2 space-y-2">
 <label className="text-xs text-gray-400 font-cairo">تاريخ الانتهاء</label>
 <input 
 type="date"
 value={quickBatch.expiry_date}
 onChange={(e) => setQuickBatch({...quickBatch, expiry_date: e.target.value})}
 className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-white focus:border-[var(--royal-gold)] outline-none [color-scheme:dark]"
 />
 </div>
 </div>

 <button 
 onClick={submitQuickBatch}
 className="w-full py-4 bg-glass-surface from-[var(--royal-gold)] to-[#B8860B] text-black font-black font-cairo rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all active:scale-[0.98]"
 >
 تسجيل الكمية في المخزن
 </button>
 </div>
 )}
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 );
}
