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
 
export default function CopilotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'أهلاً بك يا دكتور! أنا محسن، مساعدك الذكي. أنا هنا لمساعدتك في حل أي مشكلة تواجهها في الصيدلية. ماذا يمكنني أن أفعل لك الآن؟' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tabs, setTabs] = useState<{id: string, type: string, title: string}[]>([
    { id: 'welcome', type: 'welcome', title: 'البداية' }
  ]);
  const [activeTabId, setActiveTabId] = useState('welcome');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addTab = (type: string, title: string) => {
    // If tab of this type already exists, just switch to it
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
    if (tabs.length === 1) return;
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
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

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      
      // 1. Handle UI Tab Actions
      if (data.actions && data.actions.length > 0) {
        data.actions.forEach((act: any) => {
           addTab(act.type, act.title);
        });
      }

      // 2. Handle Agentic Commands (Direct Execution in Iframes)
      if (data.commands && data.commands.length > 0) {
        setTimeout(() => {
          data.commands.forEach((cmd: any) => {
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
              iframe.contentWindow?.postMessage({
                command: cmd.type,
                data: cmd.payload
              }, window.location.origin);
            });
          });
        }, 500); // Small delay to ensure tab is rendered
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'عذراً، حدث خطأ في التواصل مع محسن.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      
      {/* Left Column: AI Chat */}
      <div className="w-[450px] flex flex-col gap-4">
        <div className="flex-1 glass-panel flex flex-col overflow-hidden relative">
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-[#00CED1] flex items-center justify-center">
                 <Sparkles className="w-5 h-5 text-black" />
               </div>
               <h2 className="font-bold font-cairo text-white">المساعد محسن</h2>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active AI</span>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[85%] p-4 rounded-2xl font-cairo text-sm leading-relaxed shadow-lg ${
                  msg.role === 'user' 
                    ? 'bg-white/10 text-white border border-white/10 rounded-br-none' 
                    : 'bg-[#00CED1]/20 text-[#00CED1] border border-[#00CED1]/30 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-3 border border-white/5">
                  <Loader2 className="w-4 h-4 animate-spin text-[#00CED1]" />
                  <span className="text-xs text-gray-500 font-cairo italic">محسن يفكر...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-[#050505]/50 border-t border-white/5">
            <div className="relative flex items-center gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="تحدث مع محسن..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#00CED1]/50 outline-none transition-all pr-12 font-cairo"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute left-2 w-8 h-8 rounded-lg bg-[#00CED1] text-black flex items-center justify-center hover:bg-[#47eaed] transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Multi-Tab Multi-Action Sandbox */}
      <div className="flex-1 flex flex-col glass-panel overflow-hidden border-white/5 bg-[#050505]/50">
        
        {/* Modern Tab Bar */}
        <div className="flex items-center gap-1 p-2 bg-white/5 border-b border-white/5 overflow-x-auto scrollbar-hide">
           {tabs.map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTabId(tab.id)}
               className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all font-cairo whitespace-nowrap group relative ${
                 activeTabId === tab.id 
                   ? 'text-[#00CED1] bg-[#00CED1]/10 border border-[#00CED1]/30' 
                   : 'text-gray-500 hover:bg-white/5'
               }`}
             >
               <span className="text-sm font-bold">{tab.title}</span>
               {tabs.length > 1 && (
                 <X 
                  onClick={(e) => closeTab(tab.id, e)}
                  className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all" 
                 />
               )}
               {activeTabId === tab.id && (
                 <motion.div layoutId="activeTab" className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-[#00CED1]" />
               )}
             </button>
           ))}
        </div>

        {/* Dynamic Viewport */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            {tabs.map((tab) => {
              if (tab.id !== activeTabId) return null;

              return (
                <motion.div 
                  key={tab.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute inset-0 w-full h-full"
                >
                  {tab.type === 'welcome' && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-center">
                       <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-[#00CED1] to-[#47eaed] flex items-center justify-center neon-glow-teal shadow-2xl relative">
                          <Sparkles className="w-16 h-16 text-black" />
                       </div>
                       <div className="space-y-3">
                          <h2 className="text-4xl font-bold font-cairo">محسن في خدمتك</h2>
                          <p className="text-gray-500 font-cairo max-w-md mx-auto text-lg">
                            اسأل محسن عن أي مشكلة برمجية أو إدارية في الصيدلية وسيقوم بفتح الأدوات اللازمة لك.
                          </p>
                       </div>
                    </div>
                  )}

                  {(tab.type === 'pos' || tab.type === 'inventory' || tab.type === 'customers' || tab.type === 'financials') && (
                    <iframe 
                      src={`/${tab.type === 'pos' ? 'pos' : tab.type}?minimal=true`} 
                      className="w-full h-full border-none"
                      title={tab.title}
                    />
                  )}

                  {tab.type === 'sales_chart' && (
                    <div className="p-8 w-full h-full">
                       <h3 className="text-2xl font-bold font-cairo mb-8">التحليلات والمخططات</h3>
                       <div className="glass-card p-10 h-[500px] flex items-end justify-between gap-4">
                         {[30, 80, 45, 90, 60, 75, 40].map((h, i) => (
                           <div key={i} className="flex-1 bg-[#00CED1]/20 rounded-xl hover:bg-[#00CED1]/40 transition-all cursor-pointer group relative" style={{height: `${h}%`}}>
                             <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 bg-black text-[#00CED1] px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                               1,{h}50
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
