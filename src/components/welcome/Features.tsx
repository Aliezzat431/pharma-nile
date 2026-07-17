'use client';

import { motion } from 'framer-motion';
import { 
  ShieldCheck, Zap, BarChart3, Pill, AlertTriangle, RefreshCw, Key, Landmark, 
  Search, Shield, Database, Smartphone, Calendar, Users, TrendingUp, Bell
} from 'lucide-react';

export default function Features() {
  
  const featureList = [
    {
      icon: Pill,
      title: 'إدارة مخزون الأدوية الذكية',
      desc: 'إضافة ومتابعة آلاف الأصناف الطبية بباركود مخصص ومجموعات علاجية لسرعة البحث وتخصيص الرفوف.',
      glow: 'group-hover:text-blue-500',
      bgGlow: 'group-hover:bg-blue-500/10'
    },
    {
      icon: Search,
      title: 'قارئ الباركود والبحث الفوري',
      desc: 'قراءة فورية للأدوية والخلطات الجاهزة عبر الكاميرا أو أجهزة الباركود الخارجية لإدخال وحفظ سريع للفواتير.',
      glow: 'group-hover:text-cyan-400',
      bgGlow: 'group-hover:bg-cyan-500/10'
    },
    {
      icon: Bell,
      title: 'نظام تنبيهات النواقص التلقائي',
      desc: 'يرسل النظام إشعارات تلقائية فورية بالكميات التي قاربت على النفاد لتقوم بطلبها دون انقطاع مبيعاتك.',
      glow: 'group-hover:text-amber-500',
      bgGlow: 'group-hover:bg-amber-500/10'
    },
    {
      icon: BarChart3,
      title: 'تقارير الأرباح وتحليلات المبيعات',
      desc: 'لوحة إحصائية متكاملة توضح صافي الربح والسيولة المالية وتصنيفات الأدوية الأكثر بيعاً وطلباً بصيدليتك.',
      glow: 'group-hover:text-emerald-450',
      bgGlow: 'group-hover:bg-emerald-500/10'
    },
    {
      icon: Database,
      title: 'نسخ احتياطي سحابي تلقائي دائم',
      desc: 'لا تقلق على بياناتك؛ نقوم بنسخ مشفر وآمن لقواعد البيانات بشكل مستمر لضمان الحماية التامة من الضياع.',
      glow: 'group-hover:text-blue-400',
      bgGlow: 'group-hover:bg-blue-400/10'
    },
    {
      icon: Users,
      title: 'إدارة صلاحيات المستخدمين والورديات',
      desc: 'أنشئ حسابات منفصلة للصيادلة وموظفي الكاشير مع تحديد صلاحيات البيع والجرد وتسليم ورديات الخزنة.',
      glow: 'group-hover:text-purple-400',
      bgGlow: 'group-hover:bg-purple-400/10'
    },
    {
      icon: Calendar,
      title: 'تتبع تواريخ الصلاحية والانتهاء',
      desc: 'فرز متقدم للباتشات المضافة يتيح لك تلوين صلاحيات الأدوية التي أوشكت على الانتهاء لبيعها أو استرجاعها للموردين.',
      glow: 'group-hover:text-red-400',
      bgGlow: 'group-hover:bg-red-500/10'
    },
    {
      icon: TrendingUp,
      title: 'نظام الفترات وحساب الآجل',
      desc: 'تسجيل عمليات بيع الآجل للعملاء الثقة وتتبع مديونياتهم وتذكيرهم التلقائي بفترات التحصيل الدورية.',
      glow: 'group-hover:text-cyan-500',
      bgGlow: 'group-hover:bg-cyan-500/10'
    }
  ];

  return (
    <section id="features" className="py-20 relative font-cairo">
      
      {/* Glow backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Title */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-black text-[var(--text-primary)]">مميزات متكاملة لإدارة صيدليتك باحترافية</h2>
          <p className="text-[var(--text-muted)] max-w-2xl mx-auto text-sm sm:text-base font-semibold">
            كل ما تحتاجه للتحكم الكامل بصيدليتك أو سلسلة فروعك من مكان واحد مصمم لتسهيل وتسريع عملك اليومي.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureList.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="group p-6 bg-white/[0.02] border border-[var(--glass-border)] hover:border-cyan-400/30 hover:bg-white/[0.04] transition-all duration-300 rounded-3xl text-right flex flex-col justify-between min-h-[220px]"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-2xl bg-[var(--glass-surface-heavy)] flex items-center justify-center transition-colors duration-300 ${feat.bgGlow}`}>
                    <Icon className={`w-6 h-6 text-[var(--text-muted)] transition-colors duration-350 ${feat.glow}`} />
                  </div>
                  <h3 className="text-lg font-black text-[var(--text-primary)] group-hover:text-cyan-400 transition-colors">{feat.title}</h3>
                  <p className="text-[var(--text-muted)] text-xs leading-relaxed font-semibold">{feat.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
