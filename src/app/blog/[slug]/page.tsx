import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';

const posts: Record<string, {
  title: string;
  metaDescription: string;
  date: string;
  readTime: string;
  category: string;
  categoryColor: string;
  content: string;
}> = {
  'inventory-management': {
    title: 'الدليل الشامل لإدارة مخزون الأدوية في الصيدليات المصرية',
    metaDescription: 'كيف تنظم مخزون دوائك وتتفادى الخسائر من البضاعة المنتهية الصلاحية في صيدليات مصر.',
    date: '2 يوليو 2026',
    readTime: '7 دقائق',
    category: 'إدارة المخزون',
    categoryColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    content: `
## لماذا يُعدّ المخزون تحدياً حقيقياً في الصيدليات المصرية؟

تُمثّل الأدوية المنتهية الصلاحية أو الناقصة عند الطلب خسائر مباشرة تقدّرها الدراسات بما بين 8-15% من إيرادات الصيدليات الصغيرة. الحل لا يكمن في المزيد من الجهد اليدوي، بل في تبني نظام ذكي يُديّر هذه المهمة نيابةً عنك.

## المشكلات الأكثر شيوعاً

**1. الجرد اليدوي الخاطئ**  
الاعتماد على الورق أو الذاكرة لمتابعة مستويات المخزون يؤدي إلى أخطاء في إعادة الطلب.

**2. تراكم الدفعات المنتهية**  
غياب تتبع تواريخ الصلاحية لكل دفعة على حدة يجعل الاكتشاف متأخراً وبعد الخسارة.

**3. النواقص المفاجئة**  
أدوية ذات طلب مرتفع تنتهي فجأة دون تنبيه مسبق يتسبب في خسارة المبيعات وثقة العملاء.

## خطوات فعّالة لإدارة ذكية للمخزون

### 1. تبنّ نظاماً بإدارة الدفعات
لكل دفعة شراء: تاريخ الاستلام، تاريخ الانتهاء، والكمية. هذا يتيح لك بيع الأقدم أولاً (FIFO) ويعطيك تنبيهات مبكرة.

### 2. ضع حدود إعادة طلب
لكل صنف استراتيجي عند الصيدلية، حدد "الحد الأدنى" الذي يُطلق إشعاراً تلقائياً للطلب عند الوصول إليه.

### 3. أجرِ جرداً شهرياً بالموبايل والباركود
بدلاً من الجرد اليدوي السنوي الطويل، جرد شهري سريع بالكاميرا يكتشف الفروقات فوراً.

### 4. استثمر في تقارير المبيعات
معرفة ما يُباع كثيراً ومتى يساعدك على شراء الكميات الصحيحة في الوقت المناسب.

## الخلاصة

إدارة المخزون الذكية ليست ترفاً — هي ضرورة تجارية. مع نظام مثل فارما نايل، تتحول هذه المهمة من عبء يومي إلى عملية تلقائية تحميك من الخسائر وتضمن دوام توفر الأدوية.
    `,
  },
  'common-pharmacy-mistakes': {
    title: 'أشهر أخطاء الصيادلة في إدارة المبيعات وكيف تتجنبها',
    metaDescription: 'تحليل الأخطاء التشغيلية الأكثر شيوعاً في صيدليات مصر وكيف تتجنبها لرفع أرباحك.',
    date: '28 يونيو 2026',
    readTime: '5 دقائق',
    category: 'نصائح للصيادلة',
    categoryColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    content: `
## الخطأ الأول: إهمال متابعة ديون الآجل

كثير من الصيادلة يبيعون بالآجل دون نظام متابعة رسمي. النتيجة: ديون منسية، عملاء يتمادون، وضياع سيولة نقدية ضرورية لإعادة الشراء.

**الحل:** استخدم نظاماً يُسجل كل عملية آجل ويُرسل تنبيهات للموظف عند اقتراب موعد التحصيل.

## الخطأ الثاني: خصومات بدون تتبع

تقديم خصومات على البيع بدون تسجيلها يشوّه تقارير الأرباح الحقيقية.

**الحل:** أي خصم — كبيراً كان أم صغيراً — سجّله في النظام. بعد شهر، ستعرف أين تذهب أرباحك فعلاً.

## الخطأ الثالث: الاعتماد على حساب يدوي أثناء البيع

الحساب اليدوي يُبطئ الكاشير ويزيد احتمالية الأخطاء في الفواتير، مما يُحرج الصيدلاني أمام العميل.

**الحل:** نظام POS يحسب الإجمالي والخصم تلقائياً ويطبع فاتورة احترافية.

## الخطأ الرابع: لا تقارير = لا بيانات = لا قرارات

الصيدليات التي لا تراجع تقاريرها لا تعرف أي أصنافها خاسرة وأيها رابحة.

**الحل:** خصص 15 دقيقة أسبوعياً لمراجعة تقرير المبيعات والأرباح. هذا القرار الوحيد يوفر عليك مئات الجنيهات شهرياً.

## الخلاصة

أغلب الأخطاء في صيادلة مصر ليست بسبب قصور المعرفة، بل بسبب غياب الأدوات الصحيحة. فارما نايل صُمم خصيصاً لمعالجة هذه النقاط.
    `,
  },
  'digital-transformation': {
    title: 'التحول الرقمي في الصيدليات المصرية: من أين تبدأ؟',
    metaDescription: 'خطوات عملية لتحويل صيدليتك إلى نظام رقمي سحابي متكامل — دليل للصيادلة المصريين.',
    date: '20 يونيو 2026',
    readTime: '8 دقائق',
    category: 'التحول الرقمي',
    categoryColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    content: `
## ما معنى التحول الرقمي للصيدلية؟

التحول الرقمي لا يعني شراء أجهزة جديدة أو توظيف متخصصين في تقنية المعلومات. بمبساطة: هو الانتقال من تسجيل المبيعات يدوياً على ورق أو Excel إلى نظام سحابي متكامل يُدير كل شيء تلقائياً.

## لماذا الآن؟

السوق المصرية تتحول بسرعة. العملاء يتوقعون فاتورة إلكترونية، والموردون يطلبون طلبات منظمة، والضرائب تسير نحو الرقمنة. الصيادلة الذين لا يتكيفون الآن سيجدون أنفسهم في وضع صعب خلال سنتين.

## الخطوة الأولى: لا تُعقّد الأمور

لا تحتاج لتحويل كل شيء في يوم واحد. ابدأ بـ:
- **الكاشير الرقمي (POS):** هذا هو الأكبر أثراً فورياً.
- **تسجيل المخزون:** هذا يحميك من الخسائر طويلة المدى.

## الخطوة الثانية: اختر نظاماً يعمل أوفلاين

مشكلة الإنترنت في مصر حقيقية. اختر نظاماً لا يتوقف عن العمل عند انقطاع الشبكة ويزامن البيانات تلقائياً عند العودة.

## الخطوة الثالثة: ابدأ بالتجربة المجانية

لا تشتري نظاماً قبل تجربته. طلب 14 يوماً تجريبية مجانية يُعطيك الوقت الكافي للتقييم الحقيقي بدون ضغط.

## الخلاصة

التحول الرقمي يبدأ بقرار صغير، لكن أثره يتراكم. فارما نايل تُقدم تجربة مجانية 14 يوماً لتساعدك على الخطوة الأولى.
    `,
  },
};

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) return { title: 'مقال غير موجود | فارما نايل' };
  return {
    title: `${post.title} | مدونة فارما نايل`,
    description: post.metaDescription,
  };
}

