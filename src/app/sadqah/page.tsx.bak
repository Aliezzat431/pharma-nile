'use client';

import { useState, useEffect } from 'react';
import {
  Heart,
  Calendar,
  Package,
  TrendingUp,
  Search,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getSadqahStats } from '@/lib/api/sadqah';
import type { SadqahEntry } from '@/lib/api/sadqah';

const AHADITH = [
  'Ù‚Ø§Ù„ Ø±Ø³ÙˆÙ„ Ø§Ù„Ù„Ù‡ ï·º: "Ù…Ø§ Ù†Ù‚ØµØª ØµØ¯Ù‚Ø© Ù…Ù† Ù…Ø§Ù„". [Ø±ÙˆØ§Ù‡ Ù…Ø³Ù„Ù…]',
  'Ù‚Ø§Ù„ Ø±Ø³ÙˆÙ„ Ø§Ù„Ù„Ù‡ ï·º: "Ø§ØªÙ‚ÙˆØ§ Ø§Ù„Ù†Ø§Ø± ÙˆÙ„Ùˆ Ø¨Ø´Ù‚ ØªÙ…Ø±Ø©". [Ù…ØªÙÙ‚ Ø¹Ù„ÙŠÙ‡]',
  'Ù‚Ø§Ù„ Ø±Ø³ÙˆÙ„ Ø§Ù„Ù„Ù‡ ï·º: "ÙƒÙ„ Ø§Ù…Ø±Ø¦ ÙÙŠ Ø¸Ù„ ØµØ¯Ù‚ØªÙ‡ ÙŠÙˆÙ… Ø§Ù„Ù‚ÙŠØ§Ù…Ø©". [Ø±ÙˆØ§Ù‡ Ø£Ø­Ù…Ø¯ ÙˆØµØ­Ø­Ù‡ Ø§Ø¨Ù† Ø­Ø¨Ø§Ù†]',
  'Ù‚Ø§Ù„ Ø±Ø³ÙˆÙ„ Ø§Ù„Ù„Ù‡ ï·º: "Ø¥Ù† ØµØ¯Ù‚Ø© Ø§Ù„Ø³Ø± ØªØ·ÙØ¦ ØºØ¶Ø¨ Ø§Ù„Ø±Ø¨". [Ø±ÙˆØ§Ù‡ Ø§Ù„Ø·Ø¨Ø±Ø§Ù†ÙŠ ÙˆØµØ­Ø­Ù‡ Ø§Ù„Ø£Ù„Ø¨Ø§Ù†ÙŠ]',
  'Ù‚Ø§Ù„ Ø±Ø³ÙˆÙ„ Ø§Ù„Ù„Ù‡ ï·º: "Ø§Ù„Ø³Ø§Ø¹ÙŠ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ø±Ù…Ù„Ø© ÙˆØ§Ù„Ù…Ø³ÙƒÙŠÙ† ÙƒØ§Ù„Ù…Ø¬Ø§Ù‡Ø¯ ÙÙŠ Ø³Ø¨ÙŠÙ„ Ø§Ù„Ù„Ù‡". [Ù…ØªÙÙ‚ Ø¹Ù„ÙŠÙ‡]',
  'Ù‚Ø§Ù„ Ø±Ø³ÙˆÙ„ Ø§Ù„Ù„Ù‡ ï·º: "ØµÙ†Ø§Ø¦Ø¹ Ø§Ù„Ù…Ø¹Ø±ÙˆÙ ØªÙ‚ÙŠ Ù…ØµØ§Ø±Ø¹ Ø§Ù„Ø³ÙˆØ¡". [Ø±ÙˆØ§Ù‡ Ø§Ù„Ø·Ø¨Ø±Ø§Ù†ÙŠ ÙˆØµØ­Ø­Ù‡ Ø§Ù„Ø£Ù„Ø¨Ø§Ù†ÙŠ]',
  'Ù‚Ø§Ù„ Ø±Ø³ÙˆÙ„ Ø§Ù„Ù„Ù‡ ï·º: "Ø£Ø­Ø¨ Ø§Ù„Ø£Ø¹Ù…Ø§Ù„ Ø¥Ù„Ù‰ Ø§Ù„Ù„Ù‡ Ø³Ø±ÙˆØ± ØªØ¯Ø®Ù„Ù‡ Ø¹Ù„Ù‰ Ù…Ø³Ù„Ù…". [Ø±ÙˆØ§Ù‡ Ø§Ù„Ø·Ø¨Ø±Ø§Ù†ÙŠ ÙˆØ­Ø³Ù†Ù‡ Ø§Ù„Ø£Ù„Ø¨Ø§Ù†ÙŠ]'
];


