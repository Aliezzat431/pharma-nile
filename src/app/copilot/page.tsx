'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Loader2, X, Mic, MicOff, Download,
  Trash2, Copy, Check, Lightbulb, Zap, AlertCircle,
  Package, Users, ShieldCheck, ShoppingCart, TrendingUp,
  ChevronRight, Bot, RefreshCw, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import { store } from '@/store';
import { updateScrapedContext } from '@/store/slices/agentSlice';
import { extractPageSnapshot, snapshotToPromptString, fillField, clickButton, typeIntoSearch } from '@/lib/agent/domExtractor';

/* ─────────────────── TYPES ─────────────────── */
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: TabAction[];
  actionsHandled?: boolean;
  copied?: boolean;
};

type TabAction = {
  type: string;
  title: string;
};

type TabItem = {
  id: string;
  type: string;
  title: string;
  createdAt: Date;
};

type QuickAction = {
  icon: React.ReactNode;
  label: string;
  prompt: string;
  color: string;
};

/* ─────────────────── CONSTANTS ─────────────────── */
const TAB_META: Record<string, { url: string; icon: React.ReactNode; color: string }> = {
  pos: { url: '/pos', icon: <ShoppingCart className="w-3.5 h-3.5" />, color: '#00CED1' },
  inventory: { url: '/inventory', icon: <Package className="w-3.5 h-3.5" />, color: '#FF69B4' },
  sales_chart: { url: '/orders', icon: <TrendingUp className="w-3.5 h-3.5" />, color: '#FFD700' },
  customers: { url: '/customers', icon: <Users className="w-3.5 h-3.5" />, color: '#9370DB' },
  financials: { url: '/financials', icon: <ShieldCheck className="w-3.5 h-3.5" />, color: '#32CD32' },
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: <Package className="w-4 h-4" />,
    label: 'جرد المخزون',
    prompt: 'اعمل جرد للمخزون وعرض الأصناف اللي قربت تنتهي',
    color: 'var(--nile-teal)',
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    label: 'تقرير المبيعات',
    prompt: 'اعرض لي تقرير مبيعات اليوم',
    color: '#FF69B4',
  },
  {
    icon: <Users className="w-4 h-4" />,
    label: 'العملاء المتأخرون',
    prompt: 'اعرض العملاء اللي عليهم متأخرات',
    color: 'var(--royal-gold)',
  },
  {
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'قارب الانتهاء',
    prompt: 'اعرض الأدوية اللي هتنتهي صلاحيتها خلال 3 شهور',
    color: '#FF6347',
  },
];

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'أهلاً بك يا دكتور! 👋\n\nأنا **محسن**، مساعدك الذكي في الصيدلية. أقدر أساعدك في:\n\n- 📦 **جرد المخزون** واكتشاف النواقص\n- 📊 **تحليل المبيعات** والتقارير\n- 👥 **إدارة العملاء** والمتأخرات\n- 💊 **متابعة الأدوية** وصلاحيتها\n- 💰 **الحسابات المالية** والفواتير\n\nاسألني عن أي حاجة أو جرب الاقتراحات بالأسفل 👇',
  timestamp: new Date(),
  actions: [],
  actionsHandled: true,
};

