// Interface language. English strings are the keys; Arabic switches the layout to right-to-left.
// Untranslated strings fall back to English, so content pages stay readable while coverage grows.

export type Locale = "en" | "ar";
let current: Locale = "en";

const AR: Record<string, string> = {
  // shell
  "Home": "الرئيسية", "Standards": "المعايير", "Documents": "المستندات", "Projects": "المشاريع", "Resources": "الموارد", "Help": "المساعدة", "Hide": "إخفاء",
  "ISO standards & guides": "معايير ISO والأدلة", "Documents & templates": "المستندات والقوالب",
  "Filter pages": "تصفية الصفحات", "Focus": "التركيز", "All roles": "كل الأدوار", "Search sections, tools, topics…": "ابحث في الأقسام والأدوات والموضوعات…",
  "Ask AI": "اسأل الذكاء الاصطناعي", "Dashboard": "لوحة التحكم", "Favourites": "المفضلة", "Recently visited": "زيارات حديثة", "Favourite": "مفضلة",
  "My profile": "ملفي الشخصي", "Set my role": "تحديد دوري", "Light theme": "المظهر الفاتح", "Dark theme": "المظهر الداكن", "Sign out": "تسجيل الخروج",
  "Plan & billing": "الخطة والفوترة", "Admin console": "لوحة الإدارة", "your role": "دورك", "Create your first project": "أنشئ مشروعك الأول",
  // project hubs
  "Overview": "نظرة عامة", "Information (CDE)": "المعلومات (CDE)", "Delivery": "التسليم", "Model & coordination": "النموذج والتنسيق", "Quality & team": "الجودة والفريق",
  "Summary": "الملخص", "Activity": "النشاط", "Project assistant (AI)": "مساعد المشروع (ذكاء اصطناعي)", "Research notebook (AI)": "دفتر البحث (ذكاء اصطناعي)",
  "Files": "الملفات", "MIDP / TIDP planner": "مخطط MIDP / TIDP", "Teams & milestones": "الفرق والمعالم", "Requirements traceability": "تتبع المتطلبات",
  "Appointment review (AI)": "مراجعة العقد (ذكاء اصطناعي)", "Information uses": "استخدامات المعلومات", "Responsibility matrix": "مصفوفة المسؤوليات",
  "Model responsibility (MRM)": "مسؤولية النمذجة (MRM)", "Level of information need": "مستوى الحاجة للمعلومات", "Process gates": "بوابات العملية",
  "Risk register": "سجل المخاطر", "Handover": "التسليم النهائي", "Model validation": "التحقق من النماذج", "Model QA/QC reviews": "مراجعات جودة النماذج",
  "Issues (BCF)": "الملاحظات (BCF)", "Clash matrix": "مصفوفة التعارضات", "4D planning": "التخطيط الرباعي الأبعاد (4D)", "Asset tags": "ترميز الأصول",
  "Quality hub": "مركز الجودة", "Meetings & progress report": "الاجتماعات وتقرير التقدم", "Automations": "الأتمتة", "Team": "الفريق", "Project settings": "إعدادات المشروع",
  // hints
  "Ask questions answered from project records": "أسئلة تُجاب من سجلات المشروع", "Summarise and compare sources with citations": "تلخيص المصادر ومقارنتها مع الإحالات",
  "Controlled documents, reviews, revisions": "مستندات خاضعة للرقابة ومراجعات وإصدارات", "WIP · Shared · Published · Archived": "قيد العمل · مشترك · منشور · مؤرشف",
  "Information containers, Gantt, change impact": "حاويات المعلومات ومخطط جانت وأثر التغيير", "EIR → BEP → MIDP → delivered": "EIR ← BEP ← MIDP ← تم التسليم",
  "Check contracts for ISO 19650 obligations": "فحص العقود لالتزامات ISO 19650", "Why information is produced — drives LOIN & MIDP": "لماذا تُنتج المعلومات — يوجّه LOIN وMIDP",
  "RACI per task team": "RACI لكل فريق مهمة", "Who models each element, LOD per milestone": "من ينمذج كل عنصر ومستوى التطوير لكل معلم",
  "LOIN per element & milestone": "LOIN لكل عنصر ومعلم", "ISO 19650-2 / 42001 stage gates": "بوابات مراحل ISO 19650-2 / 42001", "PIM → AIM checklist": "قائمة تحقق PIM ← AIM",
  "IFC, COBie, LOIN & IDS checks": "فحوصات IFC وCOBie وLOIN وIDS", "Graded discipline checklists A–D": "قوائم تحقق مصنفة A–D لكل تخصص",
  "Link programme to model; planned vs actual by date": "ربط البرنامج الزمني بالنموذج؛ المخطط مقابل الفعلي", "Build and check asset tags": "إنشاء رموز الأصول وفحصها",
  "Document, plan and document-set checks": "فحوصات المستندات والخطة", "Agendas, minutes, actions, progress report": "جداول الأعمال والمحاضر والإجراءات وتقرير التقدم",
  "Scheduled chasers and quality reviews": "تذكيرات ومراجعات جودة مجدولة",
  // standards & resources
  "ISO 19650": "ISO 19650", "Learn": "التعلّم", "Learn: quizzes, mock exam, scenarios": "التعلّم: اختبارات وامتحان تجريبي وسيناريوهات",
  "All parts (1–6)": "جميع الأجزاء (1–6)", "Delivery process (19650-2)": "عملية التسليم (19650-2)", "CDE & status codes": "بيئة البيانات المشتركة ورموز الحالة",
  "Glossary & acronyms": "المصطلحات والاختصارات", "Information uses library": "مكتبة استخدامات المعلومات", "Naming & status code tool": "أداة التسمية ورموز الحالة",
  "Clauses 4–10": "البنود 4–10", "Annex A controls": "ضوابط الملحق A", "AI in BIM": "الذكاء الاصطناعي في BIM", "Glossary": "المصطلحات", "References": "المراجع",
  "ISO 19650 references": "مراجع ISO 19650", "ISO/IEC 42001 references": "مراجع ISO/IEC 42001", "My work": "عملي", "Tools": "الأدوات", "Careers": "الوظائف",
  "Client requirements": "متطلبات العميل", "Account": "الحساب", "My Day": "يومي", "Everything waiting on you": "كل ما ينتظرك", "Portfolio dashboard": "لوحة المحفظة",
  "Health across your projects": "صحة مشاريعك", "BIM fee estimator": "حاسبة أتعاب BIM", "Embodied carbon (6D)": "الكربون المتجسد (6D)",
  "BIM maturity assessment": "تقييم نضج BIM", "Digital twin readiness": "جاهزية التوأم الرقمي", "Scan-to-BIM readiness": "جاهزية المسح إلى BIM",
  "My talent profile": "ملفي المهني", "Opt-in profile for recruiters": "ملف اختياري لمسؤولي التوظيف", "Talent pool (recruiters)": "مجموعة المواهب (للتوظيف)",
  "Client standards": "معايير العملاء",
  // auth & common
  "Sign in": "تسجيل الدخول", "Create account": "إنشاء حساب", "Email": "البريد الإلكتروني", "Password": "كلمة المرور", "Full name": "الاسم الكامل",
  "Organization": "الجهة", "Job title": "المسمى الوظيفي", "Forgot password?": "نسيت كلمة المرور؟", "Request reset link": "طلب رابط إعادة التعيين",
  "← Back to sign in": "→ العودة لتسجيل الدخول", "Please wait…": "يرجى الانتظار…", "Language": "اللغة", "Save": "حفظ", "Cancel": "إلغاء", "Delete": "حذف",
  "Loading…": "جارٍ التحميل…", "Save profile": "حفظ الملف", "Change password": "تغيير كلمة المرور", "Email & language": "البريد واللغة", "Email notifications": "إشعارات البريد",
  "My projects": "مشاريعي", "Current password": "كلمة المرور الحالية", "New password": "كلمة المرور الجديدة", "Confirm new password": "تأكيد كلمة المرور الجديدة",
  "Phone": "الهاتف", "About / expertise": "نبذة / الخبرات",
  "ISO 19650 information management · ISO/IEC 42001 AI management": "إدارة المعلومات وفق ISO 19650 · إدارة الذكاء الاصطناعي وفق ISO/IEC 42001",
};

export const setLocale = (l: Locale) => {
  current = l;
  document.documentElement.lang = l;
  document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
};
export const getLocale = () => current;
export const t = (s: string) => (current === "ar" ? AR[s] ?? s : s);
