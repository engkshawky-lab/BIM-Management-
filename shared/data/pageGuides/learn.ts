import type { PageGuide } from "./types";

// Guides for the learning and reading pages (Start here, ISO 19650 parts and essentials, topic hubs, references).
// Each text is an [English, Arabic] pair, so both languages always have the same number of items in the same order.

type P = [en: string, ar: string];

function g(key: string, what: P, steps: P[], outputs: P[] = [], required: P[] = [], tips: P[] = []): PageGuide {
  const en = (xs: P[]) => xs.map((x) => x[0]);
  const ar = (xs: P[]) => xs.map((x) => x[1]);
  return {
    key, what: what[0], steps: en(steps), outputs: en(outputs), required: en(required), tips: en(tips),
    ar: { what: what[1], steps: ar(steps), outputs: ar(outputs), required: ar(required), tips: ar(tips) },
  };
}

// ---------------------------------------------------------------- shared lines for the topic hubs

const HUB_NAV: P = [
  "Type at least three letters in the search box to find a topic anywhere in the hub; use the ← Previous and Next → cards at the bottom to read in order, and after the last tab a card links to the next hub.",
  "اكتب ثلاثة أحرف على الأقل في مربع البحث للعثور على أي موضوع داخل المركز؛ واستخدم بطاقتي «← السابق» و«التالي →» أسفل الصفحة للقراءة بالترتيب، وبعد آخر تبويب تظهر بطاقة تنقلك إلى المركز التالي.",
];
const HUB_SECTIONS: P = [
  "Pick a section first, then a tab inside it; each section button shows how many of its tabs you have explored, and explored tabs carry a ✓.",
  "اختر قسماً أولاً ثم تبويباً داخله؛ يعرض زر كل قسم عدد التبويبات التي استكشفتها منه، وتظهر علامة ✓ على التبويبات التي زرتها.",
];
const HUB_CHECKS: P = [
  "Tick checklist items as you work; the ticks are kept, and Clear empties a list.",
  "ضع علامة على بنود قوائم التحقق أثناء العمل؛ تُحفظ العلامات، ويُفرغ زر «مسح» القائمة.",
];
const quiz = (tab: P, n: number): P => [
  `In ${tab[0]}, pick an answer to see the explanation straight away; your score appears when all ${n} questions are answered, and Try again resets the quiz.`,
  `في «${tab[1]}»، اختر إجابة لترى الشرح فوراً؛ تظهر درجتك عند الإجابة عن جميع الأسئلة الـ${n}، ويعيد زر «حاول مرة أخرى» ضبط الاختبار.`,
];
const ai = (tab: P, gen?: P): P => [
  `In ${tab[0]}, click a suggested question or type your own and click Ask to use the AI tutor${gen ? `; the “${gen[0]}” card has an Open in AI document generator button.` : "."}`,
  `في «${tab[1]}»، انقر على سؤال مقترح أو اكتب سؤالك ثم انقر «اسأل» لاستخدام المعلّم الذكي${gen ? `؛ وتحتوي بطاقة «${gen[1]}» على زر «فتح في مولّد الوثائق بالذكاء الاصطناعي».` : "."}`,
];
const HUB_OUT: P = [
  "Explored topics, checklist ticks and best quiz scores saved in this browser",
  "الموضوعات التي استكشفتها وعلامات قوائم التحقق وأفضل درجات الاختبارات محفوظة في هذا المتصفح",
];
const HUB_OUT_NOQUIZ: P = [
  "Explored topics and checklist ticks saved in this browser",
  "الموضوعات التي استكشفتها وعلامات قوائم التحقق محفوظة في هذا المتصفح",
];
const RELATED: P = [
  "The Related topics panel at the bottom links to related hubs, to tools under Put it into practice, and to the ISO 19650 parts behind the topic.",
  "تربطك لوحة «مواضيع ذات صلة» أسفل الصفحة بالمراكز المرتبطة، وبالأدوات تحت «طبّقه عملياً»، وبأجزاء ISO 19650 التي يستند إليها الموضوع.",
];
const LOCK: P = [
  "A lock on a section or tab means your plan does not include it; the rest of the hub stays open.",
  "يعني القفل على قسم أو تبويب أن خطتك لا تشمله؛ ويبقى باقي المركز متاحاً.",
];

// ---------------------------------------------------------------- shared lines for the six part pages

const PART_TABS: P = [
  "Choose a tab: Overview, Clauses & checklist, Practical examples, Questions & answers, Quiz, Documents & mistakes or Ask AI.",
  "اختر تبويباً: «نظرة عامة» أو «البنود وقائمة التحقق» أو «أمثلة عملية» أو «أسئلة وأجوبة» أو «اختبار» أو «الوثائق والأخطاء الشائعة» أو «اسأل الذكاء الاصطناعي».",
];
const PART_OVERVIEW: P = [
  "On Overview, read In plain terms and Why it matters, then pick Beginner, Intermediate or Expert to change the depth of the explanation; key concepts and links to other parts follow.",
  "في «نظرة عامة»، اقرأ «بعبارات مبسّطة» و«لماذا يهم»، ثم اختر «مبتدئ» أو «متوسط» أو «خبير» لتغيير عمق الشرح؛ وتليها المفاهيم الرئيسية والروابط إلى الأجزاء الأخرى.",
];
const PART_CLAUSES: P = [
  "On Clauses & checklist, read the key requirements, tick the compliance checklist items, and expand each clause in Deep dive — clause by clause.",
  "في «البنود وقائمة التحقق»، اقرأ المتطلبات الرئيسية، وضع علامة على بنود قائمة التحقق من الامتثال، ووسّع كل بند في «شرح معمّق — بندًا بندًا».",
];
const PART_PRACTICE: P = [
  "On Practical examples, read the worked example and the project examples; Questions & answers has its own search box, and on Quiz each answer shows at once whether it is right and why (Start again resets it).",
  "في «أمثلة عملية»، اقرأ المثال التطبيقي وأمثلة المشاريع؛ ولتبويب «أسئلة وأجوبة» مربع بحث خاص به، وفي «اختبار» تُظهر كل إجابة فوراً إن كانت صحيحة ولماذا (ويعيد زر «البدء من جديد» ضبطه).",
];
const PART_DOCS: P = [
  "On Documents & mistakes, click Open template ↗ next to a key document and read the common mistakes and fixes; on Ask AI, ask the AI tutor about this part.",
  "في «الوثائق والأخطاء الشائعة»، انقر «فتح القالب ↗» بجانب أي وثيقة رئيسية واقرأ الأخطاء الشائعة وطرق تصحيحها؛ وفي «اسأل الذكاء الاصطناعي» اسأل المعلّم الذكي عن هذا الجزء.",
];
const PART_MOVE: P = [
  "Use the Part 1–6 buttons at the top, or the ← Previous part and Next part → cards at the bottom, to move between parts on the same tab.",
  "استخدم أزرار الأجزاء 1–6 في الأعلى، أو بطاقتي «← الجزء السابق» و«الجزء التالي →» في الأسفل، للتنقل بين الأجزاء على التبويب نفسه.",
];
const PART_OUT: P = [
  "Checklist ticks, chosen level and latest quiz score saved in this browser",
  "علامات قائمة التحقق والمستوى المختار وآخر درجة اختبار محفوظة في هذا المتصفح",
];
const PART_REVISION: P = [
  "The red banner on Overview says what the 2026 draft revision changes for this part; the current edition stays in force until the new one is published.",
  "يوضح الشريط الأحمر في «نظرة عامة» ما تغيّره مسودة مراجعة 2026 في هذا الجزء؛ ويبقى الإصدار الحالي سارياً حتى نشر الإصدار الجديد.",
];
const PART_VERIFY: P = [
  "The content is paraphrased guidance, not the standard's text; verify against the licensed edition.",
  "المحتوى إرشاد بصياغة مختلفة وليس نص المعيار؛ تحقّق دائماً من الإصدار المرخّص.",
];
const part = (n: number, what: P, docs: P, revision: boolean) => g(`s.19650.part${n}`, what,
  [PART_TABS, PART_OVERVIEW, PART_CLAUSES, PART_PRACTICE, PART_DOCS, PART_MOVE], [PART_OUT], [],
  revision ? [docs, PART_REVISION, PART_VERIFY] : [docs, PART_VERIFY]);

// ---------------------------------------------------------------- shared lines for the knowledge library

const LIB_TABS: P = [
  "Use the buttons above the search box to switch between Parts of the series, Delivery process (19650-2), CDE & status codes and Glossary.",
  "استخدم الأزرار فوق مربع البحث للتبديل بين «أجزاء السلسلة» و«عملية التسليم (19650-2)» و«CDE ورموز الحالة» و«المسرد».",
];
const KNOWLEDGE_NAV: P = [
  "Use the tabs at the top (Library, Templates, Information uses, Naming & status codes, References) or the ISO 19650 — BIM / ISO/IEC 42001 — AI switch to move around the Knowledge hub.",
  "استخدم التبويبات في الأعلى («المكتبة» و«القوالب» و«استخدامات المعلومات» و«التسمية ورموز الحالة» و«المراجع») أو مفتاح ISO 19650 — BIM / ISO/IEC 42001 — AI للتنقل في مركز المعرفة.",
];
const PARAPHRASED: P = [
  "Summaries are paraphrased for guidance; always refer to the licensed standard.",
  "الملخصات مُعاد صياغتها للإرشاد؛ ارجع دائماً إلى المعيار المرخّص.",
];

