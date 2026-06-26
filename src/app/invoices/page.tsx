'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, Search, ChevronDown, ChevronUp, Calendar, 
  AlertCircle, Loader2, X, Printer, Filter, CreditCard, 
  Wallet, Heart, TrendingUp, Eye, Clock, DollarSign, ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageGSAP, useGSAPList } from '@/hooks/usePageGSAP';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

interface OrderItem {
  id: string;
  order_id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  product_id?: string;
  batch_id?: string;
}

interface Order {
  id: string;
  created_at: string;
  total: number;
  cost_total?: number;
  profit_total?: number;
  status?: string;
  payment_method?: string;
  customer_id?: string;

  customers?: { name: string }[] | null; 
  order_items: OrderItem[];
}

type FilterStatus = 'all' | 'completed' | 'returned';
type FilterPayment = 'all' | 'cash' | 'debt' | 'sadqah';
type SortField = 'date' | 'total' | 'items';
type SortDir = 'asc' | 'desc';

const INVOICES_PAGE_SIZE = 20;

export default function InvoicesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPayment, setFilterPayment] = useState<FilterPayment>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Order | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // GSAP page-entry
  const pageRef = usePageGSAP();

  useEffect(() => {
    let isMounted = true;
    
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            total,
            cost_total,
            profit_total,
            status,
            payment_method,
            customer_id,
            customers (name),
            order_items (id, order_id, name, price, quantity, unit, product_id, batch_id)
          `)
          .order('created_at', { ascending: false })
          .limit(500);

        if (error) throw error;
        if (isMounted) setOrders(data as unknown as Order[] || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();
    return () => { isMounted = false; };
  }, []);

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor(diff / (1000 * 60));

    if (days > 0) return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    if (hours > 0) return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
    return `منذ ${mins > 0 ? mins : 1} دقيقة`;
  };

  const paymentLabel = (method?: string) => {
    switch (method) {
      case 'cash': return { text: 'نقدي', icon: Wallet, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' };
      case 'debt': return { text: 'آجل', icon: CreditCard, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' };
      case 'sadqah': return { text: 'صدقة', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' };
      default: return { text: 'نقدي', icon: Wallet, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' };
    }
  };

  const statusLabel = (status?: string) => {
    switch (status) {
      case 'returned': return { text: 'مرتجع', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
      case 'completed': return { text: 'مكتمل', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' };
      default: return { text: 'مكتمل', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' };
    }
  };

  const filteredAndSortedOrders = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();
    
    let result = orders.filter(order => {

      const customerName = order.customers?.[0]?.name || '';
      const matchesSearch = cleanSearch.length === 0 || 
        order.id.toLowerCase().includes(cleanSearch) ||
        order.order_items.some(item => item.name.toLowerCase().includes(cleanSearch)) ||
        customerName.toLowerCase().includes(cleanSearch);
      
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      const matchesPayment = filterPayment === 'all' || order.payment_method === filterPayment;

      let matchesDate = true;
      if (dateFrom) {
        matchesDate = matchesDate && new Date(order.created_at) >= new Date(dateFrom);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(order.created_at) <= to;
      }

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });

    return result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'date') return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      if (sortField === 'total') return dir * (a.total - b.total);
      if (sortField === 'items') return dir * (a.order_items.length - b.order_items.length);
      return 0;
    });
  }, [orders, search, filterStatus, filterPayment, dateFrom, dateTo, sortField, sortDir]);

  // Pagination
  const { paginatedData: pagedOrders, currentPage, totalPages, totalItems: totalInvoices, setPage } = usePagination(
    filteredAndSortedOrders,
    { pageSize: INVOICES_PAGE_SIZE }
  );

  // GSAP list animation
  const listRef = useGSAPList<HTMLDivElement>([pagedOrders]);

  const stats = useMemo(() => {
    let revenue = 0;
    let profit = 0;
    let cash = 0;
    let debt = 0;
    let itemsCount = 0;

    filteredAndSortedOrders.forEach(o => {
      itemsCount += o.order_items.length;
      if (o.status !== 'returned') {
        revenue += Number(o.total || 0);
        profit += Number(o.profit_total || 0);
        if (o.payment_method === 'cash') cash++;
      }
      if (o.payment_method === 'debt') debt++;
    });

    return { totalRevenue: revenue, totalProfit: profit, cashCount: cash, debtCount: debt, totalItems: itemsCount };
  }, [filteredAndSortedOrders]);

  const handlePrint = (order: Order) => {
    const win = window.open('', '_blank', 'width=320,height=600');
    if (!win) return;
    const items = order.order_items.map(i => 
      `<tr>
        <td style="padding:4px 2px;border-bottom:1px dashed #ccc">${i.name}</td>
        <td style="padding:4px 2px;text-align:center;border-bottom:1px dashed #ccc">${i.quantity} ${i.unit}</td>
        <td style="padding:4px 2px;text-align:left;border-bottom:1px dashed #ccc">${(i.price * i.quantity).toFixed(2)}</td>
      </tr>`
    ).join('');

    const customerName = order.customers?.[0]?.name;

    win.document.write(`
      <html dir="rtl">
      <head><title>فاتورة #${order.id.slice(0, 8)}</title>
      <style>
        body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;margin:0;padding:16px;font-size:12px;color:#333}
        .header{text-align:center;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:12px}
        .logo{font-size:20px;font-weight:bold;color:#00CED1}
        table{width:100%;border-collapse:collapse;margin:12px 0}
        th{padding:6px 2px;text-align:right;border-bottom:2px solid #000;font-size:11px}
        .total-row{border-top:2px solid #000;font-weight:bold;font-size:14px;padding-top:8px;margin-top:8px}
        .footer{text-align:center;margin-top:20px;font-size:10px;color:#999;border-top:1px dashed #ccc;padding-top:12px}
      </style></head>
      <body>
        <div class="header">
          <div class="logo">PharmaNile</div>
          <div style="font-size:10px;color:#999;margin-top:4px">صيدلية النيل - نظام الفواتير</div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:8px">
          <span><strong>فاتورة:</strong> #${order.id.slice(0, 8)}</span>
          <span>${new Date(order.created_at).toLocaleDateString('ar-EG')}</span>
        </div>
        <div style="font-size:11px;margin-bottom:8px">
          <span><strong>الدفع:</strong> ${paymentLabel(order.payment_method).text}</span>
          ${customerName ? ` | <strong>العميل:</strong> ${customerName}` : ''}
        </div>
        <table>
          <thead><tr><th>الصنف</th><th style="text-align:center">الكمية</th><th style="text-align:left">المبلغ</th></tr></thead>
          <tbody>${items}</tbody>
        </table>
        <div class="total-row" style="display:flex;justify-content:space-between">
          <span>الإجمالي</span>
          <span>${Number(order.total).toFixed(2)} ج.م</span>
        </div>
        <div class="footer">
          <p>شكراً لزيارتكم 💊</p>
          <p>${new Date(order.created_at).toLocaleString('ar-EG')}</p>
        </div>
        <script>window.onload=()=>{window.print();window.close();}</script>
      </body></html>
    `);
    win.document.close();
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <div ref={pageRef} className="w-full max-w-7xl mx-auto space-y-6 pb-12 p-2 sm:p-4">
      <header data-gsap="fade-up" className="flex flex-col md:flex-row items-center justify-between mb-2 gap-4">
        <div className="w-full text-center md:text-right">
          <h1 className="text-3xl font-bold flex items-center justify-center md:justify-start gap-3 font-cairo text-foreground">
            <FileText className="text-[#D4AF37]" />
            سجل <span className="text-[#D4AF37]">الفواتير</span>
          </h1>
          <p className="text-gray-400 mt-2 font-cairo">عرض وطباعة جميع الفواتير الصادرة من نقطة البيع</p>
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`glass-card px-5 py-3 flex items-center gap-2 font-cairo text-sm transition-all ${showFilters ? 'border-[#00CED1]/50 text-[#00CED1]' : 'text-gray-400'}`}
        >
          <Filter className="w-4 h-4" />
          فلاتر متقدمة
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </header>

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div className="font-cairo">
              <p className="text-gray-400 text-xs">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-[#D4AF37] mt-1">{stats.totalRevenue.toLocaleString('ar-EG')} <span className="text-sm">ج.م</span></p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#D4AF37]" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div className="font-cairo">
              <p className="text-gray-400 text-xs">صافي الربح</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{stats.totalProfit.toLocaleString('ar-EG')} <span className="text-sm">ج.م</span></p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div className="font-cairo">
              <p className="text-gray-400 text-xs">عدد الفواتير</p>
              <p className="text-2xl font-bold text-[#00CED1] mt-1">{filteredAndSortedOrders.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#00CED1]/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#00CED1]" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div className="font-cairo">
              <p className="text-gray-400 text-xs">نقدي / آجل</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.cashCount} / {stats.debtCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass-card overflow-hidden"
          >
            <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4 font-cairo">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">من تاريخ</label>
                <input 
                  type="date" 
                  value={dateFrom} 
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full bg-[#050505]/50 border border-white/10 rounded-xl px-3 py-2.5 text-foreground outline-none focus:border-[#00CED1]/50 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">إلى تاريخ</label>
                <input 
                  type="date" 
                  value={dateTo} 
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full bg-[#050505]/50 border border-white/10 rounded-xl px-3 py-2.5 text-foreground outline-none focus:border-[#00CED1]/50 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">حالة الفاتورة</label>
                <select 
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as FilterStatus)}
                  className="w-full bg-[#050505]/50 border border-white/10 rounded-xl px-3 py-2.5 text-foreground outline-none focus:border-[#00CED1]/50 text-sm animate-none"
                >
                  <option value="all">الكل</option>
                  <option value="completed">مكتمل</option>
                  <option value="returned">مرتجع</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">طريقة الدفع</label>
                <select 
                  value={filterPayment}
                  onChange={e => setFilterPayment(e.target.value as FilterPayment)}
                  className="w-full bg-[#050505]/50 border border-white/10 rounded-xl px-3 py-2.5 text-foreground outline-none focus:border-[#00CED1]/50 text-sm animate-none"
                >
                  <option value="all">الكل</option>
                  <option value="cash">نقدي</option>
                  <option value="debt">آجل</option>
                  <option value="sadqah">صدقة</option>
                </select>
              </div>
            </div>
            <div className="px-5 pb-4 flex justify-end">
              <button 
                onClick={() => { setDateFrom(''); setDateTo(''); setFilterStatus('all'); setFilterPayment('all'); }}
                className="text-xs text-gray-500 hover:text-red-400 font-cairo transition-colors"
              >
                مسح الفلاتر
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <div className="glass-panel p-2 flex items-center gap-2 md:gap-3">
        <Search className="w-5 h-5 text-gray-400 mr-2 md:mr-3" />
        <input
          type="text"
          placeholder="بحث برقم الفاتورة، اسم المنتج..."
          className="flex-1 w-full bg-transparent border-none outline-none text-foreground placeholder-gray-500 py-2 font-cairo text-sm md:text-base min-w-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {}
      <div className="flex flex-wrap items-center gap-2 font-cairo text-xs text-gray-500">
        <span className="w-full md:w-auto mb-1 md:mb-0">ترتيب بحسب:</span>
        {[
          { key: 'date' as SortField, label: 'التاريخ' },
          { key: 'total' as SortField, label: 'الإجمالي' },
          { key: 'items' as SortField, label: 'عدد الأصناف' },
        ].map(s => (
          <button 
            key={s.key}
            onClick={() => toggleSort(s.key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all border ${sortField === s.key ? 'bg-[#00CED1]/10 border-[#00CED1]/30 text-[#00CED1]' : 'border-white/5 hover:bg-white/5'}`}
          >
            {s.label}
            {sortField === s.key && <ArrowUpDown className="w-3 h-3" />}
          </button>
        ))}
      </div>

      {/* Invoice list */}
      <div ref={listRef} className="space-y-3">
        {loading ? (
          <div className="glass-panel p-16 flex flex-col items-center justify-center text-gray-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
            <p className="font-cairo">جاري تحميل الفواتير...</p>
          </div>
        ) : filteredAndSortedOrders.length === 0 ? (
          <div className="glass-panel p-16 flex flex-col items-center justify-center text-gray-500 gap-3">
            <AlertCircle className="w-10 h-10 opacity-40" />
            <p className="font-cairo">لا توجد فواتير مطابقة للبحث.</p>
          </div>
        ) : (
          pagedOrders.map((order, i) => {
            const isExpanded = expandedId === order.id;
            const payment = paymentLabel(order.payment_method);
            const status = statusLabel(order.status);
            const PaymentIcon = payment.icon;

            const customerName = order.customers?.[0]?.name;

            return (
              <div
                key={order.id}
                className={`glass-card overflow-hidden transition-all ${order.status === 'returned' ? 'opacity-60 border-red-500/20' : 'border-white/5'}`}
              >
                {}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-white/5 transition-colors gap-4 sm:gap-0"
                >
                  <div className="flex items-start md:items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl flex items-center justify-center bg-[#D4AF37]/10">
                      <FileText className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <h3 className="font-bold text-foreground font-cairo text-sm md:text-base">فاتورة #{order.id.slice(0, 8)}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-cairo font-bold whitespace-nowrap ${status.bg} ${status.color}`}>
                          {status.text}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-cairo font-bold flex items-center gap-1 whitespace-nowrap ${payment.bg} ${payment.color}`}>
                          <PaymentIcon className="w-3 h-3" />
                          {payment.text}
                        </span>
                      </div>
                      <p className="text-[10px] md:text-xs text-gray-500 font-cairo mt-1 flex flex-wrap items-center gap-1 md:gap-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[#00CED1] whitespace-nowrap">• {getTimeAgo(order.created_at)}</span>
                        {customerName && (
                          <span className="text-orange-400 whitespace-nowrap">• {customerName}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 md:gap-6 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                    <div className="text-left">
                      <p className="text-[10px] md:text-xs text-gray-500 font-cairo">الإجمالي</p>
                      <p className={`text-base md:text-xl font-bold font-cairo ${order.status === 'returned' ? 'text-red-400 line-through' : 'text-[#D4AF37]'}`}>
                        {Number(order.total).toLocaleString('ar-EG')} ج.م
                      </p>
                    </div>
                    {order.profit_total !== undefined && order.profit_total !== null && order.status !== 'returned' && (
                      <div className="text-left hidden md:block">
                        <p className="text-[10px] md:text-xs text-gray-500 font-cairo">الربح</p>
                        <p className="text-sm font-bold font-cairo text-green-400">
                          {Number(order.profit_total).toLocaleString('ar-EG')} ج.م
                        </p>
                      </div>
                    )}
                    <div className="text-gray-400">
                      <span className="text-[10px] md:text-xs font-cairo">{order.order_items.length} أصناف</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-gray-500" /> : <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />}
                  </div>
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
                        <div className="p-5">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right font-cairo">
                              <thead className="text-xs text-gray-500 bg-white/5">
                                <tr>
                                  <th className="px-4 py-3 rounded-tr-lg">#</th>
                                  <th className="px-4 py-3">اسم الصنف</th>
                                  <th className="px-4 py-3">الكمية</th>
                                  <th className="px-4 py-3">الوحدة</th>
                                  <th className="px-4 py-3">سعر الوحدة</th>
                                  <th className="px-4 py-3 rounded-tl-lg">المبلغ</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.order_items.map((item, idx) => (
                                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-foreground">
                                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                                    <td className="px-4 py-3 font-bold">{item.name}</td>
                                    <td className="px-4 py-3">{item.quantity}</td>
                                    <td className="px-4 py-3 text-gray-400">{item.unit}</td>
                                    <td className="px-4 py-3">{item.price} ج.م</td>
                                    <td className="px-4 py-3 font-bold text-[#D4AF37]">{(item.quantity * item.price).toFixed(2)} ج.م</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-white/5 font-bold text-foreground">
                                  <td className="px-4 py-3 rounded-br-lg" colSpan={5}>الإجمالي الكلي</td>
                                  <td className="px-4 py-3 rounded-bl-lg text-[#D4AF37] text-lg">{Number(order.total).toFixed(2)} ج.م</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        {}
                        <div className="p-4 md:p-5 pt-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-3 mt-4 md:mt-0">
                          <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs text-gray-500 font-cairo">
                            <Clock className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleString('ar-EG')}
                            {customerName && (
                              <span className="text-orange-400 flex items-center gap-1 md:mr-4">
                                العميل: {customerName}
                              </span>
                            )}
                          </div>
                          <div className="flex w-full md:w-auto gap-2 mt-2 md:mt-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); setPreviewInvoice(order); }}
                              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00CED1]/10 text-[#00CED1] border border-[#00CED1]/20 font-bold hover:bg-[#00CED1]/20 transition-all font-cairo text-sm"
                            >
                              <Eye className="w-4 h-4" />
                              معاينة
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePrint(order); }}
                              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 font-bold hover:bg-[#D4AF37]/20 transition-all font-cairo text-sm"
                            >
                              <Printer className="w-4 h-4" />
                              طباعة
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalInvoices}
          itemsPerPage={INVOICES_PAGE_SIZE}
          onPageChange={(p) => {
            setExpandedId(null);
            setPage(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {}
      <AnimatePresence>
        {previewInvoice && (
          <div className="fixed inset-0 bg-[#050505]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-lg overflow-hidden relative border border-[#D4AF37]/30 shadow-[0_0_40px_rgba(212,175,55,0.15)]"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#D4AF37]/5">
                <h2 className="text-xl font-bold font-cairo text-[#D4AF37] flex items-center gap-2">
                  <FileText className="w-5 h-5" /> معاينة الفاتورة
                </h2>
                <button 
                   onClick={() => setPreviewInvoice(null)}
                   className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div ref={printRef} className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-[#00CED1] font-cairo">PharmaNile</h3>
                  <p className="text-xs text-gray-500 mt-1 font-cairo">صيدلية النيل - نظام الفواتير</p>
                  <div className="w-16 h-0.5 bg-[#D4AF37]/50 mx-auto mt-3"></div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm font-cairo mb-6">
                  <div className="bg-white/5 p-3 rounded-lg">
                    <span className="text-gray-500 block text-xs">رقم الفاتورة</span>
                    <span className="font-bold text-foreground font-mono">#{previewInvoice.id.slice(0, 8)}</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <span className="text-gray-500 block text-xs">التاريخ</span>
                    <span className="font-bold text-foreground">{new Date(previewInvoice.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <span className="text-gray-500 block text-xs">طريقة الدفع</span>
                    <span className={`font-bold ${paymentLabel(previewInvoice.payment_method).color}`}>{paymentLabel(previewInvoice.payment_method).text}</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <span className="text-gray-500 block text-xs">العميل</span>
                    <span className="font-bold text-foreground">{previewInvoice.customers?.[0]?.name || 'عميل عام'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

