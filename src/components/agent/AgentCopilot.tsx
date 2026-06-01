'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  const { isChatOpen, agentPendingApproval } = useSelector((state: RootState) => state.agent);
  
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
      // Create a context summary to send alongside
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          history: messages.slice(-5) // Send last 5 messages for context
        })
      });

      const data = await response.json();
      
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }

      // Handle Tools/Actions from the Agent
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
        // A direct DB execution succeeded without needing permission
        break;
    }
  };

  const handleApprove = async () => {
    if (!agentPendingApproval) return;
    
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: '[تمت الموافقة على طلب التنفيذ]' }]);
    
    try {
      // In a real implementation, this hits an API that executes the payload and logs to agent_action_logs
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
      {/* Floating Button */}
      {!isChatOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => dispatch(toggleChat())}
          className="fixed bottom-6 left-6 w-16 h-16 rounded-full bg-[#00CED1] hover:bg-[#00CED1]/80 text-black shadow-[0_0_20px_rgba(0,206,209,0.4)] flex items-center justify-center z-50 transition-colors"
        >
          <Bot className="w-8 h-8" />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-6 w-[400px] h-[600px] glass-panel border border-[#00CED1]/30 shadow-2xl flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="h-16 bg-[#00CED1]/10 border-b border-white/10 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#00CED1] p-2 rounded-lg">
                  <Bot className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="font-cairo font-bold text-white">المساعد الذكي (Copilot)</h3>
                  <p className="text-xs text-[#00CED1] font-cairo">متصل بالذكاء الاصطناعي</p>
                </div>
              </div>
              <button 
                onClick={() => dispatch(toggleChat())}
                className="text-gray-400 hover:text-white p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl font-cairo text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#00CED1] text-black rounded-bl-none' 
                        : msg.role === 'system'
                        ? 'bg-red-500/20 text-red-200 border border-red-500/30 w-full text-center'
                        : 'bg-white/10 text-white rounded-br-none border border-white/5'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {/* Approval Box */}
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
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-bold text-sm transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </motion.div>
              )}

              {isLoading && !agentPendingApproval && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-3 rounded-2xl rounded-br-none border border-white/5">
                    <Loader2 className="w-5 h-5 text-[#00CED1] animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/40">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="اسأل المساعد عن أي شيء..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-cairo focus:outline-none focus:border-[#00CED1]/50 text-sm"
                  disabled={isLoading || !!agentPendingApproval}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim() || !!agentPendingApproval}
                  className="w-12 flex items-center justify-center bg-[#00CED1] text-black rounded-xl hover:bg-[#00CED1]/80 disabled:opacity-50 transition-colors"
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
