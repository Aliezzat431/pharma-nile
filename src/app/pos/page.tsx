'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Barcode, Trash2, CreditCard, ChevronRight, Loader2, AlertCircle, ShoppingCart, X, UserPlus, Save, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart, removeFromCart, clearCart, updateUnit, updateBatchDistribution } from '@/store/slices/posSlice';
import { Package } from 'lucide-react';
import { searchProducts, getProductByBarcode, Product } from '@/lib/api/products';
import { processCheckout } from '@/lib/api/orders';
import { typesWithUnits } from '@/lib/unitOptions';

import { undoManager } from '@/lib/undo-manager';
import dynamic from 'next/dynamic';

const LiveScanner = dynamic(() => import('@/components/shared/CameraScanner'), { ssr: false });

export default function POSTerminal() {
  const dispatch = useAppDispatch();
  const { cart, total } = useAppSelector((state) => state.pos);
  
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [batchModal, setBatchModal] = useState<{ isOpen: boolean; item: any | null }>({ isOpen: false, item: null });
  const [batchDistributions, setBatchDistributions] = useState<any[]>([]);
  
  // AI Agent dynamic windows (Iframes spawned by the AI)
  const [agentWindows, setAgentWindows] = useState<{ id: string; url: string; title: string; x?: number; y?: number }[]>([]);

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

  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  const toggleProductBatches = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation(); // prevent adding to cart
    setExpandedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  // Debounced search logic for live filtering
  useEffect(() => {
    const handleRemoteCommand = (event: MessageEvent) => {
      // Security check: only allow same origin
      if (event.origin !== window.location.origin) return;

      const { command, data } = event.data;
      if (command === 'ADD_TO_CART') {
        const product = searchResults.find(p => 
          p.name.toLowerCase().includes(data.name.toLowerCase()) || 
          p.barcode === data.barcode
        );
        if (product) {
          addProductToCart(product);
          console.log(`AI Agent added ${product.name} to cart`);
        }
      } else if (command === 'OPEN_WINDOW') {
        // The AI can spawn windows based on its vision
        setAgentWindows(prev => [
          ...prev, 
          { 
            id: data.id || Math.random().toString(36).substr(2, 9), 
            url: data.url, 
            title: data.title || 'Agent Vision',
            x: Math.random() * 100, // slight offset
            y: Math.random() * 100
          }
        ]);
      } else if (command === 'CLOSE_WINDOW') {
        setAgentWindows(prev => prev.filter(w => w.id !== data.id));
      }
    };

    window.addEventListener('message', handleRemoteCommand);
    return () => window.removeEventListener('message', handleRemoteCommand);
  }, [searchResults, cart]);

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
    if (!searchInput.trim()) return;

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
        activeBatches: product.activeBatches,
      }));
      setSearchInput('');
    }
  };

  const handleCameraScan = async (barcode: string) => {
    setSearchInput(barcode);
    setIsSearching(true);
    const product = await getProductByBarcode(barcode);
    setIsSearching(false);

    if (product) {
      addProductToCart(product);
      setSearchInput('');
    } else {
      // If no exact barcode match, put it in the search bar so text search can find it
      setSearchInput(barcode);
    }
  };

  const handleCameraScanRef = useRef(handleCameraScan);
  useEffect(() => {
    handleCameraScanRef.current = handleCameraScan;
  });

  // Global hardware barcode scanner listener
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing normally in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const currentTime = Date.now();
      
      // If time between keystrokes is > 50ms, reset buffer (differentiate human typing from scanner)
      if (currentTime - lastKeyTime > 50) {
        barcodeBuffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 3) {
           e.preventDefault();
           handleCameraScanRef.current(barcodeBuffer);
        }
        barcodeBuffer = '';
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const addProductToCart = (product: Product, clearSearch = true) => {
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
      activeBatches: product.activeBatches,
    }));
    
    if (clearSearch) {
      setSearchInput('');
    }
  };

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'debt' | 'sadqah'>('cash');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  useEffect(() => {
    if (paymentMethod === 'debt') {
      import('@/lib/api/customers').then((api) => {
        api.getCustomers().then(setCustomers);
      });
    }
  }, [paymentMethod]);

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) return;
    setIsSavingCustomer(true);
    try {
      const { addCustomer } = await import('@/lib/api/customers');
      const newCust = await addCustomer({ name: newCustomerName, phone: newCustomerPhone });
      setCustomers([...customers, newCust]);
      setSelectedCustomerId(newCust.id);
      setIsAddingCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
    } catch (e) {
      console.error(e);
      alert('فشل إضافة عميل جديد');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const executeCheckoutProcess = async (cartToProcess: any[], totalToProcess: number) => {
    setIsProcessing(true);
    try {
      // Map cart items to include costPrice for profit tracking
      const itemsWithCost = cartToProcess.map(item => ({
        ...item,
        costPrice: item.activeBatches?.[0]?.purchase_price || 0
      }));

      const result = await processCheckout(
        itemsWithCost, 
        totalToProcess, 
        paymentMethod, 
        paymentMethod === 'debt' ? selectedCustomerId : undefined
      );

      // Register for Undo
      if (result?.id) {
        undoManager.push({
          type: 'SALE',
          payload: {
            orderId: result.id,
            items: itemsWithCost
          },
          timestamp: Date.now()
        });
      }

      setCheckoutSuccess(true);
      dispatch(clearCart());
      setPaymentMethod('cash');
      setSelectedCustomerId('');
      setTimeout(() => setCheckoutSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Checkout failed. See console.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'debt' && !selectedCustomerId) {
      alert("يرجى اختيار العميل لتسجيل عملية الدين.");
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
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold font-cairo">نقطة <span className="text-[#00CED1]">البيع</span> (POS)</h1>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="glass-card px-4 py-2 text-sm text-gray-300 flex items-center justify-center gap-2 font-cairo w-full md:w-auto">
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
            type="text" 
            placeholder="ابحث عن منتج أو امسح الباركود..."
            className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-gray-500 py-3 font-cairo"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoFocus
          />
        </form>

        {/* Live Barcode Scanner - Always On */}
        <LiveScanner onScan={handleCameraScan} />

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

          <div className="flex flex-col gap-4">
            {searchResults.map((product) => {
              const isExpanded = expandedProductIds.has(product.id);
              
              return (
                <div 
                  key={product.id} 
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-colors group hover:border-[#00CED1]/50 flex flex-col"
                >
                  {/* Header (Click to quick-add with default FEFO) */}
                  <div 
                    onClick={() => addProductToCart(product, false)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 relative"
                  >
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-[#00CED1] transition-colors">{product.name}</h3>
                      <p className="text-sm text-gray-400 font-cairo">{product.company} • السنتر: {product.total_quantity} {product.unit}</p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[#D4AF37] font-bold text-lg font-cairo cursor-crosshair block">{product.current_price} ج.م</span>
                        <span className="text-xs text-green-500 font-cairo bg-green-500/10 px-2 py-0.5 rounded-full block mt-1">يُسحب بالأقدم</span>
                      </div>
                      
                      <button 
                        onClick={(e) => toggleProductBatches(e, product.id)}
                        className={`text-gray-400 transition-transform bg-[#050505]/40 border border-white/10 p-2 rounded-lg hover:text-white ${isExpanded ? 'rotate-180' : ''}`}
                        title="عرض التشغيلات المتاحة"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* Batches Table Detail */}
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
                                    <td className="px-3 py-2">{b.selling_price} ج.م</td>
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
            })}
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
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-sm text-[#00CED1] font-cairo flex gap-2" dir="ltr">
                        <span>{item.quantity}</span>
                        <span>x</span>
                        <span>{item.price} ج.م</span>
                      </span>
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
                        className="bg-[#050505]/50 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white outline-none font-cairo focus:border-[#00CED1]/50"
                      >
                        {item.availableUnits?.map((u: string) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 z-10">
                    <span className="font-bold text-white text-lg font-cairo ml-2">{item.price * item.quantity} ج.م</span>
                    <button 
                      onClick={() => {
                        setBatchModal({ isOpen: true, item });
                        setBatchDistributions(item.batchDistributions || []);
                      }}
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
            
            {/* Payment Method Selector */}
            <div className="mb-6 space-y-3">
              <label className="text-xs text-gray-500 font-cairo block mr-1">طريقة الدفع</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 rounded-lg text-xs font-cairo border transition-all ${paymentMethod === 'cash' ? 'bg-[#00CED1]/20 border-[#00CED1] text-[#00CED1]' : 'border-white/5 bg-white/5 text-gray-400'}`}
                >نقدي</button>
                <button 
                  onClick={() => setPaymentMethod('debt')}
                  className={`py-2 rounded-lg text-xs font-cairo border transition-all ${paymentMethod === 'debt' ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]' : 'border-white/5 bg-white/5 text-gray-400'}`}
                >دين</button>
                <button 
                  onClick={() => setPaymentMethod('sadqah')}
                  className={`py-2 rounded-lg text-xs font-cairo border transition-all ${paymentMethod === 'sadqah' ? 'bg-[#FF69B4]/20 border-[#FF69B4] text-[#FF69B4]' : 'border-white/5 bg-white/5 text-gray-400'}`}
                >صدقة</button>
              </div>
            </div>

            {/* Customer Selection (if Debt) */}
            <AnimatePresence>
              {paymentMethod === 'debt' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-500 font-cairo block mr-1">اختر أو أضف عميل</label>
                    <button 
                      onClick={() => setIsAddingCustomer(!isAddingCustomer)}
                      className="text-xs flex items-center gap-1 text-[#D4AF37] hover:text-[#f2cd56] transition-colors font-cairo"
                    >
                      {isAddingCustomer ? <X className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                      {isAddingCustomer ? 'إلغاء' : 'إضافة عميل جديد'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isAddingCustomer ? (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-3 rounded-xl mb-3 space-y-3"
                      >
                        <input 
                          type="text" 
                          placeholder="اسم العميل"
                          value={newCustomerName}
                          onChange={e => setNewCustomerName(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none font-cairo focus:border-[#D4AF37]/50"
                        />
                        <input 
                          type="text" 
                          placeholder="رقم الهاتف (اختياري)"
                          value={newCustomerPhone}
                          onChange={e => setNewCustomerPhone(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none font-cairo focus:border-[#D4AF37]/50"
                        />
                        <button 
                          onClick={handleCreateCustomer}
                          disabled={!newCustomerName.trim() || isSavingCustomer}
                          className="w-full py-2 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 border border-[#D4AF37]/30 flex items-center justify-center gap-2 font-bold font-cairo disabled:opacity-50 transition-colors"
                        >
                          {isSavingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          حفظ وتحديد
                        </button>
                      </motion.div>
                    ) : (
                      <select 
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none font-cairo focus:border-[#D4AF37]/50"
                      >
                        <option value="" className="bg-[#050505]">-- اختر العميل --</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id} className="bg-[#050505]">{c.name} (دين: {c.total_debt} ج.م)</option>
                        ))}
                      </select>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center mb-6 font-cairo">
              <span className="text-gray-400 text-lg">الإجمالي</span>
              <span className={`text-4xl font-bold ${paymentMethod === 'sadqah' ? 'text-[#FF69B4]' : 'text-[#D4AF37]'}`}>{total} ج.م</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 font-cairo
                ${cart.length > 0 && !isProcessing
                  ? paymentMethod === 'sadqah' 
                    ? 'bg-gradient-to-r from-[#FF69B4] to-[#f54291] text-white hover:shadow-[0_0_25px_rgba(255,105,180,0.5)] scale-100 hover:scale-[1.02]'
                    : 'bg-gradient-to-r from-[#00CED1] to-[#009b9e] text-white hover:shadow-[0_0_25px_rgba(0,206,209,0.5)] scale-100 hover:scale-[1.02]' 
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <CreditCard className="w-6 h-6" />} 
              {isProcessing ? 'جاري المعالجة...' : paymentMethod === 'sadqah' ? 'إتمام عملية الصدقة' : 'إتمام عملية البيع'}
              {!isProcessing && <ChevronRight className="w-5 h-5 mr-auto" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {batchModal.isOpen && batchModal.item && (
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
                  <p className="text-sm font-cairo text-gray-400 mt-1">{batchModal.item.name} - الكمية المطلوبة: {batchModal.item.quantity}</p>
                </div>
                <button 
                   onClick={() => setBatchModal({ isOpen: false, item: null })}
                   className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                {batchModal.item.activeBatches?.length ? (
                  batchModal.item.activeBatches.map((b: any) => {
                    const existingDist = batchDistributions.find(d => d.batchId === b.id);
                    const assignedVal = existingDist ? existingDist.quantity : 0;
                    
                    return (
                      <div key={b.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                        <div>
                          <p className="text-gray-300 font-cairo font-bold">انتهاء: {new Date(b.expiry_date).toLocaleDateString('ar-EG')}</p>
                          <p className="text-sm text-gray-500 font-cairo mt-1">الكمية المتاحة: {b.quantity} | السعر: {b.selling_price} ج.م</p>
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
                               setBatchDistributions([...otherDists, { batchId: b.id, quantity: val, price: b.selling_price, expiry: b.expiry_date }]);
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
                   const target = batchModal.item.quantity;
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
                   onClick={() => setBatchModal({ isOpen: false, item: null })}
                   className="flex-1 py-3 rounded-xl font-cairo text-gray-400 hover:bg-white/5 transition-colors border border-white/10"
                 >
                   إلغاء
                 </button>
                 <button 
                   onClick={() => {
                     const totalDist = batchDistributions.reduce((acc, curr) => acc + curr.quantity, 0);
                     if (totalDist > batchModal.item.quantity) {
                       alert("الكمية الموزعة لا يجب أن تتجاوز الكمية المطلوبة للمنتج في السلة.");
                       return;
                     }
                     dispatch(updateBatchDistribution({ id: batchModal.item.id, distributions: batchDistributions }));
                     setBatchModal({ isOpen: false, item: null });
                   }}
                   className="flex-1 py-3 rounded-xl font-cairo text-white bg-[#00CED1]/20 border border-[#00CED1]/50 hover:bg-[#00CED1]/40 transition-colors font-bold"
                 >
                   حفظ التوزيع
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Floating Copilot Button */}
      <button 
        onClick={() => setIsCopilotOpen(!isCopilotOpen)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#f2cd56] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-110 transition-transform z-50 flex items-center justify-center font-bold"
        title="المساعد الذكي (Copilot)"
      >
        {isCopilotOpen ? <X className="w-8 h-8" /> : <Bot className="w-8 h-8" />}
      </button>

      {/* Copilot Iframe Modal/Widget */}
      <AnimatePresence>
        {isCopilotOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 left-6 w-[400px] h-[600px] max-h-[80vh] bg-[#050505]/95 border border-[#D4AF37]/30 rounded-2xl shadow-2xl overflow-hidden z-[60] flex flex-col backdrop-blur-xl"
          >
            <div className="bg-[#D4AF37]/10 border-b border-[#D4AF37]/20 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold font-cairo text-[#D4AF37] flex items-center gap-2"><Bot className="w-5 h-5"/> المساعد الذكي</h3>
              <button onClick={() => setIsCopilotOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe 
              src="/copilot" 
              className="w-full flex-1 border-none bg-transparent"
              title="Pharmanile Copilot"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Agent Visual Workspaces (Draggable Windows) */}
      <AnimatePresence>
        {agentWindows.map((win) => (
          <motion.div 
            key={win.id}
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, x: win.x, y: win.y }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-20 left-1/4 w-[600px] h-[500px] bg-[#050505]/95 border border-[#00CED1]/50 shadow-[0_0_30px_rgba(0,206,209,0.2)] rounded-xl overflow-hidden z-[55] flex flex-col backdrop-blur-xl"
            style={{ position: 'fixed' }}
          >
            <div className="bg-[#00CED1]/10 border-b border-[#00CED1]/20 px-4 py-3 flex items-center justify-between cursor-move grab-active">
              <h3 className="font-bold font-cairo text-white flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-[#00CED1] animate-pulse"></div>
                {win.title}
              </h3>
              <button 
                onClick={() => setAgentWindows(prev => prev.filter(w => w.id !== win.id))} 
                className="text-gray-400 hover:text-red-400 transition-colors"
                onPointerDown={(e) => e.stopPropagation()} // Prevent dragging when clicking close
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe 
              src={win.url} 
              className="w-full flex-1 border-none bg-transparent"
              title={win.title}
            />
          </motion.div>
        ))}
      </AnimatePresence>

    </div>
  );
}