export const GUIDES_LEARN: PageGuide[] = [
  g("s.guides",
    ["A short library of practical best-practice guides for modellers, coordinators and information managers. The guidance is original; check your project's information standard first.",
      "مكتبة قصيرة من أدلة أفضل الممارسات العملية للمُنمذجين والمنسقين ومديري المعلومات. الإرشادات أصلية؛ راجع معيار المعلومات الخاص بمشروعك أولاً."],
    [
      ["Browse the guide cards; each shows a summary and who it is for.", "تصفّح بطاقات الأدلة؛ تعرض كل بطاقة ملخصاً والفئة المستهدفة."],
      ["Click a card to open the full guide.", "انقر على بطاقة لفتح الدليل كاملاً."],
      ["Under a guide, click a related template badge to open that template in the Knowledge hub.", "أسفل الدليل، انقر على شارة قالب ذي صلة لفتح ذلك القالب في مركز المعرفة."],
      ["Click ← All guides to return to the list.", "انقر «→ كل الأدلة» للعودة إلى القائمة."],
    ], [], [],
    [["The six guides cover model authoring, shared parameters, writing a BEP, coordination meetings, infrastructure projects and façade information.",
      "تغطي الأدلة الستة إعداد النماذج، والمعاملات المشتركة، وكتابة BEP، واجتماعات التنسيق، ومشاريع البنية التحتية، ومعلومات الواجهات."]]),

  g("s.paths",
    ["Step-by-step learning plans for five roles: BIM modeller, BIM coordinator, BIM manager / information manager, client / appointing party and AI governance lead. Each step points to a platform page to read, practise, try a tool or take a quiz.",
      "خطط تعلّم خطوة بخطوة لخمسة أدوار: مُنمذج BIM، ومنسق BIM، ومدير BIM / مدير المعلومات، والعميل / الطرف المُعيِّن، وقائد حوكمة الذكاء الاصطناعي. تشير كل خطوة إلى صفحة في المنصة للقراءة أو التدرّب أو تجربة أداة أو أداء اختبار."],
    [
      ["Pick a path card; each shows its weeks, number of steps, total time, related videos and your progress.", "اختر بطاقة مسار؛ تعرض كل بطاقة عدد الأسابيع والخطوات والوقت الإجمالي والفيديوهات ذات الصلة وتقدّمك."],
      ["Read each step's purpose, its type (Read, Practise, Tool or Quiz) and its estimated minutes.", "اقرأ الغرض من كل خطوة ونوعها («قراءة» أو «تدرّب» أو «الأداة» أو «اختبار») والدقائق المقدّرة لها."],
      ["Click Read the written lesson → (or Open →) to read the step's written explanation; click a video thumbnail to play it on the page. Videos marked Our video come from your organisation's Our videos page.", "انقر «اقرأ الشرح المكتوب →» (أو «فتح →») لقراءة الشرح المكتوب للخطوة؛ وانقر على صورة مصغّرة لتشغيل الفيديو داخل الصفحة. الفيديوهات الموسومة «فيديو من فريقنا» مأخوذة من صفحة «فيديوهاتنا» الخاصة بمؤسستك."],
      ["Tick Mark as done when you finish a step; the Continue button jumps to the next unfinished step.", "ضع علامة على «وضع علامة كمنجز» عند إنهاء خطوة؛ وينقلك زر «متابعة» إلى الخطوة التالية غير المنجزة."],
      ["Click Reset progress to clear the path and start again.", "انقر «إعادة ضبط التقدم» لمسح المسار والبدء من جديد."],
      ["When every step is done, click Start the final exam: answer the questions before the timer ends, then click Submit exam.", "عند إنجاز كل الخطوات، انقر «ابدأ الامتحان النهائي»: أجب عن الأسئلة قبل انتهاء المؤقت، ثم انقر «تسليم الامتحان»."],
      ["With 75% or more, click Open my certificate to print it or save it as PDF, and share its verification link.", "إذا حصلت على 75% أو أكثر، انقر «افتح شهادتي» لطباعتها أو حفظها PDF، وشارك رابط التحقق منها."],
    ],
    [["Step progress for each path saved in this browser", "تقدّم الخطوات لكل مسار محفوظ في هذا المتصفح"],
      ["Exam score with a review of every answer", "نتيجة الامتحان مع مراجعة كل إجابة"],
      ["A signed certificate with a public verification link (score 75% or more)", "شهادة موقّعة برابط تحقق عام (عند 75% أو أكثر)"]],
    [["All steps marked as done before the final exam", "إنجاز كل الخطوات قبل الامتحان النهائي"]],
    [
      ["Each exam draws random questions on the path's topics; you have 3 attempts in any 24 hours, and unanswered questions count as wrong.", "يختار كل امتحان أسئلة عشوائية من موضوعات المسار؛ ولديك 3 محاولات خلال أي 24 ساعة، وتُحتسب الأسئلة غير المجابة خاطئة."],
      ["Autodesk certificates are issued only by Autodesk or an Autodesk Authorized Training Center; the result page links to their certification.", "تصدر شهادات Autodesk فقط من Autodesk أو مركز تدريب معتمد منها؛ وتربطك صفحة النتيجة بصفحة شهاداتهم."],
      ["Progress is kept per browser, so it does not follow you to another device.", "يُحفظ التقدم لكل متصفح على حدة، فلا ينتقل معك إلى جهاز آخر."],
    ]),

  g("s.videos",
    ["A free library of public YouTube and Vimeo videos on ISO 19650 and BIM information management, including links added by administrators and videos in Arabic.",
      "مكتبة مجانية من فيديوهات YouTube وVimeo العامة حول ISO 19650 وإدارة معلومات BIM، تشمل الروابط التي يضيفها المسؤولون وفيديوهات باللغة العربية."],
    [
      ["Type in Search videos… to search titles, channels and summaries.", "اكتب في «ابحث في الفيديوهات…» للبحث في العناوين والقنوات والملخصات."],
      ["Filter by level (All levels, Beginner, Intermediate, Advanced) and by language (All languages, English, Arabic).", "صفِّ حسب المستوى («كل المستويات» أو «مبتدئ» أو «متوسط» أو «متقدم») وحسب اللغة («كل اللغات» أو «الإنجليزية» أو «العربية»)."],
      ["Click a topic chip to show only that topic; the number on each chip is how many videos match.", "انقر على شريحة موضوع لعرض ذلك الموضوع فقط؛ ويبيّن الرقم على كل شريحة عدد الفيديوهات المطابقة."],
      ["Click a video card to play it in a window, or open it on YouTube or Vimeo.", "انقر على بطاقة فيديو لتشغيله في نافذة، أو افتحه على YouTube أو Vimeo."],
      ["Administrators: click + Add a video to add a public YouTube or Vimeo link. Edit and Delete manage saved links; the curated catalog remains available.", "للمسؤولين: انقر «+ إضافة فيديو» لإضافة رابط YouTube أو Vimeo عام. يدير «تعديل» و«حذف» الروابط المحفوظة؛ وتبقى المكتبة المختارة متاحة."],
      ["Click Mark as watched to track what you have seen; tick Show summaries in Arabic to switch the summary language.", "انقر «تعليم كمُشاهَد» لتتبّع ما شاهدته؛ وضع علامة على «عرض الملخصات بالعربية» لتبديل لغة الملخصات."],
    ],
    [["Watched videos saved in this browser", "الفيديوهات التي شاهدتها محفوظة في هذا المتصفح"]], [],
    [
      ["The Our videos tab at the top shows your organisation's own training videos.", "يعرض تبويب «فيديوهاتنا» في الأعلى فيديوهات التدريب الخاصة بمؤسستك."],
      ["Videos are hosted by their owners on YouTube or Vimeo; the platform only links to them.", "الفيديوهات مستضافة لدى أصحابها على YouTube أو Vimeo؛ والمنصة تكتفي بالربط إليها."],
    ]),

  g("s.ourvideos",
    ["Uploaded training videos for subscribers, such as onboarding, project standards, software how-tos and lessons learned. Only administrators can add, edit or delete videos. Free public links belong in Video library.",
      "فيديوهات تدريب مرفوعة للمشتركين، مثل التهيئة ومعايير المشاريع وشروحات البرمجيات والدروس المستفادة. يقتصر إضافة الفيديوهات أو تعديلها أو حذفها على المسؤولين. وتوجد الروابط العامة المجانية في مكتبة الفيديو."],
    [
      ["Type in Search videos…, and click a topic chip to filter when more than one topic is in use.", "اكتب في «ابحث في الفيديوهات…»، وانقر على شريحة موضوع للتصفية عند وجود أكثر من موضوع."],
      ["Click a video card to play it; each play adds to its view count.", "انقر على بطاقة فيديو لتشغيله؛ وتُضاف كل مرة تشغيل إلى عدد مشاهداته."],
      ["Administrators: click + Add a video and choose a video file. Add YouTube and Vimeo links in Video library.", "للمسؤولين: انقر «+ إضافة فيديو» واختر ملف فيديو. أضف روابط YouTube وVimeo في مكتبة الفيديو."],
      ["Fill in Title, Description, Topic and Language, then click Add video; a progress bar shows the upload.", "املأ «العنوان» و«الوصف» و«الموضوع» و«اللغة»، ثم انقر «أضف الفيديو»؛ ويعرض شريط تقدّم حالة الرفع."],
      ["Administrators: under Show in learning paths, tick the roles and steps where the video should appear (or click Suggest from topic and title).", "للمسؤولين: ضمن «العرض في مسارات التعلم»، حدد الأدوار والخطوات التي يظهر فيها الفيديو (أو انقر «اقتراح حسب الموضوع والعنوان»)."],
      ["Administrators: click Edit or Delete on a card to change a video's details or remove it.", "للمسؤولين: انقر «تعديل» أو «حذف» على البطاقة لتغيير تفاصيل الفيديو أو إزالته."],
    ],
    [["Uploaded videos, available to subscribers (administrators manage them)", "فيديوهات مرفوعة متاحة للمشتركين (يديرها المسؤولون)"]],
    [
      ["Video file (MP4, WebM, OGG or MOV; administrators only)", "ملف فيديو (MP4 أو WebM أو OGG أو MOV؛ للمسؤولين فقط)"],
      ["Title (at least 2 characters; an uploaded file uses its file name if left blank)", "العنوان (حرفان على الأقل؛ ويُستخدم اسم الملف المرفوع إذا تُرك فارغاً)"],
    ],
    [
      ["MP4 (H.264) plays in every browser.", "صيغة MP4 (H.264) تعمل في جميع المتصفحات."],
      ["Only upload videos you have the right to share.", "لا ترفع إلا الفيديوهات التي يحق لك مشاركتها."],
      ["A video with no learning-path steps ticked is placed automatically in the steps that match its topic.", "الفيديو الذي لم تُحدد له خطوات يوضع تلقائيًا في الخطوات المطابقة لموضوعه."],
    ]),

  g("s.adoption",
    ["A step-by-step plan for adopting ISO 19650 across your organisation (page heading: ISO 19650 implementation guide), in five phases: assess where you are, build the foundation, prepare people, pilot on a project, and roll out and improve.",
      "خطة خطوة بخطوة لتبنّي ISO 19650 في مؤسستك (عنوان الصفحة: دليل تطبيق ISO 19650)، في خمس مراحل: تقييم الوضع الحالي، وبناء الأساس، وتهيئة الأفراد، والتجربة على مشروع، ثم التعميم والتحسين."],
    [
      ["Read each phase's goal and its steps; each step lists its outputs, and some have an Open link to the related page.", "اقرأ هدف كل مرحلة وخطواتها؛ تذكر كل خطوة مخرجاتها، ولبعضها رابط «فتح» إلى الصفحة المرتبطة."],
      ["Set each step's status: To do, In progress, Done or N/A.", "حدّد حالة كل خطوة: «للتنفيذ» أو «قيد التنفيذ» أو «تم» أو «لا ينطبق»."],
      ["Enter an Owner, a due date and a Note for each step; changes save automatically.", "أدخل «المالك» وتاريخ الاستحقاق و«ملاحظة» لكل خطوة؛ وتُحفظ التغييرات تلقائياً."],
      ["Follow the percentage at the top; steps set to N/A are left out of the count.", "تابع النسبة المئوية في الأعلى؛ ولا تُحتسب الخطوات المعيّنة على «لا ينطبق»."],
      ["Click ⬇ CSV to download the whole plan with status, owner, due date and notes.", "انقر «⬇ CSV» لتنزيل الخطة كاملة مع الحالة والمالك وتاريخ الاستحقاق والملاحظات."],
    ],
    [
      ["Step status, owner, due date and notes saved to your account", "حالة الخطوات والمالك وتاريخ الاستحقاق والملاحظات محفوظة في حسابك"],
      ["CSV file of the implementation plan", "ملف CSV لخطة التطبيق"],
    ], [],
    [["Owner and Note are saved when you leave the field.", "يُحفظ «المالك» و«ملاحظة» عند مغادرة الحقل."]]),

  g("s.learn",
    ["The main learning page: short courses, practice questions by topic, timed mock exams (all topics or one ISO 19650 part), decision scenarios and an AI interview coach. Quiz and exam answers are scored on the server and saved to your account.",
      "صفحة التعلّم الرئيسية: دورات قصيرة، وأسئلة تدريبية حسب الموضوع، واختبارات تجريبية موقوتة (لجميع الموضوعات أو لجزء واحد من ISO 19650)، وسيناريوهات قرار، ومدرب مقابلات بالذكاء الاصطناعي. تُصحَّح إجابات الاختبارات على الخادم وتُحفظ في حسابك."],
    [
      ["Under Courses, click Start (or Continue) on a course, work through the lessons with ✔ Mark complete or Next lesson →, and end with Finish & practise questions →.", "تحت «الدورات»، انقر «ابدأ» (أو «متابعة») على دورة، وتقدّم في الدروس باستخدام «✔ وضع علامة مكتمل» أو «الدرس التالي →»، واختم بـ«إنهاء وأسئلة تدريبية →»."],
      ["Under Practice by topic, click Practise next to a topic; pick an answer, click Check to see the explanation, then Next →, and click Finish after the last question.", "تحت «التدرّب حسب الموضوع»، انقر «تدرّب» بجانب موضوع؛ اختر إجابة وانقر «فحص» لرؤية الشرح، ثم «التالي →»، وانقر «إنهاء» بعد آخر سؤال."],
      ["Click Start mock exam for 30 questions across all topics in 40 minutes (pass mark 65%), or click Start next to a part under Mock exam by part (20 questions in 25 minutes; All parts: 30 questions in 40 minutes).", "انقر «ابدأ الاختبار التجريبي» لأداء 30 سؤالاً في جميع الموضوعات خلال 40 دقيقة (درجة النجاح 65%)، أو انقر «ابدأ» بجانب جزء تحت «اختبار تجريبي حسب الجزء» (20 سؤالاً خلال 25 دقيقة؛ جميع الأجزاء: 30 سؤالاً خلال 40 دقيقة)."],
      ["In an exam, watch the timer, move with ← Back and Next →, and click Finish; the exam submits itself when the time runs out.", "أثناء الاختبار، راقب المؤقّت، وتنقّل باستخدام «← رجوع» و«التالي →»، ثم انقر «إنهاء»؛ ويُسلَّم الاختبار تلقائياً عند انتهاء الوقت."],
      ["Under Scenarios, click Play and choose an option at each decision; you get feedback and a score at the end.", "تحت «السيناريوهات»، انقر «تشغيل» واختر خياراً عند كل قرار؛ وتحصل على ملاحظات ودرجة في النهاية."],
      ["In AI interview coach, choose a role and a level, click Start mock interview, then type each answer and click Answer.", "في «مدرب المقابلات (ذكاء اصطناعي)»، اختر دوراً ومستوى، وانقر «بدء مقابلة تجريبية»، ثم اكتب كل إجابة وانقر «الإجابة»."],
    ],
    [
      ["Quiz and exam scores saved to your results history (Recent results)", "درجات الاختبارات محفوظة في سجل نتائجك («النتائج الأخيرة»)"],
      ["Skill profile by topic, built from all your attempts", "ملف المهارات حسب الموضوع، مبني على جميع محاولاتك"],
      ["Course lesson completion saved to your account", "إكمال دروس الدورات محفوظ في حسابك"],
    ], [],
    [
      ["Exams give no feedback until you finish; the result shows Pass or Not yet, a score by topic and a review of every question.", "لا تعرض الاختبارات أي ملاحظات قبل الإنهاء؛ وتُظهر النتيجة «ناجح» أو «ليس بعد»، والدرجة حسب الموضوع، ومراجعة لكل سؤال."],
      ["Only answered questions count towards the score, so answer every question before you click Finish.", "تُحتسب الأسئلة المُجاب عنها فقط في الدرجة، لذا أجب عن كل سؤال قبل النقر على «إنهاء»."],
      ["Courses a project manager assigns to you appear at the top under Assigned to you; Leave closes a quiz without saving it.", "تظهر الدورات التي يُسندها إليك مدير المشروع في الأعلى تحت «مُسند إليك»؛ ويُغلق زر «مغادرة» الاختبار دون حفظه."],
    ]),

  g("s.19650.parts",
    ["The ISO 19650 learning hub. It shows how the six parts fit together, and opens a page for each part with explanations, clauses, practical examples, questions and answers, a quiz and an AI tutor.",
      "مركز تعلّم ISO 19650. يوضح كيف تترابط الأجزاء الستة، ويفتح لكل جزء صفحة فيها شروح وبنود وأمثلة عملية وأسئلة وأجوبة واختبار ومعلّم ذكي."],
    [
      ["Read How the six parts fit together: a diagram of the delivery and operational phases, with Part 1 as the foundation and Parts 4, 5 and 6 across both phases; click any part to open it.", "اقرأ «كيف تترابط الأجزاء الستة»: مخطط لمرحلتي التسليم والتشغيل، يمثّل فيه الجزء 1 الأساس وتمتد الأجزاء 4 و5 و6 عبر المرحلتين؛ انقر على أي جزء لفتحه."],
      ["Use Which part applies at each stage to see the main part (●) and the parts that also apply (○) at each stage.", "استخدم «أي جزء ينطبق في كل مرحلة» لمعرفة الجزء الرئيسي (●) والأجزاء التي تنطبق أيضاً (○) في كل مرحلة."],
      ["Read How each part links to the others for the hand-offs between parts.", "اقرأ «كيف يرتبط كل جزء بالأجزاء الأخرى» لمعرفة نقاط التسليم بين الأجزاء."],
      ["Under Open a part, click a part card; each card shows your compliance checklist progress for that part.", "تحت «افتح جزءاً»، انقر على بطاقة جزء؛ وتعرض كل بطاقة تقدّمك في قائمة التحقق من الامتثال لذلك الجزء."],
      ["Click What is changing → on the red banner to read about the 2026 revision.", "انقر «ما الذي يتغير ←» في الشريط الأحمر للاطلاع على مراجعة 2026."],
    ], [], [],
    [["For timed exams on each part, use Mock exam by part on the Learn page.", "لأداء اختبارات موقوتة لكل جزء، استخدم «اختبار تجريبي حسب الجزء» في صفحة التعلّم."]]),

  part(1,
    ["Part 1 (ISO 19650-1:2018, Concepts and principles) sets the shared vocabulary, concepts and principles for managing information about built assets across their whole life. This page explains it at three levels, with 9 clauses, a 14-item compliance checklist, 5 practical examples, 10 questions and answers and a 6-question quiz.",
      "يضع الجزء 1 (ISO 19650-1:2018، المفاهيم والمبادئ) المفردات والمفاهيم والمبادئ المشتركة لإدارة المعلومات عن الأصول المبنية طوال دورة حياتها. تشرحه هذه الصفحة على ثلاثة مستويات، مع 9 بنود، وقائمة تحقق من الامتثال من 14 بنداً، و5 أمثلة عملية، و10 أسئلة وأجوبة، واختبار من 6 أسئلة."],
    ["Key documents covered: OIR, AIR, EIR, the project information standard, the CDE workflow and procedure, and the information protocol.",
      "الوثائق الرئيسية المشمولة: OIR وAIR وEIR، ومعيار معلومات المشروع، وسير عمل CDE وإجراءاته، وبروتوكول المعلومات."], true),
  part(2,
    ["Part 2 (ISO 19650-2:2018, Delivery phase of the assets) sets out the information management process for the delivery phase through eight activities, from assessment and need to project close-out. This page explains it at three levels, with 9 clauses, an 18-item compliance checklist, 5 practical examples, 10 questions and answers and a 6-question quiz.",
      "يحدد الجزء 2 (ISO 19650-2:2018، مرحلة تسليم الأصول) عملية إدارة المعلومات في مرحلة التسليم عبر ثمانية أنشطة، من التقييم وتحديد الحاجة إلى إغلاق المشروع. تشرحه هذه الصفحة على ثلاثة مستويات، مع 9 بنود، وقائمة تحقق من الامتثال من 18 بنداً، و5 أمثلة عملية، و10 أسئلة وأجوبة، واختبار من 6 أسئلة."],
    ["Key documents covered: EIR, pre- and post-appointment BEP, capability and capacity assessment, detailed responsibility matrix, TIDP, MIDP and mobilisation plan.",
      "الوثائق الرئيسية المشمولة: EIR، وBEP قبل التعيين وبعده، وتقييم القدرة والطاقة الاستيعابية، ومصفوفة المسؤوليات التفصيلية، وTIDP وMIDP، وخطة التعبئة."], true),
  part(3,
    ["Part 3 (ISO 19650-3:2020, Operational phase of the assets) sets out the information management process for the operational phase, so the AIM stays complete, current and trustworthy as the asset changes. This page explains it at three levels, with 8 clauses, a 15-item compliance checklist, 5 practical examples, 10 questions and answers and a 6-question quiz.",
      "يحدد الجزء 3 (ISO 19650-3:2020، المرحلة التشغيلية للأصول) عملية إدارة المعلومات في المرحلة التشغيلية، ليبقى AIM مكتملاً ومحدّثاً وموثوقاً مع تغيّر الأصل. تشرحه هذه الصفحة على ثلاثة مستويات، مع 8 بنود، وقائمة تحقق من الامتثال من 15 بنداً، و5 أمثلة عملية، و10 أسئلة وأجوبة، واختبار من 6 أسئلة."],
    ["Key documents covered: OIR, AIR, EIR for the operational phase, the information handover strategy, the CDE workflow and procedure, and the information protocol.",
      "الوثائق الرئيسية المشمولة: OIR وAIR وEIR للمرحلة التشغيلية، واستراتيجية تسليم المعلومات، وسير عمل CDE وإجراءاته، وبروتوكول المعلومات."], true),
  part(4,
    ["Part 4 (ISO 19650-4:2022, Information exchange) details the process and criteria for each information exchange, so information moving between CDE states is reviewed consistently at sharing, authorisation and acceptance. This page explains it at three levels, with 9 clauses, a 14-item compliance checklist, 5 practical examples, 10 questions and answers and a 6-question quiz.",
      "يفصّل الجزء 4 (ISO 19650-4:2022، تبادل المعلومات) العملية والمعايير لكل تبادل للمعلومات، لتُراجَع المعلومات المنتقلة بين حالات CDE بصورة متسقة عند المشاركة والتفويض والقبول. تشرحه هذه الصفحة على ثلاثة مستويات، مع 9 بنود، وقائمة تحقق من الامتثال من 14 بنداً، و5 أمثلة عملية، و10 أسئلة وأجوبة، واختبار من 6 أسئلة."],
    ["Key documents covered: the CDE workflow and procedure, the information container QA checklist, the project information standard, the EIR and the model production and delivery table.",
      "الوثائق الرئيسية المشمولة: سير عمل CDE وإجراءاته، وقائمة فحص جودة حاويات المعلومات، ومعيار معلومات المشروع، وEIR، وجدول إنتاج النماذج وتسليمها."], false),
  part(5,
    ["Part 5 (ISO 19650-5:2020, Security-minded approach to information management) sets a proportionate, security-minded approach to sensitive information about built assets, from sensitivity assessment to breach and incident management. This page explains it at three levels, with 7 clauses, a 16-item compliance checklist, 5 practical examples, 10 questions and answers and a 6-question quiz.",
      "يضع الجزء 5 (ISO 19650-5:2020، النهج المراعي للأمن في إدارة المعلومات) نهجاً متناسباً ومراعياً للأمن في التعامل مع المعلومات الحساسة عن الأصول المبنية، من تقييم الحساسية إلى إدارة الاختراقات والحوادث. تشرحه هذه الصفحة على ثلاثة مستويات، مع 7 بنود، وقائمة تحقق من الامتثال من 16 بنداً، و5 أمثلة عملية، و10 أسئلة وأجوبة، واختبار من 6 أسئلة."],
    ["Key documents covered: security triage and security management plan, security strategy, security breach/incident management plan, information protocol, EIR, and the CDE workflow and procedure.",
      "الوثائق الرئيسية المشمولة: الفرز الأمني وخطة إدارة الأمن، واستراتيجية الأمن، وخطة إدارة الاختراقات والحوادث الأمنية، وبروتوكول المعلومات، وEIR، وسير عمل CDE وإجراءاته."], false),
  part(6,
    ["Part 6 (ISO 19650-6:2025, Health and safety information) sets requirements for sharing structured health and safety information throughout the project and asset life cycle. This page explains it at three levels, with 8 clauses, a 14-item compliance checklist, 5 practical examples, 10 questions and answers and a 6-question quiz.",
      "يضع الجزء 6 (ISO 19650-6:2025، معلومات الصحة والسلامة) متطلبات المشاركة التعاونية لمعلومات الصحة والسلامة المنظّمة طوال دورة حياة المشروع والأصل. تشرحه هذه الصفحة على ثلاثة مستويات، مع 8 بنود، وقائمة تحقق من الامتثال من 14 بنداً، و5 أمثلة عملية، و10 أسئلة وأجوبة، واختبار من 6 أسئلة."],
    ["Key documents covered: AIR, EIR, the information delivery risk register, the information handover strategy and BIM meeting minutes.",
      "الوثائق الرئيسية المشمولة: AIR وEIR، وسجل مخاطر تسليم المعلومات، واستراتيجية تسليم المعلومات، ومحاضر اجتماعات BIM."], false),

  g("s.19650.revision",
    ["A hub on the draft 2026 revision of ISO 19650 Parts 1–3: where it stands, what is confirmed and what is only proposed, how the terms change, and what to do now. The current editions stay in force until the new ones are published.",
      "مركز حول مسودة مراجعة 2026 للأجزاء 1–3 من ISO 19650: أين وصلت، وما المؤكد وما المقترح فقط، وكيف تتغير المصطلحات، وما يجب فعله الآن. تبقى الإصدارات الحالية سارية حتى نشر الإصدارات الجديدة."],
    [
      ["Open the tabs in order: Where it stands, Key changes, Old and new terms, Part by part, What to do now, FAQ & quiz, and Sources & AI.", "افتح التبويبات بالترتيب: «أين وصلت المراجعة» و«التغييرات الرئيسية» و«المصطلحات القديمة والجديدة» و«جزءًا بجزء» و«ما يجب فعله الآن» و«الأسئلة الشائعة والاختبار» و«المصادر والذكاء الاصطناعي»."],
      ["On What to do now, tick the checklist items as you complete them; the ticks are kept, and Clear empties the list.", "في «ما يجب فعله الآن»، ضع علامة على بنود قائمة التحقق عند إنجازها؛ تُحفظ العلامات، ويُفرغ زر «مسح» القائمة."],
      quiz(["FAQ & quiz", "الأسئلة الشائعة والاختبار"], 4),
      ai(["Sources & AI", "المصادر والذكاء الاصطناعي"]),
      HUB_NAV,
    ],
    [HUB_OUT], [],
    [
      ["The draft is not yet a published standard; keep working to the current editions on live appointments.", "المسودة ليست معياراً منشوراً بعد؛ واصل العمل وفق الإصدارات الحالية في التعيينات القائمة."],
      RELATED,
    ]),

  g("s.19650.summary",
    ["The ISO 19650 knowledge library, open on Parts of the series: one card per part with its year, scope and key topics.",
      "مكتبة معارف ISO 19650، مفتوحة على «أجزاء السلسلة»: بطاقة لكل جزء تعرض سنته ونطاقه وموضوعاته الرئيسية."],
    [
      ["Read the card for each of the six parts: title, year, scope and key topic badges.", "اقرأ بطاقة كل جزء من الأجزاء الستة: العنوان والسنة والنطاق وشارات الموضوعات الرئيسية."],
      ["Type in Search this section… to filter the parts by title, scope or topic.", "اكتب في «ابحث في هذا القسم…» لتصفية الأجزاء حسب العنوان أو النطاق أو الموضوع."],
      LIB_TABS,
      KNOWLEDGE_NAV,
    ], [], [],
    [
      PARAPHRASED,
      ["For a full lesson on each part, use the All parts (1–6) learning hub.", "لدرس كامل عن كل جزء، استخدم مركز التعلّم «جميع الأجزاء (1–6)»."],
    ]),

  g("s.19650.process",
    ["The ISO 19650-2 delivery process as a clause tree: the eight activities from 5.1 Assessment and need to 5.8 Project close-out, each with its sub-clauses and their outputs.",
      "عملية التسليم وفق ISO 19650-2 على شكل شجرة بنود: الأنشطة الثمانية من 5.1 التقييم وتحديد الحاجة إلى 5.8 إغلاق المشروع، ولكل منها بنودها الفرعية ومخرجاتها."],
    [
      ["Click an activity to expand it and read its summary.", "انقر على نشاط لتوسيعه وقراءة ملخصه."],
      ["Read each sub-clause's summary and the output badges it produces.", "اقرأ ملخص كل بند فرعي وشارات المخرجات التي ينتجها."],
      ["Type in Search this section… to find a sub-clause; matching activities open automatically.", "اكتب في «ابحث في هذا القسم…» للعثور على بند فرعي؛ وتُفتح الأنشطة المطابقة تلقائياً."],
      LIB_TABS,
    ], [], [],
    [
      PARAPHRASED,
      ["For an interactive version showing who does what, open the Appointment process diagram hub.", "لنسخة تفاعلية توضّح من يفعل ماذا، افتح مركز «مخطط عملية التعيين»."],
    ]),

  g("s.19650.cde",
    ["A one-page quick reference for the CDE: the four information states and the suitability codes (UK National Annex) with the CDE state each belongs to.",
      "مرجع سريع في صفحة واحدة لبيئة CDE: حالات المعلومات الأربع ورموز الملاءمة (الملحق الوطني البريطاني) مع حالة CDE التي ينتمي إليها كل رمز."],
    [
      ["Read the four state cards: Work in progress, Shared, Published and Archived.", "اقرأ بطاقات الحالات الأربع: «قيد العمل» و«مشترك» و«منشور» و«مؤرشف»."],
      ["Use the Suitability codes (UK National Annex) table to see each code, its CDE state and its meaning.", "استخدم جدول «رموز الملاءمة (الملحق الوطني البريطاني)» لمعرفة كل رمز وحالة CDE الخاصة به ومعناه."],
      ["Type a code or a word in Search this section… to filter the codes table.", "اكتب رمزاً أو كلمة في «ابحث في هذا القسم…» لتصفية جدول الرموز."],
      ["Follow the naming & status tool link at the bottom to check names and codes.", "اتبع رابط أداة التسمية والحالة في الأسفل للتحقق من الأسماء والرموز."],
    ], [], [],
    [
      ["The CDE deep guide in Topic hubs goes further: revision codes, transitions, set-up, platforms and daily operation.", "يتعمّق «الدليل المتعمّق لبيئة البيانات المشتركة (CDE)» في مراكز المواضيع أكثر: رموز الإصدار، والانتقالات، والإعداد، والمنصات، والتشغيل اليومي."],
    ]),

  g("s.19650.glossary",
    ["The key ISO 19650 terms as the standard defines them, in a searchable table of terms, abbreviations and paraphrased definitions.",
      "المصطلحات الرئيسية في ISO 19650 كما يعرّفها المعيار، في جدول قابل للبحث يضم المصطلحات والاختصارات والتعريفات المُعاد صياغتها."],
    [
      ["Read the Term and Definition table; an abbreviation, where there is one, is shown before the term.", "اقرأ جدول «المصطلح» و«التعريف»؛ ويظهر الاختصار، إن وُجد، قبل المصطلح."],
      ["Type in Search this section… to filter by term, abbreviation or definition.", "اكتب في «ابحث في هذا القسم…» للتصفية حسب المصطلح أو الاختصار أو التعريف."],
      LIB_TABS,
    ], [], [],
    [["For every BIM acronym in English and Arabic, use the Glossary & acronym decoder.", "للاطلاع على جميع اختصارات BIM بالإنجليزية والعربية، استخدم «المسرد ومُفسِّر الاختصارات»."]]),

  g("s.glossary",
    ["A bilingual glossary of more than 400 BIM terms and acronyms, with each term and its definition in English and Arabic side by side, grouped into 12 categories.",
      "مسرد ثنائي اللغة يضم أكثر من 400 مصطلح واختصار في BIM، يعرض كل مصطلح وتعريفه بالإنجليزية والعربية جنباً إلى جنب، مصنّفة في 12 فئة."],
    [
      ["Type in the search box in English or Arabic, for example MIDP or trigger event; results are sorted by relevance.", "اكتب في مربع البحث بالإنجليزية أو العربية، مثل MIDP أو trigger event؛ وتُرتَّب النتائج حسب الصلة."],
      ["Click a letter to browse alphabetically (# for entries that start with a number), or click a category chip to filter by topic.", "انقر على حرف للتصفح أبجدياً (# للمدخلات التي تبدأ برقم)، أو انقر على شريحة فئة للتصفية حسب الموضوع."],
      ["Tick Acronyms only to show only abbreviations.", "ضع علامة على «الاختصارات فقط» لعرض الاختصارات وحدها."],
      ["On an entry, click a Related chip to jump to that term, or click Copy to copy the entry in both languages.", "في أي مدخل، انقر على شريحة ضمن «ذو صلة» للانتقال إلى ذلك المصطلح، أو انقر «نسخ» لنسخ المدخل باللغتين."],
      ["Click Clear filters to reset the search, letter, category and acronym filters.", "انقر «مسح عوامل التصفية» لإعادة ضبط البحث والحرف والفئة وتصفية الاختصارات."],
    ],
    [["Entry text in English and Arabic copied to your clipboard", "نص المدخل بالإنجليزية والعربية منسوخ إلى الحافظة"]], [],
    [
      ["The address changes with your search, so you can share a link that opens the glossary on that term.", "يتغير عنوان الصفحة مع بحثك، فيمكنك مشاركة رابط يفتح المسرد على ذلك المصطلح."],
      ["Definitions are paraphrased for learning; check the published standard and your appointment documents for the exact wording.", "التعريفات مُعاد صياغتها لأغراض التعلّم؛ راجع المعيار المنشور ووثائق التعيين للصياغة الدقيقة."],
    ]),

  g("s.uses",
    ["A reference library of 32 information uses: the purposes for which information is produced (ISO 19650-1 §5.1). Choosing them early drives the information requirements, the level of information need, the MIDP deliverables and the capability expected of each task team.",
      "مكتبة مرجعية تضم 32 استخداماً للمعلومات: أي الأغراض التي تُنتَج المعلومات من أجلها (ISO 19650-1 §5.1). يحدد اختيارها مبكراً متطلبات المعلومات ومستوى الحاجة إلى المعلومات ومخرجات MIDP والقدرة المتوقعة من كل فريق مهمة."],
    [
      ["Browse the uses by category: Capture, Design & analysis, Coordination, Quantities & cost, Time & logistics, Field & quality, Handover & assets and Operations.", "تصفّح الاستخدامات حسب الفئة: الالتقاط، والتصميم والتحليل، والتنسيق، والكميات والتكلفة، والوقت واللوجستيات، والموقع والجودة، والتسليم والأصول، والتشغيل."],
      ["Type in Search uses… to find a use by code, name, description or category.", "اكتب في «ابحث في الاستخدامات…» للعثور على استخدام حسب الرمز أو الاسم أو الوصف أو الفئة."],
      ["Click All phases, Plan, Design, Construct or Operate to show the uses for that phase.", "انقر «جميع المراحل» أو «الخطة» أو «التصميم» أو «التنفيذ» أو «التشغيل» لعرض استخدامات تلك المرحلة."],
      ["Read each card: description, value, inputs, deliverables, information need and capability, with the clause reference.", "اقرأ كل بطاقة: الوصف والقيمة والمدخلات والمُخرَجات والحاجة للمعلومات والقدرة، مع مرجع البند."],
    ], [], [],
    [["To choose uses for a project and generate the Information Uses Schedule, open that project's Information uses page.", "لاختيار الاستخدامات لمشروع ما وإنشاء جدول استخدامات المعلومات، افتح صفحة «استخدامات المعلومات» في ذلك المشروع."]]),

  g("s.hubs",
    ["The landing page for all topic hubs: in-depth guides that sit alongside the ISO 19650 parts, grouped into five themes in a suggested learning order. Each hub has topics, worked examples, checklists, quizzes and an AI tutor.",
      "الصفحة الرئيسية لجميع مراكز المواضيع: أدلة متعمّقة تُكمل أجزاء ISO 19650، مصنّفة في خمسة محاور بترتيب تعلّم مقترح. يضم كل مركز موضوعات وأمثلة تطبيقية وقوائم تحقق واختبارات ومعلّماً ذكياً."],
    [
      ["Click a theme chip in the header to jump to it: The ISO 19650 process, Information requirements, Software, models & AI, Sectors & strategy, or Standards & AI governance.", "انقر على شريحة محور في الأعلى للانتقال إليه: «عملية ISO 19650» أو «متطلبات المعلومات» أو «البرمجيات والنماذج والذكاء الاصطناعي» أو «القطاعات والاستراتيجية» أو «المعايير وحوكمة الذكاء الاصطناعي»."],
      ["Read the hub cards; each shows its place in the suggested order, a short introduction and how many topics you have explored.", "اقرأ بطاقات المراكز؛ تعرض كل بطاقة ترتيبها المقترح ومقدمة قصيرة وعدد الموضوعات التي استكشفتها."],
      ["Click a card to open the hub.", "انقر على بطاقة لفتح المركز."],
      ["Click Resume → under Continue where you left off to return to the last topic you opened.", "انقر «متابعة →» تحت «تابع من حيث توقفت» للعودة إلى آخر موضوع فتحته."],
    ], [], [],
    [["Progress bars come from this browser only, so they start empty on another device.", "تعتمد أشرطة التقدم على هذا المتصفح فقط، لذا تبدأ فارغة على جهاز آخر."]]),

  g("s.hub.appointment",
    ["An interactive ISO 19650-2 appointment process: who does what at each step, with inputs, activities, outputs and documents, plus a view for each party, decision gates, a RACI and a quiz.",
      "عملية تعيين تفاعلية وفق ISO 19650-2: من يفعل ماذا في كل خطوة، مع المدخلات والأنشطة والمخرجات والوثائق، إضافةً إلى عرض لكل طرف وبوابات القرار ومصفوفة RACI واختبار."],
    [
      ["Open a tab: Interactive diagram, Appointing party view, Lead appointed party view, Task team view, Milestones & decision gates, RACI by activity, Common pitfalls, Quiz or Ask AI.", "افتح تبويباً: «مخطط تفاعلي» أو «عرض الطرف المُعيِّن» أو «عرض الطرف المُعيَّن الرئيسي» أو «عرض فريق المهمة» أو «المعالم وبوابات القرار» أو «RACI حسب النشاط» أو «الأخطاء الشائعة» أو «اختبار» أو «اسأل الذكاء الاصطناعي»."],
      ["On Interactive diagram, click Full process or a party (Appointing party, Lead appointed party, Appointed parties / task teams, Shared) to highlight its steps, then click any of the 16 steps to see who is responsible, the clause, inputs, activities, outputs and documents.", "في «مخطط تفاعلي»، انقر «العملية الكاملة» أو طرفاً («الطرف المُعيِّن» أو «الطرف المُعيَّن الرئيسي» أو «الأطراف المُعيَّنة / فرق المهام» أو «مشترك») لإبراز خطواته، ثم انقر على أي خطوة من الخطوات الـ16 لمعرفة المسؤول والبند والمدخلات والأنشطة والمخرجات والوثائق."],
      ["On the party view tabs and Milestones & decision gates, tick the checklist items as you work; the ticks are kept, and Clear empties a list.", "في تبويبات عرض الأطراف و«المعالم وبوابات القرار»، ضع علامة على بنود قائمة التحقق أثناء العمل؛ تُحفظ العلامات، ويُفرغ زر «مسح» القائمة."],
      quiz(["Quiz", "اختبار"], 10),
      ai(["Ask AI", "اسأل الذكاء الاصطناعي"], ["Generate an information management assignment matrix", "إنشاء مصفوفة إسناد مهام إدارة المعلومات"]),
      HUB_NAV,
    ],
    [HUB_OUT], [], [RELATED, LOCK]),

  g("s.hub.docroles",
    ["Shows which party produces which ISO 19650 document at each ISO 19650-2 stage, with a page for each party's documents and a short guide to the main documents. It has no quiz.",
      "يوضح أي طرف يُعدّ كل وثيقة من وثائق ISO 19650 في كل مرحلة من مراحل ISO 19650-2، مع صفحة لوثائق كل طرف ودليل مختصر للوثائق الرئيسية. لا يتضمن اختباراً."],
    [
      ["Pick a section and tab: Workflow overview (Document table, Summary matrix, Document flow, Colour legend), Appointing party (Requirements, Standards & methods, Tender, acceptance & close-out), Lead appointed party (Tender documents, Appointment documents, Delivery & close-out), Task teams / sub-appointed (Planning documents, Production documents) and Document guide (EIR, BEP, MIDP, TIDP, Responsibility matrix, Information protocol).", "اختر قسماً وتبويباً: «نظرة عامة على سير العمل» («جدول المستندات» و«مصفوفة الملخص» و«تدفق المستندات» و«مفتاح الألوان»)، و«الطرف المُعيِّن» («المتطلبات» و«المعايير والأساليب» و«المناقصة والقبول والإغلاق»)، و«الطرف المُعيَّن الرئيسي» («مستندات المناقصة» و«مستندات التعيين» و«التسليم والإغلاق»)، و«فرق المهام / المُعيَّنون من الباطن» («مستندات التخطيط» و«مستندات الإنتاج»)، و«دليل المستندات» (EIR وBEP وMIDP وTIDP و«مصفوفة المسؤوليات» و«بروتوكول المعلومات»)."],
      ["On Document table, filter with All parties or one party, All stages or one stage, or type in Find a document…; the table lists documents by stage and party.", "في «جدول المستندات»، صفِّ باستخدام «جميع الأطراف» أو طرف واحد، و«جميع المراحل» أو مرحلة واحدة، أو اكتب في «ابحث عن مستند…»؛ ويعرض الجدول المستندات حسب المرحلة والطرف."],
      ["Click a document to see its details, then click Open the … template where one exists, or Close.", "انقر على مستند لعرض تفاصيله، ثم انقر زر فتح القالب الخاص به إن وُجد، أو «إغلاق»."],
      HUB_CHECKS,
      HUB_SECTIONS,
      HUB_NAV,
    ],
    [HUB_OUT_NOQUIZ], [], [RELATED, LOCK]),

  g("s.hub.loin",
    ["A single hub for level of information need (LOIN), LOD 100–500 and LOI: what each means, how they compare, what is needed at each stage, an element library, worked examples and how to carry LOIN into the EIR, BEP and AIM.",
      "مركز موحّد لمستوى الحاجة إلى المعلومات (LOIN) وLOD 100–500 وLOI: معنى كلٍّ منها، وكيف تُقارَن، وما المطلوب في كل مرحلة، ومكتبة عناصر، وأمثلة تطبيقية، وكيفية نقل LOIN إلى EIR وBEP وAIM."],
    [
      ["Open a tab: Overview, LOIN explained, LOD 100–500, LOD 400 in Revit, LOI levels, Compare, By stage, Element & LOIN library, Practical specification, Worked examples, EIR/BEP transfer, AIM guide, Quiz and AI tools.", "افتح تبويباً: «نظرة عامة» و«شرح LOIN» وLOD 100–500 و«LOD 400 في Revit» و«مستويات LOI» و«مقارنة» و«حسب المرحلة» و«مكتبة العناصر وLOIN» و«المواصفة العملية» و«أمثلة تطبيقية» و«النقل عبر EIR/BEP» و«دليل AIM» و«اختبار» و«أدوات الذكاء الاصطناعي»."],
      HUB_CHECKS,
      quiz(["Quiz", "اختبار"], 10),
      ai(["AI tools", "أدوات الذكاء الاصطناعي"], ["Draft a LOIN specification", "صياغة مسودة مواصفة LOIN"]),
      HUB_NAV,
    ],
    [HUB_OUT], [], [RELATED, LOCK]),

  g("s.hub.cobie",
    ["A practical COBie guide: the sheets and what goes in them, a sheet-by-sheet reference of the schema, colour coding, delivery timing, authoring from Revit or Archicad, quality checks, the link to ISO 19650 and a delivery playbook.",
      "دليل عملي لـ COBie: الأوراق وما يوضع فيها، ومرجع للمخطط ورقةً ورقة، والترميز اللوني، وتوقيت التسليم، والإعداد من Revit أو Archicad، وفحوصات الجودة، والارتباط بـ ISO 19650، ودليل تسليم عملي."],
    [
      ["Open a tab: Overview, Sheets explained, Sheet-by-sheet reference, Colour coding, Delivery timing, Authoring from Revit/Archicad, Quality checks, ISO 19650 link, Delivery playbook, FAQ, Quiz and AI tools.", "افتح تبويباً: «نظرة عامة» و«شرح الأوراق» و«مرجع الأوراق ورقةً ورقة» و«الترميز اللوني» و«توقيت التسليم» و«الإعداد من Revit/Archicad» و«فحوصات الجودة» و«الارتباط بـ ISO 19650» و«دليل التسليم العملي» و«الأسئلة الشائعة» و«اختبار» و«أدوات الذكاء الاصطناعي»."],
      ["Use Sheet-by-sheet reference to look up the full COBie schema; it loads when you open the tab.", "استخدم «مرجع الأوراق ورقةً ورقة» للاطلاع على مخطط COBie الكامل؛ ويُحمَّل عند فتح التبويب."],
      HUB_CHECKS,
      quiz(["Quiz", "اختبار"], 11),
      ai(["AI tools", "أدوات الذكاء الاصطناعي"], ["Draft a COBie data requirements schedule", "صياغة جدول متطلبات بيانات COBie"]),
      HUB_NAV,
    ],
    [HUB_OUT], [], [RELATED, LOCK]),

  g("s.hub.revit",
    ["Revit best practice for ISO 19650 delivery, in three sections: everyday Revit set-up and modelling, advanced Revit topics, and using MCP to connect AI to Revit and other Autodesk software.",
      "أفضل ممارسات Revit للتسليم وفق ISO 19650، في ثلاثة أقسام: الإعداد والنمذجة اليومية في Revit، وموضوعات Revit المتقدمة، واستخدام MCP لربط الذكاء الاصطناعي بـ Revit وبرمجيات Autodesk الأخرى."],
    [
      ["Revit section: Model setup, Templates & standards, Modelling by discipline, Naming, Shared parameters, Data & schedules, Worksets & collaboration, Families, IFC export, IFC mapping & validation, Coordination, Performance, Automation, Model QA checklist, Tips & shortcuts, FAQ, Quiz and AI tools.", "قسم Revit: «إعداد النموذج» و«القوالب والمعايير» و«النمذجة حسب التخصص» و«التسمية» و«المعاملات المشتركة» و«البيانات والجداول» و«مجموعات العمل والتعاون» و«العائلات» و«تصدير IFC» و«ربط IFC والتحقق منه» و«التنسيق» و«الأداء» و«الأتمتة» و«قائمة فحص ضمان جودة النموذج» و«نصائح واختصارات» و«الأسئلة الشائعة» و«اختبار» و«أدوات الذكاء الاصطناعي»."],
      ["Advanced Revit section: Federation & CDE, Data governance & IDS, Model health KPIs, Phases, options & assemblies and Revit API essentials. MCP for Revit & Autodesk section: Overview, Install & connect, How it works, ISO 19650 workflows, Writing good prompts, Governance & security, Videos & references, and FAQ & quiz.", "قسم «Revit المتقدم»: «الدمج وبيئة البيانات المشتركة» و«حوكمة البيانات و IDS» و«مؤشرات أداء صحة النموذج» و«المراحل والخيارات والتجميعات» و«أساسيات واجهة برمجة Revit». قسم «MCP لـ Revit وAutodesk»: «نظرة عامة» و«التثبيت والربط» و«آلية العمل» و«مسارات عمل ISO 19650» و«كتابة أوامر نصية جيدة» و«الحوكمة والأمن» و«فيديوهات ومراجع» و«الأسئلة الشائعة والاختبار»."],
      ["Use Model QA checklist and the other checklists as you work; the ticks are kept, and Clear empties a list.", "استخدم «قائمة فحص ضمان جودة النموذج» وقوائم التحقق الأخرى أثناء العمل؛ تُحفظ العلامات، ويُفرغ زر «مسح» القائمة."],
      ["Take the 12-question Quiz in the Revit section or the 5-question quiz in FAQ & quiz; pick an answer to see the explanation straight away, and Try again resets a quiz.", "أدِّ «اختبار» المكوّن من 12 سؤالاً في قسم Revit أو الاختبار المكوّن من 5 أسئلة في «الأسئلة الشائعة والاختبار»؛ اختر إجابة لترى الشرح فوراً، ويعيد زر «حاول مرة أخرى» ضبط الاختبار."],
      ai(["AI tools", "أدوات الذكاء الاصطناعي"], ["Draft a Revit modelling standard", "صياغة معيار نمذجة Revit"]),
      HUB_NAV,
    ],
    [HUB_OUT], [], [HUB_SECTIONS, RELATED, LOCK]),

  g("s.hub.scan",
    ["A Scan to BIM hub covering reality capture from workflow to delivery: accuracy and LOD, hardware, software, the ISO 19650 view, use cases, challenges, an advanced workflow and a cost estimator.",
      "مركز «من المسح إلى BIM» يغطي الالتقاط الواقعي من سير العمل إلى التسليم: الدقة وLOD، والأجهزة، والبرمجيات، ومنظور ISO 19650، وحالات الاستخدام، والتحديات، وسير عمل متقدم، ومقدّر للتكلفة."],
    [
      ["Open a tab: Overview, Workflow, Accuracy & LOD, Hardware, Software, ISO 19650, Use cases, Challenges, Cost estimator, Quiz, AI tools and Advanced workflow.", "افتح تبويباً: «نظرة عامة» و«سير العمل» و«الدقة وLOD» و«الأجهزة» و«البرمجيات» وISO 19650 و«حالات الاستخدام» و«التحديات» و«مقدّر التكلفة» و«اختبار» و«أدوات الذكاء الاصطناعي» و«سير عمل متقدم»."],
      ["On Cost estimator, enter Floor area (m²), Complexity, Model LOD, Scope, Day rate and Travel days; the total days, the cost at your day rate and a breakdown by activity update as you type.", "في «مقدّر التكلفة»، أدخل «مساحة الطوابق (m²)» و«مستوى التعقيد» و«LOD النموذج» و«النطاق» و«الأجر اليومي» و«أيام السفر»؛ ويتحدّث إجمالي الأيام والتكلفة بسعرك اليومي والتفصيل حسب النشاط أثناء الكتابة."],
      HUB_CHECKS,
      quiz(["Quiz", "اختبار"], 10),
      ai(["AI tools", "أدوات الذكاء الاصطناعي"], ["Draft a scan survey specification", "صياغة مواصفة لأعمال المسح بالليزر"]),
      HUB_NAV,
    ],
    [HUB_OUT], [],
    [
      ["The estimator gives indicative planning figures, not a quotation; nothing you enter in it is saved.", "يعطي المقدّر أرقاماً تخطيطية تقريبية وليس عرض سعر؛ ولا يُحفظ شيء مما تُدخله فيه."],
      RELATED, LOCK,
    ]),

  g("s.hub.infra",
    ["Applying BIM and ISO 19650 to infrastructure: why it differs from buildings, IFC 4.3 and alignment, linear referencing, GIS–BIM integration and asset data, then sector-by-sector guidance for roads, rail, bridges, utilities, tunnels, ports and energy. It has no quiz.",
      "تطبيق BIM وISO 19650 على البنية التحتية: لماذا تختلف عن المباني، وIFC 4.3 والمسار، والإسناد الخطي، والتكامل بين GIS وBIM، وبيانات الأصول، ثم إرشادات لكل قطاع: الطرق والسكك الحديدية والجسور والمرافق والأنفاق والموانئ والطاقة. لا يتضمن اختباراً."],
    [
      ["In Overview, open Why infrastructure differs, IFC 4.3 & alignment, Linear referencing, GIS–BIM integration, Key standards, Asset data & classification, Information delivery pack, Sample document structures, Infra vs buildings, and Operations & digital twins.", "في «نظرة عامة»، افتح «لماذا تختلف البنية التحتية» و«IFC 4.3 والمسار» و«الإسناد الخطي» و«التكامل بين GIS وBIM» و«المعايير الرئيسية» و«بيانات الأصول والتصنيف» و«حزمة تسليم المعلومات» و«نماذج لهياكل المستندات» و«البنية التحتية مقابل المباني» و«التشغيل والتوائم الرقمية»."],
      ["Pick a sector section (Roads & highways, Rail & transit, Bridges & structures, Utilities (water, power, telecoms), Tunnels, Ports & waterways, Energy & power); each has Overview, Information requirements, CDE & federation, LOIN examples, Worked example and Challenges.", "اختر قسم قطاع («الطرق والطرق السريعة» أو «السكك الحديدية والنقل الجماعي» أو «الجسور والمنشآت» أو «المرافق (المياه، الكهرباء، الاتصالات)» أو «الأنفاق» أو «الموانئ والممرات المائية» أو «الطاقة والكهرباء»)؛ ولكل منها «نظرة عامة» و«متطلبات المعلومات» و«بيئة البيانات المشتركة والدمج» و«أمثلة LOIN» و«مثال تطبيقي» و«التحديات»."],
      HUB_CHECKS,
      ai(["AI tools", "أدوات الذكاء الاصطناعي"], ["Draft an infrastructure EIR", "صِغ مسودة EIR للبنية التحتية"]),
      HUB_SECTIONS,
      HUB_NAV,
    ],
    [HUB_OUT_NOQUIZ], [], [RELATED, LOCK]),

  g("s.hub.dimensions",
    ["The BIM dimensions beyond 3D: 4D time, 5D cost, 6D carbon and 7D asset and facilities management, plus net zero and an industry maturity benchmark, each with workflows, software, the ISO 19650 view and quizzes.",
      "أبعاد BIM بعد الثلاثي الأبعاد: 4D للوقت، و5D للتكلفة، و6D للكربون، و7D لإدارة الأصول والمرافق، إضافةً إلى الحياد الصفري ومعيار نضج مرجعي للقطاع، ولكلٍّ منها مسارات عمل وبرمجيات ومنظور ISO 19650 واختبارات."],
    [
      ["Sections: 4D BIM (Overview, Workflow, Software comparison, ISO 19650, Use cases, Challenges, Case studies, Clash detection, Quiz, AI tools), 5D cost (Overview, Workflow, ISO 19650, Software, Challenges, Quiz) and 6D carbon (Overview, Workflow, Standards & frameworks, ISO 19650, Tools, Quiz, AI tools).", "الأقسام: 4D BIM («نظرة عامة» و«سير العمل» و«مقارنة البرمجيات» وISO 19650 و«حالات الاستخدام» و«التحديات» و«دراسات الحالة» و«كشف التعارضات» و«اختبار» و«أدوات الذكاء الاصطناعي»)، و«التكلفة 5D» («نظرة عامة» و«سير العمل» وISO 19650 و«البرمجيات» و«التحديات» و«اختبار»)، و«الكربون 6D» («نظرة عامة» و«سير العمل» و«المعايير والأطر» وISO 19650 و«الأدوات» و«اختبار» و«أدوات الذكاء الاصطناعي»)."],
      ["More sections: 7D asset & FM (Overview, COBie and AIM handover, ISO 19650-3, CAFM / CMMS integration, Challenges), Net zero (Pathway, Targets & frameworks, Role of BIM data, Checklist) and Industry benchmark (Maturity benchmark, FAQ).", "أقسام أخرى: «الأصول وإدارة المرافق 7D» («نظرة عامة» و«COBie والتسليم النهائي لـ AIM» وISO 19650-3 و«التكامل مع CAFM / CMMS» و«التحديات»)، و«الحياد الصفري» («المسار» و«الأهداف والأطر» و«دور بيانات BIM» و«قائمة التحقق»)، و«المعيار المرجعي للقطاع» («معيار النضج المرجعي» و«الأسئلة الشائعة»)."],
      ["Take the Quiz tab in the 4D, 5D and 6D sections; pick an answer to see the explanation straight away, and Try again resets a quiz. Tick checklist items as you work.", "أدِّ تبويب «اختبار» في أقسام 4D و5D و6D؛ اختر إجابة لترى الشرح فوراً، ويعيد زر «حاول مرة أخرى» ضبط الاختبار. وضع علامة على بنود قوائم التحقق أثناء العمل."],
      ai(["AI tools (4D and 6D sections)", "أدوات الذكاء الاصطناعي (في قسمي 4D و6D)"], ["Generate a 4D planning execution plan", "إنشاء خطة تنفيذ لتخطيط 4D"]),
      HUB_SECTIONS,
      HUB_NAV,
    ],
    [HUB_OUT], [],
    [
      ["In the 6D carbon section, the AI tools tab offers Generate a whole-life carbon assessment plan instead.", "في قسم «الكربون 6D»، يقدّم تبويب «أدوات الذكاء الاصطناعي» بدلاً من ذلك «إنشاء خطة تقييم الكربون على كامل دورة الحياة»."],
      RELATED, LOCK,
    ]),

  g("s.hub.cde",
    ["An in-depth guide to the common data environment (CDE): the four states and metadata, suitability and revision codes, transitions and approvals, setting up and testing a CDE, choosing a platform and running it day to day.",
      "دليل متعمّق لبيئة البيانات المشتركة (CDE): الحالات الأربع والبيانات الوصفية، ورموز الملاءمة والإصدار، والانتقالات والاعتمادات، وإعداد بيئة CDE واختبارها، واختيار منصة، وتشغيلها يومياً."],
    [
      ["Sections: Fundamentals (What a CDE is, The four states, Metadata), Status & revision codes (Suitability codes, Revision convention, Transitions & approvals), Setting up a CDE (Structure & naming, Permissions & workflows, Mobilisation testing, Audit trail), Platforms (Comparison, Selecting a platform) and Operating the CDE (Routines, KPIs & failures, Security, Close-out & archiving, FAQ, quiz & resources).", "الأقسام: «الأساسيات» («ما هي بيئة CDE» و«الحالات الأربع» و«البيانات الوصفية»)، و«رموز الحالة والإصدار» («رموز الملاءمة» و«اصطلاح الإصدارات» و«الانتقالات والاعتمادات»)، و«إعداد بيئة CDE» («الهيكل والتسمية» و«الصلاحيات ومسارات العمل» و«اختبار التعبئة» و«مسار التدقيق»)، و«المنصات» («المقارنة» و«اختيار منصة»)، و«تشغيل بيئة CDE» («الروتين ومؤشرات الأداء والإخفاقات» و«الأمن» و«الإغلاق والأرشفة» و«الأسئلة الشائعة والاختبار والمصادر»)."],
      ["On Transitions & approvals, click Full process or a party (Task team, Lead appointed party, Appointing party) to highlight its steps, then click a step to see its inputs, activities and outputs.", "في «الانتقالات والاعتمادات»، انقر «العملية الكاملة» أو طرفاً («فريق المهمة» أو «الطرف المُعيَّن الرئيسي» أو «الطرف المُعيِّن») لإبراز خطواته، ثم انقر على خطوة لعرض مدخلاتها وأنشطتها ومخرجاتها."],
      HUB_CHECKS,
      quiz(["FAQ, quiz & resources", "الأسئلة الشائعة والاختبار والمصادر"], 6),
      ai(["FAQ, quiz & resources", "الأسئلة الشائعة والاختبار والمصادر"], ["Draft CDE procedures", "صياغة إجراءات CDE"]),
      HUB_NAV,
    ],
    [HUB_OUT], [], [HUB_SECTIONS, RELATED, LOCK]),

  g("s.hub.bcf",
    ["A learning hub for the BIM Collaboration Format (BCF): what it is, versions and the BCF API, how it fits ISO 19650, the issue lifecycle and clash coordination, coordination meetings, BCF support by software, and best practice for writing and reporting issues.",
      "مركز تعلّم لصيغة BCF للتعاون في BIM: ما هي، والإصدارات وBCF API، وكيف تتوافق مع ISO 19650، ودورة حياة المشكلة وتنسيق التعارضات، واجتماعات التنسيق، ودعم BCF حسب البرنامج، وأفضل الممارسات في كتابة المشكلات والتقارير."],
    [
      ["Sections: BCF basics (What BCF is, Versions & BCF API, BCF and ISO 19650), Issue lifecycle (From open to closed, Clash coordination, Coordination meeting), BCF by software (Tool comparison, On this platform), Best practice (Writing good issues, KPIs & reporting, Common mistakes) and FAQ, quiz & resources (FAQ, Quiz, Resources & AI).", "الأقسام: «أساسيات BCF» («ما هي BCF» و«الإصدارات وBCF API» و«BCF وISO 19650»)، و«دورة حياة المشكلة» («من الفتح إلى الإغلاق» و«تنسيق التعارضات» و«اجتماع التنسيق»)، و«BCF حسب البرنامج» («مقارنة الأدوات» و«على هذه المنصة»)، و«أفضل الممارسات» («كتابة مشكلات جيدة» و«مؤشرات الأداء والتقارير» و«الأخطاء الشائعة»)، و«الأسئلة الشائعة والاختبار والمصادر» («الأسئلة الشائعة» و«اختبار» و«المصادر والذكاء الاصطناعي»)."],
      ["On From open to closed, click Full process or a role (BIM coordinator, Responsible task team, Lead appointed party) to highlight its steps, then click a step to see its inputs, activities and outputs.", "في «من الفتح إلى الإغلاق»، انقر «العملية الكاملة» أو دوراً («منسق BIM» أو «فريق المهمة المسؤول» أو «الطرف المُعيَّن الرئيسي») لإبراز خطواته، ثم انقر على خطوة لعرض مدخلاتها وأنشطتها ومخرجاتها."],
      ["Use the Coordination meeting checklist as you run a meeting; the ticks are kept, and Clear empties the list.", "استخدم قائمة التحقق في «اجتماع التنسيق» أثناء إدارة الاجتماع؛ تُحفظ العلامات، ويُفرغ زر «مسح» القائمة."],
      quiz(["Quiz", "اختبار"], 6),
      ai(["Resources & AI", "المصادر والذكاء الاصطناعي"], ["Draft a BCF and issue management procedure", "صياغة إجراء لإدارة BCF والمشكلات"]),
      HUB_NAV,
    ],
    [HUB_OUT], [], [HUB_SECTIONS, RELATED, LOCK]),

  g("s.hub.facade",
    ["BIM coordination for façades as a specialist package: design responsibility, LOIN by stage, interfaces with other trades, modelling and panel identification, tolerances, coordination and clash tests, mock-ups, digital fabrication and façade asset information.",
      "تنسيق BIM للواجهات بوصفها حزمة تخصصية: مسؤولية التصميم، وLOIN حسب المرحلة، والواجهات البينية مع التخصصات الأخرى، والنمذجة وتعريف الألواح، والتفاوتات، والتنسيق واختبارات التعارض، والنماذج التجريبية، والتصنيع الرقمي، ومعلومات أصول الواجهات."],
    [
      ["Sections: The façade package (Overview, Design responsibility, LOIN by stage), Interfaces & modelling (Interfaces, Modelling approach, Panel identification, Tolerances & movement), Coordination & testing (Coordination cycle, Façade clash tests, Mock-ups & testing), Fabrication & handover (Digital fabrication, Asset information, Common mistakes) and FAQ, quiz & AI (FAQ, Quiz, AI tools).", "الأقسام: «حزمة الواجهات» («نظرة عامة» و«مسؤولية التصميم» و«LOIN حسب المرحلة»)، و«الواجهات البينية والنمذجة» («الواجهات البينية» و«نهج النمذجة» و«تعريف الألواح» و«التفاوتات والحركة»)، و«التنسيق والاختبار» («دورة التنسيق» و«اختبارات تعارض الواجهات» و«النماذج التجريبية والاختبار»)، و«التصنيع والتسليم» («التصنيع الرقمي» و«معلومات الأصول» و«الأخطاء الشائعة»)، و«الأسئلة الشائعة والاختبار والذكاء الاصطناعي» («الأسئلة الشائعة» و«اختبار» و«أدوات الذكاء الاصطناعي»)."],
      HUB_CHECKS,
      quiz(["Quiz", "اختبار"], 6),
      ai(["AI tools", "أدوات الذكاء الاصطناعي"], ["Draft façade information requirements", "صياغة متطلبات معلومات الواجهات"]),
      HUB_SECTIONS,
      HUB_NAV,
    ],
    [HUB_OUT], [], [RELATED, LOCK]),

  g("s.hub.handover",
    ["How to hand over the PIM as an AIM: the handover strategy and timeline, roles, what to hand over, acceptance and status, the health and safety file, data quality checks, loading into CAFM/CMMS, KPIs, a 12-week plan and what happens after handover.",
      "كيفية تسليم PIM ليصبح AIM: استراتيجية التسليم وجدولها الزمني، والأدوار، وما يجب تسليمه، والقبول والحالة، وملف الصحة والسلامة، وفحوص جودة البيانات، والتحميل في CAFM/CMMS، ومؤشرات الأداء، وخطة من 12 أسبوعاً، وما يحدث بعد التسليم."],
    [
      ["Sections: Strategy & timeline (Overview, Timeline, Roles), Content & acceptance (What to hand over, Acceptance & status, Documents & H&S file), Data quality & systems (Data quality checks, Loading into CAFM/CMMS, KPIs), Plan & operation (12-week plan, Readiness checklist, After handover, Common mistakes) and FAQ, quiz & AI (FAQ, Quiz, AI tools).", "الأقسام: «الاستراتيجية والجدول الزمني» («نظرة عامة» و«الجدول الزمني» و«الأدوار»)، و«المحتوى والقبول» («ما يجب تسليمه» و«القبول والحالة» و«المستندات وملف الصحة والسلامة»)، و«جودة البيانات والأنظمة» («فحوص جودة البيانات» و«التحميل في CAFM/CMMS» و«مؤشرات الأداء»)، و«الخطة والتشغيل» («خطة الأسابيع الاثني عشر» و«قائمة الجاهزية» و«بعد التسليم» و«الأخطاء الشائعة»)، و«الأسئلة الشائعة والاختبار والذكاء الاصطناعي» («الأسئلة الشائعة» و«اختبار» و«أدوات الذكاء الاصطناعي»)."],
      ["Work through Readiness checklist and the Documents & H&S file checklist before handover; the ticks are kept, and Clear empties a list.", "اعمل على «قائمة الجاهزية» وقائمة التحقق في «المستندات وملف الصحة والسلامة» قبل التسليم؛ تُحفظ العلامات، ويُفرغ زر «مسح» القائمة."],
      quiz(["Quiz", "اختبار"], 6),
      ai(["AI tools", "أدوات الذكاء الاصطناعي"], ["Draft an information handover strategy", "صياغة استراتيجية تسليم المعلومات"]),
      HUB_SECTIONS,
      HUB_NAV,
    ],
    [HUB_OUT], [], [RELATED, LOCK]),

  g("s.hub.timeline",
    ["The history of BIM standards, from the British foundations (BS 1192 and PAS 1192) to ISO 19650 and its 2026 revision, the openBIM standards (IFC, BCF, IDS, COBie) and national adoption, including a Middle East focus.",
      "تاريخ معايير BIM، من الأسس البريطانية (BS 1192 وPAS 1192) إلى ISO 19650 ومراجعتها لعام 2026، ومعايير openBIM (IFC وBCF وIDS وCOBie)، والتبنّي الوطني، مع تركيز على الشرق الأوسط."],
    [
      ["Sections: The big picture (Timeline, What replaced what), Eras (British foundations, The ISO era, The 2026 revision), openBIM standards (IFC; BCF, IDS and COBie; UK BIM Framework and GSL), National adoption (Selected adoptions, Middle East focus) and FAQ, quiz & links (FAQ, Quiz, Links & AI).", "الأقسام: «الصورة الكاملة» («الجدول الزمني» و«ما الذي حلّ محل ماذا»)، و«الحقب» («الأسس البريطانية» و«حقبة ISO» و«مراجعة 2026»)، و«معايير openBIM» (IFC؛ و«BCF وIDS وCOBie»؛ و«UK BIM Framework وGSL»)، و«التبنّي الوطني» («حالات تبنٍّ مختارة» و«التركيز على الشرق الأوسط»)، و«الأسئلة الشائعة والاختبار والروابط» («الأسئلة الشائعة» و«اختبار» و«الروابط والذكاء الاصطناعي»)."],
      ["Use What replaced what to map older documents to the standards that replaced them.", "استخدم «ما الذي حلّ محل ماذا» لربط الوثائق القديمة بالمعايير التي حلّت محلها."],
      quiz(["Quiz", "اختبار"], 6),
      ai(["Links & AI", "الروابط والذكاء الاصطناعي"]),
      HUB_SECTIONS,
      HUB_NAV,
    ],
    [HUB_OUT], [], [RELATED, LOCK]),

  g("s.hub.implementation",
    ["Best practice for implementing BIM in an organisation: strategy, maturity, people, process, technology, standards, KPIs and common mistakes. It has no quiz.",
      "أفضل الممارسات لتطبيق BIM في المؤسسة: الاستراتيجية، والنضج، والأفراد، والعمليات، والتقنية، والمعايير، ومؤشرات الأداء، والأخطاء الشائعة. لا يتضمن اختباراً."],
    [
      ["Open a tab: Strategy, Maturity, People, Process, Technology, Standards, KPIs, Common mistakes and AI tools.", "افتح تبويباً: «الاستراتيجية» و«النضج» و«الأفراد» و«العمليات» و«التقنية» و«المعايير» و«مؤشرات الأداء» و«الأخطاء الشائعة» و«أدوات الذكاء الاصطناعي»."],
      ["Use the checklists on Process and Common mistakes to review your own approach; the ticks are kept, and Clear empties a list.", "استخدم قوائم التحقق في «العمليات» و«الأخطاء الشائعة» لمراجعة نهجك؛ تُحفظ العلامات، ويُفرغ زر «مسح» القائمة."],
      ai(["AI tools", "أدوات الذكاء الاصطناعي"], ["Draft a BIM implementation strategy", "إعداد مسودة استراتيجية تطبيق BIM"]),
      HUB_NAV,
    ],
    [HUB_OUT_NOQUIZ], [],
    [
      ["To track adoption step by step with owners and due dates, use the ISO 19650 adoption roadmap.", "لتتبّع التبنّي خطوة بخطوة مع المالكين وتواريخ الاستحقاق، استخدم «خارطة طريق تبنّي ISO 19650»."],
      RELATED, LOCK,
    ]),

  g("r.19650",
    ["A list of ISO 19650 and related BIM standards and guidance, with the publisher and a short note for each.",
      "قائمة بمعايير ISO 19650 ومعايير BIM والإرشادات ذات الصلة، مع الناشر وملاحظة قصيرة لكلٍّ منها."],
    [
      ["Read the table: Reference, Publisher and Notes.", "اقرأ الجدول: «المرجع» و«الناشر» و«ملاحظات»."],
      ["Where a reference has a link (marked ↗), click it to open the source in a new tab; the others are listed by title only.", "إذا كان للمرجع رابط (يحمل العلامة ↗)، فانقر عليه لفتح المصدر في تبويب جديد؛ أما بقية المراجع فمدرجة بعناوينها فقط."],
      KNOWLEDGE_NAV,
    ], [], [],
    [["For a summary of each part, open Parts of the series in the Library tab.", "للاطلاع على ملخص كل جزء، افتح «أجزاء السلسلة» في تبويب «المكتبة»."]]),

  g("r.42001",
    ["A list of ISO/IEC 42001 and related AI management and governance standards and guidance, with the publisher and a short note for each.",
      "قائمة بمعيار ISO/IEC 42001 ومعايير وإرشادات إدارة الذكاء الاصطناعي وحوكمته ذات الصلة، مع الناشر وملاحظة قصيرة لكلٍّ منها."],
    [
      ["Read the table: Reference, Publisher and Notes.", "اقرأ الجدول: «المرجع» و«الناشر» و«ملاحظات»."],
      ["Where a reference has a link (marked ↗), click it to open the source in a new tab; the others are listed by title only.", "إذا كان للمرجع رابط (يحمل العلامة ↗)، فانقر عليه لفتح المصدر في تبويب جديد؛ أما بقية المراجع فمدرجة بعناوينها فقط."],
      ["Use the Library, Templates and References tabs, or the ISO 19650 — BIM / ISO/IEC 42001 — AI switch, to move around the Knowledge hub.", "استخدم تبويبات «المكتبة» و«القوالب» و«المراجع»، أو مفتاح ISO 19650 — BIM / ISO/IEC 42001 — AI، للتنقل في مركز المعرفة."],
    ], [], [],
    [["The ISO/IEC 42001 library lists clauses 4–10, the Annex A controls and AI in BIM use cases.", "تعرض مكتبة ISO/IEC 42001 البنود 4–10 وضوابط الملحق A وحالات استخدام الذكاء الاصطناعي في BIM."]]),
];
