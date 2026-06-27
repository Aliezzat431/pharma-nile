'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {


  }, []);

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const msgData: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'د. أحمد', // Hardcoded for demo
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, msgData]);
    setInput('');
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start font-cairo">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="glass-panel w-[350px] mb-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col dir-rtl"
            style={{ height: '450px' }}
          >
            {}
            <div className="bg-[#00CED1]/20 p-4 border-b border-white/10 flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
                 <h3 className="font-bold text-white">دردشة الفريق</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-300 hover:text-white transition-colors"
                title="تصغير"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>

            {}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
               {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm italic text-center">
                    لا توجد رسائل بعد. رحب بزملائك في العمل!
                  </div>
               ) : (
                 messages.map((msg) => {
                   const isMe = msg.sender === 'د. أحمد';
                   return (
                     <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-start items-start text-right' : 'self-end items-end text-left'}`}>
                        <span className="text-[10px] text-gray-400 mb-1 px-1">{msg.sender} • {msg.timestamp}</span>
                        <div className={`px-4 py-2 rounded-2xl ${
                          isMe 
                            ? 'bg-gradient-to-r from-[#00CED1] to-[#009b9e] text-white rounded-bl-none' 
                            : 'bg-white/10 text-white border border-white/5 rounded-br-none'
                        }`}>
                           <p className="text-sm">{msg.text}</p>
                        </div>
                     </div>
                   );
                 })
               )}
               <div ref={messagesEndRef} />
            </div>

            { }
            <form onSubmit={sendMessage} className="p-3 bg-[#050505]/50 border-t border-white/10 flex gap-2">
               <input 
                 type="text" 
                 placeholder="اكتب رسالتك هنا..." 
                 className="flex-1 bg-transparent border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[#00CED1] text-sm text-right"
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 autoFocus={isOpen}
               />
               <button 
                 type="submit"
                 disabled={!input.trim()}
                 className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <Send className="w-4 h-4 mr-0.5 rotate-180" />
               </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all ${
          isOpen 
            ? 'glass-card text-gray-400' 
            : 'bg-gradient-to-r from-[#00CED1] to-[#009b9e] text-white hover:shadow-[0_0_20px_rgba(0,206,209,0.5)]'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}

