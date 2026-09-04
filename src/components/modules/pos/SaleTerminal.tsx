"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, ShoppingCart, Trash2, CheckCircle2, Plus, Minus, Printer, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function SaleTerminal() {
 const [query, setQuery] = useState('');
 const [results, setResults] = useState<any[]>([]);
 const [cart, setCart] = useState<any[]>([]);
 const [isProcessing, setIsProcessing] = useState(false);
 const [quickItems, setQuickItems] = useState<any[]>([]);
 const [isLoadingQuick, setIsLoadingQuick] = useState(true);
 const [showReceipt, setShowReceipt] = useState<any | null>(null);
 
 const searchInputRef = useRef<HTMLInputElement>(null);

 useEffect(() => {
 const fetchQuickItems = async () => {
 try {
 const { data } = await supabase
 .from('batches')
 .select('*, products(name, type)')
 .gt('quantity', 0)
 .order('created_at', { ascending: false })
 .limit(12);
 setQuickItems(data || []);
 } catch (err) {
 console.error('Error fetching quick items', err);
 } finally {
 setIsLoadingQuick(false);
 }
 };
 fetchQuickItems();
 }, []);

 // Keyboard shortcuts
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 // Ignore if printing modal is open
 if (showReceipt) return;

 // F9 to complete sale
 if (e.key === 'F9') {
 e.preventDefault();
 completeSale();
 return;
 }

 // Auto-focus search on alphanumeric typing (if not already focused on an input)
 if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
 const activeNode = document.activeElement;
 if (activeNode && (activeNode.tagName === 'INPUT' || activeNode.tagName === 'TEXTAREA')) {
 return;
 }
 searchInputRef.current?.focus();
 }
 };

 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [cart, showReceipt]);

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

 // Auto-add if it's an exact barcode match
 if (data && data.length === 1 && data[0].barcode === val) {
 addToCart(data[0]);
 }
 };

 const handleSearchEnter = (e: React.KeyboardEvent) => {
 if (e.key === 'Enter' && results.length > 0) {
 addToCart(results[0]);
 }
 };

 const addToCart = (batch: any) => {
 const existing = cart.find(item => item.id === batch.id);
 if (existing) {
 // Check if stock is available
 if (existing.cartQuantity >= batch.quantity) {
 // optional: alert user or just ignore
 return;
 }
 setCart(cart.map(item => 
 item.id === batch.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
 ));
 } else {
 setCart([{ ...batch, cartQuantity: 1 }, ...cart]);
 }
 setQuery('');
 setResults([]);
 searchInputRef.current?.focus();
 };

 const updateQuantity = (id: string, newQty: number) => {
 if (newQty < 1) return;
 setCart(cart.map(item => {
 if (item.id === id) {
 return { ...item, cartQuantity: Math.min(newQty, item.quantity) };
 }
 return item;
 }));
 };

 const total = cart.reduce((acc, item) => acc + (item.sale_price * item.cartQuantity), 0);

 const completeSale = async () => {
 if (cart.length === 0) return;
 setIsProcessing(true);
 
 try {
 const { data: sale, error: saleError } = await supabase
 .from('sales')
 .insert({
 total,
 items: cart,
 discount: 0
 })
 .select()
 .maybeSingle();

 if (saleError) throw saleError;
 if (!sale) throw new Error('فشل في حفظ الفاتورة (No data returned)');

 for (const item of cart) {
 const { error: updateError } = await supabase
 .from('batches')
 .update({ quantity: item.quantity - item.cartQuantity })
 .eq('id', item.id);
 
 if (updateError) throw updateError;
 }

 // Show receipt modal instead of alert
 setShowReceipt({ ...sale, items: [...cart], total });
 setCart([]);
 
 } catch (err: any) {
 alert('خطأ في العملية: ' + err.message);
 } finally {
 setIsProcessing(false);
 }
 };

 const printReceipt = () => {
 window.print();
 };

 return (
 <>
 {/* Hide terminal when printing */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-160px)] print:hidden">
 {/* Left/Middle: Search and Quick Items */}
 <div className="lg:col-span-2 space-y-6 flex flex-col">
 <div className="relative">
 <input 
 ref={searchInputRef}
 type="text"
 value={query}
 onChange={(e) => handleSearch(e.target.value)}
 onKeyDown={handleSearchEnter}
 placeholder="ابحث بالاسم أو الباركود (أو امسح الباركود)..."
 className="w-full h-16 glass-panel px-14 text-xl font-bold focus: outline-none transition-all"
 autoFocus
 />
 <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-nile-teal/50 w-6 h-6" />
 
 {results.length > 0 && (
 <div className="absolute top-20 left-0 w-full glass-panel z-20 p-2 space-y-2 overflow-hidden shadow-2xl border border-[var(--glass-border)]">
 {results.map((item, idx) => (
 <button 
 key={item.id}
 onClick={() => addToCart(item)}
 className={cn(
 "w-full p-4 flex justify-between items-center rounded-xl transition-colors group text-right",
 idx === 0 ? "bg-nile-teal/20 border border-nile-teal/50" : "hover:bg-nile-teal/10"
 )}
 >
 <span className="font-bold text-lg text-nile-teal">{item.sale_price} ج.م</span>
 <div>
 <h5 className="font-bold">{item.products.name}</h5>
 <p className="text-xs text-foreground/40">المتاح: {item.quantity} | {item.barcode}</p>
 </div>
 </button>
 ))}
 </div>
 )}
 </div>

 {isLoadingQuick ? (
 <div className="flex-1 glass-panel p-6 flex flex-col items-center justify-center">
 <ShoppingCart className="w-10 h-10 mb-4 text-nile-teal " />
 <p className="text-gray-400 font-cairo">جاري تحميل الأصناف السريعة...</p>
 </div>
 ) : (
 <div className="flex-1 glass-panel p-6 overflow-y-auto">
 <h3 className="text-lg font-bold mb-4 font-cairo text-white flex items-center gap-2">
 <ShoppingCart className="w-5 h-5 text-nile-teal" /> الأصناف السريعة المتاحة
 </h3>
 {quickItems.length === 0 ? (
 <div className="flex flex-col items-center justify-center p-8 opacity-50">
 <p className="text-xl font-bold">لا توجد أصناف متاحة للبيع السريع</p>
 </div>
 ) : (
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
 {quickItems.map(item => (
 <button
 key={item.id}
 onClick={() => addToCart(item)}
 className="flex flex-col items-center justify-center p-4 rounded-2xl glass-card hover:bg-nile-teal/10 hover:border-nile-teal/30 focus: transition-all group gap-2 text-center"
 >
 <div className="w-12 h-12 rounded-full bg-black/40 border border-[var(--glass-border)] flex items-center justify-center group-hover:scale-110 transition-transform">
 <ShoppingCart className="w-5 h-5 text-nile-teal" />
 </div>
 <div className="flex flex-col gap-1 w-full">
 <span className="font-bold text-sm text-foreground font-cairo truncate">{item.products?.name}</span>
 <span className="text-xs text-nile-teal font-inter font-bold">{item.sale_price} ج.م</span>
 <span className="text-[10px] text-gray-500 font-cairo truncate">المتاح: {item.quantity}</span>
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
 )}
 </div>

 {/* Right: Cart */}
 <div className="glass-panel p-6 flex flex-col relative overflow-hidden">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-2xl font-bold flex items-center gap-3">
 <ShoppingCart className="text-nile-teal" />
 فاتورة البيع
 </h3>
 {cart.length > 0 && (
 <button 
 onClick={() => setCart([])}
 className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors bg-red-400/10 px-3 py-1.5 rounded-lg"
 >
 <XCircle className="w-4 h-4" /> إفراغ السلة
 </button>
 )}
 </div>

 <div className="flex-1 space-y-3 overflow-y-auto min-h-0 pl-2 custom-scrollbar">
 {cart.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-full text-foreground/20 gap-3">
 <ShoppingCart className="w-16 h-16 opacity-20" />
 <p>السلة فارغة. ابحث عن صنف أو امسح باركود.</p>
 </div>
 ) : (
 cart.map(item => (
 <div key={item.id} className="flex flex-col bg-[var(--glass-surface)] p-3 rounded-xl border border-[var(--glass-border)] hover:border-nile-teal/30 transition-colors">
 <div className="flex justify-between items-start mb-2">
 <button 
 onClick={() => setCart(cart.filter(i => i.id !== item.id))}
 className="text-red-500/50 hover:text-red-500 transition-colors mt-1 p-1"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 <div className="text-right flex-1 pr-2">
 <p className="font-bold text-sm leading-tight">{item.products.name}</p>
 <p className="text-xs text-nile-teal font-bold">{item.sale_price} ج.م</p>
 </div>
 </div>
 
 <div className="flex items-center justify-between mt-1">
 <p className="font-black text-white">{item.sale_price * item.cartQuantity} ج.م</p>
 
 <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-[var(--glass-border)]">
 <button 
 onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
 className="w-7 h-7 flex items-center justify-center text-white hover:bg-nile-teal hover:text-black rounded-md transition-colors disabled:opacity-30"
 disabled={item.cartQuantity >= item.quantity}
 >
 <Plus className="w-4 h-4" />
 </button>
 <input 
 type="text" 
 value={item.cartQuantity} 
 onChange={(e) => {
 const val = parseInt(e.target.value);
 if (!isNaN(val)) updateQuantity(item.id, val);
 }}
 className="w-10 text-center bg-transparent text-sm font-bold outline-none"
 />
 <button 
 onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
 className="w-7 h-7 flex items-center justify-center text-white hover:bg-red-500 hover:text-white rounded-md transition-colors disabled:opacity-30"
 disabled={item.cartQuantity <= 1}
 >
 <Minus className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>
 ))
 )}
 </div>

 <div className="mt-4 pt-4 border-t border-[var(--glass-border)] space-y-4 shrink-0">
 <div className="flex justify-between items-end">
 <span className="text-4xl font-black text-royal-gold ">{total.toFixed(2)}</span>
 <span className="text-lg font-bold text-foreground/40">الإجمالي (ج.م)</span>
 </div>

 <button 
 disabled={cart.length === 0 || isProcessing}
 onClick={completeSale}
 className={cn(
 "w-full py-5 rounded-xl font-black text-xl flex items-center justify-center gap-2 transition-all",
 cart.length > 0 
 ? "bg-nile-teal text-obsidian hover:scale-[1.02] shadow-[0_0_20px_rgba(0,206,209,0.3)]" 
 : "bg-[var(--glass-surface)] text-foreground/20 cursor-not-allowed"
 )}
 >
 {isProcessing ? "جاري الحفظ..." : "إتمام البيع (F9)"}
 {!isProcessing && <CheckCircle2 className="w-6 h-6" />}
 </button>
 </div>
 </div>
 </div>

 {/* Printable Receipt Modal */}
 <AnimatePresence>
 {showReceipt && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm print:bg-white print:fixed print:inset-0 print:block print:z-auto">
 
 {/* Modal Container - Hidden on print */}
 <motion.div 
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="bg-white text-black p-6 rounded-2xl w-full max-w-sm shadow-2xl relative print:hidden font-cairo flex flex-col max-h-[90vh]"
 >
 <button 
 onClick={() => setShowReceipt(null)}
 className="absolute top-4 left-4 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
 >
 <X className="w-5 h-5" />
 </button>

 <div className="text-center mb-6">
 <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
 <CheckCircle2 className="w-8 h-8 text-emerald-500" />
 </div>
 <h2 className="text-xl font-bold text-gray-900">تمت البيعة بنجاح!</h2>
 <p className="text-sm text-gray-500">رقم العملية: #{showReceipt.id.split('-')[0]}</p>
 </div>

 {/* Receipt Preview */}
 <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 mb-6 overflow-y-auto flex-1">
 <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
 <h3 className="font-black text-lg">صيدلية النيل</h3>
 <p className="text-xs text-gray-500">فاتورة بيع نقدي</p>
 <p className="text-xs text-gray-500">{new Date(showReceipt.created_at || Date.now()).toLocaleString('ar-EG')}</p>
 </div>
 
 <div className="space-y-2 mb-3 text-sm">
 {showReceipt.items.map((it: any, i: number) => (
 <div key={i} className="flex justify-between items-start">
 <span className="font-bold">{it.sale_price * it.cartQuantity}</span>
 <div className="text-right flex-1 pr-3">
 <p className="leading-tight">{it.products.name}</p>
 <p className="text-xs text-gray-500">{it.cartQuantity} x {it.sale_price}</p>
 </div>
 </div>
 ))}
 </div>

 <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between items-center font-black text-lg">
 <span>{showReceipt.total.toFixed(2)} ج.م</span>
 <span>الإجمالي</span>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3 mt-auto shrink-0">
 <button 
 onClick={() => setShowReceipt(null)}
 className="py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
 >
 إغلاق
 </button>
 <button 
 onClick={printReceipt}
 className="py-3 rounded-xl font-bold text-white bg-black hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
 >
 <Printer className="w-4 h-4" /> طباعة
 </button>
 </div>
 </motion.div>

 {/* Actual Print Content - Only visible when printing */}
 <div className="hidden print:block w-full max-w-[80mm] mx-auto bg-white text-black font-sans text-sm p-2" dir="rtl">
 <div className="text-center border-b border-dashed border-black pb-2 mb-2">
 <h3 className="font-bold text-lg">صيدلية النيل</h3>
 <p className="text-xs">فاتورة بيع ضريبية مبسطة</p>
 <p className="text-xs">التاريخ: {new Date(showReceipt.created_at || Date.now()).toLocaleString('ar-EG')}</p>
 <p className="text-xs">رقم الفاتورة: {showReceipt.id.split('-')[0]}</p>
 </div>
 
 <div className="mb-2">
 <table className="w-full text-right text-xs">
 <thead>
 <tr className="border-b border-dashed border-black">
 <th className="py-1">الصنف</th>
 <th className="py-1">الكمية</th>
 <th className="py-1">السعر</th>
 <th className="py-1">الإجمالي</th>
 </tr>
 </thead>
 <tbody>
 {showReceipt.items.map((it: any, i: number) => (
 <tr key={i} className="border-b border-gray-100">
 <td className="py-1 font-bold">{it.products.name}</td>
 <td className="py-1">{it.cartQuantity}</td>
 <td className="py-1">{it.sale_price}</td>
 <td className="py-1">{it.sale_price * it.cartQuantity}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="border-t border-dashed border-black pt-2 flex justify-between items-center font-bold text-base">
 <span>الإجمالي:</span>
 <span>{showReceipt.total.toFixed(2)} ج.م</span>
 </div>
 
 <div className="text-center mt-6 pt-4 text-xs">
 <p>الأسعار تشمل ضريبة القيمة المضافة</p>
 <p className="mt-1 font-bold">مع تمنياتنا لكم بدوام الصحة والعافية</p>
 </div>
 </div>
 
 </div>
 )}
 </AnimatePresence>
 </>
 );
}
