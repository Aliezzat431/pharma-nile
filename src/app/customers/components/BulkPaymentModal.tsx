import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Customer } from '@/lib/api/customers';
import { Wallet, X, Users, Check, Loader2 } from 'lucide-react';

interface BulkPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomers: Customer[];
  paymentAmounts: Record<string, string>;
  setPaymentAmounts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  paymentNotes: Record<string, string>;
  setPaymentNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onExecutePayments: () => Promise<void>;
  processingPayment: boolean;
  totalSelectedDebt: number;
}

export function BulkPaymentModal({
  isOpen,
  onClose,
  selectedCustomers,
  paymentAmounts,
  setPaymentAmounts,
  paymentNotes,
  setPaymentNotes,
  onExecutePayments,
  processingPayment,
  totalSelectedDebt,
}: BulkPaymentModalProps) {

  const totalPaymentAmount = Object.values(paymentAmounts).reduce((acc, v) => acc + (Number(v) || 0), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-[#050505]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-card w-full max-w-2xl overflow-hidden relative border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.1)] text-right z-10 flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-[var(--glass-border)] flex justify-between items-center bg-green-500/5 shrink-0">
              <button 
                 onClick={onClose}
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

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedCustomers.map(customer => {
                const currentAmount = Number(paymentAmounts[customer.id] || 0);
                const isValid = currentAmount > 0 && currentAmount <= customer.total_debt;
                const isFull = currentAmount === customer.total_debt;

                return (
                  <div key={customer.id} className="bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-cairo">الدين الحالي</p>
                        <p className="text-lg font-bold text-red-400 font-sans">{customer.total_debt.toLocaleString()} ج.م</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <h3 className="font-bold text-white font-cairo">{customer.name}</h3>
                          <p className="text-xs text-gray-500 font-sans">{customer.phone || 'بدون رقم'}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-[var(--royal-gold)]/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-[var(--royal-gold)]" />
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
                          className="w-full bg-[#050505]/50 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--nile-teal)]/50 font-cairo text-sm text-right"
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
                            className="w-full bg-[#050505]/50 border border-white/20 rounded-xl pl-16 pr-4 py-3 text-white outline-none focus:border-green-500/50 font-sans font-bold text-lg text-left"
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
                      'bg-[var(--glass-surface)] border-[var(--glass-border)] text-gray-500'
                    }`}>
                      <span className="font-sans">المتبقي: {Math.max(0, customer.total_debt - currentAmount).toLocaleString()} ج.م</span>
                      <span>
                        {isFull ? '✓ سداد كامل' : currentAmount > 0 ? `دفعة جزئية (${((currentAmount / customer.total_debt) * 100).toFixed(0)}%)` : 'لم يتم تحديد مبلغ'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {}
            <div className="p-4 border-t border-[var(--glass-border)] bg-[#050505]/50 shrink-0">
              <div className="flex items-center justify-between mb-4 font-cairo text-sm">
                <span className="text-2xl font-bold text-green-400 font-sans">{totalPaymentAmount.toLocaleString()} ج.م</span>
                <span className="text-[var(--text-muted)]">إجمالي المبالغ المسددة</span>
              </div>
              <div className="flex gap-3">
                 <button 
                   onClick={onExecutePayments}
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
                   onClick={onClose}
                   className="flex-1 py-3 rounded-xl font-cairo text-gray-400 hover:bg-[var(--glass-surface)] transition-colors border border-[var(--glass-border)]"
                 >
                   إلغاء
                 </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
