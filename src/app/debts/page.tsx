'use client';

import { useState, useEffect } from 'react';
import { Users, Phone, Search, Plus, X, History, CreditCard, Loader2, ArrowUpRight, DollarSign, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Debtor, getDebtors, addDebtor, recordPayment, getPaymentHistory, DebtPayment } from '@/lib/api/debts';
// استيراد الـ Hook الخاص بجلب بيانات الصيدلية الحالية
import { useAuth } from '@/hooks/useAuth'; 

export default function DebtsPage() {
  // جلب الـ pharmacyId من الـ Auth context أو الـ Store
  const { pharmacyId } = useAuth(); 

  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<DebtPayment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [paymentData, setPaymentData] = useState({ amount: '', payment_type: 'partial' as 'partial' | 'full', note: '' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ربط الـ useEffect بوجود الـ pharmacyId لضمان عدم جلب بيانات فارغة
  useEffect(() => {
    if (pharmacyId) {
      fetchDebtors();
    }
  }, [pharmacyId]);

  const fetchDebtors = async () => {
    if (!pharmacyId) return;
    setLoading(true);
    try {
      const data = await getDebtors(pharmacyId); 
      setDebtors(data || []);
    } catch (err) {
      console.error("Fetch debtors error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDebtor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacyId) {
      setErrorMessage("فشل تحديد الصيدلية الحالية.");
      return;
    }
    try {
      await addDebtor({
        ...formData,
        pharmacy_id: pharmacyId
      });
      setIsAddModalOpen(false);
      setFormData({ name: '', phone: '' });
      fetchDebtors();
    } catch (err) {
      console.error("Add debtor error", err);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtor || !pharmacyId) return;
    try {
      await recordPayment({
        debtor_id: selectedDebtor.id,
        pharmacy_id: pharmacyId,
        amount: parseFloat(paymentData.amount),
        payment_type: paymentData.payment_type,
        note: paymentData.note
      });
      setIsPaymentModalOpen(false);
      setPaymentData({ amount: '', payment_type: 'partial', note: '' });
      fetchDebtors();
    } catch (err) {
      console.error("Payment error", err);
    }
  };

  const handleViewHistory = async (debtor: Debtor) => {
    if (!pharmacyId) return;
    setSelectedDebtor(debtor);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    const history = await getPaymentHistory(debtor.id, pharmacyId);
    setPaymentHistory(history || []);
    setHistoryLoading(false);
  };

  const filteredDebtors = debtors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    (d.phone && d.phone.includes(search))
  );

  const totalOutstanding = debtors.reduce((acc, d) => acc + d.total_debt, 0);

  // حماية الواجهة في حال عدم وجود معرف صيدلية صالح
  if (!pharmacyId && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-cairo text-gray-400 gap-3">
        <AlertCircle className="w-10 h-10 text-amber-500" />
        <p>يرجى التأكد من تسجيل الدخول واختيار الصيدلية أولاً.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-cairo flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {errorMessage}
        </div>
      )}

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-cairo">
            نظام <span className="nile-gradient-text">الديون</span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg font-cairo">إدارة ديون العملاء والتحصيل المالي.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="nile-button flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="font-cairo">إضافة عميل ديون</span>
        </button>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 border border-white/5">
           <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 font-cairo">إجمالي الديون المستحقة</span>
              <DollarSign className="text-[#00CED1] w-5 h-5" />
           </div>
           <p className="text-3xl font-bold text-[#00CED1]">{totalOutstanding.toLocaleString()} ج.م</p>
        </div>
        <div className="glass-panel p-6 border border-white/5">
           <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 font-cairo">عدد المدينين</span>
              <Users className="text-[#D4AF37] w-5 h-5" />
           </div>
           <p className="text-3xl font-bold text-white">{debtors.length}</p>
        </div>
        <div className="glass-panel p-6 border border-[#00CED1]/20 bg-[#00CED1]/5">
           <p className="text-sm font-cairo text-gray-300">يساعدك نظام الديون على تتبع المبالغ غير المحصلة من العملاء الدائمين وتسهيل عمليات السداد الجزئي أو الكلي.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-500" />
        <input 
          type="text" 
          placeholder="ابحث عن عميل بالاسم أو رقم الهاتف..." 
          className="flex-1 bg-transparent border-none outline-none text-white font-cairo placeholder:text-gray-600"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-[#00CED1] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDebtors.map((debtor, i) => (
            <motion.div
              key={debtor.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel p-6 border border-white/5 hover:border-[#00CED1]/30 transition-all group overflow-hidden relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold font-cairo">{debtor.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                    <Phone className="w-3.5 h-3.5 text-[#00CED1]/70" />
                    <span className="font-sans">{debtor.phone || 'بدون هاتف'}</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs text-gray-500 font-cairo mb-1 uppercase tracking-wider">الدين الحالي</p>
                <p className={`text-4xl font-bold ${debtor.total_debt > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {debtor.total_debt.toLocaleString()} <span className="text-sm font-normal">ج.م</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    setSelectedDebtor(debtor);
                    setIsPaymentModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00CED1] text-black font-bold font-cairo hover:shadow-[0_0_15px_rgba(0,206,209,0.4)] transition-all text-sm"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  تسديد
                </button>
                <button 
                  onClick={() => handleViewHistory(debtor)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-cairo hover:bg-white/10 transition-all text-sm"
                >
                  <History className="w-4 h-4" />
                  السجل
                </button>
              </div>

              <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-l from-[#00CED1] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Debtor Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-panel p-8"
            >
              <h2 className="text-2xl font-bold font-cairo mb-6">إضافة عميل ديون جديد</h2>
              <form onSubmit={handleAddDebtor} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo mr-1">اسم العميل</label>
                  <input required type="text" className="w-full bg-white/5 border border-white/10 outline-none rounded-xl p-3 font-cairo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo mr-1">رقم الهاتف</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 outline-none rounded-xl p-3" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <button type="submit" className="w-full nile-button py-4 font-bold font-cairo">إضافة العميل</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedDebtor && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-panel p-8"
            >
              <h2 className="text-2xl font-bold font-cairo mb-1">تسجيل عملية سداد</h2>
              <p className="text-gray-400 font-cairo text-sm mb-6">العميل: <span className="text-[#00CED1] font-bold">{selectedDebtor.name}</span></p>
              
              <form onSubmit={handleRecordPayment} className="space-y-6">
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo mr-1">المبلغ المسدد</label>
                  <div className="relative">
                    <input required type="number" step="0.01" className="w-full bg-white/5 border border-white/10 outline-none rounded-xl p-3 pl-12 text-2xl font-bold text-[#00CED1]" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} placeholder="0.00" />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-cairo">ج.م</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo mr-1">نوع السداد</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setPaymentData({...paymentData, payment_type: 'partial'})}
                      className={`py-3 rounded-xl font-cairo border ${paymentData.payment_type === 'partial' ? 'bg-[#00CED1]/10 border-[#00CED1] text-[#00CED1]' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >جزئي</button>
                    <button 
                      type="button"
                      onClick={() => setPaymentData({...paymentData, payment_type: 'full', amount: selectedDebtor.total_debt.toString()})}
                      className={`py-3 rounded-xl font-cairo border ${paymentData.payment_type === 'full' ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >كلي (تصفية)</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo mr-1">ملاحظات (اختياري)</label>
                  <textarea className="w-full bg-white/5 border border-white/10 outline-none rounded-xl p-3 font-cairo resize-none h-24" value={paymentData.note} onChange={e => setPaymentData({...paymentData, note: e.target.value})} placeholder="مثال: تم السداد كاش من خلال المندوب" />
                </div>

                <button type="submit" className="w-full nile-button py-4 font-bold font-cairo">تأكيد عملية السداد</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && selectedDebtor && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsHistoryModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl glass-panel p-8 max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-cairo">سجل سداد: {selectedDebtor.name}</h2>
                <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {historyLoading ? (
                  <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#00CED1]" /></div>
                ) : paymentHistory.length > 0 ? (
                  paymentHistory.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                       <div>
                          <p className="font-bold text-[#00CED1]">{p.amount.toLocaleString()} ج.م</p>
                          <p className="text-xs text-gray-500 font-cairo">{new Date(p.payment_date).toLocaleString('ar-EG')}</p>
                          {p.note && <p className="text-sm text-gray-400 font-cairo mt-1 opacity-80">{p.note}</p>}
                       </div>
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-cairo ${p.payment_type === 'full' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-blue-500/20 text-blue-400'}`}>
                          {p.payment_type === 'full' ? 'تصفية كاملة' : 'سداد جزئي'}
                       </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 text-gray-500 font-cairo">لا توجد عمليات سداد مسجلة بعد.</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
