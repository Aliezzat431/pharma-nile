'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RotateCcw, Search, ChevronDown, ChevronUp, Calendar, ShoppingBag, AlertCircle, Loader2, Check, Package, Hash, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { processReturn } from '@/lib/api/orders';

interface OrderItem {
  id: string;
  order_id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  product_id?: string;
}

interface Order {
  id: string;
  created_at: string;
  total: number;
  status?: string;
  order_items: OrderItem[];
}

export default function ReturnsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [returnSuccess, setReturnSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 15);

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .gte('created_at', cutoff.toISOString())
        .not('status', 'eq', 'returned')
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders", error);
    } finally {
      setLoading(false);
    }
  };

  const [confirmReturnModal, setConfirmReturnModal] = useState<Order | null>(null);

  const executeReturn = async (order: Order) => {
    setConfirmReturnModal(null);
    setReturningId(order.id);
    try {
      await processReturn(order.id);
      setReturnSuccess(order.id);

      setOrders(prev => prev.filter(o => o.id !== order.id));
      setExpandedId(null);
      setTimeout(() => setReturnSuccess(null), 3000);
    } catch (error: any) {
      console.error('Return error:', error);
      alert(`فشل في عملية الارتجاع: ${error?.message || 'خطأ غير معروف'}`);
    } finally {
      setReturningId(null);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor(diff / (1000 * 60));

    if (days > 0) return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    if (hours > 0) return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
    return `منذ ${mins} دقيقة`;
  };

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(search.toLowerCase()) ||
    order.order_items.some(item => item.name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalActive = orders.length;
  const totalValue = orders.reduce((acc, o) => acc + Number(o.total), 0);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 font-cairo text-foreground">
            <RotateCcw className="text-[#D4AF37]" />
            مرتجعات <span className="text-[#D4AF37]">المبيعات</span>
          </h1>
          <p className="text-gray-400 mt-2 font-cairo">عرض فواتير البيع خلال آخر 15 يوم وإمكانية إرجاع الفاتورة بالكامل.</p>
        </div>
        <div className="glass-card px-5 py-3 flex items-center gap-3 font-cairo">
          <Calendar className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-sm text-gray-400">آخر 15 يوم</span>
          <span className="text-lg font-bold text-foreground">{orders.length}</span>
          <span className="text-sm text-gray-400">فاتورة</span>
        </div>
      </header>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 flex items-center justify-between"
        >
          <div className="font-cairo h-auto py-1">
            <p className="text-gray-400 text-sm">إجمالي المبيعات</p>
            <p className="text-2xl font-bold text-[#D4AF37]" dir="ltr">{totalValue.toLocaleString('ar-EG')} ج.م</p>
          </div>
          <ShoppingBag className="w-8 h-8 text-[#D4AF37]/30" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 flex items-center justify-between"
        >
          <div className="font-cairo h-auto py-1">
            <p className="text-gray-400 text-sm">عدد الفواتير</p>
            <p className="text-2xl font-bold text-green-400">{totalActive}</p>
          </div>
          <Check className="w-8 h-8 text-green-400/30" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 flex items-center justify-between"
        >
          <div className="font-cairo h-auto py-1">
            <p className="text-gray-400 text-sm">عدد الأصناف المباعة</p>
            <p className="text-2xl font-bold text-[#00CED1]">{orders.reduce((a, o) => a + o.order_items.length, 0)}</p>
          </div>
          <Package className="w-8 h-8 text-[#00CED1]/30" />
        </motion.div>
      </div>

      {}
      <div className="glass-panel p-2 flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400 mr-3" />
        <input
          type="text"
          placeholder="بحث برقم الفاتورة أو اسم المنتج..."
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-gray-500 py-2 font-cairo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-panel p-16 flex flex-col items-center justify-center text-gray-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
            <p className="font-cairo">جاري تحميل الفواتير...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="glass-panel p-16 flex flex-col items-center justify-center text-gray-500 gap-3">
            <AlertCircle className="w-10 h-10 opacity-40" />
            <p className="font-cairo">لا توجد فواتير في هذه الفترة.</p>
          </div>
        ) : (
          filteredOrders.map((order, i) => {
            const isExpanded = expandedId === order.id;
            const isReturning = returningId === order.id;
            const justReturned = returnSuccess === order.id;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card overflow-hidden transition-all border-white/5"
              >
                {}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#D4AF37]/10">
                      <ShoppingBag className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-foreground font-cairo">فاتورة #{order.id.slice(0, 8)}</h3>
                      </div>
                      <p className="text-xs text-gray-500 font-cairo mt-1 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        <span className="text-[#00CED1]">• {getTimeAgo(order.created_at)}</span>
                      </p>
                    </div>
                  </div>

                    <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                      <div className="text-left">
                        <p className="text-[10px] text-gray-500 font-cairo mb-0.5">الإجمالي</p>
                        <p className="text-lg font-bold font-cairo text-[#D4AF37]" dir="ltr">
                          {Number(order.total).toLocaleString('ar-EG')} ج.م
                        </p>
                      </div>
                      <div className="text-gray-400">
                        <span className="text-[10px] font-cairo">{order.order_items.length} أصناف</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </div>

                {}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/5 bg-black/5">
                        {}
                        <div className="p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="glass-card p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#00CED1]/10 flex items-center justify-center shrink-0">
                                  <Package className="w-5 h-5 text-[#00CED1]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-foreground truncate font-cairo">{item.name}</p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 font-cairo mt-0.5">
                                    <span>{item.quantity} {item.unit}</span>
                                    <span>×</span>
                                    <span>{item.price} ج.م</span>
                                  </div>
                                </div>
                                <p className="font-bold text-foreground font-cairo whitespace-nowrap">
                                  {(item.quantity * item.price).toLocaleString('ar-EG')} ج.م
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {}
                        <div className="p-5 pt-0 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmReturnModal(order);
                            }}
                            disabled={isReturning}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-bold hover:bg-red-500/20 transition-all disabled:opacity-50 font-cairo"
                          >
                            {isReturning ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-5 h-5" />
                            )}
                            {isReturning ? 'جاري الارتجاع...' : 'ارتجاع هذه الفاتورة'}
                          </button>
                        </div>

                        {}
                        {justReturned && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 mx-5 mb-5 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3"
                          >
                            <Check className="w-5 h-5 text-green-400" />
                            <p className="text-green-400 font-bold font-cairo">تم ارتجاع الفاتورة بنجاح وإعادة الكميات للمخزون.</p>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {confirmReturnModal && (
          <div className="fixed inset-0 bg-[#050505]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md overflow-hidden relative border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)]"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-red-500/5">
                <h2 className="text-xl font-bold font-cairo text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> تأكيد الارتجاع
                </h2>
                <button 
                   onClick={() => setConfirmReturnModal(null)}
                   className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-foreground font-cairo leading-relaxed text-lg text-center">
                  هل أنت متأكد من ارتجاع الفاتورة 
                  <span className="font-bold text-[#D4AF37] mx-2">#{confirmReturnModal.id.slice(0, 8)}</span>؟
                </p>
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-cairo text-center flex flex-col items-center gap-2">
                  <RotateCcw className="w-6 h-6 opacity-80" />
                  سيتم إعادة كافة الكميات المخصومة للمخزون والتراجع عن أرباح الفاتورة بالكامل.
                </div>
              </div>
              
              <div className="p-4 border-t border-white/10 flex gap-3 bg-[#050505]/50">
                 <button 
                   onClick={() => setConfirmReturnModal(null)}
                   className="flex-1 py-3 rounded-xl font-cairo text-gray-400 hover:bg-white/5 transition-colors border border-white/10"
                 >
                   إلغاء
                 </button>
                 <button 
                   onClick={() => executeReturn(confirmReturnModal)}
                   className="flex-1 py-3 rounded-xl font-cairo text-white bg-red-500/20 border border-red-500/50 hover:bg-red-500/40 transition-colors font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                 >
                   تأكيد الارتجاع
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

