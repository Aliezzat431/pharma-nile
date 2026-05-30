'use client';

import { useState, useEffect } from 'react';
import { Search, Barcode, Trash2, CreditCard, ChevronRight, Loader2, AlertCircle, ShoppingCart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart, removeFromCart, clearCart, updateUnit } from '@/store/slices/posSlice';
import { searchProducts, getProductByBarcode, Product } from '@/lib/api/products';
import { processCheckout } from '@/lib/api/orders';
import { typesWithUnits } from '@/lib/unitOptions';
import { useAuth } from '@/hooks/useAuth';

export default function POSTerminal() {
  const dispatch = useAppDispatch();
  const { cart, total } = useAppSelector((state) => state.pos);
  const { activeShift } = useAuth();
  
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Custom Pills Modal State
  const [pillsModal, setPillsModal] = useState<{
    isOpen: boolean;
    type: 'UNIT_CHANGE' | 'CHECKOUT' | null;
    items: any[];
    currentIndex: number;
    pendingTargetUnit?: string;
    pendingCart?: any[];
  }>({
    isOpen: false,
    type: null,
    items: [],
    currentIndex: 0,
  });
  const [pillsInput, setPillsInput] = useState('10');

  // Debounced search logic for live filtering
  useEffect(() => {
    const fetchResults = async () => {
      if (searchInput.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await searchProducts(searchInput);
        setSearchResults(results as unknown as Product[]);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // Handle direct barcode scanner input
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim() || !activeShift) return;

    setIsSearching(true);
    const product = await getProductByBarcode(searchInput.trim());
    setIsSearching(false);

    if (product) {
      const units = typesWithUnits[product.type] || ['علبة'];
      
      dispatch(addToCart({
        id: product.id,
        name: product.name,
        basePrice: product.current_price || 0,
        price: product.current_price || 0,
        quantity: 1,
        unit: 'علبة',
        availableUnits: units,
        unitConversion: product.unit_conversion || 1,
      }));
      setSearchInput('');
    }
  };

  const addProductToCart = (product: Product) => {
    if (product.current_price === undefined || product.current_price === 0) {
      alert("منتج بدون سعر أو رصيد مخزني.");
      return;
    }
    
    const units = typesWithUnits[product.type] || ['علبة'];

    dispatch(addToCart({
      id: product.id,
      name: product.name,
      basePrice: product.current_price,
      price: product.current_price,
      quantity: 1,
      unit: 'علبة',
      availableUnits: units,
      unitConversion: product.unit_conversion || 1,
    }));
    setSearchInput(''); 
  };

  const executeCheckoutProcess = async (cartToProcess: any[], totalToProcess: number) => {
    setIsProcessing(true);
    try {
      await processCheckout(cartToProcess, totalToProcess, activeShift!.id);
      setCheckoutSuccess(true);
      dispatch(clearCart());
      setTimeout(() => setCheckoutSuccess(false), 3000);
    } catch (e) {
      alert("Checkout failed. See console.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !activeShift) return;
    
    // Check for small units
    const smallUnitItems = cart.filter(item => ["قرص", "كبسولة", "قطعة", "لبوسة"].includes(item.unit));
    
    if (smallUnitItems.length > 0) {
       setPillsModal({
         isOpen: true,
         type: 'CHECKOUT',
         items: smallUnitItems,
         currentIndex: 0,
         pendingCart: cart,
       });
       setPillsInput((smallUnitItems[0].customPills || 10).toString());
       return; 
    }

    executeCheckoutProcess(cart, total);
  };

  const handlePillsConfirm = () => {
    const val = Number(pillsInput);
    if (isNaN(val) || val <= 0) return;

    if (pillsModal.type === 'UNIT_CHANGE') {
      const item = pillsModal.items[0];
      const targetUnit = pillsModal.pendingTargetUnit;
      if (targetUnit) {
         dispatch(updateUnit({ id: item.id, unit: targetUnit, customPills: val }));
      }
      setPillsModal({ ...pillsModal, isOpen: false });
    } else if (pillsModal.type === 'CHECKOUT') {
      const currentItem = pillsModal.items[pillsModal.currentIndex];
      
      dispatch(updateUnit({ id: currentItem.id, unit: currentItem.unit, customPills: val }));
      
      const updatedCart = pillsModal.pendingCart!.map(c => {
         if (c.id === currentItem.id) {
           const multi = (c.unitConversion || 1) * val;
           return { ...c, customPills: val, price: Number((c.basePrice / multi).toFixed(2)) };
         }
         return c;
      });

      if (pillsModal.currentIndex + 1 < pillsModal.items.length) {
        const nextItem = pillsModal.items[pillsModal.currentIndex + 1];
        setPillsModal({
          ...pillsModal,
          currentIndex: pillsModal.currentIndex + 1,
          pendingCart: updatedCart
        });
        setPillsInput((nextItem.customPills || 10).toString());
      } else {
        setPillsModal({ ...pillsModal, isOpen: false });
        const newTotal = updatedCart.reduce((sum, c) => sum + c.price * c.quantity, 0);
        executeCheckoutProcess(updatedCart, newTotal);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      
      {/* Left side - Product Search & Input */}
      <div className="flex-1 flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-cairo">نقطة <span className="text-[#00CED1]">البيع</span> (POS)</h1>
          <div className="flex gap-4">
            {!activeShift && (
               <div className="glass-card px-4 py-2 text-sm text-red-400 flex items-center gap-2 border-red-500/20 font-cairo">
                 <AlertCircle className="w-4 h-4" /> يرجى فتح وردية أولاً
               </div>
            )}
            <div className="glass-card px-4 py-2 text-sm text-gray-300 flex items-center gap-2 font-cairo">
              <Barcode className="w-4 h-4 text-[#00CED1]" /> الماسح جاهز
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <form onSubmit={handleBarcodeSubmit} className="glass-panel p-2 flex items-center gap-3 relative">
          <div className="pl-3 text-gray-400">
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin text-[#00CED1]" /> : <Search className="w-5 h-5" />}
          </div>
          <input 
            disabled={!activeShift}
            type="text" 
            placeholder={activeShift ? "ابحث عن منتج أو امسح الباركود..." : "يرجى فتح الوردية للبدء في البيع"}
            className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-gray-500 py-3 font-cairo"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoFocus
          />
        </form>

        {/* Search Results / Products Area */}
        <div className="flex-1 glass-card p-6 overflow-y-auto relative">
          <h2 className="text-lg font-medium text-gray-400 mb-4 border-b border-white/10 pb-2 font-cairo">
            {searchInput.length >= 2 ? 'نتائج البحث' : 'قائمة المنتجات'}
          </h2>
          
          {searchInput.length >= 2 && searchResults.length === 0 && !isSearching && (
             <div className="flex flex-col items-center justify-center p-10 text-gray-500 gap-3">
                <AlertCircle className="w-10 h-10 text-yellow-500/50" />
                <p className="font-cairo">لا توجد نتائج لـ "{searchInput}"</p>
             </div>
          )}

          <div className="flex flex-col gap-3">
            {searchResults.map((product) => (
              <div 
                key={product.id} 
                onClick={() => activeShift && addProductToCart(product)}
                className={`bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between transition-colors group ${activeShift ? 'hover:bg-white/10 cursor-pointer hover:border-[#00CED1]/50' : 'opacity-50 cursor-not-allowed'}`}
              >
                <div>
                  <h3 className="font-bold text-lg text-white group-hover:text-[#00CED1] transition-colors">{product.name}</h3>
                  <p className="text-sm text-gray-400 font-cairo">{product.company} • المخزن: {product.total_quantity} {product.unit}</p>
                </div>
                <div className="text-right">
                  <span className="text-[#D4AF37] font-bold text-lg font-cairo">{product.current_price} ج.م</span>
                  <span className="block text-xs text-gray-500 font-cairo">لكل {product.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {searchInput.length < 2 && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                 <p className="text-gray-400 text-lg font-cairo">ابدأ البحث لعرض المنتجات من قاعدة البيانات...</p>
             </div>
          )}
        </div>
      </div>

      {/* Right side - Cart & Checkout */}
      <div className="w-full md:w-[450px] flex flex-col gap-6">
        <div className="glass-panel flex-1 p-0 overflow-hidden flex flex-col relative">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-xl font-bold font-cairo">طلب البيع الحالي</h2>
            {cart.length > 0 && (
              <button 
                onClick={() => dispatch(clearCart())}
                className="text-xs text-red-400 hover:text-red-300 transition-colors font-cairo"
              >
                مسح السلة
              </button>
            )}
          </div>
          
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-2">
            <AnimatePresence>
              {cart.map((item: any) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 mx-2 my-2 glass-card flex justify-between items-center group relative overflow-hidden"
                >
                  <div className="z-10 flex-1">
                    <h3 className="font-semibold text-white truncate max-w-[200px] font-cairo">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-[#00CED1] font-cairo">{item.quantity} x {item.price} ج.م</span>
                      <select 
                        value={item.unit}
                        onChange={(e) => {
                          const newUnit = e.target.value;
                          if (["قرص", "كبسولة", "قطعة", "لبوسة"].includes(newUnit)) {
                             setPillsModal({
                               isOpen: true,
                               type: 'UNIT_CHANGE',
                               items: [item],
                               currentIndex: 0,
                               pendingTargetUnit: newUnit,
                             });
                             setPillsInput((item.customPills || 10).toString());
                          } else {
                             dispatch(updateUnit({ id: item.id, unit: newUnit }));
                          }
                        }}
                        className="bg-[#050505]/50 border border-white/10 rounded px-1 py-0.5 text-xs text-white outline-none font-cairo"
                      >
                        {item.availableUnits?.map((u: string) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 z-10">
                    <span className="font-bold text-white text-lg font-cairo">{item.price * item.quantity} ج.م</span>
                    <button 
                      onClick={() => dispatch(removeFromCart(item.id))}
                      className="text-gray-500 hover:text-red-400 transition-colors bg-white/5 p-2 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute left-0 top-0 w-1 h-full bg-[#00CED1] opacity-50"></div>
                </motion.div>
              ))}
            </AnimatePresence>

            {cart.length === 0 && !checkoutSuccess && (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 p-6 text-center">
                  <ShoppingCart className="w-16 h-16 mb-4" />
                  <p className="font-cairo">السلة فارغة. ابحث عن منتج للبدء.</p>
              </div>
            )}

            {checkoutSuccess && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]/95 backdrop-blur-md z-20"
              >
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white font-cairo">تمت عملية البيع بنجاح</h2>
                <p className="text-gray-400 font-cairo">جاري طباعة الفاتورة والبدء في طلب جديد...</p>
              </motion.div>
            )}
          </div>

          {/* Checkout Section */}
          <div className="p-6 bg-[#050505]/80 border-t border-white/10 backdrop-blur-md">
            <div className="flex justify-between items-center mb-6 font-cairo">
              <span className="text-gray-400 text-lg">الإجمالي</span>
              <span className="text-4xl font-bold text-[#D4AF37]">{total} ج.م</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing || !activeShift}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 font-cairo
                ${cart.length > 0 && !isProcessing && activeShift
                  ? 'bg-gradient-to-r from-[#00CED1] to-[#009b9e] text-white hover:shadow-[0_0_25px_rgba(0,206,209,0.5)] scale-100 hover:scale-[1.02]' 
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <CreditCard className="w-6 h-6" />} 
              {isProcessing ? 'جاري المعالجة...' : 'إتمام عملية البيع'}
              {!isProcessing && <ChevronRight className="w-5 h-5 mr-auto" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {pillsModal.isOpen && (
          <div className="fixed inset-0 bg-[#050505]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md overflow-hidden relative border border-[#00CED1]/30"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h2 className="text-xl font-bold font-cairo text-white">تأكيد كمية الوحدة</h2>
                <button 
                   onClick={() => setPillsModal({ ...pillsModal, isOpen: false })}
                   className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-300 font-cairo mb-6 leading-relaxed">
                  {pillsModal.type === 'UNIT_CHANGE' 
                    ? `أنت تحاول تغيير الوحدة إلى "${pillsModal.pendingTargetUnit}" للمنتج "${pillsModal.items[0]?.name}".`
                    : `عملية الدفع تتطلب تأكيد كمية وحدة "${pillsModal.items[pillsModal.currentIndex]?.unit}" للمنتج "${pillsModal.items[pillsModal.currentIndex]?.name}".`
                  }
                  <br/><br/>
                  كم <strong>{pillsModal.type === 'UNIT_CHANGE' ? pillsModal.pendingTargetUnit : pillsModal.items[pillsModal.currentIndex]?.unit}</strong> في الشريط الواحد؟
                </p>
                
                <div className="flex items-center gap-4 mb-2">
                  <input 
                    type="number"
                    value={pillsInput}
                    onChange={(e) => setPillsInput(e.target.value)}
                    className="w-full bg-[#050505]/50 border border-white/20 rounded-xl px-4 py-3 text-2xl text-center text-[#00CED1] font-bold outline-none focus:border-[#00CED1] transition-colors"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handlePillsConfirm()}
                  />
                </div>
                
                {pillsModal.type === 'CHECKOUT' && pillsModal.items.length > 1 && (
                   <div className="text-xs text-gray-500 font-cairo text-center mt-4 bg-white/5 py-1 px-3 rounded-full inline-block mx-auto">
                     منتج {pillsModal.currentIndex + 1} من {pillsModal.items.length}
                   </div>
                )}
              </div>
              
              <div className="p-4 border-t border-white/10 flex gap-3 bg-[#050505]/50">
                 <button 
                   onClick={() => setPillsModal({ ...pillsModal, isOpen: false })}
                   className="flex-1 py-3 rounded-xl font-cairo text-gray-400 hover:bg-white/5 transition-colors border border-white/10"
                 >
                   إلغاء
                 </button>
                 <button 
                   onClick={handlePillsConfirm}
                   className="flex-1 py-3 rounded-xl font-cairo text-white bg-[#00CED1]/20 border border-[#00CED1]/50 hover:bg-[#00CED1]/40 transition-colors font-bold"
                 >
                   تأكيد
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
