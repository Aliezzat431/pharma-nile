'use client';

import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Search, 
  Printer, 
  Filter, 
  ChevronRight, 
  CheckCircle2, 
  Trash2,
  Download,
  Building2,
  Clock,
  Package,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { getCompanies, Company } from '@/lib/api/companies';
import { useAuth } from '@/hooks/useAuth';
import GlassTable from '@/components/ui/GlassTable';
import Skeleton from '@/components/ui/Skeleton';
import { usePageGSAP, useGSAPList } from '@/hooks/usePageGSAP';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';
import { usePreferences } from '@/hooks/usePreferences';

const PAGE_SIZE = 15;

interface ShortageItem {
  id: string;
  name: string;
  company_name: string;
  total_quantity: number;
  priority: 'عالي' | 'متوسط' | 'عادي';
}

export default function ShortagesPage() {
  const [items, setItems] = useState<ShortageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const pageRef = usePageGSAP();
  const listRef = useGSAPList<HTMLDivElement>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const pharmacyId = user?.user_metadata?.pharmacy_id;
    if (!pharmacyId) return;

    setLoading(true);
    try {
      const [compRes, shortageRes] = await Promise.all([
        getCompanies(),
        supabase
          .from('product_inventory')
          .select('*')
          .eq('pharmacy_id', pharmacyId)
          .lt('total_quantity', preferences?.stockAlertThreshold || 20)
      ]);

      setCompanies(compRes);

      if (shortageRes.data) {
        const threshold = preferences?.stockAlertThreshold || 20;
        const mapped: ShortageItem[] = shortageRes.data.map((item: any) => ({
          id: item.product_id || item.id,
          name: item.name,
          company_name: item.company || 'غير محدد',
          total_quantity: item.total_quantity,
          priority: item.total_quantity < (threshold / 4) ? 'عالي' : item.total_quantity < (threshold / 2) ? 'متوسط' : 'عادي'
        }));
        setItems(mapped);
      }
    } catch (err) {
      console.error("Error fetching shortages:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const updatePriority = (id: string, priority: ShortageItem['priority']) => {
    setItems(items.map(item => item.id === id ? { ...item, priority } : item));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCompany('all');
    setFilterPriority('all');
  };

  const filteredItems = items.filter(item => {
    const matchesCompany = filterCompany === 'all' || item.company_name === filterCompany;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
    return matchesCompany && matchesSearch && matchesPriority;
  });

  const { paginatedData, currentPage, totalPages, totalItems, setPage } = usePagination(
    filteredItems,
    { pageSize: PAGE_SIZE }
  );

  const handlePrint = () => {
    const selectedItems = items.filter(item => selectedIds.has(item.id));
    if (selectedItems.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const grouped: Record<string, ShortageItem[]> = {};
    selectedItems.forEach(item => {
      if (!grouped[item.company_name]) grouped[item.company_name] = [];
      grouped[item.company_name].push(item);
    });

    const content = `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 40px;">
        <h1 style="text-align: center; color: #00CED1;">طلب توريد أدوية - PharmaNile</h1>
        <p style="text-align: center; color: #666;">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        
        ${Object.entries(grouped).map(([company, products]) => `
          <div style="margin-bottom: 30px; border: 1px solid #eee; padding: 15px; border-radius: 8px;">
            <h2 style="color: #333; margin-top: 0;">الشركة: ${company}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f9f9f9;">
                  <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">الصنف</th>
                  <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: center;">الرصيد الحالي</th>
                  <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: center;">الأولوية</th>
                  <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: center;">الكمية المطلوبة</th>
                </tr>
              </thead>
              <tbody>
                ${products.map(p => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${p.total_quantity}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${p.priority}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-style: italic; color: #ccc;">__________</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head><title>طباعة النواقص - PharmaNile</title></head>
        <body onload="window.print(); window.close();">
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const columns = [
    {
      header: '',
      accessor: (item: ShortageItem) => (
        <input 
          type="checkbox" 
          checked={selectedIds.has(item.id)} 
          onChange={() => toggleSelect(item.id)}
          className="w-4 h-4 rounded border-white/10 bg-white/5 accent-[#00CED1] cursor-pointer"
        />
      ),
      className: 'w-[50px] text-center'
    },
    {
      header: 'الصنف',
      accessor: (item: ShortageItem) => (
        <div className="flex flex-col text-right">
          <span className="font-bold font-cairo text-white">{item.name}</span>
          <span className="text-[10px] text-gray-500 font-mono">{item.id?.substring(0, 8) || ''}</span>
        </div>
      ),
      className: 'text-right'
    },
    {
      header: 'الشركة',
      accessor: (item: ShortageItem) => (
        <div className="flex items-center justify-end gap-2 text-gray-400">
          <span className="text-xs font-cairo">{item.company_name}</span>
          <Building2 className="w-3.5 h-3.5 text-[var(--royal-gold)]" />
        </div>
      ),
      className: 'text-right'
    },
    {
      header: 'الرصيد',
      accessor: (item: ShortageItem) => (
        <span className={`font-bold font-mono text-center block ${item.total_quantity < 5 ? 'text-red-400' : item.total_quantity < 10 ? 'text-orange-400' : 'text-yellow-400'}`}>
          {item.total_quantity}
        </span>
      ),
      className: 'text-center w-[100px]'
    },
    {
      header: 'الأولوية',
      accessor: (item: ShortageItem) => (
        <select 
          value={item.priority}
          onChange={(e) => updatePriority(item.id, e.target.value as any)}
          className={`bg-[#050505]/50 border rounded-lg px-3 py-1.5 text-xs outline-none font-cairo transition-all cursor-pointer
            ${item.priority === 'عالي' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 
              item.priority === 'متوسط' ? 'text-orange-400 border-orange-500/30 bg-orange-500/10' : 
              'text-blue-400 border-blue-500/30 bg-blue-500/10'}
            hover:border-white/30 focus:border-[var(--nile-teal)]/50
          `}
        >
          <option value="عالي" className="bg-[#111] text-red-400">عالي</option>
          <option value="متوسط" className="bg-[#111] text-orange-400">متوسط</option>
          <option value="عادي" className="bg-[#111] text-blue-400">عادي</option>
        </select>
      ),
      className: 'text-center w-[120px]'
    }
  ];

  // Priority color mapping for stats
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'عالي': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'متوسط': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div ref={pageRef} className="space-y-6 pb-20 font-cairo" dir="rtl">
      {/* Header */}
      <header data-gsap="fade-up" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-4xl font-black flex items-center gap-3 font-cairo tracking-tight"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-500 to-[var(--royal-gold)] flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)] relative shrink-0"
            >
              <div className="absolute inset-0 rounded-2xl bg-white/20 blur-md" />
              <AlertCircle className="text-black w-6 h-6 z-10" />
            </motion.div>
            <span className="nile-gradient-text">إدارة النواقص</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest"
          >
            Stock Shortages · Order Requests
          </motion.p>
        </div>

        <motion.button
          whileHover={selectedIds.size > 0 ? { scale: 1.02 } : {}}
          whileTap={selectedIds.size > 0 ? { scale: 0.97 } : {}}
          onClick={handlePrint}
          disabled={selectedIds.size === 0}
          className={`px-5 py-2.5 rounded-2xl flex items-center gap-2 font-bold font-cairo transition-all shadow-xl text-sm
            ${selectedIds.size > 0
              ? 'bg-gradient-to-r from-[var(--nile-teal)] to-[var(--royal-gold)] text-black shadow-[0_0_20px_var(--nile-teal-glow)] hover:scale-105'
              : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}
          `}
        >
          <Printer className="w-4 h-4" />
          <span>طباعة ({selectedIds.size})</span>
        </motion.button>
      </header>

      {/* Stats Cards */}
      <div data-gsap="fade-up" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إجمالي النواقص', value: items.length, icon: Package, color: 'text-gray-400', glow: 'bg-white/5' },
          { label: 'أولوية عالية', value: items.filter(i => i.priority === 'عالي').length, icon: AlertCircle, color: 'text-red-400', glow: 'bg-red-500/10' },
          { label: 'شركات', value: new Set(items.map(i => i.company_name)).size, icon: Building2, color: 'text-[var(--royal-gold)]', glow: 'bg-[var(--royal-gold)]/10' },
          { label: 'مختار للطلب', value: selectedIds.size, icon: CheckCircle2, color: 'text-[var(--nile-teal)]', glow: 'bg-[var(--nile-teal)]/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -3, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="glass-card p-4 flex items-center gap-4 relative overflow-hidden group border border-white/5 hover:border-white/15 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.glow} ${stat.color} flex items-center justify-center transition-all group-hover:scale-110 relative z-10 shrink-0`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div className="relative z-10 min-w-0">
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-black font-mono">{stat.value}</p>
            </div>
            <div className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-[20px] opacity-10 ${stat.glow} group-hover:opacity-40 transition-all duration-700`} />
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="glass-panel p-2 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl">
          <Search className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
          <input 
            type="text" 
            placeholder="ابحث عن صنف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none py-2 text-white placeholder-gray-500 text-sm font-cairo min-w-0"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-gray-500 hover:text-white p-1">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Company Filter */}
        <div className="glass-panel p-2 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl">
          <Building2 className="w-4 h-4 text-[var(--royal-gold)] mr-2 shrink-0" />
          <select 
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none py-2 text-white appearance-none cursor-pointer text-sm font-cairo min-w-0"
          >
            <option value="all" className="bg-[#111]">جميع الشركات</option>
            {companies.map(c => (
              <option key={c.id} value={c.name} className="bg-[#111]">{c.name}</option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="glass-panel p-2 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl">
          <Filter className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
          <select 
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none py-2 text-white appearance-none cursor-pointer text-sm font-cairo min-w-0"
          >
            <option value="all" className="bg-[#111]">جميع الأولويات</option>
            <option value="عالي" className="bg-[#111] text-red-400">عالي</option>
            <option value="متوسط" className="bg-[#111] text-orange-400">متوسط</option>
            <option value="عادي" className="bg-[#111] text-blue-400">عادي</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {(searchTerm || filterCompany !== 'all' || filterPriority !== 'all') && (
            <button 
              onClick={clearFilters}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-cairo flex items-center gap-2 flex-1 justify-center"
            >
              <X className="w-4 h-4" />
              <span>مسح الفلاتر</span>
            </button>
          )}
          <button 
            onClick={toggleSelectAll}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold font-cairo transition-all flex-1 text-center
              ${selectedIds.size === filteredItems.length && filteredItems.length > 0
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                : 'bg-[var(--nile-teal)]/10 text-[var(--nile-teal)] border border-[var(--nile-teal)]/20 hover:bg-[var(--nile-teal)]/20'}
            `}
          >
            {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? 'إلغاء الكل' : 'تحديد الكل'}
          </button>
        </div>
      </div>

      {/* Active Filters Tags */}
      {(searchTerm || filterCompany !== 'all' || filterPriority !== 'all') && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
              بحث: {searchTerm}
              <button onClick={() => setSearchTerm('')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterCompany !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
              الشركة: {filterCompany}
              <button onClick={() => setFilterCompany('all')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterPriority !== 'all' && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs ${getPriorityColor(filterPriority)}`}>
              الأولوية: {filterPriority}
              <button onClick={() => setFilterPriority('all')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <span className="text-xs text-gray-500 font-cairo">
            {filteredItems.length} نتيجة
          </span>
        </div>
      )}

      {/* Table */}
      <div ref={listRef}>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <>
            <GlassTable 
              columns={columns} 
              data={paginatedData} 
              emptyMessage="لا توجد نواقص مطابقة للبحث"
            />
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={PAGE_SIZE}
                onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}