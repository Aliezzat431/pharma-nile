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
 XCircle,
 Download,
 Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import * as XLSX from 'xlsx';
import { usePageGSAP, useGSAPList } from '@/hooks/usePageGSAP';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';
import { deleteProduct, createBatch, deleteBatch, updateBatch } from '@/lib/api/products';
import { InventoryBatchPanel } from './components/InventoryBatchPanel';
import { InventoryQuickBatchModal } from './components/InventoryQuickBatchModal';

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





export default function InventoryDashboard() {
 const [items, setItems] = useState<InventoryItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [selectedType, setSelectedType] = useState<string>('');
 const [showTypeFilter, setShowTypeFilter] = useState(false);
 const [filterStockStatus, setFilterStockStatus] = useState<string>(''); // '', 'low-stock', 'out-of-stock', 'near-expiry'
 const [expandedId, setExpandedId] = useState<string | null>(null);
 const [inventoryError, setInventoryError] = useState<string | null>(null);
 const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

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
 
 if (filterStockStatus === 'out-of-stock' && item.total_quantity > 0) return false;
 if (filterStockStatus === 'low-stock' && (item.total_quantity === 0 || item.total_quantity >= 10)) return false;
 if (filterStockStatus === 'near-expiry') {
 const hasNearExpiry = item.batches.some(b => {
 const daysToExpiry = (new Date(b.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
 return daysToExpiry > 0 && daysToExpiry <= 90;
 });
 if (!hasNearExpiry) return false;
 }

 if (!query) return true;
 return (
 item.name.toLowerCase().includes(query) ||
 item.company.toLowerCase().includes(query) ||
 item.batches.some((b) => b.barcode && b.barcode.toLowerCase().includes(query))
 );
 });
 }, [items, search, selectedType, filterStockStatus]);

 
 const { paginatedData, currentPage, totalPages, totalItems, setPage } = usePagination(
 filteredItems,
 { pageSize: PAGE_SIZE }
 );

 const tbodyRef = useGSAPList<HTMLTableSectionElement>([paginatedData]);



 const exportToExcel = () => {
 if (items.length === 0) return;
 const exportData = items.map(p => {
 const activeBatch = p.batches.find(b => b.quantity > 0) || p.batches[0];
 return {
 'اسم الصنف': p.name,
 'الباركود': activeBatch?.barcode || '-',
 'النوع': getTypeDisplayName(p.type),
 'الكمية الإجمالية': p.total_quantity,
 'سعر الشراء': activeBatch?.purchase_price || 0,
 'سعر البيع': activeBatch?.sale_price || 0,
 'الشركة': p.company,
 'تاريخ الانتهاء (لأقرب تشغيلة)': activeBatch ? new Date(activeBatch.expiry_date).toLocaleDateString('ar-EG') : '-'
 };
 });
 
 const worksheet = XLSX.utils.json_to_sheet(exportData);
 const workbook = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
 XLSX.writeFile(workbook, `Inventory_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
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
 className="w-12 h-12 rounded-2xl bg-glass-surface from-[var(--nile-teal)] to-[var(--royal-gold)] flex items-center justify-center shadow-[0_0_20px_var(--nile-teal-glow)] relative"
 >
 <div className="absolute inset-0 rounded-2xl bg-white/20 blur-md" />
 <PackageOpen className="text-black w-6 h-6 z-10" />
 </motion.div>
 <span className="text-nile-teal font-medium">إدارة المخزن</span>
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
 <button
 onClick={exportToExcel}
 className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-heavy)] text-white font-bold transition-all border border-[var(--glass-border)] font-cairo hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] group"
 >
 <Download className="w-5 h-5 text-green-400 group-hover:-translate-y-1 transition-transform" /> تصدير
 </button>
 <Link
 href="/inventory/jard"
 className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-heavy)] text-white font-bold transition-all border border-[var(--glass-border)] font-cairo hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] group"
 >
 <Database className="w-5 h-5 text-[var(--nile-teal)] group-hover:-translate-y-1 transition-transform" /> جرد
 </Link>
 <Link
 href="/inventory/import"
 className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-heavy)] text-white font-bold transition-all border border-[var(--glass-border)] font-cairo hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] group"
 >
 <FileUp className="w-5 h-5 text-[var(--royal-gold)] group-hover:-translate-y-1 transition-transform" /> استيراد ملف
 </Link>
 <Link
 href="/products/create"
 className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--nile-teal)]/10 hover:bg-[var(--nile-teal)]/20 text-[color:var(--nile-teal)] font-bold transition-all border border-[var(--nile-teal)]/20 font-cairo hover:shadow-[0_0_15px_var(--nile-teal-glow)] group"
 >
 <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> إضافة صنف
 </Link>
 <button
 onClick={() => setIsQuickAddOpen(true)}
 className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-glass-surface from-[var(--royal-gold)]/20 to-[#f2cd56]/10 text-[color:var(--royal-gold)] hover:text-[#f2cd56] font-bold transition-all border border-[var(--royal-gold)]/30 font-cairo hover:shadow-[0_0_15px_var(--royal-gold-glow)] group"
 >
 <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> توريد تشغيلة
 </button>
 </div>
 </header>

 {}
 <div data-gsap="fade-up" className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {[
 { label: 'إجمالي المنتجات', value: items.length, icon: PackageOpen, color: 'text-[var(--nile-teal)]', glow: 'bg-[var(--nile-teal)]/10' },
 { label: 'إجمالي الرصيد', value: items.reduce((acc, item) => acc + item.total_quantity, 0), icon: Tag, color: 'text-[var(--royal-gold)]', glow: 'bg-[var(--royal-gold)]/10' },
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
 className="glass-card p-6 flex items-start gap-5 relative overflow-hidden group border border-[var(--glass-border)] hover:border-white/20 transition-all hover:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] z-10"
 >
 <div className="absolute inset-0 bg-glass-surface /5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
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
 <div className="flex-1 glass-panel p-2 flex flex-col gap-3">
 <div className="flex items-center w-full">
 <Search className="w-5 h-5 text-gray-400 mr-3" />
 <input
 type="text"
 placeholder="بحث بالاسم، الشركة أو الباركود..."
 className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-gray-500 py-2 font-cairo"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 />
 </div>
 <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--glass-border)]">
 <button
 onClick={() => setFilterStockStatus(filterStockStatus === 'low-stock' ? '' : 'low-stock')}
 className={`px-3 py-1 rounded-full text-xs font-bold font-cairo transition-all border ${filterStockStatus === 'low-stock' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-transparent text-gray-400 border-[var(--glass-border)] hover:bg-white/5'}`}
 >
 نواقص
 </button>
 <button
 onClick={() => setFilterStockStatus(filterStockStatus === 'out-of-stock' ? '' : 'out-of-stock')}
 className={`px-3 py-1 rounded-full text-xs font-bold font-cairo transition-all border ${filterStockStatus === 'out-of-stock' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-transparent text-gray-400 border-[var(--glass-border)] hover:bg-white/5'}`}
 >
 نفذت الكمية
 </button>
 <button
 onClick={() => setFilterStockStatus(filterStockStatus === 'near-expiry' ? '' : 'near-expiry')}
 className={`px-3 py-1 rounded-full text-xs font-bold font-cairo transition-all border ${filterStockStatus === 'near-expiry' ? 'bg-[var(--royal-gold)]/20 text-[var(--royal-gold)] border-[var(--royal-gold)]/50' : 'bg-transparent text-gray-400 border-[var(--glass-border)] hover:bg-white/5'}`}
 >
 صلاحيات قريبة
 </button>
 </div>
 </div>

 {/* Type Filter */}
 <div className="relative">
 <button
 onClick={() => setShowTypeFilter(!showTypeFilter)}
 className={`glass-card px-5 py-3 flex items-center justify-center gap-2 transition-all font-cairo w-full md:w-auto ${
 selectedType ? 'text-[var(--royal-gold)] border-[var(--royal-gold)]/30 bg-[var(--royal-gold)]/10' : 'text-[var(--text-muted)]'
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
 className="absolute top-full right-0 mt-2 w-64 bg-[#0a0a0a] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[300px] overflow-y-auto"
 >
 <div className="p-2">
 {}
 <button
 onClick={() => {
 setSelectedType('');
 setShowTypeFilter(false);
 }}
 className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-cairo transition-all flex items-center gap-3 ${
 !selectedType ? 'bg-[var(--royal-gold)]/20 text-[var(--royal-gold)]' : 'text-gray-400 hover:bg-[var(--glass-surface)] hover:text-white'
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
 selectedType === type ? 'bg-[var(--royal-gold)]/20 text-[var(--royal-gold)]' : 'text-gray-400 hover:bg-[var(--glass-surface)] hover:text-white'
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
 className="glass-card px-6 py-3 flex items-center justify-center gap-2 text-[var(--nile-teal)] hover:bg-[var(--nile-teal)]/10 transition-all font-cairo disabled:opacity-50 w-full md:w-auto"
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
 <div data-gsap="fade-up" className="glass-panel overflow-hidden border border-[var(--glass-border)] rounded-2xl">
 <div className="overflow-x-auto">
 <table className="w-full text-right border-collapse">
 <thead>
 <tr className="border-b border-[var(--glass-border)] bg-[var(--glass-surface)] font-cairo text-gray-400 text-[11px] uppercase tracking-wider">
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
 className={`border-b border-[var(--glass-border)] hover:bg-white/[0.03] cursor-pointer transition-all ${expandedId === item.id ? 'bg-white/[0.03]' : ''}`}
 >
 <td className="p-5">
 <div className="flex items-center gap-4">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform ${expandedId === item.id ? 'bg-[var(--nile-teal)]/20 rotate-6 shadow-[0_0_15px_rgba(0,206,209,0.2)]' : 'bg-[var(--glass-surface)]'}`}>
 <Tag className={`w-5 h-5 ${expandedId === item.id ? 'text-[var(--nile-teal)]' : 'text-[var(--text-inactive)]'}`} />
 </div>
 <div>
 <p className="font-bold text-white font-cairo text-base group-hover:text-[var(--nile-teal)] transition-colors">{item.name}</p>
 <div className="flex items-center gap-2 mt-0.5">
 <span className="text-[10px] text-gray-500 font-cairo bg-[var(--glass-surface)] px-2 py-0.5 rounded-md">
 {getTypeDisplayName(item.type) || item.type}
 </span>
 <span className={`text-[10px] font-bold font-cairo px-2 py-0.5 rounded-md ${item.pharmacy_id === pharmacyId ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[var(--royal-gold)]/10 text-[var(--royal-gold)]'}`}>
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
 <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 border border-[var(--glass-border)] px-2.5 py-1 rounded-full bg-[var(--glass-surface)]">
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
 <InventoryQuickBatchModal 
 isOpen={isQuickAddOpen}
 onClose={() => setIsQuickAddOpen(false)}
 items={items}
 fetchInventory={fetchInventory}
 setInventoryError={setInventoryError}
 />
 </div>
 );
}