'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RotateCcw, Search, ChevronDown, ChevronUp, Calendar, ShoppingBag, AlertCircle, Loader2, Check, Package, WifiOff, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { processReturn } from '@/lib/api/orders';
import { ConfirmReturnModal } from './components/ConfirmReturnModal';
import { usePageGSAP, useGSAPList } from '@/hooks/usePageGSAP';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';
import { usePreferences } from '@/hooks/usePreferences';
import {
  saveOrdersToCache,
  getCachedOrdersList,
  queueOfflineReturn,
  syncOfflineReturns,
  getQueuedReturns,
} from '@/lib/supabase/offline-orders';

const PAGE_SIZE = 15;

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
  const [isOnline, setIsOnline] = useState(true);
  const [pendingReturnIds, setPendingReturnIds] = useState<string[]>([]);
  const [offlineSyncing, setOfflineSyncing] = useState(false);
  const { preferences } = usePreferences();
  const pageRef = usePageGSAP();
  const listRef = useGSAPList<HTMLDivElement>([]);

  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(window.navigator.onLine);

    const onOnline = async () => {
      setIsOnline(true);
      
      setOfflineSyncing(true);
      try {
        const count = await syncOfflineReturns(processReturn);
        if (count > 0) {
          alert(`✅ تم رفع ${count} مرتجع(ات) مؤجلة إلى السحابة بنجاح!`);
          setPendingReturnIds([]);
          fetchOrders(); 
        }
      } catch (err) {
        console.error('Failed to sync offline returns:', err);
      } finally {
        setOfflineSyncing(false);
      }
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  
  useEffect(() => {
    getQueuedReturns().then(list => {
      setPendingReturnIds(list.map(r => r.id));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const limit = preferences?.returnDaysLimit || 14;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - limit);

      if (!navigator.onLine) {
        
        const cached = await getCachedOrdersList();
        const filtered = cached.filter(o =>
          o.status !== 'returned' && o.status !== 'cancelled' &&
          new Date(o.created_at) >= cutoff
        );
        setOrders(filtered);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .gte('created_at', cutoff.toISOString())
        .not('status', 'eq', 'returned')
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const fetched = data || [];
      setOrders(fetched);

      
      saveOrdersToCache(fetched).catch(console.error);
    } catch (error) {
      console.error('Error fetching orders, trying cache...', error);
      try {
        const cached = await getCachedOrdersList();
        setOrders(cached.filter(o => o.status !== 'returned' && o.status !== 'cancelled'));
      } catch {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const [confirmReturnModal, setConfirmReturnModal] = useState<Order | null>(null);

  const executeReturn = async (order: Order) => {
    setConfirmReturnModal(null);
    setReturningId(order.id);
    try {
      if (!isOnline) {
        
        await queueOfflineReturn(order.id);
        setPendingReturnIds(prev => [...prev, order.id]);
        setReturnSuccess(order.id);
        setTimeout(() => setReturnSuccess(null), 4000);
        return;
      }

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

  const { paginatedData, currentPage, totalPages, totalItems, setPage } = usePagination(
    filteredOrders,
    { pageSize: PAGE_SIZE }
  );

  return (
    <div ref={pageRef} className="px-4 md:px-8 w-full max-w-7xl mx-auto space-y-6 pb-12">

      {}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm font-cairo"
          >
            <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
            <span className="flex-1">
              وضع الطوارئ — تعرض الفواتير من الذاكرة المحلية. يمكنك تسجيل المرتجعات وستُرسل تلقائياً عند عودة الشبكة.
            </span>
            {pendingReturnIds.length > 0 && (
              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                {pendingReturnIds.length} مؤجل
              </span>
            )}
            {offlineSyncing && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
          </motion.div>
        )}
      </AnimatePresence>

      <header data-gsap="fade-up" className="flex items-start justify-between mb-6 gap-4 flex-col md:flex-row md:items-center">
        <div className="space-y-1">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black flex items-center gap-4 font-cairo tracking-tight"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--royal-gold)] to-orange-500 flex items-center justify-center shadow-[0_0_20px_var(--royal-gold-glow)] relative"
            >
              <div className="absolute inset-0 rounded-2xl bg-white/20 blur-md" />
              <RotateCcw className="text-black w-6 h-6 z-10" />
            </motion.div>
            <span className="nile-gradient-text">مرتجعات المبيعات</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[var(--text-secondary)] font-cairo text-sm font-bold uppercase tracking-widest"
          >
            Sales Returns · Last {preferences?.returnDaysLimit || 14} Days
          </motion.p>
        </div>
        <div className="glass-card px-5 py-3 flex items-center gap-3 font-cairo border border-[var(--glass-border)] hover:border-white/20 transition-all">
          <Calendar className="w-4 h-4 text-[var(--royal-gold)]" />
          <span className="text-sm text-[var(--text-secondary)]">آخر {preferences?.returnDaysLimit || 14} يوم</span>
          <span className="text-xl font-black text-white">{orders.length}</span>
          <span className="text-sm text-[var(--text-secondary)]">فاتورة</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'إجمالي المبيعات', value: `${totalValue.toLocaleString('ar-EG')} ج.م`, icon: ShoppingBag, color: 'text-[var(--royal-gold)]', glow: 'bg-[var(--royal-gold)]/10', delay: 0 },
          { label: 'عدد الفواتير', value: totalActive, icon: Check, color: 'text-emerald-400', glow: 'bg-emerald-500/10', delay: 0.1 },
          { label: 'عدد الأصناف المباعة', value: orders.reduce((a, o) => a + o.order_items.length, 0), icon: Package, color: 'text-[var(--nile-teal)]', glow: 'bg-[var(--nile-teal)]/10', delay: 0.2 },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="glass-card p-6 flex items-center gap-5 relative overflow-hidden group border border-[var(--glass-border)] hover:border-white/20 transition-all hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className={`w-14 h-14 rounded-2xl ${stat.glow} ${stat.color} flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6 shadow-xl relative z-10`}>
              <stat.icon className="w-7 h-7 drop-shadow-[0_0_8px_currentColor]" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase font-cairo group-hover:text-white transition-colors">{stat.label}</p>
              <p className={`text-3xl font-black font-inter ${stat.color}`}>{stat.value}</p>
            </div>
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-[40px] opacity-10 ${stat.glow} group-hover:opacity-40 transition-all duration-700`} />
          </motion.div>
        ))}
      </div>

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

      <div ref={listRef} className="space-y-3">
        {loading ? (
          <div className="glass-panel p-16 flex flex-col items-center justify-center text-gray-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--royal-gold)]" />
            <p className="font-cairo">جاري تحميل الفواتير...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="glass-panel p-16 flex flex-col items-center justify-center text-gray-500 gap-3">
            <AlertCircle className="w-10 h-10 opacity-40" />
            <p className="font-cairo">لا توجد فواتير في هذه الفترة.</p>
          </div>
        ) : (
          paginatedData.map((order, i) => {
            const isExpanded = expandedId === order.id;
            const isReturning = returningId === order.id;
            const justReturned = returnSuccess === order.id;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card overflow-hidden transition-all border-[var(--glass-border)]"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-[var(--glass-surface)] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--royal-gold)]/10">
                      <ShoppingBag className="w-6 h-6 text-[var(--royal-gold)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-foreground font-cairo">فاتورة #{order.id.slice(0, 8)}</h3>
                      </div>
                      <p className="text-xs text-gray-500 font-cairo mt-1 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        <span className="text-[var(--nile-teal)]"> • {getTimeAgo(order.created_at)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                    <div className="text-left">
                      <p className="text-[10px] text-gray-500 font-cairo mb-0.5">الإجمالي</p>
                      <p className="text-lg font-bold font-cairo text-[var(--royal-gold)]" dir="ltr">
                        {Number(order.total).toLocaleString('ar-EG')} ج.م
                      </p>
                    </div>
                    <div className="text-[var(--text-muted)]">
                      <span className="text-[10px] font-cairo">{order.order_items.length} أصناف</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[var(--glass-border)] bg-black/5">
                        <div className="p-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="glass-card p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--nile-teal)]/10 flex items-center justify-center shrink-0">
                                  <Package className="w-5 h-5 text-[var(--nile-teal)]" />
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

                        <div className="p-5 pt-0 flex justify-end">
                          {pendingReturnIds.includes(order.id) ? (
                            <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold font-cairo">
                              <Clock className="w-5 h-5" />
                              مرتجع مؤجل — في انتظار الشبكة
                            </div>
                          ) : (
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
                              {isReturning
                                ? 'جاري الارتجاع...'
                                : !isOnline
                                  ? 'تسجيل مرتجع (أوفلاين)'
                                  : 'ارتجاع هذه الفاتورة'
                              }
                            </button>
                          )}
                        </div>

                        {justReturned && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 mx-5 mb-5 rounded-xl flex items-center gap-3 ${
                              isOnline
                                ? 'bg-green-500/10 border border-green-500/20'
                                : 'bg-amber-500/10 border border-amber-500/20'
                            }`}
                          >
                            {isOnline ? (
                              <Check className="w-5 h-5 text-green-400 shrink-0" />
                            ) : (
                              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                            )}
                            <p className={`font-bold font-cairo text-sm ${
                              isOnline ? 'text-green-400' : 'text-amber-400'
                            }`}>
                              {isOnline
                                ? 'تم ارتجاع الفاتورة بنجاح وإعادة الكميات للمخزون.'
                                : 'تم تسجيل المرتجع محلياً — سيُرسل تلقائياً عند عودة الإنترنت.'}
                            </p>
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

      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={PAGE_SIZE}
          onPageChange={(p) => { setExpandedId(null); setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />
      )}

      <ConfirmReturnModal 
        order={confirmReturnModal}
        onClose={() => setConfirmReturnModal(null)}
        onConfirm={executeReturn}
      />

    </div>
  );
                      }
      
