import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Calendar, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'مقالات صيدليات مصر | مدونة فارما نايل',
  description: 'مقالات متخصصة عن إدارة الصيدليات، التحول الرقمي، ومراقبة المخزون لصيادلة مصر.',
};

const posts = [
  {
    slug: 'inventory-management',
    title: 'الدليل الشامل لإدارة مخزون الأدوية في الصيدليات المصرية',
    excerpt: 'كيف تنظم مخزون دوائك وتتفادى الخسائر من البضاعة المنتهية الصلاحية. نصائح عملية من خبرة مئات صيدليات مصر.',
    date: '2 يوليو 2026',
    readTime: '7 دقائق',
    category: 'إدارة المخزون',
    categoryColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  {
    slug: 'common-pharmacy-mistakes',
    title: 'أشهر أخطاء الصيادلة في إدارة المبيعات وكيف تتجنبها',
    excerpt: 'تحليل للأخطاء التشغيلية الأكثر شيوعاً في صيدليات مصر — من فواتير الآجل غير المتابعة إلى الجرد اليدوي المتأخر.',
    date: '28 يونيو 2026',
    readTime: '5 دقائق',
    category: 'نصائح للصيادلة',
    categoryColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    slug: 'digital-transformation',
    title: 'التحول الرقمي في الصيدليات المصرية: من أين تبدأ؟',
    excerpt: 'خطوات عملية لتحويل صيدليتك من العمل اليدوي إلى نظام رقمي سحابي متكامل بدون تعقيدات تقنية.',
    date: '20 يونيو 2026',
    readTime: '8 دقائق',
    category: 'التحول الرقمي',
    categoryColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#090d16] text-white font-cairo" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-16">

        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[var(--glass-surface)] border border-[var(--glass-border)] text-cyan-400 text-xs font-black">
            <BookOpen className="w-3.5 h-3.5" />
            مدونة فارما نايل
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white">
            مقالات لصيادلة مصر
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-base font-semibold leading-relaxed">
            نصائح، إرشادات، وتجارب حقيقية من عالم الصيدليات المصرية لمساعدتك على إدارة أعمالك باحترافية.
          </p>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-white/[0.02] hover:bg-white/[0.04] border border-white/7 hover:border-cyan-400/20 rounded-3xl p-6 flex flex-col gap-4 transition-all duration-300"
            >
              <span className={`self-start px-3 py-1 text-[10px] font-black border rounded-xl ${post.categoryColor}`}>
                {post.category}
              </span>

              <div className="space-y-2 flex-1">
                <h2 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="text-gray-400 text-xs font-semibold leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between text-gray-500 text-[10px] pt-3 border-t border-[var(--glass-border)]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {post.readTime} قراءة
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Back */}
        <div className="text-center">
          <Link href="/welcome" className="text-gray-400 hover:text-cyan-400 text-sm font-semibold transition-colors">
            ← العودة للصفحة الرئيسية
          </Link>
        </div>

      </div>
    </div>
  );
}
