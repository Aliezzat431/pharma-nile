import React from 'react';
import { Loader2, AlertCircle, Bot, ShoppingCart, Package } from 'lucide-react';
import { POSProductCard } from './POSProductCard';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface POSProductBrowserProps {
 searchInput: string;
 filteredResults: any[];
 browseTotal: number;
 browseType: string;
 setBrowseType: (type: string) => void;
 browsePage: number;
 setBrowsePage: React.Dispatch<React.SetStateAction<number>>;
 showOutOfStock: boolean;
 setShowOutOfStock: (show: boolean) => void;
 isSearching: boolean;
 handleAskAI: () => void;
 isAiLoading: boolean;
 aiSuggestions: any[];
 handleAddAiSuggestion: (choice: any, price: number) => void;
 expandedProductIds: Set<string>;
 addProductToCart: (product: any, clearSearch?: boolean) => void;
 toggleProductBatches: (e: React.MouseEvent, productId: string) => void;
 isBrowseLoading: boolean;
 browseData: any[];
 cart: any[];
 treatmentTypes: any[];
 getTypeDisplayName: (typeId: string) => string;
}

const BROWSE_PAGE_SIZE = 30;

export function POSProductBrowser({
 searchInput,
 filteredResults,
 browseTotal,
 browseType,
 setBrowseType,
 browsePage,
 setBrowsePage,
 showOutOfStock,
 setShowOutOfStock,
 isSearching,
 handleAskAI,
 isAiLoading,
 aiSuggestions,
 handleAddAiSuggestion,
 expandedProductIds,
 addProductToCart,
 toggleProductBatches,
 isBrowseLoading,
 browseData,
 cart,
 treatmentTypes,
 getTypeDisplayName
}: POSProductBrowserProps) {
 return (
 <div className="flex-1 glass-card overflow-hidden flex flex-col">
 {/* Table Header & Controls */}
 <div className="p-4 border-b border-[var(--glass-border)] flex flex-wrap items-center gap-3">
 <h2 className="text-base font-bold font-cairo text-[var(--text-primary)] flex-shrink-0">
 {searchInput.length >= 2 ? `نتائج البحث (${filteredResults.length})` : `كتالوج المنتجات (${browseTotal})`}
 </h2>

 <div className="flex items-center gap-2 mr-auto flex-wrap">
 {/* Type filter for browse mode — Custom Glassmorphism Dropdown */}
 {searchInput.length < 2 && (
 <CustomSelect
 value={browseType}
 onChange={(v) => { setBrowseType(v); setBrowsePage(1); }}
 placeholder="جميع الأنواع"
 options={[
 { value: '', label: 'جميع الأنواع' },
 ...treatmentTypes.map(t => ({ value: t.id, label: t.name }))
 ]}
 />
 )}
 <label className="flex items-center gap-1.5 text-xs font-cairo text-[var(--text-muted)] cursor-pointer select-none">
 <input
 type="checkbox"
 checked={showOutOfStock}
 onChange={(e) => { setShowOutOfStock(e.target.checked); setBrowsePage(1); }}
 className="rounded accent-[var(--nile-teal)]"
 />
 عرض المنتهي مخزونه
 </label>
 </div>
 </div>

 {/* Search results: show as cards */}
 {searchInput.length >= 2 && (
 <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
 {isSearching && (
 <div className="flex items-center justify-center py-12">
 <Loader2 className="w-8 h-8 animate-spin text-[var(--nile-teal)]" />
 </div>
 )}
 {!isSearching && filteredResults.length === 0 && (
 <div className="flex flex-col items-center justify-center py-10 text-[var(--text-muted)] gap-3">
 <AlertCircle className="w-10 h-10 text-yellow-500/50" />
 <p className="font-cairo">لا توجد نتائج لـ "{searchInput}"</p>
 <button
 onClick={handleAskAI}
 disabled={isAiLoading}
 className="mt-2 px-6 py-2 rounded-xl bg-glass-surface from-[var(--royal-gold)] to-[#f2cd56] text-black font-bold font-cairo flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 shadow-lg"
 >
 {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
 {isAiLoading ? 'جاري استشارة د. محسن...' : 'اسأل د. محسن'}
 </button>
 {aiSuggestions.length > 0 && (
 <div className="w-full max-w-md mt-4 space-y-3">
 {aiSuggestions.map((choice, idx) => (
 <div key={idx} className="bg-[var(--glass-surface)] border border-[var(--royal-gold)]/30 rounded-xl p-4 text-right">
 <h4 className="text-[var(--text-primary)] font-bold font-cairo">{choice.name}</h4>
 <p className="text-xs text-[var(--text-muted)] font-cairo mt-1">{choice.company} • {getTypeDisplayName(choice.type)}</p>
 <div className="mt-3 flex gap-2">
 <input type="number" placeholder="السعر" defaultValue={0} id={`ai-price-${idx}`}
 className="flex-1 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none font-cairo"
 />
 <button
 onClick={() => {
 const el = document.getElementById(`ai-price-${idx}`) as HTMLInputElement;
 const price = Number(el.value);
 if (!price || price <= 0) { alert('يرجى إدخال سعر صحيح.'); return; }
 handleAddAiSuggestion(choice, price);
 }}
 className="px-4 py-2 rounded-lg bg-[var(--nile-teal)]/20 text-[var(--nile-teal)] border border-[var(--nile-teal)]/50 hover:bg-[var(--nile-teal)]/30 font-cairo text-sm font-bold flex items-center gap-2"
 >
 <ShoppingCart className="w-4 h-4" /> إضافة
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 {filteredResults.map((product) => (
 <POSProductCard
 key={product.id}
 product={{ ...product, typeDisplayName: getTypeDisplayName(product.type) } as any}
 isExpanded={expandedProductIds.has(product.id)}
 onAddToCart={addProductToCart}
 onToggleBatches={toggleProductBatches}
 />
 ))}
 </div>
 )}

 {/* Browse mode: permanent paginated table */}
 {searchInput.length < 2 && (
 <>
 <div className="flex-1 overflow-y-auto">
 {isBrowseLoading ? (
 <div className="flex items-center justify-center py-16">
 <Loader2 className="w-8 h-8 animate-spin text-[var(--nile-teal)]" />
 </div>
 ) : browseData.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)] gap-2">
 <Package className="w-12 h-12 opacity-30" />
 <p className="font-cairo">لا توجد منتجات</p>
 </div>
 ) : (
 <table className="w-full text-sm text-right" dir="rtl">
 <thead className="sticky top-0 z-10">
 <tr className="bg-[var(--glass-surface-heavy)] text-[var(--text-muted)] text-xs font-bold font-cairo uppercase">
 <th className="px-4 py-3 text-right">المنتج</th>
 <th className="px-4 py-3 text-center">النوع</th>
 <th className="px-4 py-3 text-center">المخزون</th>
 <th className="px-4 py-3 text-center">السعر</th>
 <th className="px-4 py-3 text-center">إضافة</th>
 </tr>
 </thead>
 <tbody>
 {browseData.map((product, idx) => {
 const inCart = cart.some((c: any) => c.id === product.id);
 const isLowStock = (product.total_quantity ?? 0) > 0 && (product.total_quantity ?? 0) <= 5;
 const outOfStock = (product.total_quantity ?? 0) === 0;
 return (
 <tr
 key={product.id}
 onClick={() => !outOfStock && addProductToCart(product, false)}
 className={`border-b border-[var(--divider)] transition-all group ${outOfStock
 ? 'opacity-40 cursor-not-allowed'
 : 'cursor-pointer hover:bg-[var(--nile-teal)]/8 hover:border-[var(--nile-teal)]/20'
 } ${inCart ? 'bg-[var(--nile-teal)]/5 border-r-2 border-r-[var(--nile-teal)]' : ''
 } ${idx % 2 === 0 ? 'bg-[var(--glass-surface)]/30' : ''}`}
 >
 <td className="px-4 py-3">
 <div className="font-bold font-cairo text-[var(--text-primary)] group-hover:text-[var(--nile-teal)] transition-colors leading-tight">
 {product.name}
 </div>
 {product.company && (
 <div className="text-[10px] text-[var(--text-muted)] mt-0.5 font-cairo">{product.company}</div>
 )}
 </td>
 <td className="px-4 py-3 text-center">
 <span className="text-xs font-cairo px-2 py-0.5 rounded-full bg-[var(--glass-surface)] text-[var(--text-secondary)] whitespace-nowrap">
 {getTypeDisplayName(product.type)}
 </span>
 </td>
 <td className="px-4 py-3 text-center">
 <span className={`text-xs font-bold font-cairo ${outOfStock ? 'text-red-500' : isLowStock ? 'text-yellow-500' : 'text-green-500'
 }`}>
 {product.total_quantity ?? 0}
 </span>
 </td>
 <td className="px-4 py-3 text-center">
 <span className="text-[var(--royal-gold)] font-bold font-cairo text-sm">
 {product.current_price ? `${product.current_price} ج.م` : '—'}
 </span>
 </td>
 <td className="px-4 py-3 text-center">
 <button
 disabled={outOfStock}
 onClick={(e) => { e.stopPropagation(); if (!outOfStock) addProductToCart(product, false); }}
 className={`p-2 rounded-lg transition-all ${outOfStock
 ? 'opacity-30 cursor-not-allowed text-[var(--text-muted)]'
 : inCart
 ? 'bg-[var(--nile-teal)] text-black shadow-[0_0_12px_var(--nile-teal-glow)]'
 : 'bg-[var(--glass-surface)] hover:bg-[var(--nile-teal)]/20 text-[var(--nile-teal)] group-hover:scale-110'
 }`}
 title={outOfStock ? 'نفذ المخزون' : 'إضافة للسلة'}
 >
 <ShoppingCart className="w-4 h-4" />
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 )}
 </div>

 {/* Pagination */}
 {browseTotal > BROWSE_PAGE_SIZE && (
 <div className="p-3 border-t border-[var(--glass-border)] flex items-center justify-between gap-2 bg-[var(--glass-surface)]/40">
 <button
 disabled={browsePage <= 1}
 onClick={() => setBrowsePage(p => Math.max(1, p - 1))}
 className="px-4 py-1.5 text-xs font-cairo rounded-lg bg-[var(--glass-surface)] text-[var(--text-primary)] disabled:opacity-30 hover:bg-[var(--nile-teal)]/20 hover:text-[var(--nile-teal)] transition-all"
 >
 السابق
 </button>
 <span className="text-xs text-[var(--text-muted)] font-cairo">
 صفحة {browsePage} من {Math.ceil(browseTotal / BROWSE_PAGE_SIZE)}
 <span className="text-[var(--text-inactive)] mr-2">({browseTotal} منتج)</span>
 </span>
 <button
 disabled={browsePage >= Math.ceil(browseTotal / BROWSE_PAGE_SIZE)}
 onClick={() => setBrowsePage(p => p + 1)}
 className="px-4 py-1.5 text-xs font-cairo rounded-lg bg-[var(--glass-surface)] text-[var(--text-primary)] disabled:opacity-30 hover:bg-[var(--nile-teal)]/20 hover:text-[var(--nile-teal)] transition-all"
 >
 التالي
 </button>
 </div>
 )}
 </>
 )}
 </div>
 );
}
