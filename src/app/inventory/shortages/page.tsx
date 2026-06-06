'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PackageX, AlertTriangle, Search, Plus, ShoppingCart, RefreshCw, Loader2, ArrowLeftRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function ShortagesPage() {
  const [shortages, setShortages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchShortages();
    }

    const channel = supabase
      .channel('shortages-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, () => fetchShortages())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchShortages = async () => {
    const pharmacyId = user?.user_metadata?.pharmacy_id;
    if (!pharmacyId) return;

    setLoading(true);
    // Fetch products where total quantity in batches is < 10 (our shortage threshold)
    const { data: products, error } = await supabase
      .from('product_inventory')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .lt('total_quantity', 10)
      .order('total_quantity', { ascending: true });

    if (error) {
      console.error('Error fetching shortages:', error);
    } else {
      setShortages(products || []);
    }
    setLoading(false);
  };

  const filteredShortages = shortages.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-400/10 flex items-center justify-center text-red-400 border border-red-400/20">
             <PackageX className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-cairo">
              نواقص <span className="text-red-400">الصيدلية</span>
            </h1>
            <p className="text-gray-400 mt-2 text-lg font-cairo">قائمة الأدوية التي أوشكت على النفاد.</p>
          </div>
        </div>
        <button 
          onClick={fetchShortages}
          className="glass-card px-5 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors font-cairo"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          تحديث القائمة
        </button>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="glass-panel p-6 border-red-500/20 bg-red-500/5">
            <p className="text-gray-400 text-sm font-cairo mb-2">إجمالي النواقص الحاد</p>
            <p className="text-3xl font-bold text-red-400">{shortages.filter(s => s.total_quantity === 0).length} صنف</p>
         </div>
         <div className="glass-panel p-6 border-yellow-500/20 bg-yellow-500/5">
            <p className="text-gray-400 text-sm font-cairo mb-2">أصناف تحت حد الطلب</p>
            <p className="text-3xl font-bold text-yellow-400">{shortages.filter(s => s.total_quantity > 0).length} صنف</p>
         </div>
         <div className="glass-panel p-6 border-[#00CED1]/20 bg-[#00CED1]/5">
            <p className="text-gray-400 text-sm font-cairo mb-2">إحصائيات الأصناف</p>
            <p className="text-3xl font-bold text-[#00CED1]">{shortages.length} متأثر</p>
         </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 glass-panel p-2 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="البحث في النواقص..." 
            className="flex-1 bg-transparent border-none outline-none text-white font-cairo py-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
               <thead>
                  <tr className="border-b border-white/10 bg-white/5 font-cairo">
                     <th className="p-5 font-semibold text-gray-300">اسم الصنف</th>
                     <th className="p-5 font-semibold text-gray-300">الكمية الحالية</th>
                     <th className="p-5 font-semibold text-gray-300">السعر الحالي</th>
                     <th className="p-5 font-semibold text-gray-300">الحالة</th>
                     <th className="p-5 font-semibold text-gray-300">الإجراء</th>
                  </tr>
               </thead>
               <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="p-20 text-center text-gray-500 font-cairo">جاري التحميل...</td></tr>
                  ) : filteredShortages.map((item, i) => (
                    <motion.tr 
                      key={item.product_id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                    >
                       <td className="p-5 font-bold text-white font-cairo group-hover:text-red-400 transition-colors">{item.name}</td>
                       <td className="p-5 font-sans">
                         <span className={`font-bold ${item.total_quantity === 0 ? 'text-red-500' : 'text-yellow-500'}`}>
                           {item.total_quantity}
                         </span>
                       </td>
                       <td className="p-5 text-gray-400">{item.current_price || '0'} ج.م</td>
                       <td className="p-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold font-cairo border ${
                            item.total_quantity === 0 
                              ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                              : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }`}>
                             {item.total_quantity === 0 ? 'نفذ تماماً' : 'قرب يخلص'}
                          </span>
                       </td>
                       <td className="p-5">
                          <div className="flex gap-2">
                             <button className="p-2 rounded-lg bg-red-400 group-hover:bg-red-500 text-[#050505] transition-colors">
                                <ShoppingCart className="w-4 h-4" />
                             </button>
                             <Link href={`/inventory/${item.product_id}`} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
                                <ArrowLeftRight className="w-4 h-4" />
                             </Link>
                          </div>
                       </td>
                    </motion.tr>
                  ))}
                  {!loading && filteredShortages.length === 0 && (
                    <tr><td colSpan={5} className="p-20 text-center text-gray-500 font-cairo opacity-30 italic">الحمد لله، لا توجد نواقص حادة الآن.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
