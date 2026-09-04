import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug } from 'lucide-react';

interface POSDebugPanelProps {
 showDebug: boolean;
 setShowDebug: (show: boolean) => void;
 cart: any[];
 pharmacyId?: string;
 total: number;
 paymentMethod: string;
 isOnline: boolean;
 searchInput: string;
 searchResultsCount: number;
}

export function POSDebugPanel({
 showDebug,
 setShowDebug,
 cart,
 pharmacyId,
 total,
 paymentMethod,
 isOnline,
 searchInput,
 searchResultsCount
}: POSDebugPanelProps) {
 return (
 <>
 <div className="fixed top-4 right-4 z-[99]">
 <button
 onClick={() => setShowDebug(!showDebug)}
 className="p-2 rounded-full bg-[var(--nile-teal)]/20 hover:bg-[var(--nile-teal)]/40 text-[var(--nile-teal)] transition-all shadow-lg"
 title="تفعيل وضع التصحيح"
 aria-label="Toggle Debug Mode"
 >
 <Bug className="w-5 h-5" />
 </button>
 </div>

 <AnimatePresence>
 {showDebug && (
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 className="fixed top-20 right-4 z-50 w-96 max-h-[80vh] overflow-auto bg-black/90 border border-[var(--nile-teal)]/30 rounded-2xl shadow-2xl p-4 text-xs font-mono text-gray-300 backdrop-blur-xl"
 >
 <div className="flex justify-between items-center mb-3">
 <h3 className="text-[var(--nile-teal)] font-bold font-cairo">🔍 POS Debug</h3>
 <span className="text-[var(--text-inactive)]">Cart: {cart.length}</span>
 </div>
 <div className="space-y-2">
 <div className="bg-[var(--glass-surface)] p-2 rounded">
 <div className="text-[var(--text-muted)]">Pharmacy ID:</div>
 <div className="text-white truncate">{pharmacyId || 'N/A'}</div>
 </div>
 <div className="bg-[var(--glass-surface)] p-2 rounded">
 <div className="text-[var(--text-muted)]">Total:</div>
 <div className="text-[var(--royal-gold)]">{total.toFixed(2)} ج.م</div>
 </div>
 <div className="bg-[var(--glass-surface)] p-2 rounded">
 <div className="text-[var(--text-muted)]">Payment Method:</div>
 <div className="text-[var(--text-primary)]">{paymentMethod}</div>
 </div>
 <div className="bg-[var(--glass-surface)] p-2 rounded">
 <div className="text-[var(--text-muted)]">Online:</div>
 <div className="text-[var(--text-primary)]">{isOnline ? '✅' : '❌'}</div>
 </div>
 <div className="bg-[var(--glass-surface)] p-2 rounded">
 <div className="text-[var(--text-muted)]">Search Query:</div>
 <div className="text-[var(--text-primary)]">{searchInput || '(empty)'}</div>
 </div>
 <div className="bg-[var(--glass-surface)] p-2 rounded">
 <div className="text-[var(--text-muted)]">Search Results:</div>
 <div className="text-[var(--text-primary)]">{searchResultsCount}</div>
 </div>
 <div className="bg-[var(--glass-surface)] p-2 rounded max-h-40 overflow-y-auto">
 <div className="text-gray-400 mb-1">Cart Items:</div>
 {cart.length === 0 ? (
 <div className="text-[var(--text-inactive)]">(empty)</div>
 ) : (
 cart.map((item, idx) => (
 <div key={idx} className="text-white border-b border-[var(--glass-border)] py-1">
 <span className="text-[var(--nile-teal)]">{item.name}</span>
 <span className="text-gray-500 ml-2">qty: {item.quantity}</span>
 <span className="text-gray-500 ml-2">unit: {item.unit}</span>
 <span className="text-gray-500 ml-2">conv: {item.unitConversion}</span>
 <span className="text-gray-500 ml-2">price: {item.price}</span>
 </div>
 ))
 )}
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </>
 );
}
