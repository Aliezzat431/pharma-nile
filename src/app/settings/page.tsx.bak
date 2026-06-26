'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Settings as SettingsIcon, Save, CreditCard, Bell, Shield, Smartphone, Loader2, Palette, Moon, Sun, X, Trees, Ghost, CloudSnow, Waves, Coffee, Sparkles, Zap, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { GeneralSettings } from './components/GeneralSettings';
import { POSSettings } from './components/POSSettings';
import { NotificationSettings } from './components/NotificationSettings';
import { AppearanceSettings } from './components/AppearanceSettings';
import { ShortcutSettings } from './components/ShortcutSettings';
import { DatabaseSettings } from './components/DatabaseSettings';

type Tab = 'general' | 'pos' | 'notifications' | 'appearance' | 'shortcuts' | 'database';

const ALL_THEMES = [
  { id: 'dark', label: 'Ø§Ù„ÙˆØ¶Ø¹ Ø§Ù„Ù„ÙŠÙ„ÙŠ (Default)', icon: Moon, desc: 'Ø§Ù„ÙˆØ¶Ø¹ Ø§Ù„ÙƒÙ„Ø§Ø³ÙŠÙƒÙŠ Ø§Ù„ÙØ®Ù… Ù„Ù„Ù†Ø¸Ø§Ù…', color: 'bg-[#050505]' },
  { id: 'light', label: 'Ø§Ù„ÙˆØ¶Ø¹ Ø§Ù„Ù†Ù‡Ø§Ø±ÙŠ', icon: Sun, desc: 'ÙˆØ¶ÙˆØ­ Ø¹Ø§Ù„ÙŠ Ù„Ù„Ø¹Ù…Ù„ ØªØ­Øª Ø§Ù„Ø¥Ø¶Ø§Ø¡Ø© Ø§Ù„Ù‚ÙˆÙŠØ©', color: 'bg-[#f8fafc]' },
  { id: 'midnight', label: 'Ù…Ù†ØªØµÙ Ø§Ù„Ù„ÙŠÙ„', icon: Waves, desc: 'Ø£Ø²Ø±Ù‚ Ø¹Ù…ÙŠÙ‚ ÙŠØ¬Ù…Ø¹ Ø¨ÙŠÙ† Ø§Ù„Ù‡Ø¯ÙˆØ¡ ÙˆØ§Ù„Ø£Ù†Ø§Ù‚Ø©', color: 'bg-[#020612]' },
  { id: 'ocean', label: 'Ø£Ø¹Ù…Ø§Ù‚ Ø§Ù„Ù…Ø­ÙŠØ·', icon: Waves, desc: 'Ø³ÙŠØ§Ù† Ù…Ø´Ø±Ù‚ ÙˆØ·Ø§Ù‚Ø© Ù„Ø§ ØªÙ†ØªÙ‡ÙŠ', color: 'bg-[#010b14]' },
  { id: 'forest', label: 'Ø§Ù„ØºØ§Ø¨Ø© Ø§Ù„Ø¹Ù…ÙŠÙ‚Ø©', icon: Trees, desc: 'Ø£Ø®Ø¶Ø± Ø·Ø¨ÙŠØ¹ÙŠ Ù…Ø±ÙŠØ­ Ø¬Ø¯Ø§Ù‹ Ù„Ù„Ø¹ÙŠÙ†', color: 'bg-[#040d0a]' },
  { id: 'coffee', label: 'ÙˆØ¶Ø¹ Ø§Ù„Ù‚Ù‡ÙˆØ© (Coffee)', icon: Coffee, desc: 'Ø£Ù„ÙˆØ§Ù† ØªØ±Ø§Ø¨ÙŠØ© Ø¯Ø§ÙØ¦Ø© ØªØ±ÙƒØ² Ø¹Ù„Ù‰ Ø§Ù„ØªÙØ§ØµÙŠÙ„', color: 'bg-[#140d0b]' },
  { id: 'amethyst', label: 'Ø§Ù„Ø¬Ù…Ø´Øª Ø§Ù„Ù…Ù„ÙƒÙŠ', icon: Sparkles, desc: 'Ø¨Ù†ÙØ³Ø¬ÙŠ ÙØ§Ø®Ø± ÙŠØ¹ÙƒØ³ Ù‡ÙˆÙŠØ© Ø¨Ø±ÙŠÙ…ÙŠÙˆÙ…', color: 'bg-[#0d0b1a]' },
  { id: 'sunset', label: 'ÙˆÙ‚Øª Ø§Ù„ØºØ±ÙˆØ¨', icon: Zap, desc: 'Ù…Ø²ÙŠØ¬ Ø¯Ø§ÙØ¦ Ù…Ù† Ø§Ù„Ø¨Ø±ØªÙ‚Ø§Ù„ÙŠ ÙˆØ§Ù„Ø£Ø­Ù…Ø±', color: 'bg-[#140806]' },
  { id: 'cyberpunk', label: 'Ø³Ø§ÙŠØ¨Ø± Ø¨Ø§Ù†Ùƒ', icon: Zap, desc: 'ØªØ¨Ø§ÙŠÙ† Ø¹Ø§Ù„ÙŠ ÙˆØ£Ù„ÙˆØ§Ù† Ù†ÙŠÙˆÙ† Ù…Ø³ØªÙ‚Ø¨Ù„ÙŠØ©', color: 'bg-[#000000]' },
  { id: 'dracula', label: 'Ø¯Ø±Ø§ÙƒÙˆÙ„Ø§', icon: Ghost, desc: 'Ø£Ù„ÙˆØ§Ù† Ù†Ø§Ø¹Ù…Ø© ÙˆÙ…Ø±ÙŠØ­Ø© Ù„Ù„Ù…ÙƒØ§ØªØ¨ Ø§Ù„Ø·ÙˆÙŠÙ„Ø©', color: 'bg-[#1e1f29]' },
  { id: 'snowy', label: 'ÙˆØ¶ÙˆØ­ Ø§Ù„Ø«Ù„Ø¬', icon: CloudSnow, desc: 'Ø£Ø¨ÙŠØ¶ Ù†Ø§ØµØ¹ Ù…Ø¹ Ù„Ù…Ø³Ø§Øª Ø¬Ù„ÙŠØ¯ÙŠØ© Ù†Ù‚ÙŠØ©', color: 'bg-[#f8fafc]' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø¹Ø§Ù…Ø©', icon: Shield },
    { id: 'pos', label: 'Ø§Ù„ÙÙˆØ§ØªÙŠØ± ÙˆÙ†Ù‚Ø§Ø· Ø§Ù„Ø¨ÙŠØ¹', icon: CreditCard },
    { id: 'notifications', label: 'Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª ÙˆØ§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª', icon: Bell },
    { id: 'appearance', label: 'Ø§Ù„Ù…Ø¸Ù‡Ø± ÙˆØ§Ù„ÙˆØ§Ø¬Ù‡Ø©', icon: Smartphone },
    { id: 'shortcuts', label: 'Ø§Ø®ØªØµØ§Ø±Ø§Øª Ø§Ù„ØªØ·Ø¨ÙŠÙ‚', icon: Palette },
    { id: 'database', label: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙˆØ§Ù„ØªÙ†Ø¸ÙŠÙ', icon: Zap },
  ];


  return (
    <div className="px-4 md:px-8 w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 font-cairo">
            <SettingsIcon className="text-[#00CED1] w-8 h-8" />
            Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª <span className="text-[#D4AF37]">Ø§Ù„Ù†Ø¸Ø§Ù…</span>
          </h1>
          <p className="text-gray-400 mt-2 font-cairo text-sm">ØªÙƒÙˆÙŠÙ† Ø§Ù„ØªÙØ¶ÙŠÙ„Ø§Øª Ø§Ù„Ø¹Ø§Ù…Ø© Ù„Ù„ØµÙŠØ¯Ù„ÙŠØ© ÙˆØ§Ù„ØªÙƒØ§Ù…Ù„Ø§Øª Ø§Ù„Ø¨Ø±Ù…Ø¬ÙŠØ© ÙˆØ§Ù„ØªØ­ÙƒÙ… Ø§Ù„ÙƒØ§Ù…Ù„ Ø¨Ø§Ù„Ù†Ø¸Ø§Ù….</p>
        </div>
        <div className="flex items-center gap-3 bg-[#00CED1]/10 border border-[#00CED1]/20 px-4 py-2 rounded-xl">
          <CheckCircle2 className="text-[#00CED1] w-5 h-5" />
          <span className="text-[#00CED1] text-sm font-cairo font-medium">
            ÙŠØªÙ… Ø§Ù„Ø­ÙØ¸ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        {}
        <div className="md:col-span-3 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-right px-4 py-3.5 rounded-xl font-medium flex items-center gap-3 font-cairo transition-all duration-300 relative overflow-hidden group
                 ${activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/10 shadow-lg'
                  : 'text-gray-400 hover:bg-white/5 border border-transparent hover:text-gray-200'
                }
               `}
            >
              {activeTab === tab.id && (
                <motion.div layoutId="activeTabIndicator" className="absolute left-0 top-0 bottom-0 w-1 bg-[#00CED1]" />
              )}
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[#00CED1]' : 'group-hover:text-[#00CED1]/70 transition-colors'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {}
        <div className="md:col-span-9 relative min-h-[500px]">
          <AnimatePresence mode="wait">
            {}
            {activeTab === 'general' && <GeneralSettings key="general" />}
            {activeTab === 'pos' && <POSSettings key="pos" />}
            {activeTab === 'notifications' && <NotificationSettings key="notifications" />}
            {activeTab === 'appearance' && <AppearanceSettings key="appearance" theme={theme} handleThemeChange={handleThemeChange} setIsThemeModalOpen={setIsThemeModalOpen} />}
            {activeTab === 'shortcuts' && <ShortcutSettings key="shortcuts" />}
            {activeTab === 'database' && <DatabaseSettings key="database" />}
          </AnimatePresence>
        </div>

      </div>

      {}
      <AnimatePresence>
        {isThemeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsThemeModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold font-cairo flex items-center gap-3 text-white">
                  <Palette className="w-6 h-6 text-[#00CED1]" />
                  Ù…ÙƒØªØ¨Ø© Ø§Ù„Ø£Ù†Ù…Ø§Ø· Ø§Ù„Ù…ØªÙ‚Ø¯Ù…Ø©
                </h2>
                <button onClick={() => setIsThemeModalOpen(false)} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2 pb-4">
                {ALL_THEMES.map(themeItem => (
                  <button
                    key={themeItem.id}
                    onClick={() => handleThemeChange(themeItem.id)}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all group ${theme === themeItem.id
                        ? 'border-[#00CED1] bg-[#00CED1]/10 text-white'
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:border-white/20'
                      }`}
                  >
                    <div className={`w-full h-24 rounded-xl border flex flex-col gap-2 p-3 ${
                       ['light', 'light-neon', 'nature', 'coffee', 'monochrome', 'snowy'].includes(themeItem.id) ? 'bg-gray-100 border-gray-300' : 'bg-[#050505] border-white/10'
                    }`}>
                      <div className={`w-full h-3 rounded ${['light', 'light-neon', 'nature', 'coffee', 'monochrome', 'snowy'].includes(themeItem.id) ? 'bg-black/20' : 'bg-white/20'}`}></div>
                      <div className={`w-2/3 h-3 rounded ${themeItem.color}`}></div>
                      <div className={`w-1/2 h-2 rounded mt-auto ${['light', 'light-neon', 'nature', 'coffee', 'monochrome', 'snowy'].includes(themeItem.id) ? 'bg-black/10' : 'bg-white/10'}`}></div>
                    </div>
                    <div className="flex flex-col items-center gap-1 mt-2 text-center">
                      <div className={`flex items-center gap-2 font-bold font-cairo transition-colors ${theme === themeItem.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                        <themeItem.icon className={`w-5 h-5 ${theme === themeItem.id ? 'text-[#00CED1]' : 'text-gray-400 group-hover:text-[#00CED1]'}`} />
                        {themeItem.label}
                      </div>
                      <span className="text-xs text-gray-500 font-cairo">{themeItem.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


