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
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

const PAGE_SIZE = 20;

const AHADITH = [
  'قال رسول الله ﷺ: "ما نقصت صدقة من مال". [رواه مسلم]',
  'قال رسول الله ﷺ: "اتقوا النار ولو بشق تمرة". [متفق عليه]',
  'قال رسول الله ﷺ: "كل امرئ في ظل صدقته يوم القيامة". [رواه أحمد وصححه ابن حبان]',
  'قال رسول الله ﷺ: "إن صدقة السر تطفئ غضب الرب". [رواه الطبراني وصححه الألباني]',
  'قال رسول الله ﷺ: "الساعي على الأرملة والمسكين كالمجاهد في سبيل الله". [متفق عليه]',
  'قال رسول الله ﷺ: "صنائع المعروف تقي مصارع السوء". [رواه الطبراني وصححه الألباني]',
  'قال رسول الله ﷺ: "أحب الأعمال إلى الله سرور تدخله على مسلم". [رواه الطبراني وحسنه الألباني]'
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

  const { paginatedData, currentPage, totalPages, totalItems, setPage } = usePagination(
    filteredEntries,
    { pageSize: PAGE_SIZE }
  );

  return (
    <div className="px-4 md:px-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-cairo">
            سجل <span className="text-[#FF69B4]">الصدقات</span>
          </h1>

          <p className="text-gray-400 mt-2 text-lg font-cairo">
            تتبع الأدوية والمساعدات التي تم تقديمها كصدقة.
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
              إجمالي قيمة الصدقات
            </p>

            <p className="text-4xl font-bold text-[#FF69B4]">
              {stats?.totalAmount?.toLocaleString() ?? '0'} ج.م
            </p>
          </div>

          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-32 h-32 text-[#FF69B4]" />
          </div>
        </div>

        <div className="glass-panel p-8 relative overflow-hidden group">
          <div className="z-10 relative">
            <p className="text-gray-400 font-cairo mb-2">
              عدد العمليات الخيرية
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
            ✨ فضل الصدقة
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
            هذا السجل مخصص لمتابعة الأدوية التي تم صرفها بدون مقابل بنية الصدقة
            لتسهيل الجرد والمحاسبة.
          </p>
        </div>
      </div>

      {}
      <div className="glass-panel p-4 flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-500" />

        <input
          type="text"
          placeholder="ابحث عن دواء أو عملية معينة..."
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
                  رقم العملية
                </th>

                <th className="px-6 py-4 font-medium">
                  الأصناف
                </th>

                <th className="px-6 py-4 font-medium">
                  التاريخ
                </th>

                <th className="px-6 py-4 font-medium">
                  القيمة التقديرية
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
                paginatedData.map((entry, idx) => (
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
                      {entry.amount.toLocaleString()} ج.م
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-20 text-center text-gray-500 font-cairo"
                  >
                    لا توجد سجلات صدقة مطابقة للبحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={PAGE_SIZE}
              onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
