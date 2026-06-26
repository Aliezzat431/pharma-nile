'use client';

import { useState, useEffect } from 'react';
import {
  Users, Search, Plus, X, Phone, MapPin, CreditCard, ChevronRight,
  Loader2, Download, Check, CheckCircle2, Wallet, AlertCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Customer, getCustomers, addCustomer, recordCustomerPayment } from '@/lib/api/customers';
import Link from 'next/link';
import { customerSchema } from '@/lib/validations';
import { z } from 'zod';
import { AddCustomerModal } from './components/AddCustomerModal';
import { BulkPaymentModal } from './components/BulkPaymentModal';
import { usePageGSAP, useGSAPList } from '@/hooks/usePageGSAP';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

const PAGE_SIZE = 12; // 3-column grid, 4 rows

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  type CustomerFormValues = z.infer<typeof customerSchema>;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPaymentMode, setIsPaymentMode] = useState(false);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [paymentNotes, setPaymentNotes] = useState<Record<string, string>>({});
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [filterDebt, setFilterDebt] = useState<'all' | 'debtors' | 'clear'>('all');

  // GSAP page-entry
  const pageRef = usePageGSAP();

  useEffect(() => { fetchCustomers(); }, []);

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
      fetchCustomers();
    } catch (err) {
      console.error('Add customer error', err);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  let filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );
  if (filterDebt === 'debtors') filteredCustomers = filteredCustomers.filter((c) => c.total_debt > 0);
  if (filterDebt === 'clear') filteredCustomers = filteredCustomers.filter((c) => c.total_debt === 0);

  const selectAll = () => {
    const allFilteredIds = filteredCustomers.map((c) => c.id);
    const isAllSelected =
      allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllSelected) allFilteredIds.forEach((id) => next.delete(id));
      else allFilteredIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const selectedCustomers = filteredCustomers.filter((c) => selectedIds.has(c.id));
  const totalSelectedDebt = selectedCustomers.reduce((acc, c) => acc + c.total_debt, 0);

  const handleStartPayment = () => {
    const amounts: Record<string, string> = {};
    const notes: Record<string, string> = {};
    selectedCustomers.forEach((c) => {
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
        .map((customer) => {
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
      if (paymentPromises.length > 0) await Promise.all(paymentPromises);
      setPaymentSuccess(true);
      setSelectedIds(new Set());
      setIsPaymentMode(false);
      await fetchCustomers();
      setTimeout(() => setPaymentSuccess(false), 4000);
    } catch (err) {
      console.error('Payment error', err);
      alert('حدث خطأ أثناء تسجيل المدفوعات. يرجى المحاولة مرة أخرى.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Pagination
  const { paginatedData, currentPage, totalPages, totalItems, setPage } = usePagination(
    filteredCustomers,
    { pageSize: PAGE_SIZE }
  );

  // GSAP list animation
  const gridRef = useGSAPList<HTMLDivElement>([paginatedData]);

  return (
    <div
      ref={pageRef}
      className="px-4 md:px-8 w-full max-w-7xl mx-auto space-y-8 pb-12"
      dir="rtl"
    >
      {/* Header */}
      <header data-gsap="fade-up" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

      {/* Selection bar */}
      <AnimatePresence>
        {selectedCustomers.length > 0 && !isPaymentMode && (
          <motion.div
            data-gsap="fade-up"
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
                <p className="text-xs text-gray-500">
                  إجمالي ديونهم: <span className="text-red-400 font-bold">{totalSelectedDebt.toLocaleString()} ج.م</span>
                </p>
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
                <Wallet className="w-4 h-4" /> تسجيل دفع للمحددين
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success */}
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

      {/* Filters */}
      <div data-gsap="fade-up" className="flex flex-col md:flex-row gap-4">
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
          {([
            { key: 'all' as const, label: 'الكل' },
            { key: 'debtors' as const, label: 'مديونون' },
            { key: 'clear' as const, label: 'بلا ديون' },
          ] as const).map((f) => (
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
          {filteredCustomers.length > 0 && filteredCustomers.every((c) => selectedIds.has(c.id))
            ? 'إلغاء الكل'
            : 'تحديد الكل'}
        </button>
      </div>

      {/* Grid */}
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
        <>
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedData.map((customer) => {
              const isSelected = selectedIds.has(customer.id);
              return (
                <div
                  key={customer.id}
                  className={`glass-panel p-6 border transition-all group relative ${isSelected ? 'border-[#00CED1]/50 bg-[#00CED1]/5 shadow-[0_0_15px_rgba(0,206,209,0.1)]' : 'border-white/5 hover:border-[#00CED1]/30'}`}
                >
                  {/* Checkbox */}
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
                      <p className="text-lg font-bold text-[#D4AF37] leading-tight">
                        {customer.loyalty_points} <span className="text-[10px] font-normal">نقطة</span>
                      </p>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold font-cairo text-white mb-4 group-hover:text-[#00CED1] transition-colors text-right">
                    {customer.name}
                  </h2>

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
                        {customer.total_debt > 0 ? customer.total_debt.toLocaleString() : '0'}{' '}
                        <span className="text-xs font-normal">ج.م</span>
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
                          setPaymentAmounts({ [customer.id]: customer.total_debt.toString() });
                          setPaymentNotes({ [customer.id]: '' });
                          setIsPaymentMode(true);
                        }}
                        className="py-3 px-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center gap-2 text-green-400 font-cairo hover:bg-green-500/20 transition-all font-bold text-sm"
                      >
                        <Wallet className="w-4 h-4" /> دفع
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={PAGE_SIZE}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </>
      )}

      {/* Modals */}
      <BulkPaymentModal
        isOpen={isPaymentMode}
        onClose={() => setIsPaymentMode(false)}
        selectedCustomers={selectedCustomers}
        paymentAmounts={paymentAmounts}
        setPaymentAmounts={setPaymentAmounts}
        paymentNotes={paymentNotes}
        setPaymentNotes={setPaymentNotes}
        onExecutePayments={handleExecutePayments}
        processingPayment={processingPayment}
        totalSelectedDebt={totalSelectedDebt}
      />
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCustomer={onSubmit}
      />
    </div>
  );

}
