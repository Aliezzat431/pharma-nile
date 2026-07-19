'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sparkles, Loader2, X, Mic, MicOff, Download, 
  Trash2, Copy, Check, Lightbulb, Zap, AlertCircle,
  Package, Users, ShieldCheck, ShoppingCart, TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: TabAction[];
  copied?: boolean;
};

type TabItem = {
  id: string;
  type: string;
  title: string;
  icon?: string;
  createdAt: Date;
};

type TabAction = {
  type: string;
  title: string;
};

type QuickAction = {
  icon: React.ReactNode;
  label: string;
  prompt: string;
  color: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: <Package className="w-4 h-4" />,
    label: 'جرد المخزون',
    prompt: 'اعمل جرد للمخزون وعرض الأصناف الناقصة',
    color: 'var(--nile-teal)'
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    label: 'تقرير المبيعات',
    prompt: 'اعرض لي تقرير مبيعات اليوم مع المقارنة بالأمس',
    color: '#FF69B4'
  },
  {
    icon: <Users className="w-4 h-4" />,
    label: 'العملاء المتأخرون',
    prompt: 'اعرض العملاء اللي عليهم متأخرات',
    color: 'var(--royal-gold)'
  },
  {
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'الأدوية قاربت على الانتهاء',
    prompt: 'اعرض الأدوية اللي هتنتهي صلاحيتها خلال 3 شهور',
    color: '#FF6347'
  }
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'أهلاً بك يا دكتور! 👋\n\nأنا **محسن**، مساعدك الذكي في الصيدلية. أقدر أساعدك في:\n\n- 📦 **جرد المخزون** واكتشاف النواقص\n- 📊 **تحليل المبيعات** والتقارير\n- 👥 **إدارة العملاء** والمتأخرات\n- 💊 **متابعة الأدوية** وصلاحيتها\n- 💰 **الحسابات المالية** والفواتير\n\nاسألني عن أي حاجة أو جرب الاقتراحات بالأسفل 👇',
  timestamp: new Date(),
  actions: []
};

