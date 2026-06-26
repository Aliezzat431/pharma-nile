import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, RotateCcw } from 'lucide-react';

interface OrderItem {
  id: string;
  order_id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  product_id?: string;
}

interface Order {
  id: string;
  created_at: string;
  total: number;
  status?: string;
  order_items: OrderItem[];
}

interface ConfirmReturnModalProps {
  order: Order | null;
  onClose: () => void;
  onConfirm: (order: Order) => Promise<void>;
}

export function ConfirmReturnModal({ order, onClose, onConfirm }: ConfirmReturnModalProps) {
  return (
    <AnimatePresence>
      {order && (
        <div className="fixed inset-0 bg-[#050505]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-card w-full max-w-md overflow-hidden relative border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)]"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-red-500/5">
              <h2 className="text-xl font-bold font-cairo text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> تأكيد الارتجاع
              </h2>
              <button 
                 onClick={onClose}
                 className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-foreground font-cairo leading-relaxed text-lg text-center">
                هل أنت متأكد من ارتجاع الفاتورة 
                <span className="font-bold text-[#D4AF37] mx-2">#{order.id.slice(0, 8)}</span>؟
              </p>
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-cairo text-center flex flex-col items-center gap-2">
                <RotateCcw className="w-6 h-6 opacity-80" />
                سيتم إعادة كافة الكميات المخصومة للمخزون والتراجع عن أرباح الفاتورة بالكامل.
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 flex gap-3 bg-[#050505]/50">
               <button 
                 onClick={onClose}
                 className="flex-1 py-3 rounded-xl font-cairo text-gray-400 hover:bg-white/5 transition-colors border border-white/10"
               >
                 إلغاء
               </button>
               <button 
                 onClick={() => onConfirm(order)}
                 className="flex-1 py-3 rounded-xl font-cairo text-white bg-red-500/20 border border-red-500/50 hover:bg-red-500/40 transition-colors font-bold shadow-[0_0_15px_rgba(239,68,68,0.2)]"
               >
                 تأكيد الارتجاع
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