/* ─────────────────── COMPONENT ─────────────────── */
export default function CopilotPage() {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [tabs, setTabs] = useState<TabItem[]>([
    { id: 'welcome', type: 'welcome', title: 'الرئيسية', createdAt: new Date() },
  ]);
  const [activeTabId, setActiveTabId] = useState('welcome');
  const [isListening, setIsListening] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  /* ─── scroll ─── */
  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 80);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  /* ─── init ─── */
  useEffect(() => {
    loadChatHistory();
    initSpeechRecognition();
    return () => recognitionRef.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── speech ─── */
  const initSpeechRecognition = () => {
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window)) return;
    const SR = (window as any).webkitSpeechRecognition;
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'ar-EG';
    r.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsListening(false); };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('المتصفح لا يدعم التعرف على الصوت. جرب Chrome.');
      return;
    }
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { recognitionRef.current.start(); setIsListening(true); }
  };

  /* ─── helpers ─── */
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  /* ─── history ─── */
  const loadChatHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('copilot_chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data && data.length > 0) {
        const loaded: Message[] = data.reverse().map(r => ({
          id: r.id,
          role: r.role as 'user' | 'assistant',
          content: r.content,
          timestamp: new Date(r.created_at),
          actions: r.actions ?? [],
          actionsHandled: true, // historical actions are all already handled
        }));
        setMessages([WELCOME_MESSAGE, ...loaded]);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const saveMessage = async (msg: Message) => {
    if (!user) return;
    try {
      await supabase.from('copilot_chats').insert({
        id: msg.id,
        user_id: user.id,
        role: msg.role,
        content: msg.content,
        actions: msg.actions ?? [],
        created_at: msg.timestamp,
      });
    } catch { /* non-critical */ }
  };

  /* ─── tabs ─── */
  const openTab = (type: string, title: string) => {
    const existing = tabs.find(t => t.type === type);
    if (existing) { setActiveTabId(existing.id); return; }
    const id = `tab_${type}_${Date.now()}`;
    setTabs(prev => [...prev, { id, type, title, createdAt: new Date() }]);
    setActiveTabId(id);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id);
      if (activeTabId === id) {
        const idx = prev.findIndex(t => t.id === id);
        setActiveTabId(next[Math.max(0, idx - 1)].id);
      }
      return next;
    });
  };

  /* ─── copy ─── */
  const copyToClipboard = async (text: string, msgId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, copied: true } : m));
      setTimeout(() => setMessages(prev => prev.map(m => m.id === msgId ? { ...m, copied: false } : m)), 2000);
    } catch { /* ignore */ }
  };

  /* ─── export ─── */
  const exportChat = () => {
    const text = messages
      .filter(m => m.id !== 'welcome')
      .map(m => `[${m.role === 'user' ? 'أنت' : 'محسن'}] ${m.content}`)
      .join('\n\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    a.download = `copilot-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  /* ─── clear ─── */
  const clearChat = async () => {
    if (!confirm('هل أنت متأكد من مسح المحادثة؟')) return;
    setMessages([WELCOME_MESSAGE]);
    if (user) {
      await supabase.from('copilot_chats').delete().eq('user_id', user.id);
    }
  };

  /* ─── APPROVE ACTION (no LLM call) ─── */
  const handleApproveAction = (msgId: string, action: TabAction) => {
    // 1. Open / switch to the tab immediately
    openTab(action.type, action.title);

    // 2. Mark the message's actions as handled to hide the approval card
    setMessages(prev =>
      prev.map(m => m.id === msgId ? { ...m, actionsHandled: true } : m)
    );
  };

  const handleDenyActions = (msgId: string) => {
    setMessages(prev =>
      prev.map(m => m.id === msgId ? { ...m, actionsHandled: true } : m)
    );
  };

  /* ─── SEND (Autonomous Loop) ─── */
  const handleSend = async (customMessage?: string) => {
    const goal = (customMessage ?? input).trim();
    if (!goal || loading) return;

    const userMsg: Message = { id: generateId(), role: 'user', content: goal, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    saveMessage(userMsg);

    const stepHistory: any[] = [];

    try {
      for (let step = 0; step < 15; step++) {
        const currentContext = store.getState().agent.scrapedContext;
        const pageSnapshots = Object.entries(currentContext).map(([url, content]) => ({
          url,
          title: url,
          compressedContent: content
        }));

        const response = await fetch('/api/agent/orchestrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal, stepHistory, pageSnapshots })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const { thought, action } = data;

        if (action.type === 'ANSWER') {
          const assistantMsg: Message = { 
            id: generateId(), 
            role: 'assistant', 
            content: action.answer || 'اكتملت المهمة.', 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, assistantMsg]);
          saveMessage(assistantMsg);
          break;
        }

        if (action.type === 'ASK_USER') {
          const assistantMsg: Message = { 
            id: generateId(), 
            role: 'assistant', 
            content: action.question || 'ممكن توضح أكتر؟', 
            timestamp: new Date() 
          };
          setMessages(prev => [...prev, assistantMsg]);
          saveMessage(assistantMsg);
          break;
        }

        let result = "لم يتم التنفيذ.";

        switch (action.type) {
          case 'OPEN_PAGE':
            const targetUrl = action.url || '/pos';
            const mappedType = targetUrl.replace(/^\//, '') || 'inventory'; 
            openTab(mappedType, action.title || 'شاشة مهام');
            result = "تم فتح الشاشة، ننتظر تحميل البيانات...";
            await new Promise(r => setTimeout(r, 2500));
            break;

          case 'SCRAPE':
            result = "تم استخلاص وتحديث محتوى الشاشات بنجاح.";
            await new Promise(r => setTimeout(r, 500));
            break;

          case 'FILL_FIELD':
          case 'CLICK_BUTTON':
          case 'TYPE_SEARCH':
            let found = false;
            document.querySelectorAll('iframe').forEach(iframe => {
              try {
                const doc = iframe.contentDocument;
                if (!doc) return;
                
                if (action.type === 'FILL_FIELD' && action.selector && action.value) {
                  if (fillField(doc, action.selector, action.value)) found = true;
                } else if (action.type === 'CLICK_BUTTON' && action.buttonText) {
                  if (clickButton(doc, action.buttonText)) found = true;
                } else if (action.type === 'TYPE_SEARCH' && action.selector && action.value) {
                  if (typeIntoSearch(doc, action.selector, action.value)) found = true;
                }
              } catch (e) { }
            });
            result = found ? "تمت العملية بنجاح في الصفحة المفتوحة." : "فشلت العملية، لم يتم العثور على العنصر المستهدف.";
            await new Promise(r => setTimeout(r, 1000));
            break;
            
          default:
            result = "إجراء غير معروف.";
        }

        stepHistory.push({ action, result });
      }

    } catch (err) {
      console.error('Copilot Error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: '⚠️ عذراً، حدث خطأ في محرك المساعد الذكي المستقل. حاول مرة أخرى.',
          timestamp: new Date(),
          actionsHandled: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  /* ─── TAB URL RESOLVER ─── */
  const getTabUrl = (type: string) => {
    return TAB_META[type]?.url ?? `/${type}`;
  };

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4 w-full max-w-[1400px] mx-auto p-4" dir="rtl">

      {/* ══════════════ CHAT PANEL ══════════════ */}
      <div className="w-full lg:w-[420px] flex flex-col h-full gap-0 order-last lg:order-first shrink-0">
        <div className="flex-1 glass-panel flex flex-col overflow-hidden border border-[var(--glass-border)] bg-background/60 backdrop-blur-2xl rounded-2xl">

          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--glass-border)] bg-gradient-to-l from-[var(--nile-teal)]/8 to-transparent flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--nile-teal)] to-[var(--nile-teal)]/50 flex items-center justify-center shadow-lg shadow-[var(--nile-teal)]/20">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              </div>
              <div>
                <h2 className="font-bold font-cairo text-white text-sm leading-tight">المساعد محسن</h2>
                <p className="text-[10px] text-[var(--nile-teal)] font-sans tracking-wide">AI Copilot • متصل</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {historyLoading && <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />}
              <button
                onClick={loadChatHistory}
                className="p-1.5 hover:bg-[var(--glass-surface)] rounded-lg text-gray-500 hover:text-white transition-all"
                title="تحديث السجل"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={exportChat}
                className="p-1.5 hover:bg-[var(--glass-surface)] rounded-lg text-gray-500 hover:text-white transition-all"
                title="تصدير المحادثة"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={clearChat}
                className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-all"
                title="مسح المحادثة"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} group`}
                >
                  <div className="relative max-w-[88%]">
                    {/* Avatar for assistant */}
                    {msg.role === 'assistant' && (
                      <div className="absolute -left-1 bottom-2 translate-x-full w-5 h-5 rounded-full bg-[var(--nile-teal)]/20 border border-[var(--nile-teal)]/40 flex items-center justify-center ml-2">
                        <Bot className="w-3 h-3 text-[var(--nile-teal)]" />
                      </div>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl font-cairo text-sm leading-relaxed shadow-md ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-white/12 to-white/6 text-white border border-white/10 rounded-br-sm'
                          : 'bg-gradient-to-br from-[var(--nile-teal)]/12 to-[var(--nile-teal)]/5 text-gray-100 border border-[var(--nile-teal)]/20 rounded-bl-sm mr-6'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-invert prose-sm max-w-none text-right">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              strong: ({ children }) => (
                                <strong className="text-[var(--nile-teal)] font-bold">{children}</strong>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
                              ),
                              li: ({ children }) => <li className="text-gray-200">{children}</li>,
                              code: ({ children }) => (
                                <code className="bg-black/30 px-1.5 py-0.5 rounded text-[var(--nile-teal)] text-xs font-mono">
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <span className="text-right block">{msg.content}</span>
                      )}
                    </div>

                    {/* Copy button */}
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="absolute -bottom-5 left-6 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-white"
                        title="نسخ"
                      >
                        {msg.copied ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}

                    {/* Timestamp */}
                    <p className={`text-[10px] text-gray-600 mt-1 ${msg.role === 'user' ? 'text-left' : 'text-right mr-6'}`}>
                      {msg.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </p>

                    {/* ── Action Approval Card ── */}
                    {msg.role === 'assistant' &&
                      msg.actions &&
                      msg.actions.length > 0 &&
                      !msg.actionsHandled && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 p-4 bg-[var(--glass-surface)] border border-[var(--nile-teal)]/25 rounded-2xl shadow-lg relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-[var(--nile-teal)]/6 to-transparent pointer-events-none" />

                          <div className="flex items-center gap-2 mb-2 relative z-10">
                            <AlertCircle className="w-3.5 h-3.5 text-[var(--nile-teal)] animate-pulse shrink-0" />
                            <h4 className="text-xs font-bold font-cairo text-white">
                              إذن مطلوب لفتح:
                            </h4>
                          </div>

                          <div className="flex flex-col gap-2 relative z-10">
                            {msg.actions.map((action, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-2 p-2.5 bg-black/30 rounded-xl border border-[var(--glass-border)]"
                              >
                                <div className="flex items-center gap-2">
                                  <div style={{ color: TAB_META[action.type]?.color ?? 'var(--nile-teal)' }}>
                                    {TAB_META[action.type]?.icon ?? <Sparkles className="w-3.5 h-3.5" />}
                                  </div>
                                  <span className="text-xs font-bold font-cairo text-gray-200">
                                    {action.title}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleApproveAction(msg.id, action)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-[var(--nile-teal)]/20 hover:bg-[var(--nile-teal)]/40 text-[var(--nile-teal)] rounded-lg text-xs font-cairo font-bold border border-[var(--nile-teal)]/30 transition-all whitespace-nowrap"
                                >
                                  <Check className="w-3 h-3" /> فتح
                                </button>
                              </div>
                            ))}

                            <button
                              onClick={() => handleDenyActions(msg.id)}
                              className="w-full mt-1 py-1.5 text-xs text-gray-500 hover:text-red-400 font-cairo transition-colors"
                            >
                              تجاهل
                            </button>
                          </div>
                        </motion.div>
                      )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading bubble */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-end"
                >
                  <div className="bg-gradient-to-br from-[var(--nile-teal)]/12 to-[var(--nile-teal)]/5 p-3.5 rounded-2xl rounded-bl-sm flex items-center gap-3 border border-[var(--nile-teal)]/20 mr-6">
                    <div className="flex gap-1">
                      {[0, 150, 300].map(delay => (
                        <div
                          key={delay}
                          className="w-1.5 h-1.5 bg-[var(--nile-teal)] rounded-full animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 font-cairo">محسن بيفكر...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={chatEndRef} />
          </div>

          {/* Quick actions (shown only at start) */}
          <AnimatePresence>
            {messages.length <= 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-3 border-t border-[var(--glass-border)] bg-white/[0.02] pt-3"
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[var(--royal-gold)]" />
                  <span className="text-xs text-gray-400 font-cairo">اقتراحات سريعة</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      onClick={() => handleSend(action.prompt)}
                      disabled={loading}
                      className="p-2.5 bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-heavy)] border border-[var(--glass-border)] hover:border-white/15 rounded-xl transition-all text-right group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <div style={{ color: action.color }} className="shrink-0">{action.icon}</div>
                        <span className="text-xs font-bold text-white font-cairo leading-tight">{action.label}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="p-3 bg-background/40 border-t border-[var(--glass-border)]">
            <div className="relative flex items-center gap-2">
              <button
                onClick={toggleListening}
                className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
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
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder={isListening ? 'جاري الاستماع...' : 'اسأل محسن عن أي حاجة...'}
                disabled={loading || isListening}
                className="flex-1 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-[var(--nile-teal)]/50 focus:ring-1 focus:ring-[var(--nile-teal)]/20 outline-none transition-all font-cairo text-right disabled:opacity-50"
              />

              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-[var(--nile-teal)] to-[var(--nile-teal)]/80 text-black flex items-center justify-center hover:shadow-lg hover:shadow-[var(--nile-teal)]/25 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ WORKSPACE PANEL ══════════════ */}
      <div className="flex-1 flex flex-col glass-panel overflow-hidden border border-[var(--glass-border)] bg-background/60 backdrop-blur-2xl h-full rounded-2xl min-w-0">

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-3 py-2 bg-[var(--glass-surface)] border-b border-[var(--glass-border)] overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 shrink-0">
          <AnimatePresence>
            {tabs.map(tab => {
              const isActive = activeTabId === tab.id;
              const meta = TAB_META[tab.type];
              return (
                <motion.button
                  key={tab.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all font-cairo whitespace-nowrap group relative border text-sm ${
                    isActive
                      ? 'text-[var(--nile-teal)] bg-[var(--nile-teal)]/10 border-[var(--nile-teal)]/30 font-bold'
                      : 'text-gray-500 border-transparent hover:bg-[var(--glass-surface-heavy)] hover:text-gray-300'
                  }`}
                >
                  {meta && (
                    <span style={{ color: isActive ? meta.color : undefined }}>{meta.icon}</span>
                  )}
                  {tab.type === 'welcome' && <MessageSquare className="w-3.5 h-3.5" />}
                  <span>{tab.title}</span>
                  {tabs.length > 1 && (
                    <X
                      onClick={e => closeTab(tab.id, e)}
                      className="w-3 h-3 opacity-30 group-hover:opacity-80 hover:text-red-400 transition-all ml-0.5"
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabLine"
                      className="absolute bottom-[-9px] left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-[var(--nile-teal)] to-transparent"
                    />
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Tab content */}
        <div className="flex-1 relative w-full overflow-hidden">
          <AnimatePresence mode="wait">
            {tabs.map(tab => {
              if (tab.id !== activeTabId) return null;
              return (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 w-full h-full"
                >
                  {/* Welcome screen */}
                  {tab.type === 'welcome' && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-center p-8">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', duration: 0.8 }}
                        className="relative"
                      >
                        <div className="w-28 h-28 rounded-[1.75rem] bg-gradient-to-br from-[var(--nile-teal)] to-[var(--nile-teal)]/30 flex items-center justify-center shadow-[0_0_60px_rgba(0,206,209,0.25)]">
                          <Sparkles className="w-14 h-14 text-black" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#FF69B4] rounded-full flex items-center justify-center animate-bounce shadow-lg">
                          <Zap className="w-3.5 h-3.5 text-white" />
                        </div>
                      </motion.div>

                      <div className="space-y-2 max-w-md">
                        <h2 className="text-3xl font-bold font-cairo text-white">محسن في خدمتك</h2>
                        <p className="text-gray-400 font-cairo text-sm leading-relaxed">
                          مساعدك الذكي لإدارة الصيدلية. اسألني وأنا هفتحلك الشاشة المناسبة فوراً!
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                        {Object.entries(TAB_META).map(([type, meta]) => {
                          const labels: Record<string, string> = {
                            pos: 'نقطة البيع',
                            inventory: 'المخزون',
                            sales_chart: 'المبيعات',
                            customers: 'العملاء',
                            financials: 'التقارير',
                          };
                          return (
                            <motion.button
                              key={type}
                              initial={{ opacity: 0, y: 16 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: Object.keys(TAB_META).indexOf(type) * 0.08 }}
                              onClick={() => openTab(type, labels[type])}
                              className="p-4 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl hover:bg-[var(--glass-surface-heavy)] hover:border-white/15 transition-all cursor-pointer group text-right"
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <div style={{ color: meta.color }} className="group-hover:scale-110 transition-transform">
                                  {meta.icon}
                                </div>
                                <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-gray-400 mr-auto" />
                              </div>
                              <p className="text-white text-xs font-cairo font-bold">{labels[type]}</p>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Iframe tabs */}
                  {['pos', 'inventory', 'customers', 'financials'].includes(tab.type) && (
                    <iframe
                      src={`${getTabUrl(tab.type)}?minimal=true&from=copilot`}
                      className="w-full h-full border-none bg-transparent"
                      title={tab.title}
                      sandbox="allow-scripts allow-same-origin allow-forms"
                      onLoad={(e) => {
                        const iframeUrl = getTabUrl(tab.type);
                        try {
                          const doc = (e.target as HTMLIFrameElement).contentDocument;
                          if (doc) {
                            setTimeout(() => {
                              try {
                                const snapshot = extractPageSnapshot(doc, iframeUrl);
                                const combinedData = snapshotToPromptString(snapshot);
                                store.dispatch(updateScrapedContext({ url: iframeUrl, data: combinedData }));
                              } catch (err) { }
                            }, 1500);
                          }
                        } catch(e) {}
                      }}
                    />
                  )}

                  {/* Sales chart tab */}
                  {tab.type === 'sales_chart' && (
                    <iframe
                      src="/orders?from=copilot"
                      className="w-full h-full border-none bg-transparent"
                      title={tab.title}
                      sandbox="allow-scripts allow-same-origin allow-forms"
                      onLoad={(e) => {
                        const iframeUrl = '/orders';
                        try {
                          const doc = (e.target as HTMLIFrameElement).contentDocument;
                          if (doc) {
                            setTimeout(() => {
                              try {
                                const snapshot = extractPageSnapshot(doc, iframeUrl);
                                const combinedData = snapshotToPromptString(snapshot);
                                store.dispatch(updateScrapedContext({ url: iframeUrl, data: combinedData }));
                              } catch (err) { }
                            }, 1500);
                          }
                        } catch(e) {}
                      }}
                    />
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
