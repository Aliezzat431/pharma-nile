"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, ShoppingCart, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SaleTerminal() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Search logic
  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }

    const { data } = await supabase
      .from('batches')
      .select('*, products(name)')
      .or(`barcode.ilike.%${val}%, products.name.ilike.%${val}%`)
      .gt('quantity', 0)
      .limit(5);

    setResults(data || []);
  };

  const addToCart = (batch: any) => {
    const existing = cart.find(item => item.id === batch.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === batch.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...batch, cartQuantity: 1 }]);
    }
    setQuery('');
    setResults([]);
  };

  const total = cart.reduce((acc, item) => acc + (item.selling_price * item.cartQuantity), 0);

  const completeSale = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    try {
      // 1. Record Sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          total,
          items: cart,
          discount: 0
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Update Quantities
      for (const item of cart) {
        const { error: updateError } = await supabase
          .from('batches')
          .update({ quantity: item.quantity - item.cartQuantity })
          .eq('id', item.id);
        
        if (updateError) throw updateError;
      }

      setCart([]);
      alert('تمت البيعة بنجاح! الفاتورة جاهزة.');
    } catch (err: any) {
      alert('خطأ في العملية: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-160px)]">
      {/* Search & Selection */}
      <div className="lg:col-span-2 space-y-6 flex flex-col">
        <div className="relative">
          <input 
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الباركود..."
            className="w-full h-16 glass-panel px-14 text-xl font-bold focus:neon-glow-teal outline-none transition-all"
          />
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-nile-teal/50 w-6 h-6" />
          
          {results.length > 0 && (
            <div className="absolute top-20 left-0 w-full glass-panel z-20 p-2 space-y-2 overflow-hidden">
              {results.map(item => (
                <button 
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="w-full p-4 flex justify-between items-center rounded-xl hover:bg-nile-teal/10 transition-colors group text-right"
                >
                  <span className="font-bold text-lg text-nile-teal">{item.selling_price} ج.م</span>
                  <div>
                    <h5 className="font-bold">{item.products.name}</h5>
                    <p className="text-xs text-foreground/40">المتاح: {item.quantity} | {item.barcode}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 glass-panel p-6 flex flex-col items-center justify-center opacity-30">
          <ShoppingCart className="w-20 h-20 mb-4" />
          <p className="text-xl font-bold">باقي الشاشة هيكون فيه عرض الأصناف الأكثر مبيعاً</p>
        </div>
      </div>

      {/* Cart & Billing */}
      <div className="glass-panel p-8 flex flex-col">
        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <ShoppingCart className="text-nile-teal" />
          فاتورة البيع
        </h3>

        <div className="flex-1 space-y-4 overflow-y-auto min-h-0 pl-2">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-foreground/20">السلة فاضية</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                <button 
                  onClick={() => setCart(cart.filter(i => i.id !== item.id))}
                  className="text-red-500/50 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <p className="font-bold text-nile-teal">{item.selling_price * item.cartQuantity} ج.م</p>
                  <p className="text-xs text-foreground/40">{item.cartQuantity} × {item.selling_price}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{item.products.name}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
          <div className="flex justify-between items-end">
            <span className="text-4xl font-black text-royal-gold neon-glow-gold">{total}</span>
            <span className="text-lg font-bold text-foreground/40">الإجمالي (ج.م)</span>
          </div>

          <button 
            disabled={cart.length === 0 || isProcessing}
            onClick={completeSale}
            className={cn(
              "w-full py-6 rounded-2xl font-black text-2xl flex items-center justify-center gap-3 transition-all",
              cart.length > 0 
                ? "bg-nile-teal text-obsidian neon-glow-teal hover:scale-[1.02]" 
                : "bg-white/5 text-foreground/20 cursor-not-allowed"
            )}
          >
            {isProcessing ? "جاري الحفظ..." : "إتمام البيع الآن"}
            <CheckCircle2 className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
}
