import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

/* ─────────────────── TYPES ─────────────────── */
export type AgentActionType =
  | 'OPEN_PAGE'      // open a new page in a hidden iframe to scrape it
  | 'SCRAPE'         // scrape DOM of an already-open page
  | 'FILL_FIELD'     // fill a form field in an open page
  | 'CLICK_BUTTON'   // click a button in an open page
  | 'TYPE_SEARCH'    // type into a search input
  | 'NAVIGATE'       // navigate to a URL within an already-open iframe
  | 'ANSWER'         // final answer to the user — terminates the loop
  | 'ASK_USER';      // agent needs clarification before proceeding

export interface AgentAction {
  type: AgentActionType;
  /** The target page URL (for OPEN_PAGE, SCRAPE, NAVIGATE) */
  url?: string;
  /** Human-readable page title */
  title?: string;
  /** CSS selector or field name (for FILL_FIELD, TYPE_SEARCH, CLICK_BUTTON) */
  selector?: string;
  /** Value to fill / type */
  value?: string;
  /** Button text (for CLICK_BUTTON) */
  buttonText?: string;
  /** The final answer text (for ANSWER) */
  answer?: string;
  /** Clarification question (for ASK_USER) */
  question?: string;
}

export interface OrchestrateRequest {
  goal: string;
  stepHistory: OrchestrateStep[];    // what has happened so far
  pageSnapshots: PageSnapshotSummary[]; // compressed DOM of open pages
  pharmacyId?: string;
}

export interface OrchestrateStep {
  action: AgentAction;
  result: string; // what happened when this action ran
}

export interface PageSnapshotSummary {
  url: string;
  title: string;
  compressedContent: string; // snapshotToPromptString() output
}

export interface OrchestrateResponse {
  thought: string;         // agent's visible chain-of-thought (shown in UI)
  action: AgentAction;     // next action to execute
  confidence: number;      // 0-1, how confident the agent is
}

/* ─────────────────── AVAILABLE PAGES ───────────────────── */
const AVAILABLE_PAGES = [
  { url: '/inventory',  title: 'المخزون والجرد',     desc: 'قائمة المنتجات، الكميات، الباركود، تواريخ الصلاحية، التشغيلات. يمكن البحث والتصفية.' },
  { url: '/pos',        title: 'نقطة البيع',          desc: 'الكاشير، صرف الأدوية، إنشاء الفواتير، البحث عن منتجات.' },
  { url: '/orders',     title: 'تحليلات المبيعات',    desc: 'تقارير المبيعات، المخططات، إجماليات اليوم والشهر.' },
  { url: '/customers',  title: 'إدارة العملاء',       desc: 'قائمة العملاء، المتأخرات، الديون، سجل الشراء.' },
  { url: '/financials', title: 'التقارير المالية',    desc: 'الميزانية، الأرباح، الخسائر، المصروفات.' },
  { url: '/invoices',   title: 'الفواتير والمرتجعات', desc: 'كل الفواتير الصادرة، المرتجعات، التفاصيل.' },
  { url: '/products',   title: 'قائمة المنتجات',      desc: 'كتالوج الأدوية، الأسعار، الأصناف.' },
];

