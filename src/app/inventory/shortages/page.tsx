'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { PackageX, Search, ShoppingCart, RefreshCw, Loader2, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface ShortageItem {
  product_id: string;
  name: string;
  total_quantity: number;
  current_price: number | null;
  pharmacy_id: string;
}

export default function ShortagesPage() {
  const [shortages, setShortages] = useState<ShortageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { user } = useAuth();
  const pharmacyId = user?.user_metadata?.pharmacy_id;

  useEffect(() => {
    if (!user || !pharmacyId) return;

    fetchShortages();

    const channel = supabase
      .channel('shortages-sync')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'batches' }, 
        () => { fetchShortages(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, pharmacyId]);

  const fetchShortages = async () => {
    if (!pharmacyId) return;
    
    setLoading(true);
    setErrorMessage(null);

    try {

      const { data, error } = await supabase
        .from('product_inventory')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .lt('total_quantity', 10)
        .order('total_quantity', { ascending: true });

      if (error) throw error;
      setShortages(data || []);
    } catch (error) {
      console.error('Error fetching shortages:', error);
      setErrorMessage('حدث خطأ أثناء تحديث قائمة النواقص.');
    } finally {
      setLoading(false);
    }
  };

  const filteredShortages = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return shortages;
    return shortages.filter(item => item.name.toLowerCase().includes(query));
  }, [shortages, search]);

  const stats = useMemo(() => {
    return {
      critical: shortages.filter(s => s.total_quantity === 0).length,
      warning: shortages.filter(s => s.total_quantity > 0).length,
      total: shortages.length
    };
  }, [shortages]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-400/10 flex items-center justify-center text-red-400 border border-red-400/20">
             <PackageX className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-cairo">
               نواقص <span className="text-red-400">الصيدلية</span>
            </h1>
            <p className="text-gray-400 mt-2 text-lg font-cairo">قائمة الأدوية التي أوشكت على النفاد أو نفدت بالفعل.</p>
          </div>
        </div>
        <button 
          onClick={fetchShortages}
          disabled={loading || !pharmacyId}
          className="glass-card px-5 py-2.5 flex items-center justify-center gap-3 hover:bg-white/5 transition-colors font-cairo disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          تحديث القائمة
        </button>
      </header>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="glass-panel p-6 border-red-500/20 bg-red-500/5">
            <p className="text-gray-400 text-sm font-cairo mb-2">إجمالي النواقص الحاد (رصيد 0)</p>
            <p className="text-3xl font-bold text-red-400">{stats.critical} صنف</p>
         </div>
         <div className="glass-panel p-6 border-yellow-500/20 bg-yellow-500/5">
            <p className="text-gray-400 text-sm font-cairo mb-2">أصناف تحت حد الطلب (&lt; 10)</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.warning} صنف</p>
         </div>
         <div className="glass-panel p-6 border-[#00CED1]/20 bg-[#00CED1]/5">
            <p className="text-gray-400 text-sm font-cairo mb-2">إجمالي الأصناف المتأثرة</p>
            <p className="text-3xl font-bold text-[#00CED1]">{stats.total} صنف</p>
         </div>
      </div>

      {}
      <div className="flex gap-4">
        <div className="flex-1 glass-panel p-2 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="البحث بالاسم في قائمة النواقص..." 
            className="flex-1 bg-transparent border-none outline-none text-white font-cairo py-2 min-w-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 font-cairo">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      {}
      <div className="glass-panel overflow-hidden border-white/5">
         <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
               <thead>
                  <tr className="border-b border-white/10 bg-white/5 font-cairo text-gray-400">
                     <th className="p-5 font-semibold">اسم الصنف</th>
                     <th className="p-5 font-semibold">الكمية الحالية</th>
                     <th className="p-5 font-semibold">السعر الحالي</th>
                     <th className="p-5 font-semibold">الحالة</th>
                     <th className="p-5 font-semibold text-left pl-8">الإجراء</th>
                  </tr>
               </thead>
               <tbody>
                  {loading && shortages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-gray-500 font-cairo">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00CED1]" />
                        جاري تحميل البيانات...
                      </td>
                    </tr>
                  ) : filteredShortages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-gray-500 font-cairo opacity-60 italic">
                        {search ? 'لا توجد نتائج مطابقة لاسم البحث.' : 'المخزن سليم، لا توجد نواقص حالياً.'}
                      </td>
                    </tr>
                  ) : (
                    filteredShortages.map((item, i) => (
                      <motion.tr 
                        key={item.product_id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.04, 0.3) }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                      >
                         <td className="p-5 font-bold text-white font-cairo group-hover:text-red-400 transition-colors">
                           {item.name}
                         </td>
                         <td className="p-5">
                           <span className={`font-bold font-sans ${item.total_quantity === 0 ? 'text-red-500' : 'text-yellow-500'}`}>
                             {item.total_quantity}
                           </span>
                         </td>
                         <td className="p-5 text-gray-400 font-cairo" dir="ltr">
                           {item.current_price !== null ? `${item.current_price} ج.م` : 'غير محدد'}
                         </td>
                         <td className="p-5">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold font-cairo border ${
                              item.total_quantity === 0 
                                ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            }`}>
                               {item.total_quantity === 0 ? 'نفد تماماً' : 'قارب على النفاد'}
                            </span>
                         </td>
                         <td className="p-5 text-left pl-8">
                            <div className="flex gap-2 justify-end">
                               <button 
                                 title="إضافة إلى أمر الشراء" 
                                 className="p-2 rounded-lg bg-red-400 hover:bg-red-500 text-black transition-colors"
                               >
                                  <ShoppingCart className="w-4 h-4" />
                               </button>
                               <Link 
                                 href={`/inventory/${item.product_id}`} 
                                 title="عرض تفاصيل التشغيلات"
                                 className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                               >
                                  <ArrowLeftRight className="w-4 h-4" />
                               </Link>
                            </div>
                         </td>
                      </motion.tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