export default function SadqahPage() {
  const [stats, setStats] = useState<{
    entries: SadqahEntry[];
    totalAmount: number;
  } | null>(null);
  const [hadithIndex, setHadithIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [hadith] = useState(
    AHADITH[Math.floor(Math.random() * AHADITH.length)]
  );

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setHadithIndex(Math.floor(Math.random() * AHADITH.length));

    const interval = setInterval(() => {
      setHadithIndex((prev) => (prev + 1) % AHADITH.length);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const data = await getSadqahStats();

      setStats(data);
    } catch (error) {
      console.error('Failed to load sadqah stats:', error);

      setStats({
        entries: [],
        totalAmount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries =
    stats?.entries.filter(
      (e) =>
        e.items.some((i) =>
          i.toLowerCase().includes(search.toLowerCase())
        ) ||
        e.id.toLowerCase().includes(search.toLowerCase())
    ) || [];

  return (
    <div className="px-4 md:px-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-cairo">
            Ø³Ø¬Ù„ <span className="text-[#FF69B4]">Ø§Ù„ØµØ¯Ù‚Ø§Øª</span>
          </h1>

          <p className="text-gray-400 mt-2 text-lg font-cairo">
            ØªØªØ¨Ø¹ Ø§Ù„Ø£Ø¯ÙˆÙŠØ© ÙˆØ§Ù„Ù…Ø³Ø§Ø¹Ø¯Ø§Øª Ø§Ù„ØªÙŠ ØªÙ… ØªÙ‚Ø¯ÙŠÙ…Ù‡Ø§ ÙƒØµØ¯Ù‚Ø©.
          </p>
        </div>

        <div className="w-12 h-12 rounded-full bg-[#FF69B4]/20 flex items-center justify-center text-[#FF69B4] neon-glow-pink">
          <Heart className="w-6 h-6 fill-current" />
        </div>
      </header>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-8 relative overflow-hidden group">
          <div className="z-10 relative">
            <p className="text-gray-400 font-cairo mb-2">
              Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ù‚ÙŠÙ…Ø© Ø§Ù„ØµØ¯Ù‚Ø§Øª
            </p>

            <p className="text-4xl font-bold text-[#FF69B4]">
              {stats?.totalAmount?.toLocaleString() ?? '0'} Ø¬.Ù…
            </p>
          </div>

          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-32 h-32 text-[#FF69B4]" />
          </div>
        </div>

        <div className="glass-panel p-8 relative overflow-hidden group">
          <div className="z-10 relative">
            <p className="text-gray-400 font-cairo mb-2">
              Ø¹Ø¯Ø¯ Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ø®ÙŠØ±ÙŠØ©
            </p>

            <p className="text-4xl font-bold text-white">
              {stats?.entries?.length ?? 0}
            </p>
          </div>

          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Package className="w-32 h-32 text-white" />
          </div>
        </div>

        <div className="glass-panel p-8 bg-gradient-to-br from-[#FF69B4]/10 to-transparent border border-[#FF69B4]/20 min-h-[220px] flex flex-col justify-center">
          <p className="text-xs text-[#FF69B4] mb-4 font-semibold">
            âœ¨ ÙØ¶Ù„ Ø§Ù„ØµØ¯Ù‚Ø©
          </p>

          <motion.blockquote
            key={hadithIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-gray-200 font-cairo leading-loose text-lg"
          >
            {AHADITH[hadithIndex]}
          </motion.blockquote>

          <div className="mt-6 flex gap-2">
            {AHADITH.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-500 ${index === hadithIndex
                  ? 'w-8 bg-[#FF69B4]'
                  : 'w-2 bg-white/20'
                  }`}
              />
            ))}
          </div>

          <p className="mt-5 text-xs text-gray-500 leading-relaxed">
            Ù‡Ø°Ø§ Ø§Ù„Ø³Ø¬Ù„ Ù…Ø®ØµØµ Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø£Ø¯ÙˆÙŠØ© Ø§Ù„ØªÙŠ ØªÙ… ØµØ±ÙÙ‡Ø§ Ø¨Ø¯ÙˆÙ† Ù…Ù‚Ø§Ø¨Ù„ Ø¨Ù†ÙŠØ© Ø§Ù„ØµØ¯Ù‚Ø©
            Ù„ØªØ³Ù‡ÙŠÙ„ Ø§Ù„Ø¬Ø±Ø¯ ÙˆØ§Ù„Ù…Ø­Ø§Ø³Ø¨Ø©.
          </p>
        </div>
      </div>

      {}
      <div className="glass-panel p-4 flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-500" />

        <input
          type="text"
          placeholder="Ø§Ø¨Ø­Ø« Ø¹Ù† Ø¯ÙˆØ§Ø¡ Ø£Ùˆ Ø¹Ù…Ù„ÙŠØ© Ù…Ø¹ÙŠÙ†Ø©..."
          className="flex-1 bg-transparent border-none outline-none text-white font-cairo placeholder:text-gray-600"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white/5 font-cairo text-gray-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">
                  Ø±Ù‚Ù… Ø§Ù„Ø¹Ù…Ù„ÙŠØ©
                </th>

                <th className="px-6 py-4 font-medium">
                  Ø§Ù„Ø£ØµÙ†Ø§Ù
                </th>

                <th className="px-6 py-4 font-medium">
                  Ø§Ù„ØªØ§Ø±ÙŠØ®
                </th>

                <th className="px-6 py-4 font-medium">
                  Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„ØªÙ‚Ø¯ÙŠØ±ÙŠØ©
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-20 text-center"
                  >
                    <Loader2 className="w-8 h-8 text-[#FF69B4] animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredEntries.length > 0 ? (
                filteredEntries.map((entry, idx) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      #{entry.id.slice(0, 8)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {entry.items.map((item, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded bg-[#FF69B4]/10 text-[#FF69B4] text-xs font-cairo border border-[#FF69B4]/20"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4 opacity-50" />

                        <span className="font-sans">
                          {new Date(entry.date).toLocaleString(
                            'ar-EG'
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                      {entry.amount.toLocaleString()} Ø¬.Ù…
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-20 text-center text-gray-500 font-cairo"
                  >
                    Ù„Ø§ ØªÙˆØ¬Ø¯ Ø³Ø¬Ù„Ø§Øª ØµØ¯Ù‚Ø© Ù…Ø·Ø§Ø¨Ù‚Ø© Ù„Ù„Ø¨Ø­Ø«.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

