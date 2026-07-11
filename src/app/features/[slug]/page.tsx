import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Pill, ShoppingBag, Boxes, BarChart3, Smartphone, Shield, Calendar, Users } from 'lucide-react';

const features: Record<string, {
  title: string;
  metaTitle: string;
  description: string;
  metaDescription: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  details: { heading: string; body: string }[];
}> = {
  pos: {
    title: 'كاشير البيع الفوري (POS)',
    metaTitle: 'كاشير صيدلية POS | فارما نايل',
    description: 'نقطة بيع سريعة وذكية تعمل بالباركود والكاميرا وتطبع الفاتورة في ثوانٍ.',
    metaDescription: 'نظام POS لصيدليات مصر — كاشير فوري مع باركود، طباعة فاتورة حرارية، البيع أوفلاين.',
    icon: ShoppingBag,
    color: 'from-cyan-600 to-blue-600',
    details: [
      { heading: 'فاتورة في أقل من ثانيتين', body: 'امسح الباركود أو ابحث باسم الدواء وأضفه للسلة فوراً. النظام يحسب الإجمالي والخصم ويطبع الإيصال بضغطة واحدة.' },
      { heading: 'يعمل 100% أوفلاين', body: 'حتى إذا انقطع الإنترنت في الصيدلية، يواصل الكاشير عمله محلياً وعند العودة يزامن كل شيء تلقائياً.' },
      { heading: 'طباعة حرارية فورية', body: 'يدعم طابعات 58 مم و80 مم بدون تثبيت تعريفات معقدة. تطبع الفاتورة المعتمدة في أقل من 3 ثوانٍ.' },
    ],
  },
  inventory: {
    title: 'إدارة المخزون والجرد',
    metaTitle: 'إدارة مخزون صيدلية | فارما نايل',
    description: 'نظام دفعات متكامل لتتبع كل صنف وصلاحيته وكميته بدقة تامة.',
    metaDescription: 'إدارة مخزون الأدوية مع تتبع الدفعات والصلاحيات وجرد سريع بالموبايل في مصر.',
    icon: Boxes,
    color: 'from-emerald-600 to-teal-600',
    details: [
      { heading: 'تتبع الدفعات لحظة بلحظة', body: 'لكل دفعة شراء تاريخ صلاحية وكمية مستقلين. يتابع النظام كل دفعة ويخبرك قبل 3 أشهر من انتهاء صلاحيتها.' },
      { heading: 'جرد سريع بالموبايل', body: 'مسح باركود كل صنف بالكاميرا أثناء الجرد وتظهر النتائج فوراً. جرد كامل لـ 1,000 صنف في ساعتين.' },
      { heading: 'استيراد من Excel وPDF', body: 'ارفع ملف Excel أو فاتورة شراء PDF والنظام يحلل الأصناف ويضيفها تلقائياً مطابقاً قاعدة الأدوية المصرية.' },
    ],
  },
  reports: {
    title: 'تقارير الأرباح والمبيعات',
    metaTitle: 'تقارير مبيعات صيدلية | فارما نايل',
    description: 'لوحة إحصائية تعرض صافي الربح، أكثر الأدوية مبيعًا، وديون الآجل بصورة بيانية واضحة.',
    metaDescription: 'تقارير مبيعات وأرباح لصيدليات مصر — إحصائيات يومية وأسبوعية وشهرية مع رسوم بيانية.',
    icon: BarChart3,
    color: 'from-purple-600 to-pink-600',
    details: [
      { heading: 'تقارير يومية وأسبوعية وشهرية', body: 'شاهد أداء صيدليتك على مدار الزمن مع مقارنة تلقائية بالفترات السابقة لمعرفة الاتجاه الصحيح.' },
      { heading: 'أكثر الأدوية طلباً', body: 'قائمة محدَّثة لأكثر الأصناف بيعاً ربحاً تساعدك على اتخاذ قرارات الشراء والتخزين الصحيحة.' },
      { heading: 'مراقبة ديون الآجل', body: 'تتبع كامل لعمليات البيع الآجل مع إشعارات تلقائية للعملاء المتأخرين في السداد.' },
    ],
  },
  mobile: {
    title: 'تطبيق التنبيهات المساعد',
    metaTitle: 'تطبيق موبايل صيدلية | فارما نايل',
    description: 'تابع فرعك ومبيعاتك من هاتفك في أي وقت وأي مكان.',
    metaDescription: 'تطبيق إدارة صيدلية على الموبايل — تنبيهات فورية للنواقص والصلاحيات من أي مكان.',
    icon: Smartphone,
    color: 'from-blue-600 to-cyan-600',
    details: [
      { heading: 'تنبيهات فورية 24/7', body: 'نواقص المخزون، اقتراب تواريخ الصلاحية، ومبيعات الفترة — كلها تصلك فوراً على هاتفك.' },
      { heading: 'لوحة تحكم من أي مكان', body: 'راجع إحصائيات اليوم، مقارنات المبيعات، وتقرير الورديات وأنت في البيت أو السفر.' },
      { heading: 'دعم iOS وAndroid', body: 'تطبيق Progressive Web App يعمل على كل الأجهزة بدون تثبيت من متجر التطبيقات.' },
    ],
  },
};

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const feature = features[slug];
  if (!feature) return { title: 'ميزة غير موجودة | فارما نايل' };
  return {
    title: feature.metaTitle,
    description: feature.metaDescription,
  };
}

export function generateStaticParams() {
  return Object.keys(features).map(slug => ({ slug }));
}

export default async function FeaturePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const feature = features[slug];
  if (!feature) notFound();

  const Icon = feature.icon;

  return (
    <div className="min-h-screen bg-[#090d16] text-white font-cairo" dir="rtl">

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-16">

        {/* Back link */}
        <Link href="/welcome#features" className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 text-sm font-semibold transition-colors">
          ← العودة للصفحة الرئيسية
        </Link>

        {/* Hero */}
        <div className="space-y-6">
          <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-2xl`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">{feature.title}</h1>
          <p className="text-gray-400 text-lg font-semibold leading-relaxed max-w-2xl">{feature.description}</p>
        </div>

        {/* Details */}
        <div className="space-y-8">
          {feature.details.map((item, idx) => (
            <div key={idx} className="p-7 bg-white/[0.025] border border-white/8 rounded-3xl space-y-3">
              <h2 className="text-xl font-black text-white">{item.heading}</h2>
              <p className="text-gray-400 font-semibold leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4 pt-8 border-t border-white/5">
          <h3 className="text-2xl font-black text-white">جاهز لتجربة {feature.title}؟</h3>
          <Link
            href="/welcome"
            className="inline-flex items-center gap-2.5 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold text-base rounded-2xl shadow-xl hover:brightness-110 active:scale-[0.97] transition-all"
          >
            ابدأ التجربة المجانية
          </Link>
        </div>

      </div>
    </div>
  );
}
