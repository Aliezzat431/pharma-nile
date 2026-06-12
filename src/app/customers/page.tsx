'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Plus, X, Phone, Mail, MapPin, CreditCard, ChevronRight, Loader2, Download, Filter, Check, CheckCircle2, Wallet, DollarSign, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Customer, getCustomers, addCustomer, recordCustomerPayment } from '@/lib/api/customers';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema } from '@/lib/validations';
import { z } from 'zod';
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  type CustomerFormValues = z.infer<typeof customerSchema>;
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: { name: '', phone: '', email: '', address: '' }
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPaymentMode, setIsPaymentMode] = useState(false);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [paymentNotes, setPaymentNotes] = useState<Record<string, string>>({});
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [filterDebt, setFilterDebt] = useState<'all' | 'debtors' | 'clear'>('all');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const data = await getCustomers();
    setCustomers(data);
    setLoading(false);
  };

  const onSubmit = async (data: CustomerFormValues) => {
    try {
      await addCustomer(data);
      setIsAddModalOpen(false);
      reset();
      fetchCustomers();
    } catch (err) {
      console.error("Add customer error", err);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  let filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  if (filterDebt === 'debtors') filteredCustomers = filteredCustomers.filter(c => c.total_debt > 0);
  if (filterDebt === 'clear') filteredCustomers = filteredCustomers.filter(c => c.total_debt === 0);

  const selectAll = () => {
    const allFilteredIds = filteredCustomers.map(c => c.id);
    const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id));

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (isAllSelected) {
        allFilteredIds.forEach(id => next.delete(id));
      } else {
        allFilteredIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const selectedCustomers = filteredCustomers.filter(c => selectedIds.has(c.id));
  const totalSelectedDebt = selectedCustomers.reduce((acc, c) => acc + c.total_debt, 0);

  const handleStartPayment = () => {
    const amounts: Record<string, string> = {};
    const notes: Record<string, string> = {};
    selectedCustomers.forEach(c => {
      amounts[c.id] = c.total_debt.toString();
      notes[c.id] = '';
    });
    setPaymentAmounts(amounts);
    setPaymentNotes(notes);
    setIsPaymentMode(true);
  };

  const handleExecutePayments = async () => {
    setProcessingPayment(true);
    try {
      const paymentPromises = selectedCustomers
        .map(customer => {
          const amount = Number(paymentAmounts[customer.id] || 0);
          if (amount <= 0) return null;

          const paymentType = amount >= customer.total_debt ? 'full' : 'partial';
          return recordCustomerPayment({
            customer_id: customer.id,
            amount,
            payment_type: paymentType,
            note: paymentNotes[customer.id] || undefined,
          });
        })
        .filter(Boolean);

      if (paymentPromises.length > 0) {
        await Promise.all(paymentPromises);
      }

      setPaymentSuccess(true);
      setSelectedIds(new Set());
      setIsPaymentMode(false);
      await fetchCustomers();
      setTimeout(() => setPaymentSuccess(false), 4000);
    } catch (err) {
      console.error("Payment error", err);
      alert("حدث خطأ أثناء تسجيل المدفوعات. يرجى المحاولة مرة أخرى.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const totalPaymentAmount = Object.values(paymentAmounts).reduce((acc, v) => acc + (Number(v) || 0), 0);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-cairo">
            إدارة <span className="nile-gradient-text">العملاء</span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg font-cairo">قاعدة بيانات العملاء، الديون، ونقاط الولاء.</p>
        </div>
        <div className="flex gap-3">
           <button className="glass-card px-4 py-2 text-sm flex items-center gap-2 hover:bg-white/5 transition-colors font-cairo">
             <Download className="w-4 h-4" /> تصدير التقرير
           </button>
           <button 
             onClick={() => setIsAddModalOpen(true)}
             className="nile-button flex items-center gap-2"
           >
             <Plus className="w-5 h-5" />
             <span className="font-cairo">إضافة عميل جديد</span>
           </button>
        </div>
      </header>

      {}
      <AnimatePresence>
        {selectedCustomers.length > 0 && !isPaymentMode && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-4 flex items-center justify-between border border-[#00CED1]/30"
          >
            <div className="flex items-center gap-4 font-cairo">
              <div className="w-10 h-10 rounded-xl bg-[#00CED1]/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#00CED1]" />
              </div>
              <div>
                <p className="text-foreground font-bold">تم تحديد {selectedCustomers.length} عميل</p>
                <p className="text-xs text-gray-500">إجمالي ديونهم: <span className="text-red-400 font-bold">{totalSelectedDebt.toLocaleString()} ج.م</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="px-4 py-2.5 rounded-xl font-cairo text-gray-400 hover:bg-white/5 transition-colors border border-white/10 text-sm"
              >
                إلغاء التحديد
              </button>
              <button 
                onClick={handleStartPayment}
                disabled={totalSelectedDebt === 0}
                className="px-6 py-2.5 rounded-xl font-cairo text-white bg-green-500/20 border border-green-500/50 hover:bg-green-500/40 transition-colors font-bold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
              >
                <Wallet className="w-4 h-4" />
                تسجيل دفع للمحددين
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {paymentSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-4 flex items-center gap-3 border border-green-500/30 bg-green-500/5"
          >
            <Check className="w-6 h-6 text-green-400" />
            <p className="text-green-400 font-bold font-cairo">تم تسجيل جميع المدفوعات بنجاح وتحديث أرصدة العملاء ✓</p>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 glass-panel p-2 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-500 mr-2" />
          <input 
            type="text" 
            placeholder="البحث بالاسم أو رقم الهاتف..." 
            className="flex-1 bg-transparent border-none outline-none text-white font-cairo placeholder:text-gray-600 py-2 text-right"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-500 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all' as const, label: 'الكل' },
            { key: 'debtors' as const, label: 'مديونون' },
            { key: 'clear' as const, label: 'بلا ديون' },
          ].map(f => (
            <button 
              key={f.key}
              onClick={() => setFilterDebt(f.key)}
              className={`glass-panel px-5 flex items-center gap-2 transition-colors font-cairo text-sm ${filterDebt === f.key ? 'border-[#00CED1]/50 text-[#00CED1]' : 'text-gray-400 hover:text-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button 
          onClick={selectAll}
          className="glass-panel px-5 flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-cairo text-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          {filteredCustomers.length > 0 && filteredCustomers.every(c => selectedIds.has(c.id)) ? 'إلغاء الكل' : 'تحديد الكل'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-[#00CED1] animate-spin" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-3 border border-white/5">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto" />
          <p className="text-gray-400 font-cairo text-lg">لم يتم العثور على أي عملاء يطابقون خيارات البحث والفلترة الحالية.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer, i) => {
            const isSelected = selectedIds.has(customer.id);
            
            return (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-panel p-6 border transition-all group relative ${isSelected ? 'border-[#00CED1]/50 bg-[#00CED1]/5 shadow-[0_0_15px_rgba(0,206,209,0.1)]' : 'border-white/5 hover:border-[#00CED1]/30'}`}
              >
                {}
                <button 
                  onClick={() => toggleSelect(customer.id)}
                  className={`absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center transition-all border ${isSelected ? 'bg-[#00CED1] border-[#00CED1] text-black' : 'bg-white/5 border-white/20 text-transparent hover:border-[#00CED1]/50'}`}
                >
                  <Check className="w-4 h-4" />
                </button>

                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#D4AF37] border border-white/10 group-hover:border-[#D4AF37]/50 transition-colors">
                     <Users className="w-6 h-6" />
                  </div>
                  <div className="text-left h-auto py-1">
                     <p className="text-xs text-gray-500 font-cairo mb-1 uppercase">نقاط الولاء</p>
                     <p className="text-lg font-bold text-[#D4AF37] leading-tight">{customer.loyalty_points} <span className="text-[10px] font-normal">نقطة</span></p>
                  </div>
                </div>

                <h2 className="text-xl font-bold font-cairo text-white mb-4 group-hover:text-[#00CED1] transition-colors text-right">{customer.name}</h2>
                
                <div className="space-y-3 mb-6 text-right">
                   {customer.phone && (
                     <div className="flex items-center justify-start gap-3 text-sm text-gray-400">
                       <Phone className="w-4 h-4 opacity-50" />
                       <span className="font-sans">{customer.phone}</span>
                     </div>
                   )}
                   {customer.address && (
                     <div className="flex items-center justify-start gap-3 text-sm text-gray-400">
                       <MapPin className="w-4 h-4 opacity-50" />
                       <span className="font-cairo truncate">{customer.address}</span>
                     </div>
                   )}
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between mb-6">
                   <div className="text-right">
                      <p className="text-[10px] text-gray-500 font-cairo mb-1.5 uppercase">إجمالي الدين</p>
                      <p className={`text-xl font-bold ${customer.total_debt > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {customer.total_debt > 0 ? customer.total_debt.toLocaleString() : '0'} <span className="text-xs font-normal">ج.م</span>
                      </p>
                   </div>
                   <CreditCard className={`w-6 h-6 ${customer.total_debt > 0 ? 'text-red-400' : 'text-green-400'} opacity-30`} />
                </div>

                <div className="flex gap-2">
                  <Link 
                    href={`/customers/${customer.id}`}
                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-white font-cairo group/btn hover:bg-[#00CED1]/10 hover:border-[#00CED1]/30 transition-all font-medium text-sm"
                  >
                    الملف الشخصي
                    <ChevronRight className="w-4 h-4 group-hover/btn:-translate-x-1 transition-transform rotate-180" />
                  </Link>
                  {customer.total_debt > 0 && (
                    <button 
                      onClick={() => {
                        setSelectedIds(new Set([customer.id]));
                        const amounts: Record<string, string> = { [customer.id]: customer.total_debt.toString() };
                        const notes: Record<string, string> = { [customer.id]: '' };
                        setPaymentAmounts(amounts);
                        setPaymentNotes(notes);
                        setIsPaymentMode(true);
                      }}
                      className="py-3 px-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center gap-2 text-green-400 font-cairo hover:bg-green-500/20 transition-all font-bold text-sm"
                    >
                      <Wallet className="w-4 h-4" />
                      دفع
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {}
      <AnimatePresence>
        {isPaymentMode && (
          <div className="fixed inset-0 bg-[#050505]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-2xl overflow-hidden relative border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.1)] text-right"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-green-500/5">
                <button 
                   onClick={() => setIsPaymentMode(false)}
                   className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="text-right">
                  <h2 className="text-xl font-bold font-cairo text-green-400 flex items-center justify-end gap-2">
                    <Wallet className="w-5 h-5" /> تسجيل دفع ديون
                  </h2>
                  <p className="text-sm text-gray-400 font-cairo mt-1">{selectedCustomers.length} عميل محدد • إجمالي الديون: {totalSelectedDebt.toLocaleString()} ج.م</p>
                </div>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                {selectedCustomers.map(customer => {
                  const currentAmount = Number(paymentAmounts[customer.id] || 0);
                  const isValid = currentAmount > 0 && currentAmount <= customer.total_debt;
                  const isFull = currentAmount === customer.total_debt;

                  return (
                    <div key={customer.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 font-cairo">الدين الحالي</p>
                          <p className="text-lg font-bold text-red-400 font-cairo">{customer.total_debt.toLocaleString()} ج.م</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <h3 className="font-bold text-foreground font-cairo">{customer.name}</h3>
                            <p className="text-xs text-gray-500 font-cairo">{customer.phone || 'بدون رقم'}</p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#D4AF37]" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="text-right">
                          <label className="text-xs text-gray-400 mb-1 block font-cairo">ملاحظات (اختياري)</label>
                          <input 
                            type="text"
                            value={paymentNotes[customer.id] || ''}
                            placeholder="مثال: دفعة أولى..."
                            onChange={e => setPaymentNotes(prev => ({ ...prev, [customer.id]: e.target.value }))}
                            className="w-full bg-[#050505]/50 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-[#00CED1]/50 font-cairo text-sm text-right"
                          />
                        </div>
                        <div className="text-right">
                          <label className="text-xs text-gray-400 mb-1 block font-cairo">المبلغ المدفوع (ج.م)</label>
                          <div className="relative">
                            <input 
                              type="number"
                              min="0"
                              max={customer.total_debt}
                              value={paymentAmounts[customer.id] ?? ''}
                              placeholder="0"
                              onChange={e => {
                                const valStr = e.target.value;
                                const valNum = Number(valStr);
                                
                                if (valNum < 0) return;
                                if (valNum > customer.total_debt) {
                                  setPaymentAmounts(prev => ({ ...prev, [customer.id]: customer.total_debt.toString() }));
                                  return;
                                }
                                setPaymentAmounts(prev => ({ ...prev, [customer.id]: valStr }));
                              }}
                              className="w-full bg-[#050505]/50 border border-white/20 rounded-xl pl-16 pr-4 py-3 text-white outline-none focus:border-green-500/50 font-cairo font-bold text-lg text-right"
                            />
                            <button 
                              onClick={() => setPaymentAmounts(prev => ({ ...prev, [customer.id]: customer.total_debt.toString() }))}
                              className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-1 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/40 transition-colors font-cairo font-bold"
                            >
                              كامل
                            </button>
                          </div>
                        </div>
                      </div>

                      {}
                      <div className={`mt-3 p-2 rounded-lg flex items-center justify-between text-xs font-cairo border ${
                        !isValid && currentAmount > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        isFull ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                        currentAmount > 0 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                        'bg-white/5 border-white/10 text-gray-500'
                      }`}>
                        <span>المتبقي: {Math.max(0, customer.total_debt - currentAmount).toLocaleString()} ج.م</span>
                        <span>
                          {isFull ? '✓ سداد كامل' : currentAmount > 0 ? `دفعة جزئية (${((currentAmount / customer.total_debt) * 100).toFixed(0)}%)` : 'لم يتم تحديد مبلغ'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {}
              <div className="p-4 border-t border-white/10 bg-[#050505]/50">
                <div className="flex items-center justify-between mb-4 font-cairo text-sm">
                  <span className="text-2xl font-bold text-green-400">{totalPaymentAmount.toLocaleString()} ج.م</span>
                  <span className="text-gray-400">إجمالي المبالغ المسددة</span>
                </div>
                <div className="flex gap-3">
                   <button 
                     onClick={handleExecutePayments}
                     disabled={processingPayment || totalPaymentAmount === 0}
                     className="flex-1 py-3 rounded-xl font-cairo text-white bg-green-500/20 border border-green-500/50 hover:bg-green-500/40 transition-colors font-bold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                   >
                     {processingPayment ? (
                       <Loader2 className="w-5 h-5 animate-spin" />
                     ) : (
                       <Check className="w-5 h-5" />
                     )}
                     {processingPayment ? 'جاري التسجيل...' : 'تأكيد الدفع'}
                   </button>
                   <button 
                     onClick={() => setIsPaymentMode(false)}
                     className="flex-1 py-3 rounded-xl font-cairo text-gray-400 hover:bg-white/5 transition-colors border border-white/10"
                   >
                     إلغاء
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg glass-panel p-8 border border-white/10 text-right"
            >
              <div className="flex items-center justify-between mb-8">
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold font-cairo">إضافة عميل جديد</h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo ml-1 block">الاسم بالكامل</label>
                  <input 
                    type="text" 
                    {...register("name")}
                    className={cn(
                      "w-full bg-white/5 border focus:border-[#00CED1]/50 outline-none rounded-2xl p-4 font-cairo text-lg text-right",
                      errors.name ? "border-red-500" : "border-white/10"
                    )}
                  />
                  {errors.name && <p className="text-red-400 text-xs font-cairo">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 font-cairo ml-1 block">البريد الإلكتروني</label>
                    <input 
                      type="email" 
                      {...register("email")}
                      className={cn(
                        "w-full bg-white/5 border focus:border-[#00CED1]/50 outline-none rounded-2xl p-4 text-right",
                        errors.email ? "border-red-500" : "border-white/10"
                      )}
                    />
                    {errors.email && <p className="text-red-400 text-xs font-cairo">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 font-cairo ml-1 block">رقم الهاتف</label>
                    <input 
                      type="text" 
                      {...register("phone")}
                      className={cn(
                        "w-full bg-white/5 border focus:border-[#00CED1]/50 outline-none rounded-2xl p-4 text-right",
                        errors.phone ? "border-red-500" : "border-white/10"
                      )}
                    />
                    {errors.phone && <p className="text-red-400 text-xs font-cairo">{errors.phone.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 font-cairo ml-1 block">العنوان بالتفصيل</label>
                  <input 
                    type="text" 
                    {...register("address")}
                    className={cn(
                      "w-full bg-white/5 border focus:border-[#00CED1]/50 outline-none rounded-2xl p-4 font-cairo text-right",
                      errors.address ? "border-red-500" : "border-white/10"
                    )}
                  />
                  {errors.address && <p className="text-red-400 text-xs font-cairo">{errors.address.message}</p>}
                </div>

                <button type="submit" className="w-full nile-button py-5 font-bold text-xl mt-4 font-cairo">
                  حفظ بيانات العميل
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
