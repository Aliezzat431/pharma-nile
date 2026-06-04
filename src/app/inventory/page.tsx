'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PackageOpen, Plus, Search, Filter, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Calendar, Hash, Tag, Edit2, Check, X, Loader2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { updateBatch, createBatch, getProductByBarcode } from '@/lib/api/products';
import dynamic from 'next/dynamic';

const LiveScanner = dynamic(() => import('@/components/shared/CameraScanner'), { ssr: false });

interface Batch {
  id: string;
  barcode: string;
  quantity: number;
  purchase_price: number;
  selling_price: number;
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
}

export default function InventoryDashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Editing state
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Batch>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Adding Batch state
  const [addingBatchForProduct, setAddingBatchForProduct] = useState<string | null>(null);
  const [newBatchForm, setNewBatchForm] = useState<Partial<Batch>>({ quantity: 0, purchase_price: 0, selling_price: 0, barcode: '', expiry_date: '' });
  const [isAddingBatch, setIsAddingBatch] = useState(false);

  useEffect(() => {
    fetchInventory();

    const channel = supabase
      .channel('inventory-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, () => fetchInventory())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchInventory())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*, batches(*)');

      if (error) throw error;

      const formatted = products.map((p) => {
        const sortedBatches = p.batches.sort((a: any, b: any) => 
          new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
        );
        
        return {
           id: p.id,
           name: p.name,
           type: p.type,
           company: p.company,
           inventory_method: p.inventory_method,
           total_quantity: sortedBatches.reduce((acc: number, b: any) => acc + b.quantity, 0),
           current_price: sortedBatches.length > 0 ? sortedBatches.find((b: any) => b.quantity > 0)?.selling_price || sortedBatches[0].selling_price : 0,
           batches: sortedBatches
        };
      });

      setItems(formatted);
    } catch (error) {
      console.error("Error fetching inventory", error);
    } finally {
      setLoading(false);
    }
  };

  const [inventoryError, setInventoryError] = useState<string | null>(null);

  const startEditing = (batch: Batch) => {
    setEditingBatchId(batch.id);
    setEditForm(batch);
  };

  const cancelEditing = () => {
    setEditingBatchId(null);
    setEditForm({});
  };

  const handleSaveBatch = async (batchId: string) => {
    const q = Number(editForm.quantity);
    const p = Number(editForm.purchase_price);
    const s = Number(editForm.selling_price);

    if (q <= 0 || p <= 0 || s <= 0) {
      setInventoryError("خطأ: الكمية والأسعار يجب أن تكون أكبر من صفر.");
      setTimeout(() => setInventoryError(null), 3500);
      return;
    }

    setIsSaving(true);
    setInventoryError(null);
    try {
      await updateBatch(batchId, {
        quantity: q,
        purchase_price: p,
        selling_price: s,
        barcode: editForm.barcode?.trim() || '',
      });
      setEditingBatchId(null);
      await fetchInventory(); // Refresh data
    } catch (error) {
      setInventoryError("فشل تحديث البيانات");
      setTimeout(() => setInventoryError(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const startAddingBatch = (productId: string) => {
    setAddingBatchForProduct(productId);
    setNewBatchForm({ quantity: 0, purchase_price: 0, selling_price: 0, barcode: '', expiry_date: '' });
  };

  const handleCreateBatch = async (productId: string) => {
    const q = Number(newBatchForm.quantity);
    const p = Number(newBatchForm.purchase_price);
    const s = Number(newBatchForm.selling_price);
    const barcodeTrimmed = newBatchForm.barcode?.trim();

    if (q <= 0 || p <= 0 || s <= 0) {
      setInventoryError("خطأ: الكمية والأسعار يجب أن تكون أكبر من صفر.");
      setTimeout(() => setInventoryError(null), 3500);
      return;
    }

    if (!barcodeTrimmed) {
      setInventoryError("خطأ: الباركود لا يمكن أن يكون فارغاً.");
      setTimeout(() => setInventoryError(null), 3500);
      return;
    }

    setIsAddingBatch(true);
    setInventoryError(null);
    try {
      await createBatch({
        product_id: productId,
        barcode: barcodeTrimmed,
        quantity: q,
        purchase_price: p,
        selling_price: s,
        expiry_date: newBatchForm.expiry_date,
      });
      setAddingBatchForProduct(null);
      await fetchInventory();
    } catch (error) {
      setInventoryError("فشل إضافة التشغيلة");
      setTimeout(() => setInventoryError(null), 3000);
    } finally {
      setIsAddingBatch(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    (item.company || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCameraScan = async (barcode: string) => {
    setSearch(barcode);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 font-cairo text-foreground">
             <PackageOpen className="text-[#00CED1]" />
             إدارة <span className="text-[#00CED1]">المخزن والتشغيلات</span>
          </h1>
          <p className="text-gray-400 mt-2 font-cairo">تتبع المنتجات، تواريخ الانتهاء، وتعديل الكميات يدوياً.</p>
        </div>
        <Link href="/products/create" className="flex items-center justify-center w-full md:w-auto gap-2 px-5 py-2.5 rounded-xl bg-[#00CED1]/10 hover:bg-[#00CED1]/20 text-[#00CED1] font-medium transition-colors border border-[#00CED1]/20 font-cairo">
          <Plus className="w-5 h-5" /> إضافة صنف جديد
        </Link>
      </header>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 glass-panel p-2 flex items-center gap-3 w-full">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input 
            type="text" 
            placeholder="بحث بالاسم أو الشركة..." 
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-gray-500 py-2 font-cairo min-w-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={fetchInventory}
          className="glass-card px-4 py-3 md:py-2 flex justify-center items-center gap-2 text-[#00CED1] hover:bg-[#00CED1]/10 transition-colors font-cairo w-full md:w-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> تحديث
        </button>
      </div>

      {/* Background Live Scanner */}
      <LiveScanner onScan={handleCameraScan} />

      {/* Table Area */}
      <div className="glass-panel overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 font-cairo text-gray-400">
                <th className="p-5 font-semibold text-right">اسم المنتج</th>
                <th className="p-5 font-semibold text-right">التصنيف</th>
                <th className="p-5 font-semibold text-right">الشركة</th>
                <th className="p-5 font-semibold text-right">النظام</th>
                <th className="p-5 font-semibold text-right">الرصيد</th>
                <th className="p-5 font-semibold text-left">أقل سعر</th>
                <th className="p-5 text-center w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                   <td colSpan={7} className="p-10 text-center text-gray-500 font-cairo">جاري التحميل...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                   <td colSpan={7} className="p-10 text-center text-gray-500 flex flex-col items-center justify-center gap-2 font-cairo">
                      <AlertCircle className="w-8 h-8 opacity-50" />
                      لا توجد نتائج
                   </td>
                </tr>
              ) : (
                filteredItems.map((item, i) => (
                  <React.Fragment key={item.id}>
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer ${expandedId === item.id ? 'bg-white/5' : ''}`}
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-[#00CED1]/10 flex items-center justify-center group-hover:bg-[#00CED1]/20 transition-colors">
                              <Tag className="w-4 h-4 text-[#00CED1]" />
                           </div>
                           <span className="text-foreground font-medium font-cairo">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-5 text-gray-500 font-cairo">{item.type}</td>
                      <td className="p-5 text-gray-500 font-cairo">{item.company}</td>
                      <td className="p-5 text-gray-500 font-cairo text-xs font-bold">{item.inventory_method}</td>
                      <td className="p-5">
                         <span className={`font-bold ${item.total_quantity < 10 ? 'text-orange-400' : 'text-green-400'} font-cairo`}>
                            {item.total_quantity}
                         </span>
                      </td>
                      <td className="p-5 text-left font-bold text-foreground font-cairo">{item.current_price} ج.م</td>
                      <td className="p-5 text-center">
                         {expandedId === item.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </td>
                    </motion.tr>
                    
                    {/* Expanded Batches Details */}
                    <AnimatePresence>
                      {expandedId === item.id && (
                        <tr>
                          <td colSpan={7} className="p-0 border-b border-white/5">
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-black/10 backdrop-blur-sm"
                            >
                              <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {addingBatchForProduct === item.id ? (
                                    <div className="glass-card p-5 border-[#00CED1]/50 bg-[#00CED1]/5 relative shadow-[0_0_15px_rgba(0,206,209,0.1)]">
                                      <h4 className="text-sm font-bold text-[#00CED1] mb-3 flex items-center gap-2 font-cairo">
                                        <Plus className="w-4 h-4" /> إضافة تشغيلة جديدة
                                      </h4>
                                      <div className="space-y-3">
                                        <div className="flex gap-4">
                                          <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 block mb-1 font-cairo">الباركود</label>
                                            <input 
                                              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1]"
                                              value={newBatchForm.barcode}
                                              onChange={(e) => setNewBatchForm({...newBatchForm, barcode: e.target.value})}
                                            />
                                          </div>
                                          <div className="w-24">
                                            <label className="text-[10px] text-gray-400 block mb-1 font-cairo">الكمية</label>
                                            <input 
                                              type="number"
                                              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1]"
                                              value={newBatchForm.quantity}
                                              onChange={(e) => setNewBatchForm({...newBatchForm, quantity: Number(e.target.value)})}
                                            />
                                          </div>
                                        </div>
                                        <div className="flex gap-4">
                                          <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 block mb-1 font-cairo">سعر الشراء</label>
                                            <input 
                                              type="number"
                                              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1]"
                                              value={newBatchForm.purchase_price}
                                              onChange={(e) => setNewBatchForm({...newBatchForm, purchase_price: Number(e.target.value)})}
                                            />
                                          </div>
                                          <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 block mb-1 font-cairo">سعر البيع</label>
                                            <input 
                                              type="number"
                                              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1]"
                                              value={newBatchForm.selling_price}
                                              onChange={(e) => setNewBatchForm({...newBatchForm, selling_price: Number(e.target.value)})}
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-gray-400 block mb-1 font-cairo">تاريخ الانتهاء</label>
                                          <input 
                                            type="date"
                                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1] [color-scheme:dark]"
                                            value={newBatchForm.expiry_date}
                                            onChange={(e) => setNewBatchForm({...newBatchForm, expiry_date: e.target.value})}
                                          />
                                        </div>
                                        <div className="flex gap-2 justify-end pt-2">
                                          <button 
                                            onClick={() => setAddingBatchForProduct(null)}
                                            className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-white hover:bg-white/10 font-cairo text-sm"
                                          >
                                            إلغاء
                                          </button>
                                          <button 
                                            disabled={isAddingBatch || !newBatchForm.barcode || !newBatchForm.expiry_date}
                                            onClick={() => handleCreateBatch(item.id)}
                                            className="px-3 py-1.5 rounded bg-gradient-to-r from-[#00CED1] to-[#00CED1]/80 text-black hover:opacity-90 font-bold font-cairo text-sm flex items-center gap-2 disabled:opacity-50"
                                          >
                                            {isAddingBatch ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                            حفظ
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => startAddingBatch(item.id)}
                                      className="glass-card p-5 border-dashed border-white/20 hover:border-[#00CED1]/50 hover:bg-[#00CED1]/5 transition-all text-[#00CED1] font-cairo flex flex-col items-center justify-center gap-3 min-h-[160px]"
                                    >
                                      <Plus className="w-8 h-8" />
                                      <span className="font-bold">إضافة تشغيلة جديدة</span>
                                    </button>
                                  )}
                                  {item.batches.map((batch) => (
                                    <div key={batch.id} className="glass-card p-5 border-white/10 relative group hover:border-[#D4AF37]/30 transition-all">
                                      {editingBatchId === batch.id ? (
                                        <div className="space-y-4">
                                          <div className="flex justify-between gap-4">
                                            <div className="flex-1">
                                              <label className="text-[10px] text-gray-500 block mb-1 font-cairo">الباركود</label>
                                              <input 
                                                className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1]"
                                                value={editForm.barcode}
                                                onChange={(e) => setEditForm({...editForm, barcode: e.target.value})}
                                              />
                                            </div>
                                            <div className="w-24">
                                              <label className="text-[10px] text-gray-500 block mb-1 font-cairo">الكمية</label>
                                              <input 
                                                type="number"
                                                className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1]"
                                                value={editForm.quantity}
                                                onChange={(e) => setEditForm({...editForm, quantity: Number(e.target.value)})}
                                              />
                                            </div>
                                          </div>
                                          <div className="flex justify-between gap-4">
                                            <div className="flex-1">
                                              <label className="text-[10px] text-gray-500 block mb-1 font-cairo">سعر الشراء</label>
                                              <input 
                                                type="number"
                                                className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1]"
                                                value={editForm.purchase_price}
                                                onChange={(e) => setEditForm({...editForm, purchase_price: Number(e.target.value)})}
                                              />
                                            </div>
                                            <div className="flex-1">
                                              <label className="text-[10px] text-gray-500 block mb-1 font-cairo">سعر البيع</label>
                                              <input 
                                                type="number"
                                                className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[#00CED1]"
                                                value={editForm.selling_price}
                                                onChange={(e) => setEditForm({...editForm, selling_price: Number(e.target.value)})}
                                              />
                                            </div>
                                          </div>
                                          <div className="flex gap-2 justify-end pt-2">
                                            <button 
                                              onClick={cancelEditing}
                                              className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                            <button 
                                              onClick={() => handleSaveBatch(batch.id)}
                                              disabled={isSaving}
                                              className="p-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50"
                                            >
                                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <button 
                                            onClick={() => startEditing(batch)}
                                            className="absolute top-4 left-4 p-2 rounded-lg bg-white/5 text-gray-500 opacity-0 group-hover:opacity-100 transition-all hover:text-[#00CED1] hover:bg-[#00CED1]/10"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                          <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-cairo">
                                              <Hash className="w-3 h-3" />
                                              {batch.barcode}
                                            </div>
                                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${new Date(batch.expiry_date) < new Date() ? 'bg-red-500/20 text-red-400' : 'bg-[#00CED1]/10 text-[#00CED1]'}`}>
                                              {new Date(batch.expiry_date) < new Date() ? 'منتهي' : 'صالح'}
                                            </div>
                                          </div>
                                          <div className="flex justify-between items-end">
                                            <div>
                                              <div className="flex items-center gap-2 text-foreground font-bold mb-1">
                                                <span className="text-2xl font-cairo">{batch.quantity}</span>
                                                <span className="text-xs text-gray-500 font-cairo">علبة</span>
                                              </div>
                                              <div className="flex items-center gap-2 text-xs text-gray-500 font-cairo">
                                                <Calendar className="w-3 h-3" />
                                                <span>انتهاء:</span>
                                                <span dir="ltr">{new Date(batch.expiry_date).toLocaleDateString('ar-EG')}</span>
                                              </div>
                                            </div>
                                            <div className="text-left flex gap-6">
                                              <div className="flex flex-col gap-1">
                                                <p className="text-[10px] text-gray-500 font-cairo">سعر الشراء</p>
                                                <p className="font-bold text-gray-400 font-cairo text-sm" dir="ltr">{batch.purchase_price} ج.م</p>
                                              </div>
                                              <div className="flex flex-col gap-1">
                                                <p className="text-[10px] text-gray-500 font-cairo">سعر البيع</p>
                                                <p className="font-bold text-[#D4AF37] font-cairo text-sm" dir="ltr">{batch.selling_price} ج.م</p>
                                              </div>
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AnimatePresence>
        {inventoryError && (
          <div className="fixed bottom-4 left-4 z-50">
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-red-500/20 text-red-500 border border-red-500/30 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 backdrop-blur-md font-cairo"
            >
              <AlertCircle className="w-5 h-5" />
              {inventoryError}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React from 'react';
