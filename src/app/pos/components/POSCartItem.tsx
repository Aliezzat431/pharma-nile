import { motion } from 'framer-motion';
import { Package, Trash2 } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { updateQuantity, updateUnit, removeFromCart } from '@/store/slices/posSlice';

interface POSCartItemProps {
  item: any;
  itemTotal: number;
  totalStock: number;
  hasMultipleBatches: boolean;
  onShowBatchModal: (item: any) => void;
  onShowPillsModal: (item: any, newUnit: string) => void;
}

export function POSCartItem({ 
  item, 
  itemTotal, 
  totalStock, 
  hasMultipleBatches, 
  onShowBatchModal, 
  onShowPillsModal 
}: POSCartItemProps) {
  const dispatch = useAppDispatch();

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="mx-2 my-2 glass-card group relative overflow-hidden"
    >
      <div className="p-4 flex justify-between items-center">
        <div className="z-10 flex-1">
          <h3 className="font-semibold text-white truncate max-w-[200px] font-cairo">{item.name}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1 bg-[#050505]/50 border border-white/10 rounded-lg">
              <button
                onClick={() => {
                  if (item.quantity > 1) {
                    dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }));
                  }
                }}
                className="px-2 py-1 text-gray-400 hover:text-white transition-colors text-sm font-bold"
              >−</button>
              <span className="text-sm text-[#00CED1] font-bold font-cairo min-w-[24px] text-center">{item.quantity}</span>
              <button
                onClick={() => {
                  if (item.quantity < totalStock) {
                    dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }));
                  }
                }}
                className="px-2 py-1 text-gray-400 hover:text-white transition-colors text-sm font-bold"
              >+</button>
            </div>
            <select
              value={item.unit}
              onChange={(e) => {
                const newUnit = e.target.value;
                if (["قرص", "كبسولة", "قطعة", "لبوسة"].includes(newUnit)) {
                  onShowPillsModal(item, newUnit);
                } else {
                  dispatch(updateUnit({ id: item.id, unit: newUnit }));
                }
              }}
              className="bg-[#050505]/50 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white outline-none font-cairo focus:border-[#00CED1]/50"
            >
              {item.availableUnits?.map((u: string) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 z-10">
          <span className="font-bold text-white text-lg font-cairo ml-2">{Number(itemTotal.toFixed(2))} ج.م</span>
          <button
            onClick={() => onShowBatchModal(item)}
            className="text-gray-400 hover:text-[#00CED1] transition-colors bg-white/5 p-2 rounded-lg"
            title="توزيع التشغيلات"
          >
            <Package className="w-5 h-5" />
          </button>
          <button
            onClick={() => dispatch(removeFromCart(item.id))}
            className="text-gray-500 hover:text-red-400 transition-colors bg-white/5 p-2 rounded-lg"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute left-0 top-0 w-1 h-full bg-[#00CED1] opacity-50"></div>
      </div>

      {hasMultipleBatches && (
        <div className="px-4 pb-3 pt-1 border-t border-white/5">
          <p className="text-[10px] text-[#D4AF37] font-cairo mb-1.5 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
            تم التقسيم على أكثر من تشغيلة (كل تشغيلة بسعرها)
          </p>
          {item.batchDistributions.map((d: any, idx: number) => (
            <div key={d.batchId} className="flex items-center justify-between text-[11px] font-cairo py-1 px-2 rounded-md mb-0.5" style={{background: idx === 0 ? 'rgba(0,206,209,0.08)' : 'rgba(212,175,55,0.06)'}}>
              <span className="text-gray-400">
                تشغيلة {idx + 1}
                <span className="text-gray-600 mx-1">•</span>
                <span className="text-gray-500">{new Date(d.expiry).toLocaleDateString('ar-EG')}</span>
              </span>
              <span dir="ltr" className="font-mono">
                <span className={idx === 0 ? 'text-[#00CED1]' : 'text-[#D4AF37]'}>{d.quantity}</span>
                <span className="text-gray-600"> × </span>
                <span className={idx === 0 ? 'text-[#00CED1]' : 'text-[#D4AF37]'}>{d.price}</span>
                <span className="text-gray-600"> = </span>
                <span className="text-white font-bold">{Number((d.quantity * d.price).toFixed(2))}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
