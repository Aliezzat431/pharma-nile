'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, Package, Users, ShieldCheck, ShoppingCart, TrendingUp, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type TabItem = {
  id: string;
  type: string;
  title: string;
};

export default function CopilotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'أهلاً بك يا دكتور! أنا محسن، مساعدك الذكي. أنا هنا لمساعدتك في حل أي مشكلة تواجهها في الصيدلية. ماذا يمكنني أن أفعل لك الآن؟' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tabs, setTabs] = useState<TabItem[]>([
    { id: 'welcome', type: 'welcome', title: 'البداية' }
  ]);
  const [activeTabId, setActiveTabId] = useState('welcome');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const addTab = (type: string, title: string) => {

    const existing = tabs.find(t => t.type === type);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }
    const id = `${type}-${Date.now()}`;
    setTabs(prev => [...prev, { id, type, title }]);
    setActiveTabId(id);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // منع إغلاق التبويب الأخير بالكامل
    
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);

      if (activeTabId === id) {
        const closedIndex = prev.findIndex(t => t.id === id);
        const nextActiveIndex = closedIndex > 0 ? closedIndex - 1 : 0;
        setActiveTabId(newTabs[nextActiveIndex].id);
      }
      return newTabs;
    });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, chatHistory: messages })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);

      if (data.actions && Array.isArray(data.actions)) {
        data.actions.forEach((act: any) => {
          if (act.type && act.title) {
            addTab(act.type, act.title);
          }
        });
      }

      if (data.commands && Array.isArray(data.commands) && data.commands.length > 0) {
        setTimeout(() => {
          const iframes = document.querySelectorAll('iframe');
          iframes.forEach(iframe => {
            data.commands.forEach((cmd: any) => {
              iframe.contentWindow?.postMessage({
                command: cmd.type,
                data: cmd.payload
              }, window.location.origin);
            });
          });
        }, 600); // مهلة زمنية طفيفة لضمان رندرة التبويب ومستند الـ Iframe بنجاح
      }
    } catch (err) {
      console.error("Copilot error:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'عذراً يا دكتور، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto" dir="rtl">
      
      {}
      <div className="w-full lg:w-[450px] flex flex-col h-full gap-4 order-last lg:order-first">
        <div className="flex-1 glass-panel flex flex-col overflow-hidden relative border border-white/5 bg-background/50">
          
          {}
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#00CED1]/10 flex items-center justify-center border border-[#00CED1]/20">
                  <Sparkles className="w-5 h-5 text-[#00CED1]" />
                </div>
                <h2 className="font-bold font-cairo text-white text-base">المساعد محسن الذكي</h2>
             </div>
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-sans">Active AI</span>
             </div>
          </div>

          {}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[85%] p-4 rounded-2xl font-cairo text-sm leading-relaxed shadow-lg text-right ${
                  msg.role === 'user' 
                    ? 'bg-white/10 text-white border border-white/10 rounded-br-none' 
                    : 'bg-[#00CED1]/10 text-[#00CED1] border border-[#00CED1]/20 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            
            {loading && (
              <div className="flex justify-end">
                <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-3 border border-white/5">
                  <Loader2 className="w-4 h-4 animate-spin text-[#00CED1]" />
                  <span className="text-xs text-gray-500 font-cairo italic">محسن يفكر في الحل...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {}
          <div className="p-4 bg-background/50 border-t border-white/5">
            <div className="relative flex items-center gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="اسأل محسن عن النواقص، جرد المخزن، أو المبيعات..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:border-[#00CED1]/50 outline-none transition-all font-cairo text-right"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute left-2 w-9 h-9 rounded-lg bg-[#00CED1] text-black flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <Send className="w-4 h-4 transform rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="flex-1 flex flex-col glass-panel overflow-hidden border border-white/5 bg-background/50 h-full">
        
        {}
        <div className="flex items-center gap-1 p-2 bg-white/5 border-b border-white/5 overflow-x-auto scrollbar-hide">
           {tabs.map((tab) => {
             const isActive = activeTabId === tab.id;
             return (
               <button
                 key={tab.id}
                 onClick={() => setActiveTabId(tab.id)}
                 className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-cairo whitespace-nowrap group relative border ${
                   isActive 
                     ? 'text-[#00CED1] bg-[#00CED1]/5 border-[#00CED1]/30 font-bold' 
                     : 'text-gray-500 border-transparent hover:bg-white/5 hover:text-gray-300'
                 }`}
               >
                 <span className="text-sm">{tab.title}</span>
                 {tabs.length > 1 && (
                   <X 
                    onClick={(e) => closeTab(tab.id, e)}
                    className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 hover:text-red-400 transition-all mr-1" 
                   />
                 )}
                 {isActive && (
                   <motion.div 
                     layoutId="activeTabIndicator" 
                     className="absolute bottom-[-9px] left-0 right-0 h-[2px] bg-[#00CED1]" 
                   />
                 )}
               </button>
             );
           })}
        </div>

        {}
        <div className="flex-1 relative w-full h-full">
          <AnimatePresence mode="wait">
            {tabs.map((tab) => {
              if (tab.id !== activeTabId) return null;

              return (
                <motion.div 
                  key={tab.id}
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 w-full h-full"
                >
                  {}
                  {tab.type === 'welcome' && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-center p-6">
                       <div className="w-28 h-28 rounded-[2.2rem] bg-gradient-to-br from-[#00CED1] to-[#00CED1]/60 flex items-center justify-center shadow-[0_0_30px_rgba(0,206,209,0.2)] relative">
                          <Sparkles className="w-14 h-14 text-black" />
                       </div>
                       <div className="space-y-2">
                          <h2 className="text-3xl font-bold font-cairo text-white">محسن في خدمتك دائماً</h2>
                          <p className="text-gray-400 font-cairo max-w-md mx-auto text-base leading-relaxed">
                            تحدث مع محسن لتنفيذ مهام إدارية، مراجعة النواقص، أو جرد فواتير العملاء وسيتولى تلقائياً تهيئة الأدوات المناسبة لك في هذه الساحة.
                          </p>
                       </div>
                    </div>
                  )}

                  {}
                  {(tab.type === 'pos' || tab.type === 'inventory' || tab.type === 'customers' || tab.type === 'financials') && (
                    <iframe 
                      src={`/${tab.type === 'pos' ? 'pos' : tab.type}?minimal=true`} 
                      className="w-full h-full border-none bg-transparent"
                      title={tab.title}
                    />
                  )}

                  {}
                  {tab.type === 'sales_chart' && (
                    <div className="p-8 w-full h-full flex flex-col text-right">
                       <h3 className="text-xl font-bold font-cairo text-white mb-6">التحليلات والمخططات الإحصائية</h3>
                       <div className="glass-panel p-8 flex-1 flex items-end justify-between gap-3 border border-white/5 bg-white/[0.02]">
                         {[35, 80, 50, 95, 65, 75, 45].map((h, i) => (
                           <div 
                             key={i} 
                             className="flex-1 bg-[#00CED1]/10 border border-[#00CED1]/20 rounded-xl hover:bg-[#00CED1]/20 transition-all cursor-pointer group relative" 
                             style={{ height: `${h}%` }}
                           >
                             <div className="absolute top-[-35px] left-1/2 -translate-x-1/2 bg-background border border-white/10 text-[#00CED1] font-sans px-2 py-0.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                               1,{h}50 ج.م
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
