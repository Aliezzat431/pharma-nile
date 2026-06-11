'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Phone, Search, Plus, X, History, CreditCard, Loader2, ArrowUpRight, DollarSign, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Debtor, getDebtors, addDebtor, recordPayment, getPaymentHistory, DebtPayment } from '@/lib/api/debts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { debtorSchema, debtPaymentSchema } from '@/lib/validations';
import { z } from 'zod';
import { cn } from '@/lib/utils';
export default function DebtsPage() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<DebtPayment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  type DebtorFormValues = z.infer<typeof debtorSchema>;
  const { register: registerAdd, handleSubmit: handleSubmitAdd, formState: { errors: errorsAdd }, reset: resetAdd } = useForm<DebtorFormValues>({
    resolver: zodResolver(debtorSchema),
    defaultValues: { name: '', phone: '' }
  });

  type PaymentFormValues = z.infer<typeof debtPaymentSchema>;
  const { register: registerPayment, handleSubmit: handleSubmitPayment, formState: { errors: errorsPayment }, reset: resetPayment, setValue: setPaymentValue, watch: watchPayment } = useForm<PaymentFormValues>({
    resolver: zodResolver(debtPaymentSchema),
    defaultValues: { payment_type: 'partial', note: '' }
  });
  const currentPaymentType = watchPayment('payment_type');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDebtors();
  }, []);

  const fetchDebtors = async () => {
    setLoading(true);
    try {
      const data = await getDebtors(); 
      setDebtors(data || []);
    } catch (err) {
      console.error("Fetch debtors error", err);
      setErrorMessage("حدث خطأ أثناء جلب قائمة العملاء المدينين.");
    } finally {
      setLoading(false);
    }
  };

  const onAddDebtor = async (data: DebtorFormValues) => {
    setErrorMessage(null);
    try {
      await addDebtor(data);
      setIsAddModalOpen(false);
      resetAdd();
      await fetchDebtors();
    } catch (err) {
      console.error("Add debtor error", err);
      setErrorMessage("حدث خطأ أثناء إضافة العميل. يرجى التحقق من البيانات.");
    }
  };

  const onRecordPayment = async (data: PaymentFormValues) => {
    if (!selectedDebtor) return;
    setErrorMessage(null);
    
    try {
      await recordPayment({
        debtor_id: selectedDebtor.id,
        amount: data.amount,
        payment_type: data.payment_type,
        note: data.note
      });
      setIsPaymentModalOpen(false);
      resetPayment();
      await fetchDebtors();
    } catch (err) {
      console.error("Payment error", err);
      setErrorMessage("حدث خطأ أثناء تسجيل عملية السداد.");
    }
  };

  const handleViewHistory = async (debtor: Debtor) => {
    setSelectedDebtor(debtor);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setErrorMessage(null);
    try {
      const history = await getPaymentHistory(debtor.id);
      setPaymentHistory(history || []);
    } catch (err) {
      console.error("Fetch history error", err);
      setErrorMessage("تعذر جلب سجل السداد الخاص بهذا العميل.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredDebtors = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    if (!searchLower) return debtors;
    
    return debtors.filter(d => 
      (d.name && d.name.toLowerCase().includes(searchLower)) || 
      (d.phone && d.phone.includes(searchLower))
    );
  }, [debtors, search]);

  const totalOutstanding = useMemo(() => {
    return debtors.reduce((acc, d) => acc + (Number(d.total_debt) || 0), 0);
  }, [debtors]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12" dir="rtl">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-cairo flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="hover:bg-white/5 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-cairo">
            نظام <span className="text-[#00CED1]">الديون</span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg font-cairo">إدارة ديون العملاء والتحصيل المالي بسلاسة.</p>
        </div>
        <button 
          onClick={() => {
            setErrorMessage(null);
            setIsAddModalOpen(true);
          }}
          className="bg-[#00CED1] hover:bg-[#00CED1]/90 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold font-cairo transition-all shadow-[0_0_15px_rgba(0,206,209,0.15)]"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة عميل ديون</span>
        </button>
      </header>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 border border-white/5 rounded-2xl bg-white/5">
           <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 font-cairo text-sm">إجمالي الديون المستحقة</span>
              <DollarSign className="text-[#00CED1] w-5 h-5" />
           </div>
           <p className="text-3xl font-bold text-[#00CED1] font-sans">{totalOutstanding.toLocaleString()} ج.م</p>
        </div>
        <div className="glass-panel p-6 border border-white/5 rounded-2xl bg-white/5">
           <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 font-cairo text-sm">عدد المدينين الحاليين</span>
              <Users className="text-[#D4AF37] w-5 h-5" />
           </div>
           <p className="text-3xl font-bold text-white font-sans">{debtors.length}</p>
        </div>
        <div className="glass-panel p-6 border border-[#00CED1]/10 bg-[#00CED1]/5 rounded-2xl md:col-span-1 col-span-1">
           <p className="text-xs font-cairo text-gray-400 leading-relaxed">
             يساعدك نظام الديون على تتبع المبالغ غير المحصلة من العملاء الدائمين وتسهيل إجراءات وجدولة المبيعات الآجلة وعمليات السداد الجزئي أو الكلي.
           </p>
        </div>
      </div>

      {}
      <div className="glass-panel p-4 flex items-center gap-4 border border-white/5 rounded-xl bg-white/5">
        <Search className="w-5 h-5 text-gray-500" />
        <input 
          type="text" 
          placeholder="ابحث عن عميل بالاسم أو رقم الهاتف..." 
          className="flex-1 bg-transparent border-none outline-none text-white font-cairo placeholder:text-gray-600 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
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
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="glass-panel p-6 border border-white/5 hover:border-[#00CED1]/30 transition-all group overflow-hidden relative rounded-2xl bg-white/5"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold font-cairo text-white">{debtor.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                    <Phone className="w-3.5 h-3.5 text-[#00CED1]/70" />
                    <span className="font-sans">{debtor.phone || 'بدون هاتف'}</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs text-gray-500 font-cairo mb-1 tracking-wider">الدين المستحق</p>
                <p className={`text-4xl font-bold font-sans ${debtor.total_debt > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {(debtor.total_debt || 0).toLocaleString()} <span className="text-sm font-cairo font-normal text-gray-500">ج.م</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    setErrorMessage(null);
                    setSelectedDebtor(debtor);
                    resetPayment();
                    setIsPaymentModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00CED1] text-black font-bold font-cairo hover:shadow-[0_0_15px_rgba(0,206,209,0.3)] transition-all text-sm"
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

              <div className="absolute top-0 left-0 w-32 h-[2px] bg-gradient-to-r from-[#00CED1] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </motion.div>
          ))}
        </div>
      )}

      {}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-panel p-8 bg-[#0a0a0a] border border-white/10 rounded-2xl z-10 text-right"
            >
              <h2 className="text-2xl font-bold font-cairo mb-6 text-white">إضافة عميل ديون جديد</h2>
              <form onSubmit={handleSubmitAdd(onAddDebtor)} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo block">اسم العميل بالكامل</label>
                  <input 
                    type="text" 
                    {...registerAdd('name')}
                    className={cn(
                      "w-full bg-white/5 border outline-none rounded-xl p-3 font-cairo text-white focus:border-[#00CED1] transition-colors",
                      errorsAdd.name ? "border-red-500" : "border-white/10"
                    )}
                  />
                  {errorsAdd.name && <p className="text-red-400 text-xs font-cairo">{errorsAdd.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo block">رقم الهاتف</label>
                  <input 
                    type="text" 
                    {...registerAdd('phone')}
                    className={cn(
                      "w-full bg-white/5 border outline-none rounded-xl p-3 text-white focus:border-[#00CED1] transition-colors font-sans",
                      errorsAdd.phone ? "border-red-500" : "border-white/10"
                    )}
                    placeholder="01xxxxxxxxx" 
                  />
                  {errorsAdd.phone && <p className="text-red-400 text-xs font-cairo">{errorsAdd.phone.message}</p>}
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-[#00CED1] text-black py-3 rounded-xl font-bold font-cairo hover:bg-[#00CED1]/90 transition-colors">إضافة العميل</button>
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 bg-white/5 border border-white/10 text-white rounded-xl font-cairo hover:bg-white/10">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {isPaymentModalOpen && selectedDebtor && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-panel p-8 bg-[#0a0a0a] border border-white/10 rounded-2xl z-10 text-right"
            >
              <h2 className="text-2xl font-bold font-cairo mb-1 text-white">تسجيل عملية سداد</h2>
              <p className="text-gray-400 font-cairo text-sm mb-6">العميل: <span className="text-[#00CED1] font-bold">{selectedDebtor.name}</span></p>
              
              <form onSubmit={handleSubmitPayment(onRecordPayment)} className="space-y-6">
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo block">المبلغ المسدد</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01" 
                      {...registerPayment('amount')}
                      className={cn(
                        "w-full bg-white/5 border outline-none rounded-xl p-3 pr-4 pl-12 text-2xl font-bold text-[#00CED1] font-sans text-left",
                        errorsPayment.amount ? "border-red-500" : "border-white/10"
                      )}
                      placeholder="0.00" 
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-cairo text-xs">ج.م</span>
                  </div>
                  {errorsPayment.amount && <p className="text-red-400 text-xs font-cairo">{errorsPayment.amount.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo block">نوع السداد</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setPaymentValue('payment_type', 'partial')}
                      className={`py-3 rounded-xl font-cairo text-sm border transition-all ${currentPaymentType === 'partial' ? 'bg-[#00CED1]/10 border-[#00CED1] text-[#00CED1] font-bold' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >سداد جزئي</button>
                    <button 
                      type="button"
                      onClick={() => {
                        setPaymentValue('payment_type', 'full');
                        setPaymentValue('amount', selectedDebtor.total_debt);
                      }}
                      className={`py-3 rounded-xl font-cairo text-sm border transition-all ${currentPaymentType === 'full' ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37] font-bold' : 'bg-white/5 border-white/10 text-gray-400'}`}
                    >كلي (تصفية الحساب)</button>
                  </div>
                  {errorsPayment.payment_type && <p className="text-red-400 text-xs font-cairo">{errorsPayment.payment_type.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo block">ملاحظات (اختياري)</label>
                  <textarea 
                    {...registerPayment('note')}
                    className={cn(
                      "w-full bg-white/5 border outline-none rounded-xl p-3 font-cairo resize-none h-20 text-white focus:border-[#00CED1] text-sm",
                      errorsPayment.note ? "border-red-500" : "border-white/10"
                    )}
                    placeholder="مثال: استلام نقدي بموجب إيصال" 
                  />
                  {errorsPayment.note && <p className="text-red-400 text-xs font-cairo">{errorsPayment.note.message}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 bg-[#00CED1] text-black py-3 rounded-xl font-bold font-cairo hover:bg-[#00CED1]/90 transition-colors">تأكيد السداد</button>
                  <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 bg-white/5 border border-white/10 text-white rounded-xl font-cairo hover:bg-white/10">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {isHistoryModalOpen && selectedDebtor && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsHistoryModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.93 }}
              className="relative w-full max-w-2xl glass-panel p-8 bg-[#0a0a0a] border border-white/10 rounded-2xl z-10 max-h-[80vh] flex flex-col text-right"
            >
              <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <h2 className="text-2xl font-bold font-cairo text-white">سجل الدفعات للعميل: {selectedDebtor.name}</h2>
                <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pl-1">
                {historyLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#00CED1] w-8 h-8" /></div>
                ) : paymentHistory.length > 0 ? (
                  paymentHistory.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                       <div>
                          <p className="font-bold text-[#00CED1] text-lg font-sans">{(p.amount || 0).toLocaleString()} ج.م</p>
                          <p className="text-xs text-gray-500 font-cairo mt-0.5">{new Date(p.payment_date).toLocaleString('ar-EG')}</p>
                          {p.note && <p className="text-xs text-gray-400 font-cairo mt-1 bg-white/5 px-2 py-1 rounded-md inline-block opacity-90">{p.note}</p>}
                       </div>
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-cairo ${p.payment_type === 'full' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-blue-500/20 text-blue-400'}`}>
                          {p.payment_type === 'full' ? 'تصفية كاملة' : 'سداد جزئي'}
                       </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 text-gray-500 font-cairo text-sm">لا توجد عمليات سداد مسجلة لهذا العميل حتى الآن.</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