/* ─────────────────── BUILD SYSTEM PROMPT ───────────────────── */
function buildSystemPrompt(
  goal: string,
  stepHistory: OrchestrateStep[],
  pageSnapshots: PageSnapshotSummary[],
  pharmacyId?: string
): string {
  const pagesListStr = AVAILABLE_PAGES.map(p => `  ${p.url} — ${p.title}: ${p.desc}`).join('\n');

  const historyStr = stepHistory.length
    ? stepHistory.map((s, i) =>
        `الخطوة ${i + 1}: نفذت [${s.action.type}${s.action.url ? ':' + s.action.url : ''}${s.action.buttonText ? ':' + s.action.buttonText : ''}]
         النتيجة: ${s.result}`
      ).join('\n')
    : 'لم تُنفَّذ أي خطوات بعد.';

  const snapshotsStr = pageSnapshots.length
    ? pageSnapshots.map(ps =>
        `\n───────────────────────────────\n${ps.compressedContent}\n───────────────────────────────`
      ).join('\n')
    : 'لا توجد بيانات مقروءة حتى الآن.';

  return `أنت المساعد الذكي المستقل (Autonomous Agent) في نظام PharmaNile لإدارة الصيدلية.
مهمتك الاساسية: تنفيذ هدف المستخدم خطوة بخطوة.

### هدف المستخدم:
${goal}

### الصيدلية الحالية: pharmacy_id = ${pharmacyId ?? 'غير محدد'}

### الصفحات المتاحة بالنظام:
${pagesListStr}

### سجل الخطوات المنفذة حتى الآن:
${historyStr}

### بيانات الصفحات المقروءة (DOM Snapshots):
${snapshotsStr}

### قوانين العمل:
1. فكر بصوت عالٍ في حقل "thought" — لا تكن مختصراً هنا، فكر بعمق.
2. أنت وكيل مستقل تماماً (Autonomous). ممنوع منعاً باتاً أن تطلب من المستخدم فتح صفحة أو أن تخبره أنك ستقوم بذلك في رسالة ANSWER. بل قم بفعل ذلك بنفسك عبر إصدار OPEN_PAGE.
3. إذا سألك المستخدم سؤالاً يحتاج إلى قراءة بيانات من شاشة غير موجودة في الـ Snaphots → يجب عليك فوراً إصدار تحديث بالأمر OPEN_PAGE. لا تختر أبداً ANSWER في هذه الحالة.
4. بعد صدور أمر فتح الشاشة ستنتظر التطبيق ليقرأها، وفي الخطوة التالية سيأتيك الرد، حينها اختر SCRAPE.
5. لا تُجب أبداً من الخيال — البيانات الوحيدة المعتمدة هي ما في DOM Snapshots.
6. إذا وجدت البيانات الكافية → أجب بـ ANSWER فوراً وقم بإنهاء العمل.
7. الهدف الأساسي هو تقليل المحادثات الفارغة. لا تبرر افعالك للمستخدم. تصرف حالاً.

### صيغة الرد (JSON فقط، بدون أي نص خارجه):
{
  "thought": "تفكيرك التفصيلي في ما يجب فعله الآن ولماذا",
  "action": {
    "type": "OPEN_PAGE | SCRAPE | FILL_FIELD | CLICK_BUTTON | TYPE_SEARCH | NAVIGATE | ANSWER | ASK_USER",
    "url": "مسار الصفحة (إذا انطبق)",
    "title": "عنوان الصفحة",
    "selector": "CSS selector أو اسم الحقل",
    "value": "القيمة المراد إدخالها",
    "buttonText": "نص الزر المراد الضغط عليه",
    "answer": "الإجابة النهائية للمستخدم بعد جمع كافة البيانات (بالعربية العامية المصرية المهنية)",
    "question": "سؤال التوضيح فقط إذا كان طلب المستخدم مبهماً جداً"
  },
  "confidence": 0.9
}`;
}

/* ─────────────────── ROUTE HANDLER ───────────────────── */
export async function POST(req: Request) {
  try {
    const body: OrchestrateRequest = await req.json();
    const { goal, stepHistory = [], pageSnapshots = [], pharmacyId } = body;

    if (!goal?.trim()) {
      return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
    }

    // Safety: max 20 steps to prevent infinite loops
    if (stepHistory.length >= 20) {
      return NextResponse.json({
        thought: 'وصلت للحد الأقصى من الخطوات (20 خطوة).',
        action: {
          type: 'ANSWER',
          answer: 'عذراً، استغرق التنفيذ وقتاً طويلاً وتجاوزت الحد الأقصى للخطوات. حاول بطلب أبسط.',
        },
        confidence: 1,
      } satisfies OrchestrateResponse);
    }

    const systemPrompt = buildSystemPrompt(goal, stepHistory, pageSnapshots, pharmacyId);

    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.15, // low temp for determinism
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `الهدف: "${goal}"\n\nخطوة رقم ${stepHistory.length + 1}: ماذا تفعل الآن؟` },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let parsed: OrchestrateResponse;

    try {
      parsed = JSON.parse(raw) as OrchestrateResponse;
    } catch {
      return NextResponse.json({ error: 'LLM returned invalid JSON', raw }, { status: 500 });
    }

    // Validate action type
    const validTypes: AgentActionType[] = [
      'OPEN_PAGE', 'SCRAPE', 'FILL_FIELD', 'CLICK_BUTTON',
      'TYPE_SEARCH', 'NAVIGATE', 'ANSWER', 'ASK_USER',
    ];
    if (!parsed.action?.type || !validTypes.includes(parsed.action.type as AgentActionType)) {
      parsed.action = { type: 'ANSWER', answer: 'حدث خطأ في فهم الهدف. حاول صياغة طلبك بشكل مختلف.' };
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('[Orchestrate API]', err);
    return NextResponse.json({
      thought: 'حدث خطأ تقني.',
      action: { type: 'ANSWER', answer: '⚠️ خطأ تقني في المحرك. جرب مجدداً.' },
      confidence: 1,
    } satisfies OrchestrateResponse, { status: 200 });
  }
}