export function generateStaticParams() {
  return Object.keys(posts).map(slug => ({ slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) notFound();

  // Simple markdown-like renderer
  const renderContent = (content: string) => {
    return content
      .trim()
      .split('\n')
      .map((line, idx) => {
        if (line.startsWith('## ')) {
          return <h2 key={idx} className="text-2xl font-black text-white mt-10 mb-4">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={idx} className="text-lg font-black text-white mt-6 mb-2">{line.slice(4)}</h3>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={idx} className="font-black text-gray-200 my-2">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ')) {
          return <li key={idx} className="text-gray-400 font-semibold text-sm leading-relaxed list-disc list-inside">{line.slice(2)}</li>;
        }
        if (line.trim() === '') return <div key={idx} className="h-2" />;
        return <p key={idx} className="text-gray-400 font-semibold text-sm sm:text-base leading-relaxed">{line}</p>;
      });
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white font-cairo" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 space-y-8">

        {/* Back */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4 rotate-180" />
          العودة للمدونة
        </Link>

        {/* Meta */}
        <div className="space-y-4">
          <span className={`inline-block px-3 py-1 text-[11px] font-black border rounded-xl ${post.categoryColor}`}>
            {post.category}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-snug">{post.title}</h1>
          <div className="flex items-center gap-5 text-gray-500 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{post.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{post.readTime} قراءة</span>
          </div>
        </div>

        <hr className="border-white/10" />

        {/* Content */}
        <article className="space-y-2">
          {renderContent(post.content)}
        </article>

        <hr className="border-white/10" />

        {/* CTA */}
        <div className="text-center space-y-4 pt-4">
          <p className="text-gray-400 text-sm font-semibold">هل أنت مستعد لتطبيق هذا في صيدليتك؟</p>
          <Link
            href="/welcome"
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold text-sm rounded-2xl shadow-xl hover:brightness-110 active:scale-[0.97] transition-all"
          >
            ابدأ تجربة فارما نايل مجاناً
          </Link>
        </div>

      </div>
    </div>
  );
}
