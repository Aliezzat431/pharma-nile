import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Filter, ChevronRight, X, Tag } from 'lucide-react';

interface POSSearchAreaProps {
 searchInput: string;
 setSearchInput: (val: string) => void;
 isSearching: boolean;
 setShowRecommendations: (show: boolean) => void;
 handleBarcodeSubmit: (e: React.FormEvent) => void;
 selectedType: string;
 setSelectedType: (type: string) => void;
 showTypeFilter: boolean;
 setShowTypeFilter: (show: boolean) => void;
 availableTypes: string[];
 getTypeDisplayName: (typeId: string) => string;
}

export function POSSearchArea({
 searchInput,
 setSearchInput,
 isSearching,
 setShowRecommendations,
 handleBarcodeSubmit,
 selectedType,
 setSelectedType,
 showTypeFilter,
 setShowTypeFilter,
 availableTypes,
 getTypeDisplayName
}: POSSearchAreaProps) {
 return (
 <div className="flex flex-col sm:flex-row gap-3">
 <form onSubmit={handleBarcodeSubmit} className="flex-1 glass-panel p-2 flex items-center gap-3 relative">
 <div className="pl-3 text-gray-400">
 {isSearching ? <Loader2 className="w-5 h-5 animate-spin text-[var(--nile-teal)]" /> : <Search className="w-5 h-5" />}
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
 </form>

 <div className="relative">
 <button
 onClick={() => setShowTypeFilter(!showTypeFilter)}
 className={`glass-panel px-4 py-2 flex items-center justify-center gap-2 transition-all font-cairo h-full min-h-[52px] ${
 selectedType ? 'text-[var(--royal-gold)] border-[var(--royal-gold)]/30 bg-[var(--royal-gold)]/10' : 'text-[var(--text-muted)]'
 }`}
 >
 <Filter className="w-4 h-4" />
 <span className="text-sm whitespace-nowrap">
 {selectedType ? getTypeDisplayName(selectedType) : 'جميع الأنواع'}
 </span>
 <ChevronRight className={`w-4 h-4 transition-transform ${showTypeFilter ? 'rotate-90' : ''}`} />
 </button>

 <AnimatePresence>
 {showTypeFilter && (
 <motion.div
 initial={{ opacity: 0, y: -10, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -10, scale: 0.95 }}
 className="absolute top-full right-0 mt-2 w-64 bg-[#0a0a0a] border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[300px] overflow-y-auto"
 >
 <div className="p-2">
 <button
 onClick={() => {
 setSelectedType('');
 setShowTypeFilter(false);
 }}
 className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-cairo transition-all flex items-center gap-3 ${
 !selectedType ? 'bg-[var(--royal-gold)]/20 text-[var(--royal-gold)]' : 'text-gray-400 hover:bg-[var(--glass-surface)] hover:text-white'
 }`}
 >
 <X className="w-4 h-4" />
 جميع الأنواع
 </button>

 {availableTypes.length === 0 && (
 <div className="text-center py-6 text-gray-500 text-xs font-cairo">
 لا توجد أنواع متاحة
 </div>
 )}
 {availableTypes.map((type) => {
 const displayName = getTypeDisplayName(type);
 return (
 <button
 key={type}
 onClick={() => {
 setSelectedType(type);
 setShowTypeFilter(false);
 }}
 className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-cairo transition-all flex items-center gap-3 ${
 selectedType === type ? 'bg-[var(--royal-gold)]/20 text-[var(--royal-gold)]' : 'text-gray-400 hover:bg-[var(--glass-surface)] hover:text-white'
 }`}
 >
 <Tag className="w-4 h-4" />
 {displayName}
 </button>
 );
 })}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>
 );
}
