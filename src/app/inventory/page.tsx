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
  Trash2,
  Calendar,
  DollarSign,
  Barcode,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePageGSAP, useGSAPList } from '@/hooks/usePageGSAP';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';
import { deleteProduct, createBatch, deleteBatch, updateBatch } from '@/lib/api/products';

const LiveScanner = dynamic(() => import('@/components/shared/CameraScanner'), {
  ssr: false,
  loading: () => <div className="text-sm text-gray-500">جاري تحميل الماسح...</div>,
});

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
  pharmacy_id?: string;
  pharmacy_name?: string;
}

const PAGE_SIZE = 15;

// ─── Batch Panel ─────────────────────────────────────────────────────────────
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
    selling_price: item.batches.length > 0 ? item.current_price || item.batches[0].selling_price : 0,
    expiry_date: '',
  });

  const handleAddBatch = async () => {
    try {
      if (!newBatch.quantity || !newBatch.expiry_date || !newBatch.purchase_price || !newBatch.selling_price) {
        setInventoryError('الرجاء إكمال كافة البيانات المطلوبة للتشغيلة');
        return;
      }

      await createBatch({
        product_id: item.id,
        ...newBatch,
      });

      setShowAddForm(false);
      setNewBatch({
        barcode: '',
        quantity: 1,
        purchase_price: newBatch.purchase_price,
        selling_price: newBatch.selling_price,
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
        selling_price: editingBatch.selling_price,
        expiry_date: editingBatch.expiry_date
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
                    type="date"
                    value={newBatch.expiry_date}
                    onChange={(e) => setNewBatch({ ...newBatch, expiry_date: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:border-[#00CED1] outline-none transition-all [color-scheme:dark]"
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
                    value={newBatch.selling_price}
                    onChange={(e) => setNewBatch({ ...newBatch, selling_price: Number(e.target.value) })}
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
                  {/* Barcode */}
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

                  {/* Quantity */}
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

                  {/* Expiry */}
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

                  {/* Purchase Price */}
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

                  {/* Selling Price */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-cairo">سعر البيع</p>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={currentBatch.selling_price}
                        onChange={(e) => setEditingBatch({ ...currentBatch, selling_price: Number(e.target.value) })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white focus:border-[#00CED1] outline-none"
                      />
                    ) : (
                      <p className="text-sm text-[#D4AF37] font-bold">{batch.selling_price} ج.م</p>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InventoryDashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  // GSAP page-entry animation
  const pageRef = usePageGSAP();
  const { user } = useAuth();
  const pharmacyId = user?.user_metadata?.pharmacy_id;

  // Auto-hide error
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
        `);
      if (error) throw error;

      const formatted: InventoryItem[] = products.map((p: any) => {
        const sortedBatches = [...(p.batches || [])].sort(
          (a: Batch, b: Batch) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
        );
        const totalQuantity = sortedBatches.reduce((acc: number, b: Batch) => acc + (b.quantity || 0), 0);
        const activeBatch = sortedBatches.find((b: Batch) => b.quantity > 0) || sortedBatches[0];
        const currentPrice = activeBatch?.selling_price || 0;
        return {
          id: p.id,
          name: p.name,
          type: p.type,
          company: p.company || 'غير محدد',
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
    if (!query) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.company.toLowerCase().includes(query) ||
        item.batches.some((b) => b.barcode.toLowerCase().includes(query))
    );
  }, [items, search]);

  // Pagination
  const { paginatedData, currentPage, totalPages, totalItems, setPage } = usePagination(
    filteredItems,
    { pageSize: PAGE_SIZE }
  );

  // Animate table rows on page / data change
  const tbodyRef = useGSAPList<HTMLTableSectionElement>([paginatedData]);

  const handleCameraScan = (barcode: string) => setSearch(barcode);

  return (
    <div ref={pageRef} className="w-full max-w-7xl mx-auto space-y-6 pb-12 p-2 sm:p-4">
      {/* Header */}
      <header data-gsap="fade-up" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 font-cairo">
            <PackageOpen className="text-[#00CED1]" />
            إدارة <span className="text-[#00CED1]">المخزن</span>
          </h1>
          <p className="text-gray-400 mt-2 font-cairo">تتبع المنتجات، التشغيلات، وتواريخ الانتهاء</p>
        </div>
        <Link
          href="/products/create"
          className="flex items-center justify-center w-full md:w-auto gap-2 px-5 py-2.5 rounded-xl bg-[#00CED1]/10 hover:bg-[#00CED1]/20 text-[#00CED1] font-medium transition-all border border-[#00CED1]/20 font-cairo"
        >
          <Plus className="w-5 h-5" /> إضافة صنف جديد
        </Link>
      </header>

      {/* Stats Section */}
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
          <div key={i} className="glass-card p-5 flex items-center gap-5 border-white/5 relative overflow-hidden group hover:bg-white/[0.05] transition-all">
            <div className={`w-12 h-12 rounded-2xl ${stat.glow} ${stat.color} flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6 shadow-lg shadow-black/20`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.1em] font-cairo mb-1">{stat.label}</p>
              <p className="text-xl font-black font-inter tracking-tight">{stat.value}</p>
            </div>
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-[40px] opacity-10 ${stat.glow} group-hover:opacity-30 transition-opacity`} />
          </div>
        ))}
      </div>

      {/* Search & Controls */}
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
        <button
          onClick={fetchInventory}
          disabled={loading}
          className="glass-card px-6 py-3 flex items-center justify-center gap-2 text-[#00CED1] hover:bg-[#00CED1]/10 transition-all font-cairo disabled:opacity-50 w-full md:w-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {/* Scanner */}
      <div data-gsap="fade-up">
        <LiveScanner onScan={handleCameraScan} />
      </div>

      {/* Table */}
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
                      لا توجد منتجات مطابقة
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
                              <span className="text-[10px] text-gray-500 font-cairo bg-white/5 px-2 py-0.5 rounded-md">{item.type}</span>
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
                          {item.inventory_method}
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

      {/* Pagination */}
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

      {/* Error Toast */}
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
    </div>
  );
}
