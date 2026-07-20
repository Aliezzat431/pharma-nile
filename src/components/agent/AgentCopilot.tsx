'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { RootState } from '@/store';
import { toggleChat, openIframe, setPendingApproval } from '@/store/slices/agentSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Loader2, AlertTriangle, Undo2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function AgentCopilot() {
  const dispatch = useDispatch();
  const store = useStore<RootState>();
  const { isChatOpen, agentPendingApproval, progressLogs } = useSelector((state: RootState) => state.agent);
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'أهلاً بك! أنا المساعد الذكي لنظام فارما نايل. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentPendingApproval]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          history: messages.slice(-5),
          scrapedContext: store.getState().agent.scrapedContext
        })
      });

      const data = await response.json();
      
      if (data.reply) {
        let cleanReply = data.reply;
        
        // Scan for stray ACTION tokens (e.g., ACTION:INVENTORY or [ACTION:INVENTORY])
        const actionMatch = cleanReply.match(/\[?ACTION:([A-Z_]+)\]?/);
        if (actionMatch) {
          const rawAction = actionMatch[1].toUpperCase();
          
          let url = '/';
          let title = 'شاشة';

          switch (rawAction) {
            case 'INVENTORY':
              url = '/inventory';
              title = 'المخزون والجرد';
              break;
            case 'POS':
              url = '/pos';
              title = 'نقطة البيع';
              break;
            case 'FINANCIALS':
              url = '/financials';
              title = 'الماليات والتقارير';
              break;
            case 'CUSTOMERS':
              url = '/customers';
              title = 'العملاء';
              break;
            case 'SALES_CHART':
              url = '/orders'; // Using /orders for sales analysis
              title = 'المبيعات';
              break;
            default:
              url = `/${rawAction.toLowerCase()}`;
              title = rawAction;
          }

          // Clean up the visible text to prevent hallucinated code words from rendering
          cleanReply = cleanReply.replace(/\[?ACTION:[A-Z_]+\]?/g, '').trim();

          // UI Guard: Do not dispatch another screen render loop if the data for this screen is already populated in our local state!
          const activeContexts = store.getState().agent.scrapedContext;
          const isAlreadyScraped = activeContexts && Object.keys(activeContexts).some(key => key.includes(url));

          if (!isAlreadyScraped) {
            // Dispatch directly to the WorkspaceManager layout seamlessly
            dispatch(openIframe({
              id: `iframe-action-${Date.now()}`,
              url,
              title
            }));
          } else {
            console.log(`Intercepted duplicate [ACTION] request for ${url} - Data is already scraped and active.`);
          }
        }

        if (cleanReply) {
          setMessages(prev => [...prev, { role: 'assistant', content: cleanReply }]);
        }
      }

      if (data.action) {
        handleAgentAction(data.action);
      }
      
    } catch (error) {
      console.error("Agent interaction failed", error);
      setMessages(prev => [...prev, { role: 'system', content: 'حدث خطأ في الاتصال بالمساعد الذكي.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentAction = (action: any) => {
    switch (action.type) {
      case 'OPEN_IFRAME':
        dispatch(openIframe({
          id: `iframe-${Date.now()}`,
          url: action.url,
          title: action.title || 'نافذة مهام'
        }));
        break;
      case 'ASK_PERMISSION':
        dispatch(setPendingApproval({
          message: action.message,
          payload: action.payload,
          actionType: action.actionType
        }));
        break;
      case 'EXECUTE_SUCCESS':

        break;
    }
  };

  const handleApprove = async () => {
    if (!agentPendingApproval) return;
    
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: '[تمت الموافقة على طلب التنفيذ]' }]);
    
    try {

      const response = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentPendingApproval)
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'تم تنفيذ المهمة بنجاح.' }]);
      
    } catch (error) {
      setMessages(prev => [...prev, { role: 'system', content: 'فشل تنفيذ المهمة.' }]);
    } finally {
      dispatch(setPendingApproval(null));
      setIsLoading(false);
    }
  };

  const handleReject = () => {
    setMessages(prev => [...prev, { role: 'user', content: '[تم رفض طلب التنفيذ]' }]);
    dispatch(setPendingApproval(null));
  };

  return (
    <>
      {}
      {!isChatOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => dispatch(toggleChat())}
          className="fixed bottom-6 left-6 w-16 h-16 rounded-full bg-[var(--nile-teal)] hover:bg-[var(--nile-teal)]/80 text-black shadow-[0_0_20px_rgba(0,206,209,0.4)] flex items-center justify-center z-50 transition-colors"
        >
          <Bot className="w-8 h-8" />
        </motion.button>
      )}

      {}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-6 w-[400px] h-[600px] glass-panel border border-[var(--nile-teal)]/30 shadow-2xl flex flex-col overflow-hidden z-50"
          >
            {}
            <div className="h-16 bg-[var(--nile-teal)]/10 border-b border-[var(--glass-border)] flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="bg-[var(--nile-teal)] p-2 rounded-lg">
                  <Bot className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-white">المساعد الذكي (Copilot)</h3>
                  <p className="text-xs text-[var(--nile-teal)] font-cairo">متصل بالذكاء الاصطناعي</p>
                </div>
              </div>
              <button 
                onClick={() => dispatch(toggleChat())}
                className="text-gray-400 hover:text-white p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl font-cairo text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[var(--nile-teal)] text-black rounded-bl-none' 
                        : msg.role === 'system'
                        ? 'bg-red-500/20 text-red-200 border border-red-500/30 w-full text-center'
                        : 'bg-[var(--glass-surface-heavy)] text-white rounded-br-none border border-[var(--glass-border)]'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {}
              {agentPendingApproval && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-orange-500/10 border border-orange-500/50 rounded-xl p-4 font-cairo"
                >
                  <div className="flex items-center gap-2 text-orange-400 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <h4 className="font-bold">مطلوب تأكيد أمني</h4>
                  </div>
                  <p className="text-white text-sm mb-4 leading-relaxed">
                    {agentPendingApproval.message}
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleApprove}
                      disabled={isLoading}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-bold text-sm transition-colors"
                    >
                      موافق
                    </button>
                    <button 
                      onClick={handleReject}
                      disabled={isLoading}
                      className="flex-1 bg-[var(--glass-surface-heavy)] hover:bg-white/20 text-white py-2 rounded-lg font-bold text-sm transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </motion.div>
              )}

              {isLoading && !agentPendingApproval && (
                <div className="flex justify-start">
                  <div className="bg-[var(--glass-surface)] p-3 rounded-2xl rounded-br-none border border-[var(--glass-border)]">
                    <Loader2 className="w-5 h-5 text-[var(--nile-teal)] animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {progressLogs.length > 0 && isLoading && !agentPendingApproval && (
              <div className="px-4 pb-2">
                <div className="bg-black/30 rounded-xl p-3 border border-[var(--glass-border)]">
                  {progressLogs.map((log, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-[var(--nile-teal)] flex items-center gap-2 mb-1 last:mb-0"
                    >
                      <Loader2 className="w-3 h-3 animate-spin inline-block" />
                      {log}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {}
            <div className="p-4 border-t border-[var(--glass-border)] bg-black/40">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="اسأل المساعد عن أي شيء..."
                  className="flex-1 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-white font-cairo focus:outline-none focus:border-[var(--nile-teal)]/50 text-sm"
                  disabled={isLoading || !!agentPendingApproval}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim() || !!agentPendingApproval}
                  className="w-12 flex items-center justify-center bg-[var(--nile-teal)] text-black rounded-xl hover:bg-[var(--nile-teal)]/80 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5 rtl:hidden" />
                  <Send className="w-5 h-5 hidden rtl:block rotate-180" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

