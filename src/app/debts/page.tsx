'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Phone, Search, Plus, X, History, CreditCard, Loader2, ArrowUpRight, DollarSign, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Debtor, getDebtors, addDebtor, recordPayment, getPaymentHistory, DebtPayment } from '@/lib/api/debts';
import { debtorSchema, debtPaymentSchema } from '@/lib/validations';
import { z } from 'zod';
import { AddDebtorModal } from './components/AddDebtorModal';
import { PaymentModal } from './components/PaymentModal';
import { HistoryModal } from './components/HistoryModal';
import { usePageGSAP, useGSAPList } from '@/hooks/usePageGSAP';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

const PAGE_SIZE = 12;

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pageRef = usePageGSAP();
  const gridRef = useGSAPList<HTMLDivElement>([]);

  type DebtorFormValues = z.infer<typeof debtorSchema>;
  type PaymentFormValues = z.infer<typeof debtPaymentSchema>;

  useEffect(() => {
    fetchDebtors();
  }, []);

  const fetchDebtors = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getDebtors();
      setDebtors(data || []);
    } catch (err) {
      console.error("Fetch debtors error", err);
      setErrorMessage("حدث خطأ أثناء جلب قائمة المدينين");
    } finally {
      setLoading(false);
    }
  };

  const onAddDebtor = async (data: DebtorFormValues) => {
    setErrorMessage(null);
    try {
      await addDebtor(data);
      setIsAddModalOpen(false);
      await fetchDebtors();
    } catch (err) {
      console.error("Add debtor error", err);
      setErrorMessage("حدث خطأ أثناء إضافة العميل. يرجى التحقق من البيانات");
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
      await fetchDebtors();
    } catch (err) {
      console.error("Payment error", err);
      setErrorMessage("حدث خطأ أثناء تسجيل عملية السداد");
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
      setErrorMessage("تعذر جلب سجل السداد");
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredDebtors = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    if (!searchLower) return debtors;
    
    return debtors.filter(d => 
      (d.name?.toLowerCase().includes(searchLower)) || 
      (d.phone?.includes(searchLower))
    );
  }, [debtors, search]);

  const totalOutstanding = useMemo(() => {
    return debtors.reduce((acc, d) => acc + (Number(d.total_debt) || 0), 0);
  }, [debtors]);

  const { paginatedData, currentPage, totalPages, totalItems, setPage } = usePagination(
    filteredDebtors,
    { pageSize: PAGE_SIZE }
  );

  return (
    <div ref={pageRef} className="px-4 md:px-8 w-full max-w-7xl mx-auto space-y-8 pb-12" dir="rtl">
      {}
      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-cairo flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
            <button 
              onClick={() => setErrorMessage(null)} 
              className="ml-auto hover:bg-white/10 p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header data-gsap="fade-up" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-cairo">
            نظام <span className="text-[#00CED1]">الديون</span>
          </h1>
          <p className="text-gray-400 mt-2 text-lg font-cairo">
            إدارة ديون العملاء والتحصيل المالي بسلاسة
          </p>
        </div>

        <button 
          onClick={() => {
            setErrorMessage(null);
            setIsAddModalOpen(true);
          }}
          className="bg-[#00CED1] hover:bg-[#00CED1]/90 text-black px-6 py-3 rounded-xl flex items-center gap-2 font-bold font-cairo transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          إضافة عميل مدين
        </button>
      </header>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 font-cairo text-sm">إجمالي الديون المستحقة</span>
            <DollarSign className="text-[#00CED1] w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-[#00CED1]">{totalOutstanding.toLocaleString()} ج.م</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 font-cairo text-sm">عدد المدينين الحاليين</span>
            <Users className="text-[#D4AF37] w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-white">{debtors.length}</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl bg-[#00CED1]/5 border border-[#00CED1]/10">
          <p className="text-sm text-gray-400 leading-relaxed font-cairo">
            يساعدك نظام الديون على تتبع المبالغ غير المحصلة وتسهيل التحصيل
          </p>
        </div>
      </div>

      {}
      <div className="glass-panel p-4 flex items-center gap-4 rounded-xl">
        <Search className="w-5 h-5 text-gray-500" />
        <input 
          type="text" 
          placeholder="ابحث عن عميل بالاسم أو رقم الهاتف..." 
          className="flex-1 bg-transparent border-none outline-none text-white font-cairo placeholder:text-gray-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-12 h-12 text-[#00CED1] animate-spin" />
        </div>
      ) : (
        <>
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedData.map((debtor, i) => (
            <motion.div
              key={debtor.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.03, 0.25) }}
              className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-[#00CED1]/30 transition-all group relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold font-cairo">{debtor.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                    <Phone className="w-4 h-4 text-[#00CED1]/70" />
                    <span>{debtor.phone || 'بدون هاتف'}</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs text-gray-500 font-cairo mb-1">الدين المستحق</p>
                <p className={`text-4xl font-bold ${Number(debtor.total_debt) > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {Number(debtor.total_debt || 0).toLocaleString()} <span className="text-sm font-normal text-gray-500">ج.م</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    setErrorMessage(null);
                    setSelectedDebtor(debtor);
                    setIsPaymentModalOpen(true);
                  }}
                  className="py-3 rounded-xl bg-[#00CED1] text-black font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  تسديد
                </button>
                <button 
                  onClick={() => handleViewHistory(debtor)}
                  className="py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <History className="w-4 h-4" />
                  السجل
                </button>
              </div>
            </motion.div>
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={PAGE_SIZE}
              onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          )}
        </>
      )}

      {}
      <AddDebtorModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAddDebtor={onAddDebtor} 
      />

      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        selectedDebtor={selectedDebtor} 
        onRecordPayment={onRecordPayment} 
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        selectedDebtor={selectedDebtor} 
        paymentHistory={paymentHistory} 
        historyLoading={historyLoading} 
      />
    </div>
  );
      }
