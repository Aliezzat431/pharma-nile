import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { updateBatchDistribution } from '@/store/slices/posSlice';

interface BatchDistributionModalProps {
  isOpen: boolean;
  item: any | null;
  onClose: () => void;
  batchDistributions: any[];
  setBatchDistributions: React.Dispatch<React.SetStateAction<any[]>>;
}

export function BatchDistributionModal({
  isOpen,
  item,
  onClose,
  batchDistributions,
  setBatchDistributions,
}: BatchDistributionModalProps) {
  const dispatch = useAppDispatch();

  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-[#050505]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-card w-full max-w-lg overflow-hidden relative border border-[#00CED1]/30"
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div>
              <h2 className="text-xl font-bold font-cairo text-white">توزيع التشغيلات</h2>
              <p className="text-sm font-cairo text-gray-400 mt-1">{item.name} - الكمية المطلوبة: {item.quantity}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
            {item.activeBatches?.length ? (
              item.activeBatches.map((b: any) => {
                const existingDist = batchDistributions.find(d => d.batchId === b.id);
                const assignedVal = existingDist ? existingDist.quantity : 0;

                return (
                  <div key={b.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div>
                      <p className="text-gray-300 font-cairo font-bold">انتهاء: {new Date(b.expiry_date).toLocaleDateString('ar-EG')}</p>
                      <p className="text-sm text-gray-500 font-cairo mt-1">الكمية المتاحة: {b.quantity} | السعر: {b.sale_price} ج.م</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={b.quantity}
                      value={assignedVal || ''}
                      placeholder="0"
                      onChange={(e) => {
                        let val = Number(e.target.value);
                        if (val < 0) val = 0;
                        if (val > b.quantity) val = b.quantity;
                        const otherDists = batchDistributions.filter(d => d.batchId !== b.id);
                        if (val > 0) {
                          setBatchDistributions([...otherDists, { batchId: b.id, quantity: val, price: b.sale_price, purchasePrice: b.purchase_price, expiry: b.expiry_date }]);
                        } else {
                          setBatchDistributions(otherDists);
                        }
                      }}
                      className="w-24 bg-[#050505]/50 border border-white/20 rounded-lg px-3 py-2 text-center text-white outline-none focus:border-[#00CED1] font-cairo font-bold"
                    />
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 font-cairo py-6">لا توجد تشغيلات مسجلة لهذا المنتج.</p>
            )}

            {(() => {
              const totalDist = batchDistributions.reduce((acc, curr) => acc + curr.quantity, 0);
              const target = item.quantity;
              return (
                <div className={`p-3 rounded-lg flex justify-between items-center font-cairo text-sm mt-4 border ${totalDist === target ? 'bg-green-500/10 border-green-500/50 text-green-400' : totalDist > target ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500'}`}>
                  <span>إجمالي الموزع: {totalDist}</span>
                  <span>المطلوب: {target}</span>
                </div>
              );
            })()}

          </div>
          <div className="p-4 border-t border-white/10 flex gap-3 bg-[#050505]/50">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-cairo text-gray-400 hover:bg-white/5 transition-colors border border-white/10"
            >
              إلغاء
            </button>
            <button
              onClick={() => {
                const totalDist = batchDistributions.reduce((acc, curr) => acc + curr.quantity, 0);
                if (totalDist > item.quantity) {
                  alert("الكمية الموزعة لا يجب أن تتجاوز الكمية المطلوبة للمنتج في السلة.");
                  return;
                }
                dispatch(updateBatchDistribution({ id: item.id, distributions: batchDistributions }));
                onClose();
              }}
              className="flex-1 py-3 rounded-xl font-cairo text-white bg-[#00CED1]/20 border border-[#00CED1]/50 hover:bg-[#00CED1]/40 transition-colors font-bold"
            >
              حفظ التوزيع
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