export default function CopilotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tabs, setTabs] = useState<TabItem[]>([
    { id: 'welcome', type: 'welcome', title: 'البداية', createdAt: new Date() }
  ]);
  const [activeTabId, setActiveTabId] = useState('welcome');
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  
  useEffect(() => {
    loadChatHistory();
    initSpeechRecognition();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const initSpeechRecognition = () => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ar-EG';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('المتصفح لا يدعم التعرف على الصوت. جرب Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const loadChatHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('copilot_chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!error && data && data.length > 0) {
        const loadedMessages = data.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          actions: msg.actions || []
        }));
        
        setMessages([WELCOME_MESSAGE, ...loadedMessages.reverse()]);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  };

  const saveMessage = async (message: Message) => {
    if (!user) return;
    
    try {
      await supabase.from('copilot_chats').insert({
        id: message.id,
        user_id: user.id,
        role: message.role,
        content: message.content,
        actions: message.actions || [],
        created_at: message.timestamp
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  };

  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addTab = (type: string, title: string) => {
    const existing = tabs.find(t => t.type === type);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }
    
    const id = `tab_${type}_${Date.now()}`;
    const newTab: TabItem = { id, type, title, createdAt: new Date() };
    
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(id);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    
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

  const copyToClipboard = async (text: string, msgId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, copied: true } : m
      ));
      setTimeout(() => {
        setMessages(prev => prev.map(m => 
          m.id === msgId ? { ...m, copied: false } : m
        ));
      }, 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const exportChat = () => {
    const chatText = messages
      .filter(m => m.id !== 'welcome')
      .map(m => `[${m.role === 'user' ? 'أنت' : 'محسن'}] ${m.content}`)
      .join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `copilot-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearChat = async () => {
    if (!confirm('هل أنت متأكد من مسح المحادثة؟')) return;
    
    setMessages([WELCOME_MESSAGE]);
    
    if (user) {
      try {
        await supabase
          .from('copilot_chats')
          .delete()
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Error clearing chat:', err);
      }
    }
  };

  const sendCommandToIframes = (commands: any[]) => {
    setTimeout(() => {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        commands.forEach((cmd: any) => {
          iframe.contentWindow?.postMessage({
            source: 'copilot',
            command: cmd.type,
            data: cmd.payload,
            timestamp: Date.now()
          }, window.location.origin);
        });
      });
    }, 800);
  };

  const handleSend = async (customMessage?: string) => {
    const messageText = customMessage || input.trim();
    if (!messageText || loading) return;

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    saveMessage(userMsg);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageText, 
          chatHistory: messages.slice(-10),
          context: {
            userId: user?.id,
            pharmacyId: user?.user_metadata?.pharmacy_id,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        actions: data.actions || []
      };

      setMessages(prev => [...prev, assistantMsg]);
      saveMessage(assistantMsg);

      if (data.commands?.length > 0) {
        sendCommandToIframes(data.commands);
      }

    } catch (err) {
      console.error("Copilot error:", err);
      
      const errorMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: '⚠️ عذراً يا دكتور، حدث خطأ في الاتصال. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSend(action.prompt);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto p-4" dir="rtl">
      
      {}
      <div className="w-full lg:w-[480px] flex flex-col h-full gap-4 order-last lg:order-first">
        <div className="flex-1 glass-panel flex flex-col overflow-hidden relative border border-[var(--glass-border)] bg-background/50 backdrop-blur-xl">
          
          {}
          <div className="p-4 border-b border-[var(--glass-border)] bg-gradient-to-l from-[var(--nile-teal)]/5 to-transparent flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--nile-teal)] to-[var(--nile-teal)]/60 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-5 h-5 text-black" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
                </div>
                <div>
                  <h2 className="font-bold font-cairo text-white text-base">المساعد محسن</h2>
                  <p className="text-[10px] text-gray-400 font-sans">AI Assistant • v2.0</p>
                </div>
             </div>
             
             <div className="flex items-center gap-1">
               <button 
                 onClick={exportChat}
                 className="p-2 hover:bg-[var(--glass-surface)] rounded-lg text-gray-400 hover:text-white transition-all"
                 title="تصدير المحادثة"
               >
                 <Download className="w-4 h-4" />
               </button>
               <button 
                 onClick={clearChat}
                 className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-all"
                 title="مسح المحادثة"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
             </div>
          </div>

          {}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} group`}
                >
                  <div className={`relative max-w-[85%] ${msg.role === 'user' ? '' : ''}`}>
                    <div className={`p-4 rounded-2xl font-cairo text-sm leading-relaxed shadow-lg text-right ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-white/10 to-white/5 text-white border border-[var(--glass-border)] rounded-br-sm' 
                        : 'bg-gradient-to-br from-[var(--nile-teal)]/10 to-[var(--nile-teal)]/5 text-gray-100 border border-[var(--nile-teal)]/20 rounded-bl-sm'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              strong: ({ children }) => <strong className="text-[var(--nile-teal)] font-bold">{children}</strong>,
                              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                              li: ({ children }) => <li className="text-gray-200">{children}</li>,
                              code: ({ children }) => (
                                <code className="bg-black/30 px-1.5 py-0.5 rounded text-[var(--nile-teal)] text-xs font-mono">
                                  {children}
                                </code>
                              )
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                    
                    {}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="p-1.5 hover:bg-[var(--glass-surface)] rounded-lg text-gray-500 hover:text-white transition-all"
                          title="نسخ"
                        >
                          {msg.copied ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                    
                    {}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-4 p-4 bg-[var(--glass-surface)] border border-[var(--nile-teal)]/30 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--nile-teal)]/10 to-transparent pointer-events-none" />
                        <div className="flex items-center gap-2 mb-3 relative z-10">
                          <AlertCircle className="w-4 h-4 text-[var(--nile-teal)] animate-pulse" />
                          <h4 className="text-sm font-bold font-cairo text-white">إذن مطلوب لتنفيذ عملية (Multi-iFrame Orchestrator):</h4>
                        </div>
                        <p className="text-xs text-gray-300 font-cairo mb-4 relative z-10">
                          يستأذنك محسن في المضي قدماً وتنفيذ المهام التلقائية التالية. هل تصرح له بذلك؟
                        </p>
                        <div className="flex flex-col gap-2 relative z-10">
                          {msg.actions.map((action, idx) => {
                            const isApproved = msg.content.includes(`[APPROVED_${action.type}]`);
                            const isDenied = msg.content.includes(`[DENIED_${action.type}]`);
                            
                            return (
                              <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-black/40 rounded-xl border border-[var(--glass-border)]">
                                <span className="text-xs font-bold font-cairo text-gray-200">
                                  {action.title} ({action.type})
                                </span>
                                <div className="flex gap-2">
                                  {!isApproved && !isDenied && (
                                    <>
                                      <button
                                        onClick={() => {
                                          addTab(action.type, action.title);
                                          handleSend(`تم تصريح الإجراء: ${action.title}`);
                                        }}
                                        className="px-4 py-1.5 bg-[var(--nile-teal)]/20 hover:bg-[var(--nile-teal)]/40 text-[var(--nile-teal)] rounded-lg text-xs font-cairo transition-all flex items-center gap-1.5 font-bold border border-[var(--nile-teal)]/30 w-full justify-center md:w-auto"
                                      >
                                        <Check className="w-3.5 h-3.5" /> السماح والتنفيذ
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleSend(`تم رفض الإجراء: ${action.title}`);
                                        }}
                                        className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-cairo transition-all flex items-center gap-1.5 font-bold border border-red-500/20 w-full justify-center md:w-auto"
                                      >
                                        <X className="w-3.5 h-3.5" /> رفض
                                      </button>
                                    </>
                                  )}
                                  {isApproved && <span className="text-xs text-green-400 font-bold flex items-center gap-1"><Check className="w-3 h-3"/> مُصرح</span>}
                                  {isDenied && <span className="text-xs text-red-400 font-bold flex items-center gap-1"><X className="w-3 h-3"/> مرفوض</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {loading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end"
              >
                <div className="bg-gradient-to-br from-[var(--nile-teal)]/10 to-[var(--nile-teal)]/5 p-4 rounded-2xl flex items-center gap-3 border border-[var(--nile-teal)]/20">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[var(--nile-teal)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-[var(--nile-teal)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-[var(--nile-teal)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs text-gray-400 font-cairo">محسن يفكر...</span>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {}
          {messages.length <= 1 && (
            <div className="p-4 border-t border-[var(--glass-border)] bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-[var(--royal-gold)]" />
                <span className="text-xs text-gray-400 font-cairo">اقتراحات سريعة</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((action, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleQuickAction(action)}
                    className="p-3 bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-heavy)] border border-[var(--glass-border)] hover:border-white/20 rounded-xl transition-all text-right group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div style={{ color: action.color }}>{action.icon}</div>
                      <span className="text-xs font-bold text-white font-cairo">{action.label}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {}
          <div className="p-4 bg-background/50 border-t border-[var(--glass-border)]">
            <div className="relative flex items-center gap-2">
              <button
                onClick={toggleListening}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-heavy)] text-gray-400 hover:text-white'
                }`}
                title={isListening ? 'إيقاف الاستماع' : 'إدخال صوتي'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              
              <input 
                ref={inputRef}
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isListening ? 'جاري الاستماع...' : 'اسأل محسن عن أي حاجة...'} 
                disabled={isListening}
                className="flex-1 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-[var(--nile-teal)]/50 outline-none transition-all font-cairo text-right disabled:opacity-50"
              />
              
              <button 
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="absolute left-2 w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--nile-teal)] to-[var(--nile-teal)]/80 text-black flex items-center justify-center hover:shadow-lg hover:shadow-[var(--nile-teal)]/20 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <Send className="w-4 h-4 transform rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="flex-1 flex flex-col glass-panel overflow-hidden border border-[var(--glass-border)] bg-background/50 backdrop-blur-xl h-full">
        
        {}
        <div className="flex items-center gap-1 p-2 bg-[var(--glass-surface)] border-b border-[var(--glass-border)] overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
           <AnimatePresence>
             {tabs.map((tab) => {
               const isActive = activeTabId === tab.id;
               return (
                 <motion.button
                   key={tab.id}
                   layout
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   onClick={() => setActiveTabId(tab.id)}
                   className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-cairo whitespace-nowrap group relative border ${
                     isActive 
                       ? 'text-[var(--nile-teal)] bg-[var(--nile-teal)]/10 border-[var(--nile-teal)]/30 font-bold shadow-lg shadow-[var(--nile-teal)]/5' 
                       : 'text-gray-500 border-transparent hover:bg-[var(--glass-surface)] hover:text-gray-300'
                   }`}
                 >
                   <span className="text-sm">{tab.title}</span>
                   {tabs.length > 1 && (
                     <X 
                      onClick={(e) => closeTab(tab.id, e)}
                      className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 hover:text-red-400 transition-all" 
                     />
                   )}
                   {isActive && (
                     <motion.div 
                       layoutId="activeTabIndicator" 
                       className="absolute bottom-[-9px] left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-[var(--nile-teal)] to-transparent" 
                     />
                   )}
                 </motion.button>
               );
             })}
           </AnimatePresence>
        </div>

        {}
        <div className="flex-1 relative w-full h-full overflow-hidden">
          <AnimatePresence mode="wait">
            {tabs.map((tab) => {
              if (tab.id !== activeTabId) return null;

              return (
                <motion.div 
                  key={tab.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 w-full h-full"
                >
                  {tab.type === 'welcome' && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-8 text-center p-8">
                       <motion.div
                         initial={{ scale: 0, rotate: -180 }}
                         animate={{ scale: 1, rotate: 0 }}
                         transition={{ type: 'spring', duration: 0.8 }}
                         className="relative"
                       >
                         <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-[var(--nile-teal)] to-[var(--nile-teal)]/40 flex items-center justify-center shadow-[0_0_50px_rgba(0,206,209,0.3)]">
                            <Sparkles className="w-16 h-16 text-black" />
                         </div>
                         <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#FF69B4] rounded-full flex items-center justify-center animate-bounce">
                           <Zap className="w-4 h-4 text-white" />
                         </div>
                       </motion.div>
                       
                       <div className="space-y-3 max-w-lg">
                          <h2 className="text-4xl font-bold font-cairo text-white">محسن في خدمتك</h2>
                          <p className="text-gray-400 font-cairo text-base leading-relaxed">
                            مساعدك الذكي لإدارة الصيدلية بكفاءة. اسألني عن أي حاجة وأنا هنفذها لك فوراً!
                          </p>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-3 w-full max-w-md mt-4">
                         {[
                           { icon: <Package className="w-5 h-5" />, label: 'المخزون', color: 'var(--nile-teal)' },
                           { icon: <Users className="w-5 h-5" />, label: 'العملاء', color: '#FF69B4' },
                           { icon: <TrendingUp className="w-5 h-5" />, label: 'المبيعات', color: 'var(--royal-gold)' },
                           { icon: <ShieldCheck className="w-5 h-5" />, label: 'التقارير', color: '#9370DB' }
                         ].map((item, idx) => (
                           <motion.div
                             key={idx}
                             initial={{ opacity: 0, y: 20 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: idx * 0.1 }}
                             className="p-4 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl hover:bg-[var(--glass-surface-heavy)] transition-all cursor-pointer"
                           >
                             <div style={{ color: item.color }}>{item.icon}</div>
                             <p className="text-white text-sm font-cairo mt-2">{item.label}</p>
                           </motion.div>
                         ))}
                       </div>
                    </div>
                  )}

                  {(tab.type === 'pos' || tab.type === 'inventory' || tab.type === 'customers' || tab.type === 'financials') && (
                    <iframe 
                      src={`/${tab.type}?minimal=true&from=copilot`} 
                      className="w-full h-full border-none bg-transparent"
                      title={tab.title}
                      sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                  )}

                  {tab.type === 'sales_chart' && (
                    <div className="p-8 w-full h-full flex flex-col text-right">
                       <h3 className="text-xl font-bold font-cairo text-white mb-6">التحليلات والمخططات</h3>
                       <div className="glass-panel p-8 flex-1 flex items-end justify-between gap-3 border border-[var(--glass-border)] bg-white/[0.02]">
                         {[35, 80, 50, 95, 65, 75, 45].map((h, i) => (
                           <motion.div 
                             key={i} 
                             initial={{ height: 0 }}
                             animate={{ height: `${h}%` }}
                             transition={{ delay: i * 0.1, duration: 0.5 }}
                             className="flex-1 bg-gradient-to-t from-[var(--nile-teal)]/20 to-[var(--nile-teal)]/5 border border-[var(--nile-teal)]/30 rounded-xl hover:from-[var(--nile-teal)]/30 hover:to-[var(--nile-teal)]/10 transition-all cursor-pointer group relative" 
                           >
                             <div className="absolute top-[-35px] left-1/2 -translate-x-1/2 bg-background border border-[var(--glass-border)] text-[var(--nile-teal)] font-sans px-2 py-0.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                               1,{h}50 ج.م
                             </div>
                           </motion.div>
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
