import type { PageGuide } from "./types";

// The three MIDP / TIDP tools. They share the template-layout workbook (shared/midpWorkbook.ts).
export const GUIDES_DELIVERY: PageGuide[] = [
  {
    key: "p.plan",
    what: "The project's delivery plan: every information container each task team will deliver, at which data exchange (milestone), in which formats and by when. It is the project's TIDPs and MIDP in one place, checked continuously, and exports in the MIDP / TIDP template layout.",
    steps: [
      "Set up task teams (with originator codes) and milestones first under \"Teams & milestones\": milestones are the data exchanges of the MIDP.",
      "Click \"+ Container\" and fill in the task team, title, type, container name (\"Auto\" gives the next free number), milestone, dates and the template columns: description, native format, exchange formats, model reference (for drawings and schedules cut from a model), classification and cost code.",
      "To deliver the same container again at a later exchange, click \"+ Exchange\" on its row: it is copied to the next milestone it is not planned for, depending on the earlier issue.",
      "Or click \"Import (template / Excel)\" and upload a filled MIDP / TIDP workbook (.xlsx): task teams and exchanges are matched to the project's, missing ones are created, and each exchange becomes one row per container. Pasting rows from Excel still works.",
      "Use the filter to switch between the MIDP (all task teams) and one team's TIDP, and between the table and the Gantt view; update the status of each row as work moves through the CDE.",
      "Fix what the plan check reports (duplicates at the same exchange, dates after the milestone, missing names, dependency loops); the full list is in the Quality hub.",
      "Click \"⬇ Excel\" for the MIDP / TIDP workbook, or \"Generate MIDP\" / \"Generate TIDP\" for the controlled Word documents.",
    ],
    outputs: [
      "MIDP / TIDP workbook (.xlsx) in the template layout: document control, instructions, the MIDP and one TIDP sheet per task team, grouped as Models / Documents, schedules & reports / Drawings / Others, with naming fields, revision and status codes and owner / planned / issued dates per data exchange; plus Tracking, Milestones and Summary sheets",
      "MIDP and TIDP controlled documents (WIP, ready to review and issue)",
      "CSV export of the current view",
      "Plan findings in the Quality hub",
    ],
    required: [
      "At least one task team (set up under Teams & milestones)",
      "Task team and title for every container",
      "Editor role or higher to add, import or change containers",
    ],
    tips: [
      "Plan a container once per data exchange: the same name at two milestones is expected, twice at the same milestone is reported as a duplicate.",
      "Revision and status codes in the workbook come from the file linked to the container in the CDE.",
      "The TIDP sheets are what the lead appointed party checks before consolidating; ask each task team to work in its own sheet when filling the template outside the platform.",
    ],
    ar: {
      what: "خطة التسليم للمشروع: كل حاوية معلومات سيسلّمها كل فريق مهمة، وفي أي تبادل بيانات (معلم)، وبأي صيغ ومتى. تجمع خطط TIDP وخطة MIDP في مكان واحد، وتُفحص باستمرار، وتُصدَّر بتخطيط قالب MIDP / TIDP.",
      steps: [
        "أعدّ فرق المهام (مع رموز الجهة المُنشئة) والمعالم أولًا في «الفرق والمعالم»: المعالم هي تبادلات البيانات في MIDP.",
        "انقر «+ Container» واملأ فريق المهمة والعنوان والنوع واسم الحاوية (يعطي «Auto» الرقم التالي المتاح) والمعلم والتواريخ وأعمدة القالب: الوصف والصيغة الأصلية وصيغ التبادل ومرجع النموذج (للمخططات والجداول المستخرجة من نموذج) والتصنيف ورمز التكلفة.",
        "لتسليم الحاوية نفسها مرة أخرى في تبادل لاحق، انقر «+ Exchange» في صفها: تُنسخ إلى المعلم التالي غير المخطط له، مع اعتمادها على الإصدار السابق.",
        "أو انقر «Import (template / Excel)» وارفع ملف MIDP / TIDP مكتملًا (‎.xlsx): تُطابَق فرق المهام والتبادلات مع ما في المشروع، ويُنشأ الناقص، ويصبح كل تبادل صفًا لكل حاوية. لا يزال لصق الصفوف من Excel متاحًا.",
        "استخدم عامل التصفية للتبديل بين MIDP (كل الفرق) وخطة TIDP لفريق واحد، وبين الجدول ومخطط جانت؛ وحدّث حالة كل صف مع انتقال العمل عبر CDE.",
        "عالج ما يبلّغ عنه فحص الخطة (التكرار في التبادل نفسه، التواريخ بعد المعلم، الأسماء الناقصة، حلقات الاعتماد)؛ القائمة الكاملة في مركز الجودة.",
        "انقر «⬇ Excel» للحصول على ملف MIDP / TIDP، أو «Generate MIDP» / «Generate TIDP» للمستندات الخاضعة للرقابة بصيغة Word.",
      ],
      outputs: [
        "ملف MIDP / TIDP (‎.xlsx) بتخطيط القالب: ضبط المستند والتعليمات وMIDP وورقة TIDP لكل فريق مهمة، مجمّعة إلى نماذج / مستندات وجداول وتقارير / مخططات / أخرى، مع حقول التسمية ورموز الإصدار والحالة والمالك / التاريخ المخطط / تاريخ الإصدار لكل تبادل؛ إضافة إلى أوراق المتابعة والمعالم والملخص",
        "مستندا MIDP وTIDP الخاضعان للرقابة (قيد العمل، جاهزان للمراجعة والإصدار)",
        "تصدير CSV للعرض الحالي",
        "ملاحظات فحص الخطة في مركز الجودة",
      ],
      required: [
        "فريق مهمة واحد على الأقل (يُعدّ في الفرق والمعالم)",
        "فريق المهمة والعنوان لكل حاوية",
        "دور محرر أو أعلى لإضافة الحاويات أو استيرادها أو تعديلها",
      ],
      tips: [
        "خطّط للحاوية مرة واحدة لكل تبادل بيانات: الاسم نفسه في معلمين أمر متوقع، أما مرتين في المعلم نفسه فيُعدّ تكرارًا.",
        "تأتي رموز الإصدار والحالة في الملف من الملف المرتبط بالحاوية في CDE.",
        "أوراق TIDP هي ما يفحصه الطرف المعيَّن الرئيسي قبل الدمج؛ اطلب من كل فريق العمل في ورقته عند تعبئة القالب خارج المنصة.",
      ],
    },
  },
  {
    key: "ai.plans",
    what: "A standalone generator for a TIDP, MIDP or MPDT (model production and delivery table) without a project: starter rows per discipline or AI rows, ISO 19650 container names, checks, and an Excel workbook in the MIDP / TIDP template layout. The plan is kept in this browser.",
    steps: [
      "Choose TIDP, MIDP or MPDT at the top.",
      "Complete the project data the page asks for (the gate at the top) and the document data panel, then fill in the plan details: project code and originator for container names, task team and discipline for a TIDP.",
      "List the milestones (code, name, date): each one is a data exchange in the workbook.",
      "Click \"Standard starter list\" or \"Generate with AI\", or \"+ Add row\"; for a deliverable issued at several exchanges, add one row per milestone with the same type, role and number.",
      "Edit the rows in the table: description, native and exchange formats, model reference, cost code, LOIN, dates, responsible, suitability and status. Rows with problems are marked; hover to read why.",
      "To start from a filled template, click \"Import template (.xlsx)\"; \"Import CSV\" / \"Import TIDP CSVs\" read CSVs exported from this tool.",
      "Export with \"Excel (.xlsx)\", \"Word (.docx)\" or \"CSV\".",
    ],
    outputs: [
      "Excel workbook in the MIDP / TIDP template layout (document control, instructions, MIDP and a TIDP sheet per task team; MPDT as a single table)",
      "Word document (.docx)",
      "CSV of the rows",
    ],
    required: [
      "The project data minimum shown at the top of the page",
      "The required document data fields (marked in the document data panel)",
      "A title for every row",
    ],
    tips: [
      "AI rows need AI to be switched on for the portal; the starter list works without it.",
      "The plan is saved in this browser only. To share it, export the workbook or use the project MIDP / TIDP planner.",
    ],
    ar: {
      what: "مولّد مستقل لخطة TIDP أو MIDP أو MPDT (جدول إنتاج النماذج وتسليمها) دون مشروع: صفوف بداية لكل تخصص أو صفوف بالذكاء الاصطناعي، وأسماء حاويات وفق ISO 19650، وفحوصات، وملف Excel بتخطيط قالب MIDP / TIDP. تُحفظ الخطة في هذا المتصفح.",
      steps: [
        "اختر TIDP أو MIDP أو MPDT في الأعلى.",
        "أكمل بيانات المشروع التي تطلبها الصفحة (البوابة في الأعلى) ولوحة بيانات المستند، ثم املأ تفاصيل الخطة: رمز المشروع والجهة المُنشئة لأسماء الحاويات، وفريق المهمة والتخصص لخطة TIDP.",
        "اذكر المعالم (الرمز والاسم والتاريخ): كل معلم هو تبادل بيانات في الملف.",
        "انقر «Standard starter list» أو «Generate with AI» أو «+ Add row»؛ وللمُخرَج الذي يُصدر في عدة تبادلات أضف صفًا لكل معلم بالنوع والدور والرقم نفسها.",
        "عدّل الصفوف في الجدول: الوصف والصيغة الأصلية وصيغ التبادل ومرجع النموذج ورمز التكلفة وLOIN والتواريخ والمسؤول والملاءمة والحالة. تُعلَّم الصفوف التي فيها مشكلات؛ مرّر المؤشر لمعرفة السبب.",
        "للبدء من قالب مكتمل انقر «Import template (.xlsx)»؛ ويقرأ «Import CSV» / «Import TIDP CSVs» ملفات CSV المصدَّرة من هذه الأداة.",
        "صدّر عبر «Excel (.xlsx)» أو «Word (.docx)» أو «CSV».",
      ],
      outputs: [
        "ملف Excel بتخطيط قالب MIDP / TIDP (ضبط المستند والتعليمات وMIDP وورقة TIDP لكل فريق مهمة؛ وMPDT جدول واحد)",
        "مستند Word (‎.docx)",
        "ملف CSV للصفوف",
      ],
      required: [
        "الحد الأدنى من بيانات المشروع الظاهر أعلى الصفحة",
        "حقول بيانات المستند الإلزامية (المعلَّمة في لوحة بيانات المستند)",
        "عنوان لكل صف",
      ],
      tips: [
        "تتطلب صفوف الذكاء الاصطناعي تفعيل الذكاء الاصطناعي في البوابة؛ أما قائمة البداية فتعمل دونه.",
        "تُحفظ الخطة في هذا المتصفح فقط. لمشاركتها صدّر الملف أو استخدم مخطط MIDP / TIDP في المشروع.",
      ],
    },
  },
  {
    key: "x.programme",
    what: "Builds a TIDP or MIDP from the construction or design programme: each programme activity becomes the information containers it needs, with dates taken from the activity. Re-import a newer programme to see what moved.",
    steps: [
      "Click \"Load programme\" and choose the programme: Primavera P6 (.xer or .xml), Microsoft Project (.xml), or a CSV / Excel export with activity id, name, start and finish.",
      "Fill in the plan details (project code, originator, task team) and milestones, then pick the activities that produce information: \"Select suggested\" or \"Select all shown\" (\"Clear selection\" starts again).",
      "Check the containers proposed for the selected activities and adjust titles, types, formats, LOIN and responsibilities in the table.",
      "Click \"Save to plan generator\" (or \"Merge into plan\" when a plan already exists) to continue in the TIDP / MIDP generator.",
      "When the programme changes, click \"Load new programme version\": changed dates and new or removed activities are listed, and \"Apply new dates\" updates the containers.",
      "Export with \"Excel (.xlsx)\" (MIDP / TIDP template layout with a Programme link sheet) or \"CSV\".",
    ],
    outputs: [
      "Excel workbook in the MIDP / TIDP template layout, plus a Programme link sheet (activity → containers)",
      "CSV with the activity for each container",
      "A list of programme changes between two versions",
    ],
    required: [
      "A programme file (.xer, .xml, .csv, .txt or .xlsx) with activity names and dates",
    ],
    tips: [
      "Activities without dates cannot drive container dates; fix them in the programme or enter dates by hand.",
    ],
    ar: {
      what: "ينشئ خطة TIDP أو MIDP من البرنامج الزمني للتصميم أو الإنشاء: يصبح كل نشاط حاويات المعلومات التي يحتاجها، بتواريخ مأخوذة من النشاط. أعد استيراد برنامج أحدث لترى ما تغيّر.",
      steps: [
        "انقر «Load programme» واختر البرنامج الزمني: Primavera P6 (‎.xer أو ‎.xml) أو Microsoft Project (‎.xml) أو تصدير CSV / Excel يحوي رقم النشاط واسمه وبدايته ونهايته.",
        "املأ تفاصيل الخطة (رمز المشروع والجهة المُنشئة وفريق المهمة) والمعالم، ثم اختر الأنشطة التي تُنتج معلومات: «Select suggested» أو «Select all shown» (ويبدأ «Clear selection» من جديد).",
        "راجع الحاويات المقترحة للأنشطة المختارة وعدّل العناوين والأنواع والصيغ وLOIN والمسؤوليات في الجدول.",
        "انقر «Save to plan generator» (أو «Merge into plan» إذا وُجدت خطة) للمتابعة في مولّد TIDP / MIDP.",
        "عند تغيّر البرنامج انقر «Load new programme version»: تُعرض التواريخ المتغيرة والأنشطة الجديدة أو المحذوفة، ويحدّث «Apply new dates» الحاويات.",
        "صدّر عبر «Excel (.xlsx)» (بتخطيط قالب MIDP / TIDP مع ورقة ربط البرنامج) أو «CSV».",
      ],
      outputs: [
        "ملف Excel بتخطيط قالب MIDP / TIDP، مع ورقة ربط البرنامج (النشاط ← الحاويات)",
        "ملف CSV يتضمن النشاط لكل حاوية",
        "قائمة بتغييرات البرنامج بين نسختين",
      ],
      required: [
        "ملف برنامج زمني (‎.xer أو ‎.xml أو ‎.csv أو ‎.txt أو ‎.xlsx) يحوي أسماء الأنشطة وتواريخها",
      ],
      tips: [
        "لا يمكن للأنشطة غير المؤرخة أن تحدد تواريخ الحاويات؛ صحّحها في البرنامج أو أدخل التواريخ يدويًا.",
      ],
    },
  },
];
