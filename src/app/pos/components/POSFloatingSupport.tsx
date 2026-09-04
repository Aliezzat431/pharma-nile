import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X } from 'lucide-react';

interface POSFloatingSupportProps {
 isCopilotOpen: boolean;
 setIsCopilotOpen: (open: boolean) => void;
 agentWindows: { id: string; url: string; title: string; x?: number; y?: number }[];
 setAgentWindows: React.Dispatch<React.SetStateAction<any[]>>;
}

export function POSFloatingSupport({
 isCopilotOpen,
 setIsCopilotOpen,
 agentWindows,
 setAgentWindows
}: POSFloatingSupportProps) {
 return (
 <>
 <button
 onClick={() => setIsCopilotOpen(!isCopilotOpen)}
 className="fixed bottom-6 right-6 p-4 rounded-full bg-glass-surface from-[var(--royal-gold)] to-[#f2cd56] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-110 transition-transform z-50 flex items-center justify-center font-bold"
 title="المساعد الذكي (Copilot)"
 >
 {isCopilotOpen ? <X className="w-8 h-8" /> : <Bot className="w-8 h-8" />}
 </button>

 <AnimatePresence>
 {isCopilotOpen && (
 <motion.div
 initial={{ opacity: 0, y: 50, scale: 0.9 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 50, scale: 0.9 }}
 className="fixed bottom-24 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-6 w-[calc(100vw-2rem)] sm:w-[400px] h-[600px] max-h-[80vh] bg-[#050505]/95 border border-[var(--royal-gold)]/30 rounded-2xl shadow-2xl overflow-hidden z-[60] flex flex-col backdrop-blur-xl"
 >
 <div className="bg-[var(--royal-gold)]/10 border-b border-[var(--royal-gold)]/20 px-4 py-3 flex items-center justify-between">
 <h3 className="font-bold font-cairo text-[var(--royal-gold)] flex items-center gap-2"><Bot className="w-5 h-5" /> المساعد الذكي</h3>
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

 <AnimatePresence>
 {agentWindows.map((win) => (
 <motion.div
 key={win.id}
 drag
 dragMomentum={false}
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1, x: win.x, y: win.y }}
 exit={{ opacity: 0, scale: 0.8 }}
 className="fixed top-20 left-1/4 w-[600px] h-[500px] bg-[#050505]/95 border border-[var(--nile-teal)]/50 shadow-[0_0_30px_rgba(0,206,209,0.2)] rounded-xl overflow-hidden z-[55] flex flex-col backdrop-blur-xl"
 style={{ position: 'fixed' }}
 >
 <div className="bg-[var(--nile-teal)]/10 border-b border-[var(--nile-teal)]/20 px-4 py-3 flex items-center justify-between cursor-move grab-active">
 <h3 className="font-bold font-cairo text-white flex items-center gap-2 text-sm">
 <div className="w-2 h-2 rounded-full bg-[var(--nile-teal)] "></div>
 {win.title}
 </h3>
 <button
 onClick={() => setAgentWindows(prev => prev.filter(w => w.id !== win.id))}
 className="text-gray-400 hover:text-red-400 transition-colors"
 onPointerDown={(e) => e.stopPropagation()}
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
 </>
 );
}
