'use client';

import { motion } from 'framer-motion';
import { Printer, RefreshCw, CheckCircle2, ChevronLeft, CreditCard, HeartHandshake, ShieldCheck } from 'lucide-react';
import { undoManager } from '@/lib/undo-manager';
import { useAppDispatch } from '@/store/hooks';
import { addToCart, clearCart } from '@/store/slices/posSlice';

interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  unitConversion?: number;
  activeBatches?: any[];
}

interface VirtualReceiptProps {
  isOpen: boolean;
  orderId: string;
  items: ReceiptItem[];
  total: number;
  paymentMethod: 'cash' | 'debt' | 'sadqah';
  customerName?: string;
  onClose: () => void;
}

export function VirtualReceipt({
  isOpen,
  orderId,
  items,
  total,
  paymentMethod,
  customerName,
  onClose
}: VirtualReceiptProps) {
  const dispatch = useAppDispatch();

  if (!isOpen) return null;

  // Handle Instant Rollback/Undo and put items back to card
  const handleUndoAndEdit = async () => {
    const confirmUndo = window.confirm('هل تريد إلغاء هذه العملية وإرجاع المنتجات إلى السلة للتعديل؟');
    if (!confirmUndo) return;

    try {
      const result = await undoManager.undo();
      if (result.success) {
        // Clear current cart just in case
        dispatch(clearCart());
        
        // Put all items back into Redux Cart
        items.forEach(item => {
          dispatch(addToCart({
            id: item.id,
            name: item.name,
            basePrice: item.price, // Keep final checkout price
            price: item.price,
            quantity: item.quantity,
            unit: item.unit,
            availableUnits: [item.unit],
            unitConversion: item.unitConversion || 1,
            activeBatches: item.activeBatches || [],
          }));
        });

        alert('تم التراجع عن الفاتورة بنجاح وإعادة المنتجات إلى السلة.');
        onClose();
      } else {
        alert(result.message || 'فشل التراجع عن الفاتورة.');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء محاولة التراجع.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const methodLabel = {
    cash: 'نقدي (Cash)',
    debt: `آجل/دين (${customerName || 'عميل آجل'})`,
    sadqah: 'معونة/صدقة (Sadqah)'
  }[paymentMethod];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-300">
      
      {/* Printable Area - Hidden on screen, shown strictly in @media print */}
      <div id="printable-receipt" className="hidden print:block bg-white text-black p-4 w-[80mm] text-xs font-mono">
        <div className="text-center font-bold text-sm mb-1">صيدلية النيل Premium</div>
        <div className="text-center text-[10px] mb-2 font-sans">بوابة النيل للخدمات الطبية</div>
        <div className="border-b border-dashed border-black/40 my-2"></div>
        
        <div className="space-y-1 mb-2 font-sans">
          <p>رقم الفاتورة: <span className="font-bold">{orderId.slice(0, 8)}</span></p>
          <p>التاريخ: {new Date().toLocaleString('ar-EG')}</p>
          <p>طريقة الدفع: {methodLabel}</p>
        </div>

        <div className="border-b border-dashed border-black/40 my-2"></div>

        <table className="w-full text-[11px] font-sans">
          <thead>
            <tr className="border-b border-black text-right">
              <th className="py-1">المنتج</th>
              <th className="text-center py-1">الكمية</th>
              <th className="text-left py-1">السعر</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-black/10">
                <td className="py-1 leading-tight">{item.name} <span className="text-[9px] text-gray-700">({item.unit})</span></td>
                <td className="text-center py-1 font-bold">{item.quantity}</td>
                <td className="text-left py-1">{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-b border-dashed border-black/40 my-2"></div>

        <div className="flex justify-between items-center text-sm font-bold font-sans">
          <span>الإجمالي النهائي</span>
          <span>{total.toFixed(2)} ج.م</span>
        </div>

        <div className="border-b border-dashed border-black/40 my-2"></div>
        <div className="text-center font-sans text-[10px] mt-4">
          <p>شكراً لتعاملكم معنا🩺</p>
          <p>صيدلية النيل ترجو لكم الشفاء العاجل دائمًا</p>
        </div>
      </div>

      {/* Screen Mode Render Card */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-center w-full max-w-4xl relative print:hidden">
        
        {/* Left Side: Virtual Receipt Paper Roll Simulation */}
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="relative w-full max-w-[370px] bg-gradient-to-b from-[#fbfbfa] via-[#f7f7f4] to-[#f2f2ed] text-zinc-900 rounded-lg shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-white/20 select-none overflow-hidden"
          style={{
            // Tear edge saw effect (pure styled top and bottom borders helper)
            clipPath: 'polygon(0% 0%, 5% 2%, 10% 0%, 15% 2%, 20% 0%, 25% 2%, 30% 0%, 35% 2%, 40% 0%, 45% 2%, 50% 0%, 55% 2%, 60% 0%, 65% 2%, 70% 0%, 75% 2%, 80% 0%, 85% 2%, 90% 0%, 95% 2%, 100% 0%, 100% 98%, 95% 100%, 90% 98%, 85% 100%, 80% 98%, 75% 100%, 70% 98%, 65% 100%, 60% 98%, 55% 100%, 50% 98%, 45% 100%, 40% 98%, 35% 100%, 30% 98%, 25% 100%, 20% 98%, 15% 100%, 10% 98%, 5% 100%, 0% 98%)',
          }}
        >
          {/* Top Paper header ribbon */}
          <div className="h-3 bg-gradient-to-r from-[#D4AF37] to-[#f2cd56]"></div>
          
          <div className="p-6 font-mono text-xs text-zinc-800 space-y-4">
            
            {/* Pharmacy branding logo */}
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold font-cairo text-zinc-950 flex items-center justify-center gap-2">
                🩺 صيدلية النيل
              </h3>
              <p className="text-[10px] text-zinc-500 font-cairo">Pharma Egypt Premium OS</p>
              <p className="text-[9px] text-zinc-400">فرع القاهرة - الساحل</p>
            </div>

            {/* Dash border separator */}
            <div className="border-b border-dashed border-zinc-300 my-1"></div>

            {/* Metadatas */}
            <div className="space-y-1.5 font-cairo text-[11px] text-zinc-600">
              <div className="flex justify-between">
                <span>رقم الفاتورة:</span>
                <span className="font-bold text-zinc-950 font-sans">{orderId.slice(0, 13)}</span>
              </div>
              <div className="flex justify-between">
                <span>التاريخ والوقت:</span>
                <span className="text-zinc-700 font-sans">{new Date().toLocaleString('ar-EG')}</span>
              </div>
              <div className="flex justify-between">
                <span>طريقة الدفع:</span>
                <span className="font-semibold text-zinc-950">{methodLabel}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-zinc-300 my-1"></div>

            {/* Receipt checkout listing */}
            <div className="space-y-3 font-cairo">
              <div className="flex justify-between font-bold text-zinc-950 text-[11px] pb-1 border-b border-zinc-200">
                <span className="w-1/2 text-right">المنتج</span>
                <span className="w-1/4 text-center">الكمية</span>
                <span className="w-1/4 text-left">القيمة</span>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px] text-zinc-800 leading-tight">
                    <span className="w-1/2 text-right text-zinc-950 font-semibold">
                      {item.name}
                      <span className="block text-[9px] font-normal text-zinc-500">({item.unit})</span>
                    </span>
                    <span className="w-1/4 text-center font-bold text-zinc-950 font-sans">{item.quantity}</span>
                    <span className="w-1/4 text-left font-sans font-medium">{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-dashed border-zinc-300 my-1"></div>

            {/* Total value info */}
            <div className="flex justify-between items-center py-1 font-cairo">
              <span className="text-sm font-bold text-zinc-950">الإجمالي النهائي:</span>
              <span className="text-xl font-black text-emerald-700 font-sans">{total.toFixed(2)} ج.م</span>
            </div>

            <div className="border-b border-dashed border-zinc-300 my-1"></div>

            {/* Receipt footer message */}
            <div className="text-center font-cairo text-[10px] text-zinc-400 space-y-1 py-1">
              <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>عملية دفع ناجحة ومعتمدة</span>
              </div>
              <p>نسأل الله لكم دوام الصحة والعافية</p>
            </div>
            
          </div>
          
          {/* Bottom Tear margin spacer */}
          <div className="h-6 bg-gradient-to-t from-zinc-200 to-transparent"></div>
        </motion.div>

        {/* Right Side: Interactive Action Buttons Panel */}
        <div className="flex flex-col gap-4 w-full max-w-[320px] font-cairo">
          
          <div className="text-right space-y-2 mb-2">
            <h2 className="text-2xl font-bold text-white flex items-center justify-start gap-2">
              <ShieldCheck className="w-7 h-7 text-[#00CED1]" /> تم تسجيل الفاتورة!
            </h2>
            <p className="text-zinc-400 text-sm">
              تم إرسال الطلب بنجاح إلى النظام السحابي وتحديث الأرصدة والتشغيلات. اختر إجراء لمتابعة العمل.
            </p>
          </div>

          {/* PRINT BUTTON */}
          <button
            onClick={handlePrint}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#00CED1] to-[#00a2a5] text-white font-bold hover:shadow-[0_0_20px_rgba(0,206,209,0.4)] flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 group"
          >
            <Printer className="w-5 h-5 group-hover:animate-bounce" />
            <span>طباعة الفاتورة الفورية (Ctrl+P)</span>
          </button>

          {/* UNDO / EDIT BUTTON */}
          <button
            onClick={handleUndoAndEdit}
            className="w-full py-3.5 px-6 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/45 text-[#D4AF37] font-semibold hover:bg-[#D4AF37]/25 flex items-center justify-center gap-3 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إلغاء البيع وإرجاع المنتجات للسلة</span>
          </button>

          <div className="h-[1px] bg-white/10 my-1"></div>

          {/* NEW SALE / CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="w-full py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 flex items-center justify-center gap-2 transition-colors"
          >
            <span>متابعة معاملة جديدة</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
          
        </div>
        
      </div>

      {/* Global CSS injection block to isolate printable ticket layout correctly */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 5mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      
    </div>
  );
}
