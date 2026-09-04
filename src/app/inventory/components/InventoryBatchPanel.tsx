import React, { useState } from 'react';
import { Plus, Trash2, Barcode, Calendar, DollarSign, Edit2, Loader2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteProduct, createBatch, deleteBatch, updateBatch } from '@/lib/api/products';

interface Batch {
 id: string;
 barcode: string;
 quantity: number;
 purchase_price: number;
 sale_price: number;
 expiry_date: string;
}

interface InventoryItem {
 id: string;
 name: string;
 type: string;
 company: string;
 inventory_method: string;
 total_quantity: number;
 current_price: number;
 batches: Batch[];
 pharmacy_id?: string;
 pharmacy_name?: string;
}

export function InventoryBatchPanel({
 item,
 fetchInventory,
 setInventoryError,
 user,
}: {
 item: InventoryItem;
 fetchInventory: () => void;
 setInventoryError: (error: string | null) => void;
 user: any;
}) {
 const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
 const [showAddForm, setShowAddForm] = useState(false);
 const [newBatch, setNewBatch] = useState({
 barcode: '',
 quantity: 1,
 purchase_price: item.batches.length > 0 ? item.batches[0].purchase_price : 0,
 sale_price: item.batches.length > 0 ? item.current_price || item.batches[0].sale_price : 0,
 expiry_date: '',
 });

 const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

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

 const handleAddBatch = async () => {
 try {
 if (!newBatch.quantity || !newBatch.expiry_date || !newBatch.purchase_price || !newBatch.sale_price) {
 setInventoryError('الرجاء إكمال كافة البيانات المطلوبة للتشغيلة');
 return;
 }

 await createBatch({
 product_id: item.id,
 ...newBatch,
 expiry_date: parseDate(newBatch.expiry_date),
 });

 setShowAddForm(false);
 setNewBatch({
 barcode: '',
 quantity: 1,
 purchase_price: newBatch.purchase_price,
 sale_price: newBatch.sale_price,
 expiry_date: '',
 });
 fetchInventory();
 } catch (error: any) {
 console.error('Error adding batch:', error);
 setInventoryError(error.message || 'حدث خطأ أثناء إضافة التشغيلة');
 }
 };

 const handleUpdateBatch = async () => {
 if (!editingBatch) return;
 try {
 await updateBatch(editingBatch.id, {
 barcode: editingBatch.barcode,
 quantity: editingBatch.quantity,
 purchase_price: editingBatch.purchase_price,
 sale_price: editingBatch.sale_price,
 expiry_date: parseDate(editingBatch.expiry_date)
 });
 setEditingBatch(null);
 fetchInventory();
 } catch (error: any) {
 console.error('Error updating batch:', error);
 setInventoryError(error.message || 'حدث خطأ أثناء تحديث التشغيلة');
 }
 };

 const handleDeleteBatch = async (batchId: string) => {
 if (!window.confirm('هل أنت متأكد من حذف هذه التشغيلة؟ سيتم مسح الكمية المرتبطة بها نهائياً.')) return;
 try {
 await deleteBatch(batchId);
 fetchInventory();
 } catch (error: any) {
 console.error('Error deleting batch:', error);
 setInventoryError(error.message || 'فشل حذف التشغيلة. قد تكون مرتبطة بعمليات بيع.');
 }
 };

 const handleDeleteProduct = async () => {
 if (!window.confirm(`هل أنت متأكد من حذف المنتج "${item.name}" نهائياً من النظام؟`)) return;
 try {
 await deleteProduct(item.id);
 fetchInventory();
 } catch (error: any) {
 console.error('Error deleting product:', error);
 setInventoryError(error.message || 'فشل حذف المنتج. قد يكون هناك مبيعات مرتبطة به.');
 }
 };

 return (
 <div className="p-6 bg-white/[0.02] border-t border-[var(--glass-border)]">
 <div className="flex justify-between items-center mb-4">
 <h4 className="text-sm font-bold text-gray-400 font-cairo">التشغيلات المتاحة</h4>
 <div className="flex gap-2">
 {item.pharmacy_id === user?.user_metadata?.pharmacy_id && (
 <>
 <button
 onClick={() => setShowAddForm(!showAddForm)}
 className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--nile-teal)]/10 hover:bg-[var(--nile-teal)]/20 text-[var(--nile-teal)] text-xs font-bold font-cairo transition-all"
 >
 <Plus className="w-3.5 h-3.5" /> إضافة تشغيلة
 </button>
 <button
 onClick={handleDeleteProduct}
 className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold font-cairo transition-all"
 >
 <Trash2 className="w-3.5 h-3.5" /> حذف المنتج نهائياً
 </button>
 </>
 )}
 </div>
 </div>

 <AnimatePresence>
 {showAddForm && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 className="mb-8 border border-[var(--nile-teal)]/20 bg-[var(--nile-teal)]/5 rounded-2xl p-6 overflow-hidden"
 >
 <h5 className="text-sm font-bold text-[var(--nile-teal)] mb-4 font-cairo">إضافة تشغيلة (Batch) جديدة</h5>
 <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
 <div className="space-y-1.5">
 <label className="text-[10px] text-gray-400 font-cairo px-1">الباركود</label>
 <div className="relative">
 <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
 <input
 type="text"
 value={newBatch.barcode}
 onChange={(e) => setNewBatch({ ...newBatch, barcode: e.target.value })}
 className="w-full bg-black/40 border border-[var(--glass-border)] rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:border-[var(--nile-teal)] outline-none transition-all"
 placeholder="باركود التشغيلة..."
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-[10px] text-gray-400 font-cairo px-1">الكمية <span className="text-red-400">*</span></label>
 <input
 type="number"
 min="1"
 value={newBatch.quantity}
 onChange={(e) => setNewBatch({ ...newBatch, quantity: Number(e.target.value) })}
 className="w-full bg-black/40 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-sm text-white focus:border-[var(--nile-teal)] outline-none transition-all"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-[10px] text-gray-400 font-cairo px-1">تاريخ الانتهاء <span className="text-red-400">*</span></label>
 <div className="relative">
 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
 <input
 type="text"
 value={newBatch.expiry_date}
 onChange={(e) => setNewBatch({ ...newBatch, expiry_date: e.target.value })}
 className="w-full bg-black/40 border border-[var(--glass-border)] rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:border-[var(--nile-teal)] outline-none transition-all"
 placeholder="DD/MM/YYYY أو MM/YYYY"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-[10px] text-gray-400 font-cairo px-1">سعر الشراء <span className="text-red-400">*</span></label>
 <div className="relative">
 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
 <input
 type="number"
 step="0.01"
 value={newBatch.purchase_price}
 onChange={(e) => setNewBatch({ ...newBatch, purchase_price: Number(e.target.value) })}
 className="w-full bg-black/40 border border-[var(--glass-border)] rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:border-[var(--nile-teal)] outline-none transition-all"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-[10px] text-gray-400 font-cairo px-1">سعر البيع <span className="text-red-400">*</span></label>
 <div className="relative">
 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
 <input
 type="number"
 step="0.01"
 value={newBatch.sale_price}
 onChange={(e) => setNewBatch({ ...newBatch, sale_price: Number(e.target.value) })}
 className="w-full bg-black/40 border border-[var(--glass-border)] rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:border-[var(--nile-teal)] outline-none transition-all"
 />
 </div>
 </div>
 </div>
 <div className="mt-6 flex justify-end gap-3">
 <button
 onClick={() => setShowAddForm(false)}
 className="px-4 py-2 rounded-xl bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-heavy)] text-gray-400 text-xs font-cairo transition-all"
 >
 إلغاء
 </button>
 <button
 onClick={handleAddBatch}
 className="px-6 py-2 rounded-xl bg-glass-surface from-[var(--nile-teal)] to-[#01AFB2] text-white text-xs font-bold font-cairo transition-all shadow-lg shadow-[var(--nile-teal)]/20 hover:scale-[1.02] active:scale-95"
 >
 حفظ التشغيلة
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 {item.batches.length === 0 ? (
 <p className="text-gray-500 text-sm font-cairo">لا توجد تشغيلات مسجلة</p>
 ) : (
 <div className="space-y-4">
 {item.batches.map((batch) => {
 const isEditing = editingBatch?.id === batch.id;
 const currentBatch = isEditing ? editingBatch : batch;
 
 return (
 <div
 key={batch.id}
 className={`p-5 rounded-2xl border transition-all ${
 isEditing 
 ? 'bg-[var(--nile-teal)]/5 border-[var(--nile-teal)]/30 shadow-lg shadow-[var(--nile-teal)]/5' 
 : 'bg-[var(--glass-surface)] border-[var(--glass-border)] hover:border-white/20'
 }`}
 >
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
 {/* Barcode */}
 <div className="space-y-1.5">
 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-cairo">الباركود</p>
 {isEditing ? (
 <input
 type="text"
 value={currentBatch.barcode}
 onChange={(e) => setEditingBatch({ ...currentBatch, barcode: e.target.value })}
 className="w-full bg-black/40 border border-[var(--glass-border)] rounded-xl px-3 py-1.5 text-sm text-white focus:border-[var(--nile-teal)] outline-none"
 />
 ) : (
 <p className="text-sm font-mono text-gray-300">{batch.barcode || '---'}</p>
 )}
 </div>

 {/* Quantity */}
 <div className="space-y-1.5">
 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-cairo">الكمية</p>
 {isEditing ? (
 <input
 type="number"
 value={currentBatch.quantity}
 onChange={(e) => setEditingBatch({ ...currentBatch, quantity: Number(e.target.value) })}
 className="w-full bg-black/40 border border-[var(--glass-border)] rounded-xl px-3 py-1.5 text-sm text-white focus:border-[var(--nile-teal)] outline-none"
 />
 ) : (
 <p className={`text-sm font-bold ${batch.quantity < 10 ? 'text-orange-400' : 'text-[var(--nile-teal)]'}`}>
 {batch.quantity}
 </p>
 )}
 </div>

 {/* Expiry */}
 <div className="space-y-1.5">
 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-cairo">تاريخ الانتهاء</p>
 {isEditing ? (
 <input
 type="date"
 value={currentBatch.expiry_date}
 onChange={(e) => setEditingBatch({ ...currentBatch, expiry_date: e.target.value })}
 className="w-full bg-black/40 border border-[var(--glass-border)] rounded-xl px-3 py-1.5 text-sm text-white focus:border-[var(--nile-teal)] outline-none [color-scheme:dark]"
 />
 ) : (
 <p className="text-sm text-gray-300">
 {new Date(batch.expiry_date).toLocaleDateString('ar-EG')}
 </p>
 )}
 </div>

 {/* Purchase Price */}
 <div className="space-y-1.5">
 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-cairo">سعر الشراء</p>
 {isEditing ? (
 <input
 type="number"
 step="0.01"
 value={currentBatch.purchase_price}
 onChange={(e) => setEditingBatch({ ...currentBatch, purchase_price: Number(e.target.value) })}
 className="w-full bg-black/40 border border-[var(--glass-border)] rounded-xl px-3 py-1.5 text-sm text-white focus:border-[var(--nile-teal)] outline-none"
 />
 ) : (
 <p className="text-sm text-gray-300">{batch.purchase_price} ج.م</p>
 )}
 </div>

 {/* Sale Price */}
 <div className="space-y-1.5">
 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-cairo">سعر البيع</p>
 {isEditing ? (
 <input
 type="number"
 step="0.01"
 value={currentBatch.sale_price}
 onChange={(e) => setEditingBatch({ ...currentBatch, sale_price: Number(e.target.value) })}
 className="w-full bg-black/40 border border-[var(--glass-border)] rounded-xl px-3 py-1.5 text-sm text-white focus:border-[var(--nile-teal)] outline-none"
 />
 ) : (
 <p className="text-sm text-[var(--royal-gold)] font-bold">{batch.sale_price} ج.م</p>
 )}
 </div>
 </div>

 <div className="mt-4 pt-4 border-t border-[var(--glass-border)] flex justify-end gap-3">
 {isEditing ? (
 <>
 <button
 onClick={handleUpdateBatch}
 className="px-4 py-2 bg-glass-surface from-[var(--nile-teal)] to-[#01AFB2] text-white rounded-xl text-[10px] font-bold font-cairo transition-all hover:scale-105 active:scale-95"
 >
 حفظ التعديلات
 </button>
 <button
 onClick={() => setEditingBatch(null)}
 className="px-4 py-2 bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-heavy)] text-gray-400 rounded-xl text-[10px] font-cairo transition-all"
 >
 إلغاء
 </button>
 </>
 ) : (
 <>
 <button
 onClick={() => setEditingBatch({...batch})}
 className="px-4 py-2 bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-heavy)] text-gray-400 hover:text-white rounded-xl text-[10px] font-bold font-cairo transition-all"
 >
 تعديل
 </button>
 <button
 onClick={() => handleDeleteBatch(batch.id)}
 className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all"
 title="حذف التشغيلة"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </>
 )}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
}
