'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { RootState } from '@/store';
import { toggleChat, openIframe, setPendingApproval } from '@/store/slices/agentSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Loader2, AlertTriangle } from 'lucide-react';

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
        
        // 1. Catch ANY aggressive dynamic variation of the action text (e.g. ACTION:INVENTORY or [ACTION:POS])
        const actionMatch = cleanReply.match(/ACTION:\s*([A-Z_]+)/i);
        
        if (actionMatch) {
          const rawAction = actionMatch[1].toUpperCase();
          console.log("🎯 Intercepted UI Action:", rawAction);
          
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
            case 'ORDERS':
              url = '/orders'; 
              title = 'المبيعات';
              break;
            default:
              url = `/${rawAction.toLowerCase()}`;
              title = rawAction;
          }

          // 2. Aggressively strip out any variation of the action token globally from the chat bubble
          cleanReply = cleanReply.replace(/\[?ACTION:\s*[a-zA-Z_]+\]?/gi, '').trim();

          // 3. UI Guard: Check if we already have the fresh scraped dynamic DOM data
          const activeContexts = store.getState().agent.scrapedContext;
          const isAlreadyScraped = activeContexts && Object.keys(activeContexts).some(key => key.includes(url));

          if (!isAlreadyScraped) {
            // Force Multi-iFrame Orchestrator Permission Card instead of silent auto-spawning
            dispatch(setPendingApproval({
              message: `المخزون والجرد (${title})`,
              actionType: 'OPEN_IFRAME',
              payload: { id: `iframe-action-${Date.now()}`, url, title }
            }));
          } else {
            console.log(`⚡ Data already active for ${url}. Bypassing permission block.`);
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
      // Direct Interception: Execute the iframe opening immediately within the Workspace layout!
      if (agentPendingApproval.actionType === 'OPEN_IFRAME' && (agentPendingApproval as any).payload) {
        dispatch(openIframe((agentPendingApproval as any).payload));
      } else {
        const response = await fetch('/api/agent/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agentPendingApproval)
        });
        
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'تم تنفيذ المهمة بنجاح.' }]);
      }
      
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

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-6 w-[400px] h-[600px] glass-panel border border-[var(--nile-teal)]/30 shadow-2xl flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
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

            {/* Chat Messages */}
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
              
              {/* Orchestrator Permission Guard Card */}
              {agentPendingApproval && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 font-cairo shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                >
                  <div className="text-white text-xs mb-3 border-b border-white/10 pb-2">
                    إذن مطلوب لتنفيذ عملية (Multi-iFrame Orchestrator):
                  </div>
                  <p className="text-gray-300 text-xs mb-4 leading-relaxed">
                    يستأذنك محسن في المضي قدماً وتنفيذ المهام التلقائية التالية. هل تصرح له بذلك؟
                  </p>
                  <div className="text-[var(--nile-teal)] text-sm font-bold mb-4 flex items-center gap-2 bg-black/30 p-2 rounded border border-white/5">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    {agentPendingApproval.message}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleApprove}
                      disabled={isLoading}
                      className="flex-1 bg-[var(--nile-teal)] hover:bg-[var(--nile-teal)]/80 text-black py-2 rounded-lg font-bold text-xs transition-colors"
                    >
                      السماح والتنفيذ
                    </button>
                    <button 
                      onClick={handleReject}
                      disabled={isLoading}
                      className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 py-2 rounded-lg font-bold text-xs border border-red-500/30 transition-colors"
                    >
                      رفض
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

            {/* Traversal Tracking Logs Progress */}
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
            
            {/* Input Footer */}
            <div className="p-4 border-t border-[var(--glass-border)] bg-black/40">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="اسأل محسن عن أي حاجة..."
                  className="flex-1 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-white font-cairo focus:outline-none focus:border-[var(--nile-teal)]/50 text-sm"
                  disabled={isLoading || !!agentPendingApproval}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim() || !!agentPendingApproval}
                  className="w-12 flex items-center justify-center bg-[var(--nile-teal)] text-black rounded-xl hover:bg-[var(--nile-teal)]/80 disabled:opacity-50 transition-colors"
                >
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