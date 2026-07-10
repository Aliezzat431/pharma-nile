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
  Clock
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
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const updatePriority = (id: string, priority: ShortageItem['priority']) => {
    setItems(items.map(item => item.id === id ? { ...item, priority } : item));
  };

  const filteredItems = items.filter(item => {
    const matchesCompany = filterCompany === 'all' || item.company_name === filterCompany;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCompany && matchesSearch;
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
          <span className="font-bold font-cairo">{item.name}</span>
          <span className="text-[10px] text-gray-500 font-inter">{item.id?.substring(0, 8) || ''}</span>
        </div>
      ),
      className: 'text-right'
    },
    {
      header: 'الشركة',
      accessor: (item: ShortageItem) => (
        <div className="flex items-center justify-end gap-2 text-gray-400">
          <span className="text-xs font-cairo">{item.company_name}</span>
          <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
        </div>
      ),
      className: 'text-right'
    },
    {
      header: 'الرصيد',
      accessor: (item: ShortageItem) => (
        <span className={`font-bold font-inter ${item.total_quantity < 5 ? 'text-red-400' : 'text-orange-400'}`}>
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
          className={`bg-[#050505]/50 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none font-cairo transition-colors
            ${item.priority === 'عالي' ? 'text-red-400 border-red-500/30' : 
              item.priority === 'متوسط' ? 'text-orange-400 border-orange-500/30' : 
              'text-blue-400 border-blue-500/30'}
          `}
        >
          <option value="عالي">عالي</option>
          <option value="متوسط">متوسط</option>
          <option value="عادي">عادي</option>
        </select>
      )
    }
  ];

  return (
    <div ref={pageRef} className="space-y-8 pb-20">
      <header data-gsap="fade-up" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black flex items-center gap-4 font-cairo tracking-tight"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-500 to-[var(--royal-gold)] flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)] relative"
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
            className="text-[var(--text-secondary)] font-cairo text-sm font-bold uppercase tracking-widest"
          >
            Stock Shortages · Order Requests
          </motion.p>
        </div>

        <div className="flex items-center gap-4">
          <motion.button
            whileHover={selectedIds.size > 0 ? { scale: 1.03 } : {}}
            whileTap={selectedIds.size > 0 ? { scale: 0.97 } : {}}
            onClick={handlePrint}
            disabled={selectedIds.size === 0}
            className={`px-6 py-3 rounded-2xl flex items-center gap-3 font-bold font-cairo transition-all shadow-xl
              ${selectedIds.size > 0
                ? 'bg-gradient-to-r from-[var(--nile-teal)] to-[var(--royal-gold)] text-black shadow-[0_0_20px_var(--nile-teal-glow)]'
                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}
            `}
          >
            <Printer className="w-5 h-5" />
            <span>طباعة طلب توريد ({selectedIds.size})</span>
          </motion.button>
        </div>
      </header>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-2 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-500 mr-3" />
          <input 
            type="text" 
            placeholder="ابحث عن صنف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none py-3 text-white placeholder-gray-500 font-cairo"
          />
        </div>

        <div className="glass-panel p-2 flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-500 mr-3" />
          <select 
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none py-3 text-white appearance-none font-cairo cursor-pointer"
          >
            <option value="all" className="bg-[#111]">جميع الشركات</option>
            {companies.map(c => (
              <option key={c.id} value={c.name} className="bg-[#111]">{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between glass-panel px-6 py-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#00CED1]" />
            <span className="text-sm font-bold font-cairo">تحديد الكل</span>
          </div>
          <button 
            onClick={toggleSelectAll}
            className="text-xs bg-[#00CED1]/10 text-[#00CED1] px-3 py-1.5 rounded-lg border border-[#00CED1]/20 hover:bg-[#00CED1]/20 font-bold"
          >
            {selectedIds.size === filteredItems.length ? 'إلغاء التحديد' : 'تحديد المصفى'}
          </button>
        </div>
      </div>

      <div data-gsap="fade-up" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي النواقص', value: items.length, icon: AlertCircle, color: 'text-gray-400', glow: 'bg-white/5' },
          { label: 'أولوية عالية', value: items.filter(i => i.priority === 'عالي').length, icon: Clock, color: 'text-red-400', glow: 'bg-red-500/10' },
          { label: 'شركات متأثرة', value: new Set(items.map(i => i.company_name)).size, icon: Building2, color: 'text-[var(--royal-gold)]', glow: 'bg-[var(--royal-gold)]/10' },
          { label: 'مختار للطلب', value: selectedIds.size, icon: CheckCircle2, color: 'text-[var(--nile-teal)]', glow: 'bg-[var(--nile-teal)]/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="glass-card p-5 flex items-center gap-5 relative overflow-hidden group border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className={`w-12 h-12 rounded-xl ${stat.glow} ${stat.color} flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6 relative z-10`}>
              <stat.icon className="w-5 h-5 drop-shadow-[0_0_6px_currentColor]" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase font-cairo group-hover:text-white transition-colors">{stat.label}</p>
              <p className="text-2xl font-black font-inter">{stat.value}</p>
            </div>
            <div className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-[20px] opacity-10 ${stat.glow} group-hover:opacity-40 transition-all duration-700`} />
          </motion.div>
        ))}
      </div>

      {}
        <div ref={listRef}>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
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
