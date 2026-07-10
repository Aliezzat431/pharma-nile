import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/lib/api/products';

interface POSProductCardProps {
  product: Product & { activeBatches?: any[] };
  isExpanded: boolean;
  onAddToCart: (product: Product, clearSearch: boolean) => void;
  onToggleBatches: (e: React.MouseEvent, productId: string) => void;
}

export function POSProductCard({ product, isExpanded, onAddToCart, onToggleBatches }: POSProductCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-colors group hover:border-[#00CED1]/50 flex flex-col">
      <div
        onClick={() => onAddToCart(product, false)}
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 relative"
      >
        <div>
          <h3 className="font-bold text-lg text-white group-hover:text-[#00CED1] transition-colors">{product.name}</h3>
          <p className="text-sm text-gray-400 font-cairo">
            {(product as any).pharmacy_name} • {product.company} • السنتر: {product.total_quantity} {product.unit}
          </p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <span className="text-[#D4AF37] font-bold text-lg font-cairo cursor-crosshair block">
              {product.current_price} ج.م
            </span>
            <span className="text-xs text-green-500 font-cairo bg-green-500/10 px-2 py-0.5 rounded-full block mt-1">يُسحب بالأقدم</span>
          </div>

          <button
            onClick={(e) => onToggleBatches(e, product.id)}
            className={`text-gray-400 transition-transform bg-[#050505]/40 border border-white/10 p-2 rounded-lg hover:text-white ${isExpanded ? 'rotate-180' : ''}`}
            title="عرض التشغيلات المتاحة"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && product.activeBatches && product.activeBatches.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#050505]/70 border-t border-white/5 p-3 overflow-hidden"
          >
            <h4 className="text-xs text-gray-400 mb-2 font-cairo">التشغيلات المتاحة للاختيار من السلة (Batches)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-gray-500 uppercase bg-white/5 font-cairo">
                  <tr>
                    <th className="px-3 py-2 rounded-tr-lg">رقم التشغيلة</th>
                    <th className="px-3 py-2">تاريخ الانتهاء</th>
                    <th className="px-3 py-2">الكمية</th>
                    <th className="px-3 py-2 rounded-tl-lg">سعر البيع</th>
                  </tr>
                </thead>
                <tbody className="font-cairo text-gray-300">
                  {product.activeBatches.map((b: any, idx: number) => {
                    const isClosest = idx === 0;
                    return (
                      <tr key={b.id} className={`border-b border-white/5 hover:bg-white/5 ${isClosest ? 'bg-[#00CED1]/5 text-[#00CED1]' : ''}`}>
                        <td className="px-3 py-2 font-mono text-xs">{b.barcode || b.id.substring(0, 8)}</td>
                        <td className="px-3 py-2">
                          {new Date(b.expiry_date).toLocaleDateString('ar-EG')}
                          {isClosest && <span className="ml-2 text-[10px] bg-[#00CED1] text-black px-1.5 py-0.5 rounded-sm">الأقرب انتهاءً</span>}
                        </td>
                        <td className="px-3 py-2">{b.quantity}</td>
                        <td className="px-3 py-2">{b.sale_price} ج.م</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}