import { motion } from 'framer-motion';
import { Palette, Moon, Sun } from 'lucide-react';

interface AppearanceSettingsProps {
  theme: string | undefined;
  handleThemeChange: (newTheme: string) => void;
  setIsThemeModalOpen: (val: boolean) => void;
}

export function AppearanceSettings({ theme, handleThemeChange, setIsThemeModalOpen }: AppearanceSettingsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="glass-panel p-8">
        <h2 className="text-xl font-bold mb-6 border-b border-[var(--glass-border)] pb-4 font-cairo flex items-center gap-2">
          <Palette className="w-5 h-5 text-[#FF6b6b]" /> المظهر العام وتخصيص الواجهة
        </h2>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium font-cairo">الأنماط الأساسية (Important Themes)</h3>
              <button
                onClick={() => setIsThemeModalOpen(true)}
                className="text-sm text-[var(--nile-teal)] hover:text-white transition-colors flex items-center gap-1 font-cairo bg-[var(--glass-surface)] px-3 py-1.5 rounded-lg hover:bg-[var(--glass-surface-heavy)]"
              >
                <Palette className="w-4 h-4" />
                المزيد (See More)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {}
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                    ? 'border-[var(--nile-teal)] bg-[var(--nile-teal)]/10 text-white'
                    : 'border-transparent bg-[var(--glass-surface)] text-gray-400 hover:bg-[var(--glass-surface-heavy)]'
                  }`}
              >
                <div className="w-full h-16 rounded bg-[#050505] border border-[var(--glass-border)] flex flex-col gap-1 p-2">
                  <div className="w-full h-2 bg-white/20 rounded"></div>
                  <div className="w-1/2 h-2 bg-[var(--nile-teal)]/50 rounded"></div>
                </div>
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  <span className="font-cairo">Dark السمة الداكنة</span>
                </div>
              </button>

              {}
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'light'
                    ? 'border-[var(--nile-teal)] bg-[var(--nile-teal)]/10 text-white'
                    : 'border-transparent bg-[var(--glass-surface)] text-gray-400 hover:bg-[var(--glass-surface-heavy)]'
                  }`}
              >
                <div className="w-full h-16 rounded bg-white border border-gray-200 flex flex-col gap-1 p-2">
                  <div className="w-full h-2 bg-gray-200 rounded"></div>
                  <div className="w-1/2 h-2 bg-[var(--nile-teal)]/50 rounded"></div>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4" />
                  <span className="font-cairo">Light السمة المضيئة</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
