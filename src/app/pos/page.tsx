'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Barcode, Trash2, CreditCard, ChevronRight, Loader2, AlertCircle, ShoppingCart, X, UserPlus, Save, Bot, FileText, Upload, Pill, CheckCircle2, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart, removeFromCart, clearCart, updateUnit, updateQuantity, updateBatchDistribution } from '@/store/slices/posSlice';
import { Package } from 'lucide-react';
import { searchProducts, getProductByBarcode, Product } from '@/lib/api/products';
import { processCheckout } from '@/lib/api/orders';
import { typesWithUnits } from '@/lib/unitOptions';
import { analyzeProduct } from '@/lib/api/ai'; // Import the new AI helper

import { undoManager } from '@/lib/undo-manager';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema } from '@/lib/validations';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { POSHeader } from './components/POSHeader';
import { POSProductCard } from './components/POSProductCard';
import { POSCartItem } from './components/POSCartItem';
import { BatchDistributionModal } from './components/BatchDistributionModal';
import { PillsConfirmModal } from './components/PillsConfirmModal';
import { POSRecommendations } from './components/POSRecommendations';
import { usePreferences } from '@/hooks/usePreferences';

const LiveScanner = dynamic(() => import('@/components/shared/CameraScanner'), { ssr: false });

export default function POSTerminal() {
  const { user } = useAuth();
  const pharmacyId = user?.user_metadata?.pharmacy_id;

  const dispatch = useAppDispatch();
  const { cart, total } = useAppSelector((state) => state.pos);
  const { preferences } = usePreferences();

  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [batchModal, setBatchModal] = useState<{ isOpen: boolean; item: any | null }>({ isOpen: false, item: null });
  const [batchDistributions, setBatchDistributions] = useState<any[]>([]);

  const [agentWindows, setAgentWindows] = useState<{ id: string; url: string; title: string; x?: number; y?: number }[]>([]);

  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

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
  const [showRecommendations, setShowRecommendations] = useState(false);

  const toggleProductBatches = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation(); // prevent adding to cart
    setExpandedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleAskAI = async () => {
    if (!searchInput.trim()) return;
    setIsAiLoading(true);
    setAiSuggestions([]);
    try {
      const data = await analyzeProduct(searchInput);
      setAiSuggestions(data.choices || []);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "فشل الاتصال بالمساعد الذكي");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddAiSuggestion = (choice: any, price: number) => {
    const units = typesWithUnits[choice.type] || ['علبة'];
    dispatch(addToCart({
      id: `ai-${Date.now()}-${Math.random()}`, // Temporary ID for cart
      name: choice.name,
      basePrice: price,
      price: price,
      quantity: 1,
      unit: 'علبة',
      availableUnits: units,
      unitConversion: choice.unit_conversion || 1,
      activeBatches: [],
    }));
    setAiSuggestions([]);
    setSearchInput('');
  };

  useEffect(() => {
    const handleRemoteCommand = (event: MessageEvent) => {

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
      if (!pharmacyId) return;
      if (searchInput.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await searchProducts(searchInput, pharmacyId);
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

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacyId || !searchInput.trim()) return;

    setIsSearching(true);
    const product = await getProductByBarcode(searchInput.trim(), pharmacyId);
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
    if (!pharmacyId) return;
    setSearchInput(barcode);
    setIsSearching(true);
    const product = await getProductByBarcode(barcode, pharmacyId);
    setIsSearching(false);

    if (product) {
      addProductToCart(product);
      setSearchInput('');
    } else {

      setSearchInput(barcode);
    }
  };

  const handleCameraScanRef = useRef(handleCameraScan);
  useEffect(() => {
    handleCameraScanRef.current = handleCameraScan;
  });

  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const currentTime = Date.now();

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
  const [showSadqahOption, setShowSadqahOption] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');

  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  type POSCustomerFormValues = z.infer<typeof customerSchema>;
  const { register: registerCustomer, handleSubmit: handleSubmitCustomer, formState: { errors: customerErrors }, reset: resetCustomer } = useForm<POSCustomerFormValues>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: { name: '', phone: '', email: '', address: '', creditLimit: 0 }
  });

  useEffect(() => {
    if (paymentMethod === 'debt') {
      import('@/lib/api/customers').then((api) => {
        api.getCustomers().then(setCustomers);
      });
    }
  }, [paymentMethod]);

  const onAddCustomer = async (data: POSCustomerFormValues) => {
    setIsSavingCustomer(true);
    try {
      const { addCustomer } = await import('@/lib/api/customers');
      const newCust = await addCustomer({ name: data.name, phone: data.phone || '' });
      setCustomers([...customers, newCust]);
      setSelectedCustomerId(newCust.id);
      setIsAddingCustomer(false);
      resetCustomer();
    } catch (e) {
      console.error(e);
      alert('فشل إضافة عميل جديد');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const executeCheckoutProcess = async (cartToProcess: any[], totalToProcess: number) => {

    if (totalToProcess < 0) {
      alert("خطأ: الإجمالي لا يمكن أن يكون قيمة سالبة.");
      return;
    }
    for (const item of cartToProcess) {
      if (item.quantity <= 0) {
        alert(`خطأ: الكمية للمنتج ${item.name} يجب أن تكون أكبر من صفر.`);
        return;
      }
      if (item.price < 0 || item.basePrice <= 0) {
        alert(`خطأ: السعر للمنتج ${item.name} غير صالح.`);
        return;
      }

      const stockAvailable = item.activeBatches?.reduce((sum: number, b: any) => sum + Number(b.quantity), 0) || 0;
      if (item.quantity > stockAvailable) {
        alert(`خطأ: الكمية المطلوبة من ${item.name} (${item.quantity}) تتجاوز المخزون المتاح (${stockAvailable}).`);
        return;
      }
    }

    setIsProcessing(true);
    try {

      const itemsWithCost = cartToProcess.map(item => ({
        ...item,
        costPrice: item.activeBatches?.[0]?.purchase_price || 0,
        batchDistributions: item.batchDistributions || [],
      }));

      const result = await processCheckout(
        itemsWithCost,
        totalToProcess,
        paymentMethod,
        paymentMethod === 'debt' ? selectedCustomerId : undefined
      );

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

  const handleCheckoutWithTotal = async (totalToProcess: number) => {
    if (cart.length === 0) return;
    if (paymentMethod === 'debt' && !selectedCustomerId) {
      alert("يرجى اختيار العميل لتسجيل عملية الدين.");
      return;
    }

    executeCheckoutProcess(cart, totalToProcess);
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

  if (!pharmacyId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#00CED1]" />
        <h2 className="text-xl font-bold font-cairo">جاري جلب بيانات الصيدلية (Tenant Scope)...</h2>
        <p className="text-gray-500 font-cairo">يرجى تسجيل الدخول بشكل صحيح إذا لم يتم التحميل.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">

      {/* 1. اللوحة اليسرى: البحث، الماسح، والنتائج */}
      <div className="flex-1 min-h-[50vh] lg:min-h-0 flex flex-col gap-6">
        <POSHeader />

        {/* شريط البحث */}
        <form onSubmit={handleBarcodeSubmit} className="glass-panel p-2 flex items-center gap-3 relative">
          <div className="pl-3 text-gray-400">
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin text-[#00CED1]" /> : <Search className="w-5 h-5" />}
          </div>
          <input
            type="text"
            placeholder="ابحث عن منتج أو امسح الباركود..."
            className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-gray-500 py-3 font-cairo"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setShowRecommendations(true);
            }}
            onFocus={() => setShowRecommendations(true)}
            onBlur={() => setTimeout(() => setShowRecommendations(false), 200)}
            autoComplete="off"
            autoFocus
          />

          <POSRecommendations
            suggestions={searchResults}
            visible={showRecommendations && searchInput.length >= 2}
            loading={isSearching}
            onSelect={(p) => {
              addProductToCart(p);
              setShowRecommendations(false);
            }}
          />
        </form>

        {/* الماسح الضوئي */}
        <LiveScanner onScan={handleCameraScan} />

        {/* قائمة المنتجات */}
        <div className="flex-1 glass-card p-6 overflow-y-auto relative">
          <h2 className="text-lg font-medium text-gray-400 mb-4 border-b border-white/10 pb-2 font-cairo">
            {searchInput.length >= 2 ? 'نتائج البحث' : 'قائمة المنتجات'}
          </h2>

          {/* حالة عدم وجود نتائج */}
          {searchInput.length >= 2 && searchResults.length === 0 && !isSearching && (
            <div className="flex flex-col items-center justify-center p-10 text-gray-500 gap-3">
              <AlertCircle className="w-10 h-10 text-yellow-500/50" />
              <p className="font-cairo">لا توجد نتائج لـ "{searchInput}"</p>
              
              <button
                onClick={handleAskAI}
                disabled={isAiLoading}
                className="mt-4 px-6 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#f2cd56] text-black font-bold font-cairo flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 shadow-lg"
              >
                {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                {isAiLoading ? 'جاري استشارة د. محسن...' : 'اسأل د. محسن عن هذا المنتج'}
              </button>

              {aiSuggestions.length > 0 && (
                <div className="w-full max-w-md mt-6 space-y-3">
                  <h3 className="text-[#D4AF37] font-bold font-cairo text-center mb-2 flex items-center justify-center gap-2">
                    <Bot className="w-4 h-4" /> اقتراحات د. محسن
                  </h3>
                  {aiSuggestions.map((choice, idx) => (
                    <div key={idx} className="bg-white/5 border border-[#D4AF37]/30 rounded-xl p-4 text-right">
                      <h4 className="text-white font-bold font-cairo">{choice.name}</h4>
                      <p className="text-xs text-gray-400 font-cairo mt-1">{choice.company} • {choice.type}</p>
                      <p className="text-xs text-gray-500 font-cairo mt-1">تحويل الوحدة: {choice.unit_conversion}</p>
                      
                      <div className="mt-3 flex gap-2">
                        <input
                          type="number"
                          placeholder="السعر"
                          defaultValue={0}
                          id={`ai-price-${idx}`}
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none font-cairo focus:border-[#00CED1]/50"
                        />
                        <button
                          onClick={() => {
                            const priceInput = document.getElementById(`ai-price-${idx}`) as HTMLInputElement;
                            const price = Number(priceInput.value);
                            if (!price || price <= 0) {
                              alert("يرجى إدخال سعر صحيح للمنتج.");
                              return;
                            }
                            handleAddAiSuggestion(choice, price);
                          }}
                          className="px-4 py-2 rounded-lg bg-[#00CED1]/20 text-[#00CED1] border border-[#00CED1]/50 hover:bg-[#00CED1]/30 transition-colors font-cairo text-sm font-bold flex items-center gap-2 whitespace-nowrap"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          إضافة
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {searchResults.map((product) => (
              <POSProductCard
                key={product.id}
                product={product as any}
                isExpanded={expandedProductIds.has(product.id)}
                onAddToCart={addProductToCart}
                onToggleBatches={toggleProductBatches}
              />
            ))}
          </div>

          {searchInput.length < 2 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <p className="text-gray-400 text-lg font-cairo">ابدأ البحث لعرض المنتجات من قاعدة البيانات...</p>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="w-full lg:w-[450px] flex flex-col gap-6 h-[50vh] lg:h-auto lg:flex-none">
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

          {}
          <div className="flex-1 overflow-y-auto p-2">
            <AnimatePresence>
              {cart.map((item: any) => {

                const itemTotal = item.batchDistributions && item.batchDistributions.length > 0
                  ? item.batchDistributions.reduce((s: number, d: any) => s + d.quantity * d.price, 0)
                  : item.price * item.quantity;
                const hasMultipleBatches = item.batchDistributions && item.batchDistributions.length > 1;
                const totalStock = item.activeBatches?.reduce((s: number, b: any) => s + Number(b.quantity), 0) || 0;

                return (
                  <POSCartItem
                    key={item.id}
                    item={item}
                    itemTotal={itemTotal}
                    totalStock={totalStock}
                    hasMultipleBatches={hasMultipleBatches}
                    onShowBatchModal={(i) => {
                      setBatchModal({ isOpen: true, item: i });
                      setBatchDistributions(i.batchDistributions || []);
                    }}
                    onShowPillsModal={(i, newUnit) => {
                      setPillsModal({
                        isOpen: true,
                        type: 'UNIT_CHANGE',
                        items: [i],
                        currentIndex: 0,
                        pendingTargetUnit: newUnit,
                      });
                      setPillsInput((i.customPills || 10).toString());
                    }}
                  />
                );
              })}
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

          {}
          <div className="p-6 bg-[#050505]/80 border-t border-white/10 backdrop-blur-md">

            {}
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

            {}
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
                        className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-3 rounded-xl mb-3"
                      >
                        <form onSubmit={handleSubmitCustomer(onAddCustomer)} className="space-y-3">
                          <div>
                            <input
                              type="text"
                              placeholder="اسم العميل"
                              {...registerCustomer('name')}
                              className={cn(
                                "w-full bg-black/40 border rounded-lg px-3 py-2 text-sm text-white outline-none font-cairo focus:border-[#D4AF37]/50",
                                customerErrors.name ? "border-red-500" : "border-white/10"
                              )}
                            />
                            {customerErrors.name && <p className="text-red-400 text-xs mt-1 font-cairo">{customerErrors.name.message}</p>}
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="رقم الهاتف (اختياري)"
                              {...registerCustomer('phone')}
                              className={cn(
                                "w-full bg-black/40 border rounded-lg px-3 py-2 text-sm text-white outline-none font-cairo focus:border-[#D4AF37]/50",
                                customerErrors.phone ? "border-red-500" : "border-white/10"
                              )}
                            />
                            {customerErrors.phone && <p className="text-red-400 text-xs mt-1 font-cairo">{customerErrors.phone.message}</p>}
                          </div>
                          <button
                            type="submit"
                            disabled={isSavingCustomer}
                            className="w-full py-2 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 border border-[#D4AF37]/30 flex items-center justify-center gap-2 font-bold font-cairo disabled:opacity-50 transition-colors"
                          >
                            {isSavingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            حفظ وتحديد
                          </button>
                        </form>
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

            <div className="mb-4 space-y-2 border-b border-white/5 pb-4 font-cairo">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">المجموع الفرعي</span>
                <span className="text-white">{total.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">الضريبة ({preferences?.taxPercentage || 0}%)</span>
                <span className="text-white">{((total * (preferences?.taxPercentage || 0)) / 100).toFixed(2)} ج.م</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6 font-cairo">
              <span className="text-gray-400 text-lg">الإجمالي النهائي</span>
              <span className={`text-4xl font-bold ${paymentMethod === 'sadqah' ? 'text-[#FF69B4]' : 'text-[#D4AF37]'}`}>
                {(total + (total * (preferences?.taxPercentage || 0)) / 100).toFixed(2)} ج.م
              </span>
            </div>
            <button
              onClick={() => {
                const finalTotal = total + (total * (preferences?.taxPercentage || 0)) / 100;
                handleCheckoutWithTotal(finalTotal);
              }}
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

      <BatchDistributionModal 
        isOpen={batchModal.isOpen}
        item={batchModal.item}
        onClose={() => setBatchModal({ isOpen: false, item: null })}
        batchDistributions={batchDistributions}
        setBatchDistributions={setBatchDistributions}
      />

      <PillsConfirmModal 
        isOpen={pillsModal.isOpen}
        type={pillsModal.type}
        items={pillsModal.items}
        currentIndex={pillsModal.currentIndex}
        pendingTargetUnit={pillsModal.pendingTargetUnit}
        pillsInput={pillsInput}
        setPillsInput={setPillsInput}
        onClose={() => setPillsModal({ ...pillsModal, isOpen: false })}
        onConfirm={handlePillsConfirm}
      />


      {}
      <button
        onClick={() => setIsCopilotOpen(!isCopilotOpen)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#f2cd56] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-110 transition-transform z-50 flex items-center justify-center font-bold"
        title="المساعد الذكي (Copilot)"
      >
        {isCopilotOpen ? <X className="w-8 h-8" /> : <Bot className="w-8 h-8" />}
      </button>

      {}
      <AnimatePresence>
        {isCopilotOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-6 w-[calc(100vw-2rem)] sm:w-[400px] h-[600px] max-h-[80vh] bg-[#050505]/95 border border-[#D4AF37]/30 rounded-2xl shadow-2xl overflow-hidden z-[60] flex flex-col backdrop-blur-xl"
          >
            <div className="bg-[#D4AF37]/10 border-b border-[#D4AF37]/20 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold font-cairo text-[#D4AF37] flex items-center gap-2"><Bot className="w-5 h-5" /> المساعد الذكي</h3>
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

      {}
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
