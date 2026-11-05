import type { PageGuide } from "./types";

// Page guides for the "My work", "Workflow & roles", "Project data & setup", "Create", "Check" and
// "Templates & samples" pages (excluding the delivery plans page). English and Arabic side by side.

export const GUIDES_DOCUMENTS: PageGuide[] = [
  // ---------------------------------------------------------------- My work
  {
    key: "r.home",
    what: "Your start page: what is due today, pages you opened recently, items that need your attention and your projects.",
    steps: [
      "Work through the “Get started” card: “Read the platform guide”, “Set your role”, “Create a project” and “Draft your first EIR”.",
      "Use the quick buttons such as “New project”, “Check file names” or “Draft a document” to jump straight to a tool.",
      "Check the “Today” card for overdue containers, containers due this week and items assigned to you; click “Open My Day →” for the full list.",
      "Click a page under “Continue where you left off” to return to it.",
      "Open an item under “Needs your attention” to act on a review request, an assigned issue or a mention.",
      "Open a project under “Projects”, or click “View all →” to see every project.",
    ],
    outputs: [],
    required: [],
    tips: [
      "The Today card counts due containers only after you save a TIDP or MIDP in the plan generator.",
      "The “Get started” card disappears when all four steps are done.",
    ],
    ar: {
      what: "صفحة البداية الخاصة بك: ما هو مستحق اليوم، والصفحات التي فتحتها مؤخرًا، والعناصر التي تتطلب انتباهك، ومشاريعك.",
      steps: [
        "أكمل بطاقة «ابدأ»: «اقرأ دليل المنصة» و«حدّد دورك» و«إنشاء مشروع» و«صِغ أول EIR لك».",
        "استخدم الأزرار السريعة مثل «مشروع جديد» أو «تدقيق أسماء الملفات» أو «صياغة مستند» للانتقال مباشرة إلى أداة.",
        "راجع بطاقة «اليوم» لمعرفة الحاويات المتأخرة والمستحقة هذا الأسبوع والعناصر المسندة إليك؛ وانقر «افتح يومي →» للقائمة الكاملة.",
        "انقر صفحة ضمن «تابع من حيث توقفت» للعودة إليها.",
        "افتح عنصرًا ضمن «يتطلب انتباهك» للتعامل مع طلب مراجعة أو ملاحظة مسندة إليك أو إشارة.",
        "افتح مشروعًا ضمن «المشاريع»، أو انقر «عرض الكل →» لرؤية كل المشاريع.",
      ],
      outputs: [],
      required: [],
      tips: [
        "لا تحسب بطاقة «اليوم» الحاويات المستحقة إلا بعد حفظ TIDP أو MIDP في مولّد الخطط.",
        "تختفي بطاقة «ابدأ» عند إكمال الخطوات الأربع كلها.",
      ],
    },
  },
  {
    key: "r.guide",
    what: "Explains what every sidebar section is for and where to begin, with a first-day checklist, a first-week plan, how the pages connect, routes by role and common questions.",
    steps: [
      "Start on the “Start here” tab to learn the parts of the sidebar: account menu, search and Ask AI, Favourites, View by role, sections and Help & support.",
      "Open “Every section” to read each section's purpose, when to use it and its pages; click a page name to open it.",
      "On “First day”, do the steps in order: click “Open” on each one and tick it when it is done.",
      "Use “First week” for a day-by-day plan with links to the pages for each day.",
      "Open “How it fits together” to follow how information entered on one page flows into the next.",
      "Use “By role” to open your “Learning path” and “Role profile”, and “FAQ” to search questions with “Search questions…”.",
    ],
    outputs: [],
    required: [],
    tips: [
      "First-day ticks are saved in this browser only.",
      "Press Ctrl+K anywhere to jump to any page, template or project.",
    ],
    ar: {
      what: "يشرح الغرض من كل قسم في الشريط الجانبي ومن أين تبدأ، مع قائمة مهام لليوم الأول وخطة للأسبوع الأول وكيفية ترابط الصفحات ومسارات حسب الدور والأسئلة الشائعة.",
      steps: [
        "ابدأ بتبويب «ابدأ من هنا» لتتعرف على أجزاء الشريط الجانبي: قائمة الحساب، والبحث و«اسأل الذكاء الاصطناعي»، والمفضلة، والعرض حسب الدور، والأقسام، والمساعدة والدعم.",
        "افتح «كل الأقسام» لقراءة غرض كل قسم ومتى تستخدمه وصفحاته؛ وانقر اسم صفحة لفتحها.",
        "في «اليوم الأول»، نفّذ الخطوات بالترتيب: انقر «افتح» في كل خطوة وضع علامة عليها عند إنجازها.",
        "استخدم «الأسبوع الأول» للحصول على خطة يومًا بيوم مع روابط إلى صفحات كل يوم.",
        "افتح «كيف تترابط الأجزاء» لتتبع كيف تنتقل المعلومات المُدخلة في صفحة إلى الصفحة التالية.",
        "استخدم «حسب الدور» لفتح «مسار التعلّم» و«ملف الدور»، و«الأسئلة الشائعة» للبحث في الأسئلة عبر «ابحث في الأسئلة…».",
      ],
      outputs: [],
      required: [],
      tips: [
        "تُحفظ علامات اليوم الأول في هذا المتصفح فقط.",
        "اضغط Ctrl+K في أي مكان للانتقال إلى أي صفحة أو قالب أو مشروع.",
      ],
    },
  },
  {
    key: "r.myday",
    what: "Shows what is due from your delivery plan and what is waiting on you in projects: reviews, containers, issues, meeting actions and risk reviews.",
    steps: [
      "Choose the plan in the drop-down: “Plan generator (this browser)” or a project's MIDP / TIDP planner; click “Refresh” to reload a project plan.",
      "Read the counters “Overdue”, “Due in the next 7 days”, “Due in 8–14 days” and “No due date”; click one to list only those containers.",
      "For a plan from the plan generator, change a container's status in the “Status” drop-down; for a project plan, change it in the project with “Open the project planner →”.",
      "Under “Assigned to you in projects”, click a type counter to filter the list, then click an item to open it.",
      "Use the quick links at the top (“Check file names”, “Check a model”, “Delivery plans”, “Project data”) for daily tasks.",
    ],
    outputs: [
      "Updated container statuses in the TIDP or MIDP saved in this browser (plan generator plans only).",
    ],
    required: [],
    tips: [
      "Containers without a due date never show as due: add due dates in the plan generator.",
    ],
    ar: {
      what: "يعرض ما هو مستحق من خطة التسليم وما ينتظرك في المشاريع: المراجعات والحاويات والملاحظات وإجراءات الاجتماعات ومراجعات المخاطر.",
      steps: [
        "اختر الخطة من القائمة المنسدلة: «مولّد الخطط (هذا المتصفح)» أو مخطط MIDP / TIDP لأحد المشاريع؛ وانقر «تحديث» لإعادة تحميل خطة المشروع.",
        "اقرأ العدادات «متأخر» و«مستحقة خلال 7 أيام» و«مستحقة خلال 8–14 يوماً» و«بدون تاريخ استحقاق»؛ وانقر أحدها لعرض تلك الحاويات فقط.",
        "في خطة من مولّد الخطط، غيّر حالة الحاوية من القائمة المنسدلة «الحالة»؛ أما في خطة المشروع فغيّرها داخل المشروع عبر «افتح مخطط المشروع ←».",
        "ضمن «المسند إليك في المشاريع»، انقر عداد نوع لتصفية القائمة، ثم انقر عنصرًا لفتحه.",
        "استخدم الروابط السريعة في الأعلى («تدقيق أسماء الملفات» و«فحص نموذج» و«خطط التسليم» و«بيانات المشروع») للمهام اليومية.",
      ],
      outputs: [
        "حالات حاويات محدّثة في TIDP أو MIDP المحفوظة في هذا المتصفح (لخطط مولّد الخطط فقط).",
      ],
      required: [],
      tips: [
        "لا تظهر الحاويات التي ليس لها تاريخ استحقاق كمستحقة أبدًا: أضف تواريخ الاستحقاق في مولّد الخطط.",
      ],
    },
  },
  {
    key: "r.portfolio",
    what: "Shows information delivery health across all your projects in one table.",
    steps: [
      "Read the totals at the top: projects, information containers, overdue containers and open issues.",
      "Check the dot at the start of each row: it flags a problem when a project has overdue containers, high-priority issues, high risks or model quality under 60%, and a caution when it has more than 10 open issues or quality under 80%.",
      "Compare the columns “Your role”, “Delivery progress”, “Overdue”, “Open issues”, “Model quality”, “Requirements delivered” and “High risks”.",
      "Click a project name to open its overview.",
    ],
    outputs: [],
    required: [],
    ar: {
      what: "يعرض صحة تسليم المعلومات عبر جميع مشاريعك في جدول واحد.",
      steps: [
        "اقرأ الإجماليات في الأعلى: المشاريع وحاويات المعلومات والحاويات المتأخرة والملاحظات المفتوحة.",
        "راجع النقطة في بداية كل صف: تشير إلى مشكلة عندما يكون في المشروع حاويات متأخرة أو ملاحظات عالية الأولوية أو مخاطر مرتفعة أو جودة نموذج أقل من 60%، وإلى تنبيه عندما تتجاوز الملاحظات المفتوحة 10 أو تقل الجودة عن 80%.",
        "قارن الأعمدة «دورك» و«تقدّم التسليم» و«متأخر» و«الملاحظات المفتوحة» و«جودة النموذج» و«المتطلبات المُسلَّمة» و«المخاطر المرتفعة».",
        "انقر اسم مشروع لفتح نظرته العامة.",
      ],
      outputs: [],
      required: [],
    },
  },

  // ---------------------------------------------------------------- Workflow & roles
  {
    key: "w.project",
    what: "Walks through the ten project stages from need to asset operation. For each stage it shows the steps, the gate, the documents, who does what, pitfalls and the tools to use.",
    steps: [
      "Click a stage in the numbered stepper at the top.",
      "Read “What happens, in order” and the checks under “Gate: done when”.",
      "Check “Documents in this stage”; each one is tagged Create, Update, Approve or Use.",
      "Review “Who does what in this stage” and click a role to open its profile.",
      "Read “Pitfalls and how to prevent them” and open a tool from “Tools for this stage”.",
      "Use the buttons at the bottom to move to the previous or next stage.",
    ],
    outputs: [],
    required: [],
    ar: {
      what: "يمر بالمراحل العشر للمشروع من الحاجة إلى تشغيل الأصل. ويعرض لكل مرحلة الخطوات والبوابة والوثائق ومن يفعل ماذا والأخطاء الشائعة والأدوات المستخدمة.",
      steps: [
        "انقر مرحلة في شريط المراحل المرقّم في الأعلى.",
        "اقرأ «ما يحدث بالترتيب» والفحوصات ضمن «البوابة: تكتمل عندما».",
        "راجع «الوثائق في هذه المرحلة»؛ كل وثيقة موسومة بإنشاء أو تحديث أو اعتماد أو استخدام.",
        "راجع «من يفعل ماذا في هذه المرحلة» وانقر دورًا لفتح ملفه.",
        "اقرأ «الأخطاء الشائعة وكيف تتجنبها» وافتح أداة من «أدوات هذه المرحلة».",
        "استخدم الأزرار في الأسفل للانتقال إلى المرحلة السابقة أو التالية.",
      ],
      outputs: [],
      required: [],
    },
  },
  {
    key: "w.table",
    what: "A table of every document by ISO 19650-2 stage (clauses 5.1 to 5.8) and by party: appointing party, lead appointed party, and task teams / sub-appointed parties. Every stage and document opens a detailed explanation.",
    steps: [
      "Narrow the table with “Filter by stage” (or “All stages”) and the party buttons (or “All parties”).",
      "Click a cell, “Expand row” or “Expand all” to list the documents; “Collapse all” folds them again.",
      "Click a document to open its panel: purpose, what it must contain and, where a guide exists, who writes and approves it, what to write, how to create it, checks and common mistakes.",
      "From the panel, click “Open the full guide”, “Open the template” or “Draft it with AI”.",
      "Click a stage name to see what happens in it, who does what and its gate; press Escape or ✕ to close the panel.",
    ],
    outputs: [],
    required: [],
    ar: {
      what: "جدول بكل وثيقة حسب مرحلة ISO 19650-2 (البنود 5.1 إلى 5.8) وحسب الطرف: الطرف المُعيِّن، والطرف المُعيَّن الرئيسي، وفرق المهام / الأطراف المُعيَّنة من الباطن. وتفتح كل مرحلة ووثيقة شرحًا مفصلًا.",
      steps: [
        "ضيّق الجدول عبر «تصفية حسب المرحلة» (أو «جميع المراحل») وأزرار الأطراف (أو «جميع الأطراف»).",
        "انقر خلية أو «توسيع الصف» أو «توسيع الكل» لعرض الوثائق؛ ويعيد «طي الكل» طيّها.",
        "انقر وثيقة لفتح لوحتها: الغرض وما يجب أن تتضمنه، وحيث يوجد دليل: من يكتبها ومن يعتمدها وما يُكتب فيها وكيف تُعدّ والفحوصات والأخطاء الشائعة.",
        "من اللوحة، انقر «افتح الدليل الكامل» أو «افتح القالب» أو «صِغها بالذكاء الاصطناعي».",
        "انقر اسم مرحلة لرؤية ما يحدث فيها ومن يفعل ماذا وبوابتها؛ واضغط Escape أو ✕ لإغلاق اللوحة.",
      ],
      outputs: [],
      required: [],
    },
  },
  {
    key: "w.documents",
    what: "Shows step by step how information moves through the CDE states WIP, Shared, Published and Archived: who acts, the status code and revision at each step, the checks and what goes wrong.",
    steps: [
      "Choose a flow: “Information container through the CDE”, “Controlled document (e.g. BEP or EIR) review and approval” or “Handover information to the AIM”.",
      "Read the flow summary and the number of steps in each CDE state.",
      "Follow each numbered card: its state, status code, revision, “Who”, “Actions”, “Checks” and the failure warning.",
      "Use the links at the bottom: “CDE & status codes”, “File naming checker” and “Suitability code hub”.",
    ],
    outputs: [],
    required: [],
    ar: {
      what: "يعرض خطوة بخطوة كيف تنتقل المعلومات عبر حالات CDE ‏(WIP وShared وPublished وArchived): من يتصرف، ورمز الحالة والمراجعة في كل خطوة، والفحوصات، وما الذي قد يسوء.",
      steps: [
        "اختر مسارًا: «حاوية المعلومات عبر بيئة البيانات المشتركة» أو «مراجعة واعتماد وثيقة مضبوطة (مثل BEP أو EIR)» أو «معلومات التسليم إلى نموذج معلومات الأصول (AIM)».",
        "اقرأ ملخص المسار وعدد الخطوات في كل حالة من حالات CDE.",
        "تتبّع كل بطاقة مرقّمة: حالتها ورمز الحالة والمراجعة و«من» و«إجراءات» و«الفحوصات» وتحذير الإخفاق.",
        "استخدم الروابط في الأسفل: «CDE ورموز الحالة» و«مدقق تسمية الملفات» و«مركز رموز الملاءمة».",
      ],
      outputs: [],
      required: [],
    },
  },
  {
    key: "w.matrix",
    what: "A RACI matrix of every role against the ten project stages: who is Accountable, Responsible, Consulted and Informed.",
    steps: [
      "Read the key A, R, C and I at the top.",
      "Click a role name to highlight its row.",
      "Click any cell to read that role's duty in that stage.",
      "In the duty box, click “Open the stage” or “Open the role profile”.",
      "Click a stage number in the header to open that stage in the project workflow.",
    ],
    outputs: [],
    required: [],
    ar: {
      what: "مصفوفة RACI لكل دور مقابل مراحل المشروع العشر: من هو المساءَل (A) والمسؤول (R) ومن يُستشار (C) ومن يُبلَّغ (I).",
      steps: [
        "اقرأ مفتاح الرموز A وR وC وI في الأعلى.",
        "انقر اسم دور لتمييز صفّه.",
        "انقر أي خلية لقراءة مهمة ذلك الدور في تلك المرحلة.",
        "في مربع المهمة، انقر «افتح المرحلة» أو «افتح ملف الدور».",
        "انقر رقم مرحلة في رأس الجدول لفتح تلك المرحلة في سير عمل المشروع.",
      ],
      outputs: [],
      required: [],
    },
  },
  {
    key: "w.roles",
    what: "A profile of each project role: summary, responsibilities, documents it owns, measures of success, its duty at every stage, skills and tools.",
    steps: [
      "Pick a role from the list on the left; the BIM manager opens by default.",
      "Read the summary, “Responsibilities”, “Documents this role owns” and “Measures of success”.",
      "Check “Across the project” for the role's RACI letter and duty in each stage; click a stage to open it.",
      "Review “Skills” and open a tool from “Tools for this role”.",
    ],
    outputs: [],
    required: [],
    ar: {
      what: "ملف لكل دور في المشروع: ملخص، ومسؤوليات، والوثائق التي يملكها، ومقاييس النجاح، ومهمته في كل مرحلة، والمهارات والأدوات.",
      steps: [
        "اختر دورًا من القائمة على الجانب؛ يُفتح دور مدير BIM افتراضيًا.",
        "اقرأ الملخص و«المسؤوليات» و«الوثائق التي يملكها هذا الدور» و«مقاييس النجاح».",
        "راجع «عبر مراحل المشروع» لمعرفة حرف RACI للدور ومهمته في كل مرحلة؛ وانقر مرحلة لفتحها.",
        "راجع «المهارات» وافتح أداة من «أدوات هذا الدور».",
      ],
      outputs: [],
      required: [],
    },
  },

  // ---------------------------------------------------------------- Project data & setup
  {
    key: "r.wizard",
    what: "Six questions about your role, the project stage, the asset type, handover for operation, security and AI use. It recommends the ISO 19650 documents, standards and tools to start with, and creates the documents in a project.",
    steps: [
      "Answer each question by clicking an option; click “← Back” to change an earlier answer.",
      "On “Your starting set”, untick any recommended document you do not need.",
      "Read the standards and the “Tools to use next”.",
      "Under “Create the documents in”, choose “A new project” or one of your projects.",
      "For a new project, enter the “Project name” and “Project code”.",
      "Click “Create N documents” (N is the number ticked); “Start again” clears the answers.",
    ],
    outputs: [
      "A new project with the recommended standards in scope (when you choose a new project).",
      "Draft documents created from the recommended templates in the project's documents; documents that already exist are skipped.",
    ],
    required: [
      "At least one document ticked",
      "Project name (at least 2 characters; new project only)",
      "Project code (2–6 letters or digits; new project only)",
    ],
    tips: [
      "To add documents to an existing project you need editor rights in it.",
    ],
    ar: {
      what: "ستة أسئلة عن دورك ومرحلة المشروع ونوع الأصل والتسليم للتشغيل والأمن واستخدام الذكاء الاصطناعي. يوصي بوثائق ISO 19650 والمعايير والأدوات التي تبدأ بها، وينشئ الوثائق في مشروع.",
      steps: [
        "أجب عن كل سؤال بالنقر على خيار؛ وانقر «← رجوع» لتغيير إجابة سابقة.",
        "في «مجموعتك الأولى»، ألغِ تحديد أي وثيقة موصى بها لا تحتاجها.",
        "اقرأ المعايير و«أدوات للخطوة التالية».",
        "ضمن «إنشاء المستندات في»، اختر «مشروع جديد» أو أحد مشاريعك.",
        "لمشروع جديد، أدخل «اسم المشروع» و«رمز المشروع».",
        "انقر «إنشاء N مستندات» (N هو عدد المحدد منها)؛ ويمسح «البدء من جديد» الإجابات.",
      ],
      outputs: [
        "مشروع جديد ضمن نطاقه المعايير الموصى بها (عند اختيار مشروع جديد).",
        "مسودات وثائق منشأة من القوالب الموصى بها في وثائق المشروع؛ ويتم تخطي الوثائق الموجودة مسبقًا.",
      ],
      required: [
        "تحديد وثيقة واحدة على الأقل",
        "اسم المشروع (حرفان على الأقل؛ للمشروع الجديد فقط)",
        "رمز المشروع (من 2 إلى 6 أحرف أو أرقام؛ للمشروع الجديد فقط)",
      ],
      tips: [
        "لإضافة وثائق إلى مشروع قائم تحتاج إلى صلاحية محرّر فيه.",
      ],
    },
  },
  {
    key: "ai.projectdata",
    what: "The common project data you enter once; the document generator, delivery plans, naming checker and Word exports reuse it. No document can be generated until the eight hard-minimum inputs are complete. The data is saved in this browser.",
    steps: [
      "Optionally choose a project in “Fill from a portal project:” and click “Fill” to copy its name, code, client, milestones, task teams and deliverables.",
      "In section 1, enter the project and client; in section 2, add stages with dates using “Quick fill:” or “+ Add stage”.",
      "In section 3, add disciplines with their organisations (“+ Add discipline”); in section 4, choose at least one information purpose.",
      "In section 5, set the naming fields (“+ Field”, “Reset to ISO order”), the separator and the classification system; in section 6, name the CDE platform.",
      "In section 7, add deliverables with a format and a milestone (“+ Add deliverable” or “Start with a typical list”).",
      "In section 8, “Inputs specific to each document”, open a document tab and fill the fields marked *.",
      "Check section 9, “Generation order”, then click “Open the document generator” or “Open delivery plans (TIDP / MIDP)”.",
    ],
    outputs: [
      "Project data saved in this browser and reused by the document generator, delivery plans, naming checker and every Word export.",
    ],
    required: [
      "Project name, project code and appointing party (client) (all three)",
      "Project stages (at least one stage with a name and a start or end date)",
      "Disciplines (at least one discipline with its organisation)",
      "Information purposes (at least one chosen)",
      "Naming convention fields (at least three)",
      "Classification system (choose one)",
      "CDE platform (name it)",
      "Deliverables (at least one with a format and a milestone)",
    ],
    tips: [
      "Fields marked * in section 8 are only required when you generate that document type.",
      "The data stays in this browser: on another computer use “Fill” or enter it again.",
    ],
    ar: {
      what: "بيانات المشروع المشتركة التي تُدخلها مرة واحدة؛ ويعيد استخدامها مولّد الوثائق وخطط التسليم ومدقق التسمية وصادرات Word. لا يمكن إنشاء أي وثيقة قبل اكتمال المدخلات الثمانية للحد الأدنى. تُحفظ البيانات في هذا المتصفح.",
      steps: [
        "اختياريًا، اختر مشروعًا في «التعبئة من مشروع في البوابة:» وانقر «تعبئة» لنسخ اسمه ورمزه وعميله ومعالمه وفرق المهام والمُخرَجات.",
        "في القسم 1، أدخل المشروع والعميل؛ وفي القسم 2، أضف المراحل مع تواريخها عبر «تعبئة سريعة:» أو «+ إضافة مرحلة».",
        "في القسم 3، أضف التخصصات مع جهاتها («+ إضافة تخصص»)؛ وفي القسم 4، اختر غرضًا واحدًا على الأقل للمعلومات.",
        "في القسم 5، حدّد حقول التسمية («+ حقل» و«إعادة التعيين إلى ترتيب ISO») والفاصل ونظام التصنيف؛ وفي القسم 6، سمِّ منصة CDE.",
        "في القسم 7، أضف المُخرَجات مع صيغة ومعلم («+ إضافة مُخرَج» أو «البدء بقائمة نموذجية»).",
        "في القسم 8، «مدخلات خاصة بكل مستند»، افتح تبويب وثيقة واملأ الحقول المعلّمة بـ *.",
        "راجع القسم 9، «ترتيب الإنشاء»، ثم انقر «فتح مولّد المستندات» أو «فتح خطط التسليم (TIDP / MIDP)».",
      ],
      outputs: [
        "بيانات مشروع محفوظة في هذا المتصفح يعيد استخدامها مولّد الوثائق وخطط التسليم ومدقق التسمية وكل صادرات Word.",
      ],
      required: [
        "اسم المشروع ورمز المشروع والطرف المُعيِّن (العميل) (الثلاثة جميعًا)",
        "مراحل المشروع (مرحلة واحدة على الأقل لها اسم وتاريخ بداية أو نهاية)",
        "التخصصات (تخصص واحد على الأقل مع جهته)",
        "أغراض المعلومات (اختيار غرض واحد على الأقل)",
        "حقول اصطلاح التسمية (ثلاثة على الأقل)",
        "نظام التصنيف (اختيار نظام)",
        "منصة CDE (تسميتها)",
        "المُخرَجات (مُخرَج واحد على الأقل مع صيغة ومعلم)",
      ],
      tips: [
        "الحقول المعلّمة بـ * في القسم 8 مطلوبة فقط عند إنشاء ذلك النوع من الوثائق.",
        "تبقى البيانات في هذا المتصفح: على حاسوب آخر استخدم «تعبئة» أو أدخلها من جديد.",
      ],
    },
  },
  {
    key: "r.standards",
    what: "Stores each client's information requirements, imported once from their EIR appendix workbooks: COBie schema and picklists, required fields by stage, the asset attribute dictionary with the stages (and parties) each attribute is due at, the classification dictionary and the asset tag format. Only the extracted rules are stored, not the files.",
    steps: [
      "Under “New standard”, type a name and the client, then click “Create”.",
      "On the standard's page, drop .xlsx appendix workbooks or click “⬆ Import workbooks”; a message lists the tables found in each file.",
      "Review “Required by stage” (COBie fields · asset attributes), the “Picklists”, the “COBie rules” for each sheet and the “Asset attribute dictionary”.",
      "Set the “Asset tag format”: separator, COBie field and parts with length, characters and approved codes (“+ Add part”), then click “Save tag format”.",
      "Search the “Classification dictionary” by equipment, code, Uniclass or IFC; “Delete standard” removes the standard and detaches the projects using it.",
    ],
    outputs: [
      "A saved client standard (COBie rules, picklists, stage requirements, classification entries and tag format) that can be applied to projects.",
    ],
    required: [
      "Name (at least 2 characters)",
      "Appendix workbooks (.xlsx; tables are recognised by their headers)",
      "Tag format: a separator, a COBie field and at least one part, each with a label",
    ],
    tips: [
      "Import up to 20 workbooks at a time; the files themselves are not kept.",
      "Equipment codes are checked per system: a tag pairing an equipment code with a system it is not listed under is rejected.",
      "COBie validation at a stage reports every required attribute missing from its mapped column or from the Attribute sheet (by parameter name).",
    ],
    ar: {
      what: "يخزّن متطلبات المعلومات لكل عميل، مستوردة مرة واحدة من مصنفات ملاحق EIR الخاصة به: مخطط COBie وقوائم الاختيار، والحقول المطلوبة حسب المرحلة، وقاموس سمات الأصول مع المراحل (والأطراف) المطلوبة لكل سمة، وقاموس التصنيف، وصيغة وسم الأصل. تُخزَّن القواعد المستخرجة فقط وليس الملفات.",
      steps: [
        "ضمن «معيار جديد»، اكتب اسمًا والعميل، ثم انقر «إنشاء».",
        "في صفحة المعيار، أفلت مصنفات الملاحق ‎.xlsx أو انقر «⬆ استيراد المصنفات»؛ وتعرض رسالة الجداول التي وُجدت في كل ملف.",
        "راجع «المطلوب حسب المرحلة» (حقول COBie · سمات الأصول) و«قوائم الاختيار» و«قواعد COBie» لكل ورقة و«قاموس سمات الأصول».",
        "اضبط «صيغة وسم الأصل»: الفاصل وحقل COBie والأجزاء مع الطول والأحرف والرموز المعتمدة («+ إضافة جزء»)، ثم انقر «حفظ تنسيق الوسم».",
        "ابحث في «قاموس التصنيف» حسب المعدّة أو الرمز أو Uniclass أو IFC؛ ويحذف «حذف المعيار» المعيار ويفصل المشاريع التي تستخدمه.",
      ],
      outputs: [
        "معيار عميل محفوظ (قواعد COBie وقوائم الاختيار ومتطلبات المراحل وبنود التصنيف وصيغة الوسم) يمكن تطبيقه على المشاريع.",
      ],
      required: [
        "الاسم (حرفان على الأقل)",
        "مصنفات الملاحق (‎.xlsx؛ تُتعرّف الجداول من عناوينها)",
        "صيغة الوسم: فاصل وحقل COBie وجزء واحد على الأقل لكل منها تسمية",
      ],
      tips: [
        "استورد حتى 20 مصنفًا في المرة الواحدة؛ ولا يُحتفظ بالملفات نفسها.",
        "تُفحص رموز المعدات لكل نظام: يُرفض الوسم الذي يقرن رمز معدة بنظام غير مدرجة تحته.",
        "يُبلغ فحص COBie في مرحلة ما عن كل سمة مطلوبة غائبة عن عمودها المرتبط أو عن ورقة Attribute (باسم المعامل).",
      ],
    },
  },

  // ---------------------------------------------------------------- Create
  {
    key: "ai.generate",
    what: "Drafts any ISO 19650 document from a description: it plans an outline (from the portal's template when one exists), drafts it section by section and exports it to Word. For a full EIR, or a BEP that answers an EIR, use the AI studio writers.",
    steps: [
      "Complete the project data hard minimum (click “Complete project data →”) and the “Document data — required before generating the document” fields.",
      "Choose “Project draft” or “Reusable template”, then pick a document from the quick lists or type it in “Document type *”.",
      "Add project facts and requirements; the more you give, the less is marked [CONFIRM].",
      "Click “Plan the document →”, then untick, rename or add sections (“+ Add a section”) in the outline.",
      "Click “Draft N sections →” and watch the sections appear; use “Redo” on a section, with an optional instruction, then “Redo now”.",
      "Click “Download Word (.docx)”, or use “Markdown” or “Copy”; “New document” starts again.",
    ],
    outputs: [
      "Word document (.docx) with the cover page and document control table filled from the document data",
      "Markdown file (.md) of the same draft",
      "A list of items to confirm, highlighted in the draft and in Word",
    ],
    required: [
      "Document type (at least 2 characters)",
      "Document data: project name, document reference, version / revision, organisation name, organisation role, project stage, status and prepared by",
      "Project data hard minimum (8 of 8, on the Project data page)",
      "For an EIR, AIR, BEP, TIDP or MIDP: that document's inputs marked *",
    ],
    tips: [
      "AI must be switched on by an administrator.",
      "If an earlier document in the generation order is not produced yet, a warning appears; you can still continue.",
    ],
    ar: {
      what: "يصوغ أي وثيقة ISO 19650 من وصف: يخطط هيكلًا (من قالب البوابة عند وجوده)، ثم يصوغه قسمًا بقسم ويصدّره إلى Word. لكتابة EIR كامل، أو BEP يستجيب لـ EIR، استخدم أدوات الكتابة في استوديو الذكاء الاصطناعي.",
      steps: [
        "أكمل الحد الأدنى لبيانات المشروع (انقر «استكمال بيانات المشروع →») وحقول «بيانات المستند — مطلوبة قبل إنشاء المستند».",
        "اختر «مسودة مشروع» أو «قالب قابل لإعادة الاستخدام»، ثم اختر وثيقة من القوائم السريعة أو اكتبها في «نوع الوثيقة *».",
        "أضف حقائق المشروع ومتطلباته؛ كلما زادت المعلومات قلّ ما يُعلَّم بـ [CONFIRM].",
        "انقر «خطّط المستند →»، ثم ألغِ تحديد الأقسام أو أعد تسميتها أو أضف أقسامًا («+ إضافة قسم») في الهيكل.",
        "انقر «صياغة N أقسام →» وتابع ظهور الأقسام؛ واستخدم «إعادة» على أي قسم، مع تعليمات اختيارية، ثم «إعادة الآن».",
        "انقر «تنزيل Word (.docx)»، أو استخدم «Markdown» أو «نسخ»؛ ويبدأ «مستند جديد» من جديد.",
      ],
      outputs: [
        "مستند Word ‏(.docx) مع صفحة الغلاف وجدول ضبط الوثيقة معبأين من بيانات المستند",
        "ملف Markdown ‏(.md) للمسودة نفسها",
        "قائمة بالبنود المطلوب تأكيدها، مظللة في المسودة وفي Word",
      ],
      required: [
        "نوع الوثيقة (حرفان على الأقل)",
        "بيانات المستند: اسم المشروع ومرجع المستند والإصدار / المراجعة واسم المؤسسة ودور المؤسسة ومرحلة المشروع والحالة ومن أعدّه",
        "الحد الأدنى لبيانات المشروع (8 من 8، في صفحة بيانات المشروع)",
        "لوثائق EIR أو AIR أو BEP أو TIDP أو MIDP: مدخلات تلك الوثيقة المعلّمة بـ *",
      ],
      tips: [
        "يجب أن يفعّل المسؤول الذكاء الاصطناعي.",
        "إذا لم تُنتَج بعدُ وثيقة سابقة في ترتيب الإنشاء يظهر تحذير؛ ويمكنك المتابعة مع ذلك.",
      ],
    },
  },
  {
    key: "x.bepwriter",
    what: "Writes a pre- or post-appointment BEP that answers the client's EIR point by point, using your company profile, with an EIR response matrix, risks and tender clarifications. Without an EIR it writes from a short project brief.",
    steps: [
      "In step 1, choose “From the client's EIR” and upload a PDF, DOCX, TXT or MD file or paste the text, or choose “From a project brief (no EIR)” and describe the project; add the “Project name”.",
      "In step 2, “Company profile”, fill in your company details; blank fields are marked [TBC]. The profile is saved in this browser.",
      "In step 3, “Choose the BEP”, pick “Pre-appointment BEP” or “Post-appointment BEP”.",
      "Click “Generate BEP”; the sections are written in batches.",
      "In “Review and edit”, check the coverage figures, edit each section and use “Regenerate this section”, with an optional “Note for regeneration (optional)”.",
      "Edit the “EIR response matrix”, “Risks” and “Clarifications to raise at tender”, then click “Download Word” or “Copy”.",
    ],
    outputs: [
      "BEP Word document (pre- or post-appointment) including the EIR response matrix, risks and clarifications",
      "Coverage figures: EIR requirements answered and not answered, and the coverage percentage",
    ],
    required: [
      "The EIR (file or pasted text), or a project brief (at least 20 characters)",
    ],
    tips: [
      "AI must be switched on by an administrator.",
      "Use “Check it with the compliance matrix” to test the draft against the EIR.",
      "Complete every [TBC] and have the accountable person approve the BEP before submission.",
    ],
    ar: {
      what: "يكتب BEP لما قبل التعيين أو ما بعده يستجيب لـ EIR الخاص بالعميل بندًا بندًا، باستخدام الملف التعريفي لشركتك، مع مصفوفة استجابة EIR والمخاطر واستيضاحات المناقصة. وبدون EIR يكتب من موجز قصير للمشروع.",
      steps: [
        "في الخطوة 1، اختر «من EIR الخاص بالعميل» وارفع ملف PDF أو DOCX أو TXT أو MD أو الصق النص، أو اختر «من موجز المشروع (بدون EIR)» وصِف المشروع؛ وأضف «اسم المشروع».",
        "في الخطوة 2، «الملف التعريفي للشركة»، املأ بيانات شركتك؛ وتُعلَّم الحقول الفارغة بـ [TBC]. ويُحفظ الملف التعريفي في هذا المتصفح.",
        "في الخطوة 3، «اختر نوع خطة BEP»، اختر «BEP ما قبل التعيين» أو «BEP ما بعد التعيين».",
        "انقر «إنشاء خطة BEP»؛ تُكتب الأقسام على دفعات.",
        "في «المراجعة والتحرير»، راجع أرقام التغطية وعدّل كل قسم واستخدم «إعادة إنشاء هذا القسم»، مع «ملاحظة لإعادة الإنشاء (اختياري)».",
        "عدّل «مصفوفة الاستجابة لمتطلبات EIR» و«المخاطر» و«الاستيضاحات المطلوب طرحها في المناقصة»، ثم انقر «تنزيل Word» أو «نسخ».",
      ],
      outputs: [
        "مستند Word لخطة BEP (ما قبل التعيين أو ما بعده) يتضمن مصفوفة الاستجابة لمتطلبات EIR والمخاطر والاستيضاحات",
        "أرقام التغطية: متطلبات EIR التي أُجيب عنها والتي لم يُجب عنها ونسبة التغطية",
      ],
      required: [
        "EIR (ملف أو نص ملصق)، أو موجز للمشروع (20 حرفًا على الأقل)",
      ],
      tips: [
        "يجب أن يفعّل المسؤول الذكاء الاصطناعي.",
        "استخدم «تحقّق منها بمصفوفة الامتثال» لاختبار المسودة مقابل EIR.",
        "أكمل كل [TBC] واجعل الشخص المساءَل يعتمد BEP قبل التقديم.",
      ],
    },
  },
  {
    key: "ai.risks",
    what: "Drafts a starter list of project-specific information delivery risks, each with likelihood, impact, ISO clause, mitigation, owner and residual score. Manage the live register in the project.",
    steps: [
      "Fill in “Project type”, “Stage”, “Delivery team size”, “CDE platform” and “Procurement route” (examples are filled in).",
      "Choose the “Number of risks” (15, 25 or 35) and add “Notes (constraints, client concerns, known issues)”.",
      "Click “Generate risk register”.",
      "Review the “Heat map (inherent)”, the “By category” counts and the register table with inherent and residual scores.",
      "Export with “Excel (CSV)” or “Word”.",
    ],
    outputs: [
      "Risk register as a CSV file for Excel",
      "Risk register as a Word document",
    ],
    required: [],
    tips: [
      "AI must be switched on by an administrator.",
      "The register is a starting point: review every risk, owner and score before you use it.",
    ],
    ar: {
      what: "يصوغ قائمة أولية بمخاطر تسليم المعلومات الخاصة بالمشروع، لكل منها الاحتمالية والأثر وبند ISO والمعالجة والمالك والدرجة المتبقية. أدِر السجل الحي داخل المشروع.",
      steps: [
        "املأ «نوع المشروع» و«المرحلة» و«حجم فريق التسليم» و«منصة CDE» و«مسار المشتريات» (معبأة بأمثلة).",
        "اختر «عدد المخاطر» (15 أو 25 أو 35) وأضف «ملاحظات (القيود، مخاوف العميل، المشكلات المعروفة)».",
        "انقر «إنشاء سجل المخاطر».",
        "راجع «الخريطة الحرارية (المخاطر الأصلية)» وأعداد «حسب الفئة» وجدول السجل بالدرجات الأصلية والمتبقية.",
        "صدّر عبر «Excel ‏(CSV)» أو «Word».",
      ],
      outputs: [
        "سجل المخاطر بصيغة ملف CSV لبرنامج Excel",
        "سجل المخاطر بصيغة مستند Word",
      ],
      required: [],
      tips: [
        "يجب أن يفعّل المسؤول الذكاء الاصطناعي.",
        "السجل نقطة بداية: راجع كل خطر ومالك ودرجة قبل استخدامه.",
      ],
    },
  },
  {
    key: "ai.clash",
    what: "Before clash runs, plans which discipline pairs to test, with tolerances, priorities and frequencies suited to your stage, LOD and software.",
    steps: [
      "Choose the “Project type”, “Stage”, “Software” and “LOD”.",
      "Tick the “Disciplines” to include in the tests.",
      "Add any “Special requirements”, such as a tight ceiling void or prefabricated MEP modules.",
      "Click “Build clash matrix”.",
      "Review the matrix (tolerance in mm and priority for each pair), the list of clash tests and the “Running and reporting” guidance.",
      "Click “CSV” to export the tests.",
    ],
    outputs: [
      "Clash test list as CSV: code, selections A and B, type, tolerance (mm), priority, frequency and notes",
    ],
    required: [
      "Disciplines (at least two ticked)",
    ],
    tips: [
      "AI must be switched on by an administrator.",
    ],
    ar: {
      what: "قبل تشغيل فحوص التعارض، يخطط أزواج التخصصات المطلوب اختبارها، مع التفاوتات والأولويات والتكرار المناسبة لمرحلتك ومستوى LOD والبرمجيات.",
      steps: [
        "اختر «نوع المشروع» و«المرحلة» و«البرمجيات» و«LOD».",
        "حدّد «التخصصات» التي تشملها الاختبارات.",
        "أضف أي «متطلبات خاصة»، مثل فراغ سقف ضيق أو وحدات MEP مسبقة الصنع.",
        "انقر «إنشاء مصفوفة التعارضات».",
        "راجع المصفوفة (التفاوت بالمليمتر والأولوية لكل زوج) وقائمة اختبارات التعارض وإرشادات «التشغيل وإعداد التقارير».",
        "انقر «CSV» لتصدير الاختبارات.",
      ],
      outputs: [
        "قائمة اختبارات التعارض بصيغة CSV: الرمز والمجموعتان A وB والنوع والتفاوت (mm) والأولوية والتكرار والملاحظات",
      ],
      required: [
        "التخصصات (تحديد تخصصين على الأقل)",
      ],
      tips: [
        "يجب أن يفعّل المسؤول الذكاء الاصطناعي.",
      ],
    },
  },
  {
    key: "b.minutes",
    what: "Turns rough notes or a Teams or Zoom transcript into formal minutes with attendees, agenda items, decisions, actions with owners and dates, and risks. Names and dates not in the notes are left as TBC.",
    steps: [
      "Enter the “Meeting title”, “Date”, “Project”, “Chair” and the attendees, one per line: name, organisation, role.",
      "Paste the notes in “Notes or transcript”, or click “Load .txt, .vtt or .docx”.",
      "Click “Write the minutes”.",
      "Check and edit the attendees, apologies, agenda items, decisions, actions (“Add action”), risks (“Add risk”) and next meeting.",
      "Export with “Download Word”, “Actions CSV” or “Copy as text”.",
    ],
    outputs: [
      "Minutes as a Word document",
      "Action list as CSV (ref, action, owner, due, status)",
      "Minutes as plain text copied to the clipboard",
    ],
    required: [
      "Notes or transcript (at least 20 characters, up to 120,000)",
    ],
    tips: [
      "AI must be switched on by an administrator.",
      "Check every name, date, decision and action against the meeting before you issue the minutes.",
    ],
    ar: {
      what: "يحوّل الملاحظات الأولية أو نصًا مفرّغًا من Teams أو Zoom إلى محضر رسمي يضم الحضور وبنود جدول الأعمال والقرارات والإجراءات مع مالكيها وتواريخها والمخاطر. وتُترك الأسماء والتواريخ غير الواردة في الملاحظات بصيغة TBC.",
      steps: [
        "أدخل «عنوان الاجتماع» و«التاريخ» و«المشروع» و«رئيس الاجتماع» والحضور، سطرًا لكل شخص: الاسم، الجهة، الدور.",
        "الصق الملاحظات في «الملاحظات أو النص المفرّغ»، أو انقر «تحميل ‎.txt أو ‎.vtt أو ‎.docx».",
        "انقر «اكتب المحضر».",
        "راجع وعدّل الحضور والاعتذارات وبنود جدول الأعمال والقرارات والإجراءات («إضافة إجراء») والمخاطر («إضافة خطر») والاجتماع التالي.",
        "صدّر عبر «تنزيل Word» أو «الإجراءات CSV» أو «نسخ كنص».",
      ],
      outputs: [
        "المحضر بصيغة مستند Word",
        "قائمة الإجراءات بصيغة CSV (المرجع، الإجراء، المالك، الاستحقاق، الحالة)",
        "المحضر نصًا عاديًا منسوخًا إلى الحافظة",
      ],
      required: [
        "الملاحظات أو النص المفرّغ (20 حرفًا على الأقل، وحتى 120,000)",
      ],
      tips: [
        "يجب أن يفعّل المسؤول الذكاء الاصطناعي.",
        "تحقق من كل اسم وتاريخ وقرار وإجراء مقابل الاجتماع قبل إصدار المحضر.",
      ],
    },
  },
  {
    key: "b.comms",
    what: "Builds a transmittal from a list of container names, checking each name and taking the purpose of issue from its status code (no AI needed). An AI writer drafts RFIs, rejections, non-conformance notices, reminders, transmittal cover notes and general letters that cite ISO 19650.",
    steps: [
      "In “Transmittal builder”, enter the “Project code”, “From”, “To”, “Date”, “Transmittal no.” (a number is suggested) and “Reason for issue”.",
      "Paste the “Container names”, one per line, with the status and revision as columns or as the last fields of the name; “Try an example” shows the format.",
      "Check the “Schedule of containers”: each name is checked against ISO 19650 naming and problems are listed per row.",
      "Click “Download Word”, “Download CSV” or “Copy” to issue the transmittal.",
      "In “AI correspondence writer”, pick a letter type and fill “To”, “From”, “Project” and “Context”; optionally tick “Include the transmittal containers as context” or click “Use transmittal details”.",
      "Click “Draft the letter”, edit the subject and body, then click “Download Word” or “Copy”.",
    ],
    outputs: [
      "Transmittal as a Word document and as CSV",
      "Letter or notice as a Word document",
    ],
    required: [
      "Container names (at least one, for a transmittal)",
      "Context (at least 10 characters, for a letter)",
    ],
    tips: [
      "The transmittal builder works without AI; the letter writer needs AI switched on by an administrator.",
      "Containers with problems are listed as exceptions on the transmittal; correct them before issue where you can.",
      "Fill in every [TBC] in a drafted letter before you send it.",
    ],
    ar: {
      what: "يبني كشف إرسال من قائمة أسماء الحاويات، فيدقق كل اسم ويستخرج غرض الإصدار من رمز حالته (دون الحاجة إلى الذكاء الاصطناعي). ويصوغ كاتب بالذكاء الاصطناعي طلبات RFI وإشعارات الرفض وعدم المطابقة والتذكيرات ومذكرات تغطية كشوف الإرسال والرسائل العامة مع الإشارة إلى ISO 19650.",
      steps: [
        "في «منشئ كشوف الإرسال»، أدخل «رمز المشروع» و«من» و«إلى» و«التاريخ» و«رقم كشف الإرسال» (يُقترح رقم) و«سبب الإصدار».",
        "الصق «أسماء الحاويات»، سطرًا لكل اسم، مع الحالة والمراجعة كأعمدة أو كآخر حقول في الاسم؛ ويعرض «جرّب مثالاً» الصيغة.",
        "راجع «جدول الحاويات»: يُدقَّق كل اسم وفق تسمية ISO 19650 وتُعرض المشكلات لكل صف.",
        "انقر «تنزيل Word» أو «تنزيل CSV» أو «نسخ» لإصدار كشف الإرسال.",
        "في «كاتب المراسلات بالذكاء الاصطناعي»، اختر نوع الرسالة واملأ «إلى» و«من» و«المشروع» و«السياق»؛ واختياريًا حدّد «تضمين حاويات كشف الإرسال كسياق» أو انقر «استخدام تفاصيل كشف الإرسال».",
        "انقر «صِغ الرسالة»، وعدّل الموضوع والنص، ثم انقر «تنزيل Word» أو «نسخ».",
      ],
      outputs: [
        "كشف الإرسال بصيغة مستند Word وبصيغة CSV",
        "الرسالة أو الإشعار بصيغة مستند Word",
      ],
      required: [
        "أسماء الحاويات (اسم واحد على الأقل، لكشف الإرسال)",
        "السياق (10 أحرف على الأقل، للرسالة)",
      ],
      tips: [
        "يعمل منشئ كشوف الإرسال دون ذكاء اصطناعي؛ أما كاتب الرسائل فيحتاج إلى أن يفعّل المسؤول الذكاء الاصطناعي.",
        "تُدرج الحاويات التي بها مشكلات كاستثناءات في كشف الإرسال؛ صحّحها قبل الإصدار متى أمكن.",
        "املأ كل [TBC] في الرسالة المصاغة قبل إرسالها.",
      ],
    },
  },

  // ---------------------------------------------------------------- Check
  {
    key: "ai.review",
    what: "Reviews one document against the checklist for its type, checks a BEP against its EIR, or compares two BEP versions. It gives a score, a verdict, a compliance matrix and findings with fixes. For a full EIR ↔ BEP matrix, use the AI studio.",
    steps: [
      "Choose a mode: “Single document review”, “EIR ↔ BEP compliance” or “BEP version compare”.",
      "For a single review, pick the document type or leave “Auto-detect document type”.",
      "Upload a PDF, DOCX or TXT file (up to 25 MB) or paste the text; for the two compare modes, provide both documents.",
      "Click “Run compliance review”; a full review usually takes 1–2 minutes.",
      "Read the score, verdict, summary, coverage table and findings; click the chips to filter by status or severity.",
      "Export with “Download report (Word)”, “Compliance matrix (CSV)” or “Findings (CSV)”.",
    ],
    outputs: [
      "Review report as a Word document (score, verdict, coverage and findings)",
      "Compliance matrix as CSV",
      "Findings as CSV",
    ],
    required: [
      "The document to review (file or pasted text)",
      "For EIR ↔ BEP compliance and BEP version compare: both documents",
    ],
    tips: [
      "AI must be switched on by an administrator.",
      "The review is decision support: the accountable reviewer must confirm each finding.",
    ],
    ar: {
      what: "يراجع وثيقة واحدة مقابل قائمة التحقق الخاصة بنوعها، أو يتحقق من BEP مقابل EIR الخاص به، أو يقارن إصدارين من BEP. ويقدم درجة وحكمًا ومصفوفة امتثال وملاحظات مع حلولها. لمصفوفة EIR ↔ BEP كاملة، استخدم استوديو الذكاء الاصطناعي.",
      steps: [
        "اختر نمطًا: «مراجعة وثيقة واحدة» أو «امتثال EIR ↔ BEP» أو «مقارنة إصدارات BEP».",
        "لمراجعة وثيقة واحدة، اختر نوع الوثيقة أو اترك «اكتشاف نوع الوثيقة تلقائيًا».",
        "ارفع ملف PDF أو DOCX أو TXT (حتى 25 MB) أو الصق النص؛ وفي نمطي المقارنة، قدّم الوثيقتين.",
        "انقر «تشغيل مراجعة الامتثال»؛ تستغرق المراجعة الكاملة عادةً من دقيقة إلى دقيقتين.",
        "اقرأ الدرجة والحكم والملخص وجدول التغطية والملاحظات؛ وانقر الشرائح للتصفية حسب الحالة أو الشدة.",
        "صدّر عبر «تنزيل التقرير (Word)» أو «مصفوفة الامتثال (CSV)» أو «الملاحظات (CSV)».",
      ],
      outputs: [
        "تقرير المراجعة بصيغة مستند Word (الدرجة والحكم والتغطية والملاحظات)",
        "مصفوفة الامتثال بصيغة CSV",
        "الملاحظات بصيغة CSV",
      ],
      required: [
        "الوثيقة المراد مراجعتها (ملف أو نص ملصق)",
        "لامتثال EIR ↔ BEP ومقارنة إصدارات BEP: الوثيقتان كلتاهما",
      ],
      tips: [
        "يجب أن يفعّل المسؤول الذكاء الاصطناعي.",
        "المراجعة دعم للقرار: يجب على المراجع المساءَل تأكيد كل ملاحظة.",
      ],
    },
  },
  {
    key: "m.naming",
    what: "Checks hundreds of file or container names at once against the ISO 19650-2 UK National Annex fields, your project code and your delivery plan, and suggests corrected names. Only names are read: files never leave your computer.",
    steps: [
      "Check the “Project code”, the optional “Originator codes” and the “Field separator”; tick the delivery plan match if a TIDP or MIDP is saved.",
      "Paste names one per line, or drop files or “choose a whole folder”; “Try an example” fills in sample names.",
      "Read the counters (names checked, correct, to confirm, wrong) and click one to filter the table.",
      "Read “What to fix” on each row and click a suggested name to copy it.",
      "Use “Copy N corrected names”, “Copy Windows rename commands”, “Export CSV” or the “Not in plan” filter.",
    ],
    outputs: [
      "Naming check report as CSV (name, result, problems, suggested name, in delivery plan)",
      "Corrected names and Windows rename commands copied to the clipboard",
      "A list of planned containers that have no file in the list",
    ],
    required: [
      "File or container names (at least one, one per line)",
    ],
    tips: [
      "The project code and separator come from the Project data page when it is filled in.",
    ],
    ar: {
      what: "يدقق مئات أسماء الملفات أو الحاويات دفعة واحدة مقابل حقول الملحق الوطني البريطاني لـ ISO 19650-2 ورمز مشروعك وخطة التسليم، ويقترح أسماء مصحّحة. تُقرأ الأسماء فقط: لا تغادر الملفات حاسوبك أبدًا.",
      steps: [
        "تحقق من «رمز المشروع» و«رموز الجهة المُنشئة» الاختيارية و«فاصل الحقول»؛ وحدّد المطابقة مع خطة التسليم إذا كانت TIDP أو MIDP محفوظة.",
        "الصق الأسماء سطرًا لكل اسم، أو أفلت الملفات أو «اختر مجلداً كاملاً»؛ ويملأ «جرّب مثالاً» أسماء نموذجية.",
        "اقرأ العدادات (الأسماء المدققة، الصحيحة، المطلوب تأكيدها، الخاطئة) وانقر أحدها لتصفية الجدول.",
        "اقرأ «ما يجب إصلاحه» في كل صف وانقر اسمًا مقترحًا لنسخه.",
        "استخدم «نسخ N اسم مصحّح» أو «نسخ أوامر إعادة التسمية في Windows» أو «تصدير بصيغة CSV» أو مرشح «ليست في الخطة».",
      ],
      outputs: [
        "تقرير تدقيق التسمية بصيغة CSV (الاسم، النتيجة، المشكلات، الاسم المقترح، الوجود في خطة التسليم)",
        "أسماء مصحّحة وأوامر إعادة تسمية Windows منسوخة إلى الحافظة",
        "قائمة بالحاويات المخططة التي ليس لها ملف في القائمة",
      ],
      required: [
        "أسماء الملفات أو الحاويات (اسم واحد على الأقل، سطر لكل اسم)",
      ],
      tips: [
        "يُؤخذ رمز المشروع والفاصل من صفحة بيانات المشروع عند تعبئتها.",
      ],
    },
  },
  {
    key: "s.naming",
    what: "Builds one information container name from the UK National Annex fields, validates a pasted name field by field, and lists the status (suitability) codes with their CDE state.",
    steps: [
      "In “Generator”, fill each field: Project, Originator, Volume / System, Level / Location, Type, Role and Number; invalid fields are outlined in red.",
      "Read the “Result” name and click “Copy”.",
      "In “Validator”, paste a container name to check each field.",
      "Look up a code in the “Status (suitability) codes” table.",
    ],
    outputs: [
      "A container name copied to the clipboard",
    ],
    required: [
      "Project (2–6 letters or digits)",
      "Originator (3–6 letters or digits)",
      "Volume / System (1–2 letters or digits)",
      "Level / Location (2 letters or digits)",
      "Type (2 characters, chosen from the list)",
      "Role (1–2 letters, chosen from the list)",
      "Number (4–6 digits)",
    ],
    tips: [
      "The validator expects exactly seven fields separated by “-”, without a status code or revision at the end.",
    ],
    ar: {
      what: "يبني اسم حاوية معلومات واحدًا من حقول الملحق الوطني البريطاني، ويتحقق من اسم ملصق حقلًا حقلًا، ويعرض رموز الحالة (الملاءمة) مع حالة CDE لكل منها.",
      steps: [
        "في «المُولِّد»، املأ كل حقل: المشروع والجهة المُنشئة والحجم / النظام والمستوى / الموقع والنوع والدور والرقم؛ وتُحاط الحقول غير الصالحة بإطار أحمر.",
        "اقرأ الاسم في «النتيجة» وانقر «نسخ».",
        "في «أداة التحقق»، الصق اسم حاوية لتدقيق كل حقل.",
        "ابحث عن رمز في جدول «رموز الحالة (الملاءمة)».",
      ],
      outputs: [
        "اسم حاوية منسوخ إلى الحافظة",
      ],
      required: [
        "المشروع (من 2 إلى 6 أحرف أو أرقام)",
        "الجهة المُنشئة (من 3 إلى 6 أحرف أو أرقام)",
        "الحجم / النظام (حرف أو رقم واحد أو اثنان)",
        "المستوى / الموقع (حرفان أو رقمان)",
        "النوع (رمزان، يُختار من القائمة)",
        "الدور (حرف أو حرفان، يُختار من القائمة)",
        "الرقم (من 4 إلى 6 أرقام)",
      ],
      tips: [
        "تتوقع أداة التحقق سبعة حقول بالضبط مفصولة بـ «-»، دون رمز حالة أو مراجعة في النهاية.",
      ],
    },
  },
  {
    key: "ai.suitability",
    what: "Helps you pick the right status (suitability) code: a quick wizard for common cases, an AI advisor for tricky situations, and a quick reference of every code with its CDE state.",
    steps: [
      "In “Quick wizard”, answer the questions by clicking an option until a code appears with its CDE state.",
      "Click “Start again” to reset the wizard.",
      "For a tricky case, describe it in “AI advisor for complex situations” and click “Advise”.",
      "Read the suggested code, explanation, next step, alternatives and cautions.",
      "Check the “Quick reference” table, where the chosen code is highlighted.",
    ],
    outputs: [],
    required: [
      "Situation description (at least 10 characters; AI advisor only)",
    ],
    tips: [
      "The AI advisor appears only when AI is switched on; the quick wizard always works.",
      "Codes follow the UK National Annex to ISO 19650-2; your project's information standard may define its own.",
    ],
    ar: {
      what: "يساعدك على اختيار رمز الحالة (الملاءمة) الصحيح: معالج سريع للحالات الشائعة، ومستشار بالذكاء الاصطناعي للحالات المعقدة، ومرجع سريع لكل رمز مع حالة CDE الخاصة به.",
      steps: [
        "في «معالج سريع»، أجب عن الأسئلة بالنقر على خيار حتى يظهر رمز مع حالة CDE الخاصة به.",
        "انقر «البدء من جديد» لإعادة تعيين المعالج.",
        "للحالة المعقدة، صِفها في «مستشار الذكاء الاصطناعي للحالات المعقدة» وانقر «تقديم المشورة».",
        "اقرأ الرمز المقترح والشرح والخطوة التالية والبدائل والتنبيهات.",
        "راجع جدول «مرجع سريع»، حيث يُميَّز الرمز المختار.",
      ],
      outputs: [],
      required: [
        "وصف الحالة (10 أحرف على الأقل؛ لمستشار الذكاء الاصطناعي فقط)",
      ],
      tips: [
        "يظهر مستشار الذكاء الاصطناعي فقط عند تفعيل الذكاء الاصطناعي؛ أما المعالج السريع فيعمل دائمًا.",
        "تتبع الرموز الملحق الوطني البريطاني لـ ISO 19650-2؛ وقد يحدد معيار معلومات مشروعك رموزه الخاصة.",
      ],
    },
  },

  // ---------------------------------------------------------------- Templates & samples
  {
    key: "w.docguides",
    what: "Explains every ISO 19650 document: what it is, who writes and approves it, what goes in each section, how to create it step by step and what to check before issue.",
    steps: [
      "Search with “Search documents…” or browse the four phases, from requirements to handover.",
      "Click a document card to open its guide.",
      "Read “What it is”, “Why it matters”, “Who and when” and the “Document chain”; use the bar under the title to jump to a part.",
      "Open each section under “What to write, section by section” for guidance and an example, and follow “How to create it”.",
      "Tick the “Quality checklist” before issue and read the “Common mistakes”.",
      "Click “Open the template” or “Draft it with AI” to start the document.",
    ],
    outputs: [],
    required: [],
    tips: [
      "Checklist ticks are saved in this browser.",
      "Some guides start with a worked example and case studies (Deep dive).",
    ],
    ar: {
      what: "يشرح كل وثيقة من وثائق ISO 19650: ما هي، ومن يكتبها ويعتمدها، وما يُكتب في كل قسم، وكيف تُعدّ خطوة بخطوة، وما الذي يجب التحقق منه قبل الإصدار.",
      steps: [
        "ابحث عبر «ابحث في المستندات…» أو تصفّح المراحل الأربع، من المتطلبات إلى التسليم.",
        "انقر بطاقة وثيقة لفتح دليلها.",
        "اقرأ «ما هو» و«لماذا يهم» و«من ومتى» و«سلسلة الوثائق»؛ واستخدم الشريط أسفل العنوان للانتقال إلى جزء.",
        "افتح كل قسم ضمن «ما الذي يُكتب، قسماً بقسم» للإرشادات ومثال، واتبع «كيف تُعدّها».",
        "ضع علامات «قائمة تحقق الجودة» قبل الإصدار واقرأ «الأخطاء الشائعة».",
        "انقر «افتح القالب» أو «صِغها بالذكاء الاصطناعي» لبدء الوثيقة.",
      ],
      outputs: [],
      required: [],
      tips: [
        "تُحفظ علامات قائمة التحقق في هذا المتصفح.",
        "تبدأ بعض الأدلة بمثال عملي ودراسات حالة (Deep dive).",
      ],
    },
  },
  {
    key: "t.lib19650",
    what: "The ISO 19650 template library: structured templates for the EIR, BEP, TIDP, MIDP and every other document, with sections, guidance and clause references. Use one to create a controlled document in a project.",
    steps: [
      "Search with “Search templates…” or browse the templates by category.",
      "Click “Contents” to see a template's sections and fields.",
      "Click “Read the guide” to learn how to write the document.",
      "Click “Use in project…”, choose the project and click “Create document”.",
      "Under “House templates”, find the versions your organisation saved from its own documents.",
    ],
    outputs: [
      "A controlled document created from the template in the chosen project, opened for editing",
    ],
    required: [
      "A project with ISO 19650 in scope where you are an editor",
    ],
    tips: [
      "Templates generated from a project register (such as the TIDP, MIDP or risk register) are created from that register instead: follow the notice in the dialog.",
    ],
    ar: {
      what: "مكتبة قوالب ISO 19650: قوالب منظمة لوثائق EIR وBEP وTIDP وMIDP وكل وثيقة أخرى، مع الأقسام والإرشادات ومراجع البنود. استخدم أحدها لإنشاء وثيقة مضبوطة في مشروع.",
      steps: [
        "ابحث عبر «ابحث في القوالب…» أو تصفّح القوالب حسب الفئة.",
        "انقر «المحتويات» لرؤية أقسام القالب وحقوله.",
        "انقر «اقرأ الدليل» لمعرفة كيفية كتابة الوثيقة.",
        "انقر «استخدام في مشروع…»، واختر المشروع وانقر «إنشاء مستند».",
        "ضمن «قوالب المنظمة»، اعثر على الإصدارات التي حفظتها منظمتك من وثائقها.",
      ],
      outputs: [
        "وثيقة مضبوطة منشأة من القالب في المشروع المختار، ومفتوحة للتحرير",
      ],
      required: [
        "مشروع ضمن نطاقه ISO 19650 تكون فيه محرّرًا",
      ],
      tips: [
        "القوالب المولّدة من سجل في المشروع (مثل TIDP أو MIDP أو سجل المخاطر) تُنشأ من ذلك السجل بدلًا من ذلك: اتبع الإشعار في مربع الحوار.",
      ],
    },
  },
  {
    key: "t.lib42001",
    what: "The ISO/IEC 42001 template library: AI policy, AI risk assessment, AI impact assessment and the other documents of an AI management system (AIMS). Use one to create a controlled document in a project.",
    steps: [
      "Search with “Search templates…” or browse the templates by category.",
      "Click “Contents” to see a template's sections and fields.",
      "Click “Use in project…”, choose the project and click “Create document”.",
      "Under “House templates”, find the versions your organisation saved from its own documents.",
    ],
    outputs: [
      "A controlled document created from the template in the chosen project, opened for editing",
    ],
    required: [
      "A project with ISO/IEC 42001 in scope where you are an editor",
    ],
    ar: {
      what: "مكتبة قوالب ISO/IEC 42001: سياسة الذكاء الاصطناعي وتقييم مخاطره وتقييم أثره وسائر وثائق نظام إدارة الذكاء الاصطناعي (AIMS). استخدم أحدها لإنشاء وثيقة مضبوطة في مشروع.",
      steps: [
        "ابحث عبر «ابحث في القوالب…» أو تصفّح القوالب حسب الفئة.",
        "انقر «المحتويات» لرؤية أقسام القالب وحقوله.",
        "انقر «استخدام في مشروع…»، واختر المشروع وانقر «إنشاء مستند».",
        "ضمن «قوالب المنظمة»، اعثر على الإصدارات التي حفظتها منظمتك من وثائقها.",
      ],
      outputs: [
        "وثيقة مضبوطة منشأة من القالب في المشروع المختار، ومفتوحة للتحرير",
      ],
      required: [
        "مشروع ضمن نطاقه ISO/IEC 42001 تكون فيه محرّرًا",
      ],
    },
  },
  {
    key: "r.samples",
    what: "Structured Word samples of the EIR, AIR, OIR, pre- and post-appointment BEP, project information standard, information protocol and security triage, with the correct sections, clause references and guidance notes.",
    steps: [
      "Click “Preview” on a sample to list its sections and guidance.",
      "Click “Download Word” to get the structured sample.",
      "Click “Use in a project” to open the template and create a controlled document from it.",
      "Click “AI-filled sample” to have the document generator draft a filled example for a fictional project.",
      "For a PIR, click “Draft PIR with AI”.",
    ],
    outputs: [
      "A structured Word sample (.docx) with placeholders for every field",
    ],
    required: [],
    tips: [
      "When the document data (entered in the document generator) is complete, the download fills the cover and document control with your project, reference, version and author.",
    ],
    ar: {
      what: "نماذج Word منظمة لوثائق EIR وAIR وOIR وBEP ما قبل التعيين وما بعده ومعيار معلومات المشروع وبروتوكول المعلومات وفرز الأمن، بالأقسام الصحيحة ومراجع البنود وملاحظات الإرشاد.",
      steps: [
        "انقر «معاينة» في نموذج لعرض أقسامه وإرشاداته.",
        "انقر «تنزيل Word» للحصول على النموذج المنظم.",
        "انقر «استخدام في مشروع» لفتح القالب وإنشاء وثيقة مضبوطة منه.",
        "انقر «نموذج مُعبّأ بالذكاء الاصطناعي» ليصوغ مولّد الوثائق مثالًا معبأً لمشروع افتراضي.",
        "لوثيقة PIR، انقر «صياغة PIR بالذكاء الاصطناعي».",
      ],
      outputs: [
        "نموذج Word منظم (‎.docx) مع عناصر نائبة لكل حقل",
      ],
      required: [],
      tips: [
        "عند اكتمال بيانات المستند (المُدخلة في مولّد الوثائق) يملأ التنزيل الغلاف وضبط الوثيقة باسم مشروعك ومرجعه وإصداره ومُعدّه.",
      ],
    },
  },
  {
    key: "r.downloads",
    what: "A library of templates, checklists, guides and worked examples curated by the platform administrators, in Word, Excel, PDF, DWG, IFC and other formats.",
    steps: [
      "Search with “Search resources…”, sort by “Newest first”, “Most downloaded” or A–Z, and filter with “All categories”.",
      "Click “Preview” to view a file in the page, where available.",
      "Click “Download” to save the file.",
      "Administrators: under “Add a resource”, choose a file, title, category, ISO 19650 part and short description, then click “Add to library”; “Delete” removes a resource.",
    ],
    outputs: [
      "Downloaded files",
      "A new library resource (administrators only)",
    ],
    required: [
      "File (administrators adding a resource)",
      "Title (at least 2 characters; defaults to the file name)",
    ],
    tips: [
      "Only upload material you have the right to share.",
    ],
    ar: {
      what: "مكتبة من القوالب وقوائم التحقق والأدلة والأمثلة العملية ينسقها مسؤولو المنصة، بصيغ Word وExcel وPDF وDWG وIFC وغيرها.",
      steps: [
        "ابحث عبر «بحث في الموارد…»، ورتّب حسب «الأحدث أولًا» أو «الأكثر تنزيلًا» أو A–Z، وصفِّ عبر «جميع الفئات».",
        "انقر «معاينة» لعرض الملف داخل الصفحة، حيثما توفر ذلك.",
        "انقر «تنزيل» لحفظ الملف.",
        "للمسؤولين: ضمن «إضافة مورد»، اختر ملفًا وعنوانًا وفئة وجزء ISO 19650 ووصفًا قصيرًا، ثم انقر «إضافة إلى المكتبة»؛ ويزيل «حذف» المورد.",
      ],
      outputs: [
        "ملفات منزّلة",
        "مورد جديد في المكتبة (للمسؤولين فقط)",
      ],
      required: [
        "الملف (للمسؤولين عند إضافة مورد)",
        "العنوان (حرفان على الأقل؛ يُستخدم اسم الملف افتراضيًا)",
      ],
      tips: [
        "لا ترفع إلا مواد يحق لك مشاركتها.",
      ],
    },
  },
];
