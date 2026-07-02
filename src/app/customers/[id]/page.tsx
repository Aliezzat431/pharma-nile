'use client';

import { useState, useEffect, use } from 'react';
import { 
  User, Phone, Mail, MapPin, CreditCard, Clock, ShoppingBag, 
  ArrowUpRight, ArrowDownLeft, ChevronLeft, Loader2, Calendar, 
  Download, Plus, FileText, History as HistoryIcon, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCustomerDetails, recordCustomerPayment } from '@/lib/api/customers';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

export default function CustomerProfile() {
  const params = useParams();
  // فك حزمة المعاملات المستلمة من الرابط بما يتوافق مع ميزات Next.js الحديثة
  const customerId = params?.id as string;
  
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: '', payment_type: 'partial' as 'partial' | 'full', note: '' });
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'history'>('invoices');

  const INVOICES_PAGE_SIZE = 10;
  const PAYMENTS_PAGE_SIZE = 10;

  useEffect(() => {
    if (customerId) fetchDetails();
  }, [customerId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const data = await getCustomerDetails(customerId);
      setCustomer(data);
    } catch (err) {
      console.error("Error fetching customer details", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(paymentData.amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("يرجى إدخال مبلغ صحيح أكبر من الصفر.");
      return;
    }

    setProcessing(true);
    try {
      await recordCustomerPayment({
        customer_id: customerId,
        amount: amountNum,
        payment_type: paymentData.payment_type,
        note: paymentData.note || undefined
      });
      setIsPaymentModalOpen(false);
      setPaymentData({ amount: '', payment_type: 'partial', note: '' });
      await fetchDetails();
    } catch (err) {
      console.error("Payment error", err);
      alert("حدث خطأ أثناء تسجيل الدفعة المالية. يرجى المحاولة مرة أخرى.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#050505]">
      <Loader2 className="w-10 h-10 text-[#00CED1] animate-spin" />
    </div>
  );

  if (!customer) return (
    <div className="h-screen flex flex-col items-center justify-center text-gray-500 font-cairo bg-[#050505]" dir="rtl">
       <p className="text-lg">العميل غير موجود أو تم حذفه من النظام.</p>
       <Link href="/customers" className="mt-4 text-[#00CED1] hover:underline flex items-center gap-1">
         العودة لقائمة العملاء
       </Link>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 text-right" dir="rtl">
      {/* Header / Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/customers" className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400">
            <ChevronLeft className="w-6 h-6 rotate-0" />
          </Link>
          <h1 className="text-2xl font-bold font-cairo">ملف <span className="text-[#00CED1]">العميل</span></h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col - Profile Summary */}
        <div className="space-y-6">
          <div className="glass-panel p-8 flex flex-col items-center text-center">
             <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37] mb-6 shadow-2xl">
                <User className="w-12 h-12" />
             </div>
             <h2 className="text-2xl font-bold font-cairo mb-2 text-white">{customer.name}</h2>
             <span className="px-4 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold font-cairo border border-[#D4AF37]/20 mb-8">
                عميل مميز • {customer.loyalty_points || 0} نقطة
             </span>

             <div className="w-full space-y-4 text-right" dir="rtl">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                   <Phone className="w-4 h-4 text-[#00CED1]" />
                   <span className="text-sm font-sans text-gray-300">{customer.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                   <Mail className="w-4 h-4 text-[#00CED1]" />
                   <span className="text-sm text-gray-300 truncate">{customer.email || '—'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                   <MapPin className="w-4 h-4 text-[#00CED1]" />
                   <span className="text-sm font-cairo text-gray-300 truncate">{customer.address || '—'}</span>
                </div>
             </div>
          </div>

          <div className="glass-panel p-8 bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
             <p className="text-xs text-gray-400 font-cairo mb-2 uppercase">إجمالي الرصيد المستحق</p>
             <p className="text-4xl font-bold text-red-400 mb-6 font-sans">
               {(customer.total_debt || 0).toLocaleString()} <span className="text-sm font-cairo font-normal text-gray-400">ج.م</span>
             </p>
             <button 
               onClick={() => setIsPaymentModalOpen(true)}
               disabled={!customer.total_debt || customer.total_debt <= 0}
               className="w-full py-4 rounded-xl bg-red-400 text-[#050505] font-bold font-cairo hover:shadow-[0_0_20px_rgba(248,113,113,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
             >
                <ArrowDownLeft className="w-5 h-5" />
                تحصيل دفعة
             </button>
          </div>
        </div>

        {/* Right Col - Details & History */}
        <div className="lg:col-span-2 space-y-6">
           <div className="glass-panel p-2 flex gap-2">
              <button 
                onClick={() => setActiveTab('invoices')}
                className={`flex-1 py-3 rounded-xl font-cairo text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'invoices' ? 'bg-[#00CED1] text-black font-bold' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <ShoppingBag className="w-4 h-4" /> الفواتير
              </button>
              <button 
                onClick={() => setActiveTab('payments')}
                className={`flex-1 py-3 rounded-xl font-cairo text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'payments' ? 'bg-[#00CED1] text-black font-bold' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <CreditCard className="w-4 h-4" /> المدفوعات
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 rounded-xl font-cairo text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-[#00CED1] text-black font-bold' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <Clock className="w-4 h-4" /> السجل الكامل
              </button>
           </div>

           <div className="glass-panel p-6 min-h-[500px]">
              {activeTab === 'invoices' && (
                <div className="space-y-4">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold font-cairo text-white">سجل المشتريات</h3>
                      <button
                        onClick={() => {
                          if (!customer.orders?.length) { alert('لا توجد فواتير لتصديرها'); return; }
                          const headers = ['رقم الفاتورة', 'التاريخ', 'الإجمالي (ج.م)', 'طريقة الدفع'];
                          const rows = customer.orders.map((o: any) => [
                            `"${o.id.slice(0, 8)}"`,
                            `"${new Date(o.created_at).toLocaleDateString('ar-EG')}"`,
                            o.total ?? 0,
                            `"${o.payment_method || ''}"`,
                          ].join(','));
                          const csv = [headers.join(','), ...rows].join('\n');
                          const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
                          const link = document.createElement('a');
                          link.href = URL.createObjectURL(blob);
                          link.download = `invoices_${customer.name}_${new Date().toISOString().split('T')[0]}.csv`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(link.href);
                        }}
                        className="text-sm text-[#00CED1] font-cairo flex items-center gap-2 hover:underline"
                      >
                        <Download className="w-4 h-4" /> تحميل كشف فواتير
                      </button>
                   </div>
                   {customer.orders?.length > 0 ? customer.orders.map((order: any) => (
                     <div key={order.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-lg bg-[#00CED1]/10 flex items-center justify-center text-[#00CED1]">
                              <ShoppingBag className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="font-bold text-white font-cairo text-sm">فاتورة #{order.id.slice(0, 8)}</p>
                              <p className="text-xs text-gray-500 font-sans">{new Date(order.created_at).toLocaleString('ar-EG')}</p>
                           </div>
                        </div>
                        <div className="text-left flex items-center gap-6">
                           <div>
                              <p className="text-xs text-gray-500 font-cairo mb-1 text-left">القيمة</p>
                              <p className="font-bold text-[#D4AF37] font-sans">{(order.total || 0).toLocaleString()} ج.م</p>
                           </div>
                           <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white">
                              <ArrowUpRight className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                   )) : (
                     <div className="py-20 text-center opacity-40 font-cairo text-gray-400">لا توجد فواتير مسجلة لهذا العميل.</div>
                   )}
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-4">
                   <h3 className="text-xl font-bold font-cairo text-white mb-6">مدفوعات الدين</h3>
                   {customer.debt_payments?.length > 0 ? customer.debt_payments.map((p: any) => (
                     <div key={p.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                              <ArrowDownLeft className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="font-bold text-green-400 font-sans">{(p.amount || 0).toLocaleString()} ج.م</p>
                              <p className="text-xs text-gray-500 font-sans">{new Date(p.payment_date || p.created_at).toLocaleString('ar-EG')}</p>
                           </div>
                        </div>
                        <div className="text-left">
                           {p.note && <p className="text-xs text-gray-400 font-cairo mb-1.5 italic">"{p.note}"</p>}
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-cairo ${p.payment_type === 'full' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-blue-500/20 text-blue-400'}`}>
                              {p.payment_type === 'full' ? 'تصفية كاملة' : 'دفعة جزئية'}
                           </span>
                        </div>
                     </div>
                   )) : (
                     <div className="py-20 text-center opacity-40 font-cairo text-gray-400">لم يتم تسجيل أي دفعات مالية بعد.</div>
                   )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="py-20 text-center opacity-40 font-cairo text-gray-400 flex flex-col items-center justify-center gap-4">
                     <HistoryIcon className="w-12 h-12 text-[#00CED1]" />
                     <p>سيظهر هنا سجل زمني شامل يجمع بين الفواتير، الديون، والمدفوعات بترتيبها التاريخي.</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !processing && setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-panel p-8 text-right border border-white/10"
              dir="rtl"
            >
              <div className="flex items-center justify-between mb-6">
                <button 
                  type="button" 
                  onClick={() => !processing && setIsPaymentModalOpen(false)} 
                  className="p-1 text-gray-500 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold font-cairo text-red-400">تحصيل دفعة دين</h2>
              </div>

              <form onSubmit={handlePayment} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo block">المبلغ المحصل (ج.م)</label>
                  <input 
                    required 
                    disabled={processing}
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    max={customer?.total_debt}
                    className="w-full bg-[#050505]/60 border border-white/10 outline-none rounded-2xl p-4 text-2xl font-bold text-[#00CED1] font-sans text-right focus:border-[#00CED1]/50 disabled:opacity-50" 
                    value={paymentData.amount} 
                    onChange={e => setPaymentData({...paymentData, amount: e.target.value})} 
                  />
                  <p className="text-xs text-gray-500 font-cairo">الحد الأقصى للمبلغ المستحق: {customer?.total_debt?.toLocaleString()} ج.م</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo block">نوع السداد</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button" 
                      disabled={processing}
                      onClick={() => setPaymentData({...paymentData, payment_type: 'partial'})} 
                      className={`py-4 rounded-2xl font-cairo border transition-colors ${paymentData.payment_type === 'partial' ? 'bg-[#00CED1]/10 border-[#00CED1] text-[#00CED1] font-bold' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                    >
                      جزئي
                    </button>
                    <button 
                      type="button" 
                      disabled={processing}
                      onClick={() => setPaymentData({...paymentData, payment_type: 'full', amount: (customer?.total_debt || 0).toString()})} 
                      className={`py-4 rounded-2xl font-cairo border transition-colors ${paymentData.payment_type === 'full' ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37] font-bold' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                    >
                      تصفية كاملة
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo block">ملاحظات التحصيل</label>
                  <textarea 
                    disabled={processing}
                    className="w-full bg-[#050505]/60 border border-white/10 outline-none rounded-2xl p-4 font-cairo resize-none h-24 text-right text-white focus:border-[#00CED1]/50 disabled:opacity-50" 
                    placeholder="اكتب ملاحظة للعملية كـ (تحصيل شيك، كاش)..."
                    value={paymentData.note} 
                    onChange={e => setPaymentData({...paymentData, note: e.target.value})} 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={processing}
                  className="w-full nile-button py-4 font-bold font-cairo text-black bg-[#00CED1] rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "تأكيد استلام المبلغ"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Invoices Tab with Pagination ─────────────────────────────────── */
function CustomerInvoicesTab({ customer }: { customer: any }) {
  const PAGE_SIZE = 10;
  const orders = customer.orders || [];
  const { paginatedData, currentPage, totalPages, totalItems, setPage } = usePagination(orders, { pageSize: PAGE_SIZE });

  return null; // rendered inline above
}

/* ─── Payments Tab with Pagination ─────────────────────────────────── */
function CustomerPaymentsTab({ customer }: { customer: any }) {
  const PAGE_SIZE = 10;
  const payments = customer.debt_payments || [];
  const { paginatedData, currentPage, totalPages, totalItems, setPage } = usePagination(payments, { pageSize: PAGE_SIZE });

  return null; // rendered inline above
}
