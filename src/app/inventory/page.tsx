'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import {
  PackageOpen,
  Plus,
  Search,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Tag,
  DollarSign,
  Barcode,
  PlusCircle,
  X,
  Trash2,
  Pencil,
  Calendar,
  FileUp,
  Filter,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePageGSAP, useGSAPList } from '@/hooks/usePageGSAP';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';
import { deleteProduct, createBatch, deleteBatch, updateBatch } from '@/lib/api/products';

import { treatmentTypes } from "@/lib/unitOptions";


const getTypeDisplayName = (typeId: string): string => {
  const found = treatmentTypes.find(t => t.id === typeId);
  return found ? found.name : typeId;
};


const getAvailableUnits = (type: string): string[] => {
  const found = treatmentTypes.find(t => t.id === type);
  if (found && found.hasConversion && found.units) {
    return found.units;
  }
  return ['علبة'];
};

const LiveScanner = dynamic(() => import('@/components/shared/CameraScanner'), {
  ssr: false,
  loading: () => <div className="text-sm text-gray-500">جاري تحميل الماسح...</div>,
});

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

const PAGE_SIZE = 15;


function InventoryBatchPanel({
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
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBatch, setNewBatch] = useState({
    barcode: '',
    quantity: 1,
    purchase_price: item.batches.length > 0 ? item.batches[0].purchase_price : 0,
    sale_price: item.batches.length > 0 ? item.current_price || item.batches[0].sale_price : 0,
    expiry_date: '',
  });

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

  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

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
    <div className="p-6 bg-white/[0.02] border-t border-white/5">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-bold text-gray-400 font-cairo">التشغيلات المتاحة</h4>
        <div className="flex gap-2">
          {item.pharmacy_id === user?.user_metadata?.pharmacy_id && (
            <>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00CED1]/10 hover:bg-[#00CED1]/20 text-[#00CED1] text-xs font-bold font-cairo transition-all"
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
            className="mb-8 border border-[#00CED1]/20 bg-[#00CED1]/5 rounded-2xl p-6 overflow-hidden"
          >
            <h5 className="text-sm font-bold text-[#00CED1] mb-4 font-cairo">إضافة تشغيلة (Batch) جديدة</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-cairo px-1">الباركود</label>
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={newBatch.barcode}
                    onChange={(e) => setNewBatch({ ...newBatch, barcode: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:border-[#00CED1] outline-none transition-all"
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
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-[#00CED1] outline-none transition-all"
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
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:border-[#00CED1] outline-none transition-all"
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
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:border-[#00CED1] outline-none transition-all"
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
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:border-[#00CED1] outline-none transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-cairo transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddBatch}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#00CED1] to-[#01AFB2] text-white text-xs font-bold font-cairo transition-all shadow-lg shadow-[#00CED1]/20 hover:scale-[1.02] active:scale-95"
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
                    ? 'bg-[#00CED1]/5 border-[#00CED1]/30 shadow-lg shadow-[#00CED1]/5' 
                    : 'bg-white/5 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-cairo">الباركود</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentBatch.barcode}
                        onChange={(e) => setEditingBatch({ ...currentBatch, barcode: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white focus:border-[#00CED1] outline-none"
                      />
                    ) : (
                      <p className="text-sm font-mono text-gray-300">{batch.barcode || '---'}</p>
                    )}
                  </div>

                  {}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-cairo">الكمية</p>
                    {isEditing ? (
                      <input
                        type="number"
                        value={currentBatch.quantity}
                        onChange={(e) => setEditingBatch({ ...currentBatch, quantity: Number(e.target.value) })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white focus:border-[#00CED1] outline-none"
                      />
                    ) : (
                      <p className={`text-sm font-bold ${batch.quantity < 10 ? 'text-orange-400' : 'text-[#00CED1]'}`}>
                        {batch.quantity}
                      </p>
                    )}
                  </div>

                  {}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-cairo">تاريخ الانتهاء</p>
                    {isEditing ? (
                      <input
                        type="date"
                        value={currentBatch.expiry_date}
                        onChange={(e) => setEditingBatch({ ...currentBatch, expiry_date: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white focus:border-[#00CED1] outline-none [color-scheme:dark]"
                      />
                    ) : (
                      <p className="text-sm text-gray-300">
                        {new Date(batch.expiry_date).toLocaleDateString('ar-EG')}
                      </p>
                    )}
                  </div>

                  {}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-cairo">سعر الشراء</p>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={currentBatch.purchase_price}
                        onChange={(e) => setEditingBatch({ ...currentBatch, purchase_price: Number(e.target.value) })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white focus:border-[#00CED1] outline-none"
                      />
                    ) : (
                      <p className="text-sm text-gray-300">{batch.purchase_price} ج.م</p>
                    )}
                  </div>

                  {}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-cairo">سعر البيع</p>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={currentBatch.sale_price}
                        onChange={(e) => setEditingBatch({ ...currentBatch, sale_price: Number(e.target.value) })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white focus:border-[#00CED1] outline-none"
                      />
                    ) : (
                      <p className="text-sm text-[#D4AF37] font-bold">{batch.sale_price} ج.م</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex justify-end gap-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleUpdateBatch}
                        className="px-4 py-2 bg-gradient-to-r from-[#00CED1] to-[#01AFB2] text-white rounded-xl text-[10px] font-bold font-cairo transition-all hover:scale-105 active:scale-95"
                      >
                        حفظ التعديلات
                      </button>
                      <button
                        onClick={() => setEditingBatch(null)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-[10px] font-cairo transition-all"
                      >
                        إلغاء
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingBatch({...batch})}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-[10px] font-bold font-cairo transition-all"
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


export default function InventoryDashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
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

  const pageRef = usePageGSAP();
  const { user } = useAuth();
  const pharmacyId = user?.user_metadata?.pharmacy_id;

  
  useEffect(() => {
    if (inventoryError) {
      const timer = setTimeout(() => setInventoryError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [inventoryError]);

  useEffect(() => {
    if (!pharmacyId) return;
    fetchInventory();
    const channel = supabase
      .channel('inventory-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, fetchInventory)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchInventory)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [pharmacyId]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          batches(*),
          pharmacy:pharmacies(name)
        `)
        .eq('pharmacy_id', pharmacyId)
        .eq('batches.pharmacy_id', pharmacyId);
      if (error) throw error;

      const formatted: InventoryItem[] = products.map((p: any) => {
        const sortedBatches = [...(p.batches || [])].sort(
          (a: Batch, b: Batch) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
        );
        const totalQuantity = sortedBatches.reduce((acc: number, b: Batch) => acc + (b.quantity || 0), 0);
        const activeBatch = sortedBatches.find((b: any) => b.quantity > 0) || sortedBatches[0];
        const currentPrice = activeBatch?.sale_price || 0;
        return {
          id: p.id,
          name: p.name,
          type: p.type,
          company: p.company_name || 'غير محدد',
          inventory_method: p.inventory_method,
          total_quantity: totalQuantity,
          current_price: currentPrice,
          batches: sortedBatches,
          pharmacy_id: p.pharmacy_id,
          pharmacy_name: p.pharmacy?.name || 'مجهول',
        };
      });

      setItems(formatted);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventoryError('حدث خطأ أثناء جلب بيانات المخزن');
    } finally {
      setLoading(false);
    }
  };

  
  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();
    return items.filter((item) => {
      if (selectedType && item.type !== selectedType) return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.company.toLowerCase().includes(query) ||
        item.batches.some((b) => b.barcode && b.barcode.toLowerCase().includes(query))
      );
    });
  }, [items, search, selectedType]);

  
  const { paginatedData, currentPage, totalPages, totalItems, setPage } = usePagination(
    filteredItems,
    { pageSize: PAGE_SIZE }
  );

  const tbodyRef = useGSAPList<HTMLTableSectionElement>([paginatedData]);

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
      setIsQuickAddOpen(false);
      setSelectedProduct(null);
      fetchInventory();
    } catch (err: any) {
      setInventoryError(err.message || 'خطأ في إضافة التشغيلة');
    }
  };

  const handleCameraScan = (barcode: string) => setSearch(barcode);

  
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    items.forEach(item => {
      if (item.type) types.add(item.type);
    });
    return Array.from(types).sort();
  }, [items]);

  return (
    <div ref={pageRef} className="w-full max-w-7xl mx-auto space-y-6 pb-12 p-2 sm:p-4">
      {}
      <header data-gsap="fade-up" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black flex items-center gap-4 font-cairo tracking-tight"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--nile-teal)] to-[var(--royal-gold)] flex items-center justify-center shadow-[0_0_20px_var(--nile-teal-glow)] relative"
            >
              <div className="absolute inset-0 rounded-2xl bg-white/20 blur-md" />
              <PackageOpen className="text-black w-6 h-6 z-10" />
            </motion.div>
            <span className="nile-gradient-text">إدارة المخزن</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[var(--text-secondary)] mt-2 font-cairo text-sm font-bold uppercase tracking-widest"
          >
            Tracking Products, Batches, and Expirations
          </motion.p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <Link
            href="/inventory/import"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/10 font-cairo hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] group"
          >
            <FileUp className="w-5 h-5 text-[#D4AF37] group-hover:-translate-y-1 transition-transform" /> استيراد ملف
          </Link>
          <Link
            href="/products/create"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--nile-teal)]/10 hover:bg-[var(--nile-teal)]/20 text-[color:var(--nile-teal)] font-bold transition-all border border-[var(--nile-teal)]/20 font-cairo hover:shadow-[0_0_15px_var(--nile-teal-glow)] group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> إضافة صنف
          </Link>
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[var(--royal-gold)]/20 to-[#f2cd56]/10 text-[color:var(--royal-gold)] hover:text-[#f2cd56] font-bold transition-all border border-[var(--royal-gold)]/30 font-cairo hover:shadow-[0_0_15px_var(--royal-gold-glow)] group"
          >
            <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> توريد تشغيلة
          </button>
        </div>
      </header>

      {}
      <div data-gsap="fade-up" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المنتجات', value: items.length, icon: PackageOpen, color: 'text-[#00CED1]', glow: 'bg-[#00CED1]/10' },
          { label: 'إجمالي الرصيد', value: items.reduce((acc, item) => acc + item.total_quantity, 0), icon: Tag, color: 'text-[#D4AF37]', glow: 'bg-[#D4AF37]/10' },
          { label: 'نواقص المخزون', value: items.filter(i => i.total_quantity < 10).length, icon: AlertCircle, color: 'text-red-400', glow: 'bg-red-500/10' },
          { 
            label: 'قيمة المخزن (تكلفة)', 
            value: items.reduce((acc, item) => {
              return acc + item.batches.reduce((bAcc: number, b: Batch) => bAcc + (b.quantity * (b.purchase_price || 0)), 0);
            }, 0).toLocaleString('ar-EG') + ' ج.م', 
            icon: DollarSign, 
            color: 'text-emerald-400', 
            glow: 'bg-emerald-500/10' 
          },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="glass-card p-6 flex items-start gap-5 relative overflow-hidden group border border-white/10 hover:border-white/20 transition-all hover:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] z-10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
            <div className={`w-14 h-14 rounded-2xl ${stat.glow} ${stat.color} flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-xl relative z-10`}>
              <stat.icon className="w-7 h-7 drop-shadow-[0_0_8px_currentColor]" />
            </div>
            <div className="flex-1 relative z-10 mt-1">
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.1em] font-cairo mb-1 group-hover:text-white transition-colors">{stat.label}</p>
              <p className="text-3xl font-black font-inter tracking-tight">{stat.value}</p>
            </div>
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[40px] opacity-10 ${stat.glow} group-hover:opacity-40 transition-all duration-700 group-hover:scale-150 z-0`} />
          </motion.div>
        ))}
      </div>

      {}
      <div data-gsap="fade-up" className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 glass-panel p-2 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="بحث بالاسم، الشركة أو الباركود..."
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-gray-500 py-2 font-cairo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {}
        <div className="relative">
          <button
            onClick={() => setShowTypeFilter(!showTypeFilter)}
            className={`glass-card px-5 py-3 flex items-center justify-center gap-2 transition-all font-cairo w-full md:w-auto ${
              selectedType ? 'text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/10' : 'text-gray-400'
            }`}
          >
            <Filter className="w-4 h-4" />
            {selectedType ? getTypeDisplayName(selectedType) : 'جميع الأنواع'}
            <ChevronDown className={`w-4 h-4 transition-transform ${showTypeFilter ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showTypeFilter && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-64 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[300px] overflow-y-auto"
              >
                <div className="p-2">
                  {}
                  <button
                    onClick={() => {
                      setSelectedType('');
                      setShowTypeFilter(false);
                    }}
                    className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-cairo transition-all flex items-center gap-3 ${
                      !selectedType ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    جميع الأنواع
                  </button>

                  {}
                  {availableTypes.map((type) => {
                    const displayName = getTypeDisplayName(type);
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedType(type);
                          setShowTypeFilter(false);
                        }}
                        className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-cairo transition-all flex items-center gap-3 ${
                          selectedType === type ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Tag className="w-4 h-4" />
                        {displayName}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={fetchInventory}
          disabled={loading}
          className="glass-card px-6 py-3 flex items-center justify-center gap-2 text-[#00CED1] hover:bg-[#00CED1]/10 transition-all font-cairo disabled:opacity-50 w-full md:w-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {}
      <div data-gsap="fade-up">
        <LiveScanner onScan={handleCameraScan} />
      </div>

      {}
      <div data-gsap="fade-up" className="glass-panel overflow-hidden border border-white/5 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 font-cairo text-gray-400 text-[11px] uppercase tracking-wider">
                <th className="p-5 font-bold text-right">المعلومات الأساسية</th>
                <th className="p-5 font-bold text-right hidden lg:table-cell">الشركة المصنعة</th>
                <th className="p-5 font-bold text-right">النظام</th>
                <th className="p-5 font-bold text-center">الرصيد</th>
                <th className="p-5 font-bold text-left">أحدث سعر</th>
                <th className="p-5 w-24"></th>
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    جاري تحميل المخزن...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="w-10 h-10 opacity-50" />
                      {selectedType ? `لا توجد منتجات من نوع "${getTypeDisplayName(selectedType)}"` : 'لا توجد منتجات مطابقة'}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className={`border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-all ${expandedId === item.id ? 'bg-white/[0.03]' : ''}`}
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform ${expandedId === item.id ? 'bg-[#00CED1]/20 rotate-6 shadow-[0_0_15px_rgba(0,206,209,0.2)]' : 'bg-white/5'}`}>
                            <Tag className={`w-5 h-5 ${expandedId === item.id ? 'text-[#00CED1]' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <p className="font-bold text-white font-cairo text-base group-hover:text-[#00CED1] transition-colors">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-gray-500 font-cairo bg-white/5 px-2 py-0.5 rounded-md">
                                {getTypeDisplayName(item.type) || item.type}
                              </span>
                              <span className={`text-[10px] font-bold font-cairo px-2 py-0.5 rounded-md ${item.pharmacy_id === pharmacyId ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#D4AF37]/10 text-[#D4AF37]'}`}>
                                {item.pharmacy_name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-gray-400 font-cairo text-sm hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                           {item.company}
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 border border-white/10 px-2.5 py-1 rounded-full bg-white/5">
                          {item.inventory_method || 'FEFO'}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-lg font-bold font-inter ${item.total_quantity < 10 ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]' : 'text-emerald-400'}`}>
                            {item.total_quantity}
                          </span>
                          <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter mt-0.5">قطعة متاحة</span>
                        </div>
                      </td>
                      <td className="p-5 text-left font-bold text-lg text-white font-inter">
                        <div className="flex flex-col items-start">
                          <span>{item.current_price.toLocaleString()} <span className="text-xs text-gray-500 font-cairo">ج.م</span></span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center gap-2">
                           {item.pharmacy_id === pharmacyId && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!window.confirm(`هل أنت متأكد من حذف المنتج "${item.name}" نهائياً؟`)) return;
                                try {
                                  await deleteProduct(item.id);
                                  fetchInventory();
                                } catch (err) {
                                  setInventoryError('فشل حذف المنتج. قد يكون مرتباً بعمليات بيع.');
                                }
                              }}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all"
                              title="حذف المنتج"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {expandedId === item.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </td>
                    </tr>

                    <AnimatePresence>
                      {expandedId === item.id && (
                        <tr>
                          <td colSpan={8} className="p-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-black/10 backdrop-blur-sm"
                            >
                              <InventoryBatchPanel
                                item={item}
                                fetchInventory={fetchInventory}
                                setInventoryError={setInventoryError}
                                user={user}
                              />
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

      {}
      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={PAGE_SIZE}
          onPageChange={(p) => {
            setExpandedId(null);
            setPage(p);
          }}
        />
      )}

      {}
      <AnimatePresence>
        {inventoryError && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-xl"
            >
              <AlertCircle className="w-5 h-5" />
              {inventoryError}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {}
      <AnimatePresence>
        {isQuickAddOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#050505] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-1 h-full bg-[#D4AF37]"></div>
              
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-cairo flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-[#D4AF37]" />
                    توريد كمية جديدة
                  </h3>
                  <p className="text-xs text-gray-400 font-cairo mt-1">أضف تشغيلة جديدة لصنف موجود بالفعل في نظامك</p>
                </div>
                <button 
                  onClick={() => {
                    setIsQuickAddOpen(false);
                    setSelectedProduct(null);
                  }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
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
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pr-12 pl-4 text-white focus:border-[#D4AF37] outline-none transition-all font-cairo"
                      />
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                      {quickAddResults.map(p => (
                        <div 
                          key={p.id}
                          onClick={() => handleSelectProductForBatch(p)}
                          className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors">
                              <Tag className="w-5 h-5 text-gray-400 group-hover:text-[#D4AF37]" />
                            </div>
                            <div>
                                <p className="font-bold text-white font-cairo">{p.name}</p>
                                <p className="text-[10px] text-gray-500 font-cairo">{getTypeDisplayName(p.type)} - {p.company}</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-[#D4AF37]">{p.total_quantity} قطعة</p>
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
                    <div className="p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Tag className="w-5 h-5 text-[#D4AF37]" />
                          <div>
                            <p className="font-bold text-white font-cairo">{selectedProduct.name}</p>
                            <p className="text-xs text-[#D4AF37]/80 font-cairo">{getTypeDisplayName(selectedProduct.type)} - {selectedProduct.company}</p>
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
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-[#D4AF37] outline-none"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs text-gray-400 font-cairo">الكمية الموردة</label>
                          <input 
                            type="number"
                            value={quickBatch.quantity}
                            onChange={(e) => setQuickBatch({...quickBatch, quantity: Number(e.target.value)})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-[#D4AF37] outline-none"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs text-gray-400 font-cairo">سعر الشراء</label>
                          <input 
                            type="number"
                            step="0.01"
                            value={quickBatch.purchase_price}
                            onChange={(e) => setQuickBatch({...quickBatch, purchase_price: Number(e.target.value)})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-[#D4AF37] outline-none"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs text-gray-400 font-cairo">سعر البيع</label>
                          <input 
                            type="number"
                            step="0.01"
                            value={quickBatch.sale_price}
                            onChange={(e) => setQuickBatch({...quickBatch, sale_price: Number(e.target.value)})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-[#D4AF37] outline-none"
                          />
                       </div>
                       <div className="col-span-2 space-y-2">
                          <label className="text-xs text-gray-400 font-cairo">تاريخ الانتهاء</label>
                          <input 
                            type="date"
                            value={quickBatch.expiry_date}
                            onChange={(e) => setQuickBatch({...quickBatch, expiry_date: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-[#D4AF37] outline-none [color-scheme:dark]"
                          />
                       </div>
                    </div>

                    <button 
                      onClick={submitQuickBatch}
                      className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-black font-cairo rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all active:scale-[0.98]"
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
    </div>
  );
}