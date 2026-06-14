'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  PackageOpen, 
  Plus, 
  Search, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Tag 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const LiveScanner = dynamic(() => import('@/components/shared/CameraScanner'), { 
  ssr: false,
  loading: () => <div className="text-sm text-gray-500">جاري تحميل الماسح...</div>
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
}

export default function InventoryDashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  // Auto hide error
  useEffect(() => {
    if (inventoryError) {
      const timer = setTimeout(() => setInventoryError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [inventoryError]);

  useEffect(() => {
    fetchInventory();

    const channel = supabase
      .channel('inventory-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, fetchInventory)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchInventory)
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

      const formatted: InventoryItem[] = products.map((p: any) => {
        const sortedBatches = [...(p.batches || [])].sort((a: Batch, b: Batch) => 
          new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
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
          batches: sortedBatches
        };
      });

      setItems(formatted);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setInventoryError("حدث خطأ أثناء جلب بيانات المخزن");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return items;

    return items.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.company.toLowerCase().includes(query) ||
      item.batches.some(b => b.barcode.toLowerCase().includes(query))
    );
  }, [items, search]);

  const handleCameraScan = (barcode: string) => {
    setSearch(barcode);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 p-2 sm:p-4">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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

      {/* Search & Controls */}
      <div className="flex flex-col md:flex-row gap-4">
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
      <LiveScanner onScan={handleCameraScan} />

      {/* Table */}
      <div className="glass-panel overflow-hidden border border-white/5 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 font-cairo text-gray-400 text-sm">
                <th className="p-4 font-semibold text-right">اسم المنتج</th>
                <th className="p-4 font-semibold text-right">التصنيف</th>
                <th className="p-4 font-semibold text-right hidden md:table-cell">الشركة</th>
                <th className="p-4 font-semibold text-right">النظام</th>
                <th className="p-4 font-semibold text-right">الرصيد</th>
                <th className="p-4 font-semibold text-left">السعر</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-gray-500">جاري تحميل المخزن...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
                    <AlertCircle className="w-10 h-10 opacity-50" />
                    لا توجد منتجات مطابقة
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, i) => (
                  <React.Fragment key={item.id}>
                    <motion.tr 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.025, 0.25) }}
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className={`border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all ${expandedId === item.id ? 'bg-white/5' : ''}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#00CED1]/10 flex items-center justify-center">
                            <Tag className="w-4 h-4 text-[#00CED1]" />
                          </div>
                          <span className="font-medium font-cairo">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400 font-cairo">{item.type}</td>
                      <td className="p-4 text-gray-400 font-cairo hidden md:table-cell">{item.company}</td>
                      <td className="p-4 text-xs font-bold uppercase tracking-widest">{item.inventory_method}</td>
                      <td className="p-4">
                        <span className={`font-bold font-cairo ${item.total_quantity < 10 ? 'text-orange-400' : 'text-emerald-400'}`}>
                          {item.total_quantity}
                        </span>
                      </td>
                      <td className="p-4 text-left font-bold text-foreground">{item.current_price} ج.م</td>
                      <td className="p-4 text-center">
                        {expandedId === item.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </td>
                    </motion.tr>

                    <AnimatePresence>
                      {expandedId === item.id && (
                        <tr>
                          <td colSpan={7} className="p-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                            >
                              <InventoryBatchPanel 
                                item={item} 
                                fetchInventory={fetchInventory} 
                                setInventoryError={setInventoryError} 
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
              }                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-black/10 backdrop-blur-sm"
                            >
                              <InventoryBatchPanel 
                                item={item} 
                                fetchInventory={fetchInventory} 
                                setInventoryError={setInventoryError} 
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
