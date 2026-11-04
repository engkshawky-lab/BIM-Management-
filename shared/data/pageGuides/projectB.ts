import type { PageGuide } from "./types";

// Page guides for the project pages from "Model validation" to "Project settings" (nav.ts order).

export const GUIDES_PROJECT_B: PageGuide[] = [
  {
    key: "p.validation",
    what: "Checks IFC models and COBie workbooks stored in the project Files. Each check gives a PASS, PASS with warnings, FAIL or ERROR result and a score, measured against generic rules plus the project's LOIN rows and uploaded IDS files.",
    steps: [
      "Upload an .ifc model or a COBie .xlsx (file name containing \"COBie\") in Files; if the list is empty, use 'Go to Files'.",
      "Check the 'Requirement sources' card: LOIN rows with IFC classes and properties, and uploaded .ids files, become extra checks.",
      "Click 'Validate' next to a file to run the checks again (new versions are checked automatically).",
      "Click 'Report' to open the result: summary figures, each check, LOIN & IDS requirements and the findings list.",
      "In the report, click '⬇ CSV' to export the findings, or 'Raise issues for errors' to create one issue per error.",
    ],
    outputs: [
      "Validation report with status (PASS / PASS with warnings / FAIL / ERROR) and score per file version",
      "Findings CSV export",
      "Error issues in Issues (BCF), linked to the file and the validation report",
    ],
    required: [
      "An IFC model (.ifc) or COBie workbook (.xlsx with \"COBie\" in the name) uploaded to Files",
    ],
    tips: [
      "A failing version cannot be shared until it is fixed; managers can override with a reason.",
      "A result marked \"re-run\" was made for an older version of the file.",
      "Validating and raising issues need the editor role or higher.",
    ],
    ar: {
      what: "يفحص نماذج IFC ومصنفات COBie المحفوظة في ملفات المشروع. يعطي كل فحص نتيجة PASS أو PASS with warnings أو FAIL أو ERROR مع درجة، وفق قواعد عامة إضافة إلى صفوف LOIN في المشروع وملفات IDS المرفوعة.",
      steps: [
        "ارفع نموذج ‎.ifc أو ملف COBie بصيغة ‎.xlsx (يحتوي اسمه على \"COBie\") في الملفات؛ إذا كانت القائمة فارغة فاستخدم «الانتقال إلى الملفات».",
        "راجع بطاقة «مصادر المتطلبات»: صفوف LOIN التي تحتوي على فئات وخصائص IFC، وملفات ‎.ids المرفوعة، تصبح فحوصات إضافية.",
        "انقر «تحقّق» بجانب الملف لإعادة تشغيل الفحوصات (تُفحص النسخ الجديدة تلقائياً).",
        "انقر «التقرير» لفتح النتيجة: الأرقام الموجزة، وكل فحص، ومتطلبات LOIN وIDS، وقائمة النتائج.",
        "في التقرير، انقر «⬇ CSV» لتصدير النتائج، أو «إنشاء ملاحظات للأخطاء» لإنشاء ملاحظة لكل خطأ.",
      ],
      outputs: [
        "تقرير تحقق يتضمن الحالة (PASS / PASS with warnings / FAIL / ERROR) والدرجة لكل نسخة ملف",
        "تصدير النتائج بصيغة CSV",
        "ملاحظات أخطاء في الملاحظات (BCF)، مرتبطة بالملف وبتقرير التحقق",
      ],
      required: [
        "نموذج IFC ‏(‎.ifc) أو مصنف COBie ‏(‎.xlsx يحتوي اسمه على \"COBie\") مرفوع في الملفات",
      ],
      tips: [
        "لا يمكن مشاركة نسخة فاشلة حتى تُصحَّح؛ ويمكن للمديرين التجاوز مع ذكر السبب.",
        "النتيجة الموسومة بـ \"re-run\" صدرت لنسخة أقدم من الملف.",
        "يتطلب التحقق وإنشاء الملاحظات دور محرّر أو أعلى.",
      ],
    },
  },
  {
    key: "p.reviews",
    what: "Graded QA/QC checklists for discipline models before information is shared (ISO 19650-2 §5.6.3). Each check is graded A–D or N/A, weighted by priority, and the review gets a score and an overall grade.",
    steps: [
      "Under 'New review', enter the model / review title, choose the discipline, and optionally a task team and milestone / stage.",
      "Click 'Start review' to open the checklist for that discipline.",
      "Grade every check A, B, C, D or N/A and add a 'Comment / evidence' where useful; changes save automatically.",
      "Click 'Raise issues for C/D' to create an issue for each check graded C or D.",
      "Click 'Complete review' once every check is graded; use 'Reopen' to make further changes.",
      "Click '⬇ CSV' to export the checklist with grades and comments.",
    ],
    outputs: [
      "Numbered review (QA-001, QA-002…) with weighted score and grade A–D",
      "Checklist CSV export",
      "Issues for checks graded C or D, assigned to the reviewed task team",
    ],
    required: [
      "Review title (must not be empty)",
      "Discipline (one of the listed disciplines)",
      "A grade for every check before 'Complete review' is enabled (use N/A where not applicable)",
    ],
    tips: [
      "A critical check graded D caps the whole review at D.",
      "Grades: A from 90%, B from 75%, C from 50%, otherwise D.",
      "Starting and grading need the editor role; only managers can delete a review.",
    ],
    ar: {
      what: "قوائم فحص QA/QC مُقيَّمة لنماذج التخصصات قبل مشاركة المعلومات (ISO 19650-2 §5.6.3). يُقيَّم كل فحص من A إلى D أو N/A، ويُرجَّح حسب الأولوية، وتحصل المراجعة على درجة وتقدير إجمالي.",
      steps: [
        "تحت «مراجعة جديدة»، أدخل عنوان النموذج / المراجعة، واختر التخصص، ويمكنك اختيار فريق مهمة و«المعلم / المرحلة».",
        "انقر «بدء المراجعة» لفتح قائمة الفحص الخاصة بهذا التخصص.",
        "قيّم كل فحص بـ A أو B أو C أو D أو N/A وأضف «تعليق / دليل» عند الحاجة؛ تُحفظ التغييرات تلقائياً.",
        "انقر «إنشاء ملاحظات لـ C/D» لإنشاء ملاحظة لكل فحص مُقيَّم بـ C أو D.",
        "انقر «إكمال المراجعة» بعد تقييم جميع الفحوصات؛ واستخدم «إعادة فتح» لإجراء تغييرات أخرى.",
        "انقر «⬇ CSV» لتصدير قائمة الفحص مع التقييمات والتعليقات.",
      ],
      outputs: [
        "مراجعة مرقّمة (QA-001، QA-002…) بدرجة مرجّحة وتقدير من A إلى D",
        "تصدير قائمة الفحص بصيغة CSV",
        "ملاحظات للفحوصات المُقيَّمة بـ C أو D، مُسندة إلى فريق المهمة الذي تمت مراجعته",
      ],
      required: [
        "عنوان المراجعة (يجب ألا يكون فارغاً)",
        "التخصص (أحد التخصصات المدرجة)",
        "تقييم لكل فحص قبل تفعيل «إكمال المراجعة» (استخدم N/A عند عدم الانطباق)",
      ],
      tips: [
        "إذا قُيِّم فحص حرج بـ D، فإن تقدير المراجعة كلها يُحدّ عند D.",
        "التقديرات: A من 90%، وB من 75%، وC من 50%، وإلا فـ D.",
        "يتطلب بدء المراجعة والتقييم دور محرّر؛ ولا يحذف المراجعة إلا المديرون.",
      ],
    },
  },
  {
    key: "p.issues",
    what: "The project issue register for issues, clashes, RFIs and comments. Issues can be raised by hand, from validation reports, QA/QC reviews and clash reports, and exchanged with other tools as BCF.",
    steps: [
      "Click '+ Issue', enter a title, and optionally a description, type, priority, due date, assignee and task team, then click 'Raise issue'.",
      "Use the search box, the status and type filters and 'Assigned to me' to find issues.",
      "Click an issue to open it, change its status, priority, assignee, due date, type or task team, and reply under 'Discussion'.",
      "Click '⬇ BCF' to download all issues as a BCF file, or '⬆ Import BCF' to load a .bcf / .bcfzip file.",
      "When open clashes exist, click '✨ AI triage clashes' to review suggested changes and apply the ones you accept.",
      "Click '⬇ CSV' to export the filtered list.",
    ],
    outputs: [
      "Numbered issue records with status history and comments",
      "BCF export (.bcfzip)",
      "CSV export of the filtered issue list",
      "Notifications to the assignee and to the issue creator on status changes",
    ],
    required: [
      "Title (must not be empty)",
      "For import: a .bcf, .bcfzip or .zip BCF file",
    ],
    tips: [
      "Viewers can raise issues and update the ones they raised or are assigned to.",
      "Importing BCF and AI triage need the editor role; importing the same BCF again updates existing issues instead of duplicating them.",
      "Overdue issues are highlighted and counted next to the filters.",
    ],
    ar: {
      what: "سجل ملاحظات المشروع للملاحظات والتعارضات وطلبات المعلومات (RFI) والتعليقات. يمكن إنشاء الملاحظات يدوياً، أو من تقارير التحقق ومراجعات QA/QC وتقارير التعارض، وتبادلها مع أدوات أخرى بصيغة BCF.",
      steps: [
        "انقر «+ ملاحظة»، وأدخل العنوان، ويمكنك إضافة الوصف والنوع والأولوية وتاريخ الاستحقاق والمُكلَّف وفريق المهمة، ثم انقر «إنشاء ملاحظة».",
        "استخدم مربع البحث ومرشحات الحالة والنوع و«المُسندة إليّ» للعثور على الملاحظات.",
        "انقر ملاحظة لفتحها، وغيّر حالتها أو أولويتها أو المُكلَّف أو تاريخ الاستحقاق أو النوع أو فريق المهمة، وردّ تحت «النقاش».",
        "انقر «⬇ BCF» لتنزيل جميع الملاحظات كملف BCF، أو «⬆ استيراد BCF» لتحميل ملف ‎.bcf / ‎.bcfzip.",
        "عند وجود تعارضات مفتوحة، انقر «✨ فرز التعارضات بالذكاء الاصطناعي» لمراجعة التغييرات المقترحة وتطبيق ما تقبله.",
        "انقر «⬇ CSV» لتصدير القائمة بعد التصفية.",
      ],
      outputs: [
        "سجلات ملاحظات مرقّمة مع سجل الحالات والتعليقات",
        "تصدير BCF ‏(‎.bcfzip)",
        "تصدير CSV لقائمة الملاحظات بعد التصفية",
        "إشعارات للمُكلَّف ولمنشئ الملاحظة عند تغيّر الحالة",
      ],
      required: [
        "العنوان (يجب ألا يكون فارغاً)",
        "للاستيراد: ملف BCF بصيغة ‎.bcf أو ‎.bcfzip أو ‎.zip",
      ],
      tips: [
        "يمكن للمُطّلعين إنشاء ملاحظات وتحديث ما أنشؤوه أو ما أُسند إليهم.",
        "يتطلب استيراد BCF والفرز بالذكاء الاصطناعي دور محرّر؛ وإعادة استيراد ملف BCF نفسه تحدّث الملاحظات الموجودة بدلاً من تكرارها.",
        "تُبرز الملاحظات المتأخرة ويظهر عددها بجانب المرشحات.",
      ],
    },
  },
  {
    key: "p.clash",
    what: "A clash detection matrix between the project's task teams. Each cell defines a clash test (type, tolerance, priority, frequency, search sets), and clash reports from Navisworks, Solibri or Revizto can be imported as Clash issues.",
    steps: [
      "Make sure task teams exist (Delivery plan → Task teams); the matrix lists them in rows and columns.",
      "Click a cell ('+') to define the test for that pair of teams.",
      "Set 'Type', 'Tolerance (mm)', 'Priority', 'Frequency', 'Test code', search sets for side A and B and 'Notes / rules', then click 'Save'.",
      "Click '⬆ Import clash report', choose a CSV file or paste the report, set 'Test name', 'Assign to', 'Responsible task team' and grouping, then click 'Import'.",
      "Click '⬇ Clash tests CSV' to export the test definitions.",
    ],
    outputs: [
      "Clash test definitions per task-team pair",
      "Clash tests CSV export",
      "Clash issues in Issues (BCF), grouped by grid location or one per clash, with a notification to the assignee",
    ],
    required: [
      "At least one task team in the delivery plan",
      "For import: a clash report with a header row and at least one clash row (CSV/TSV)",
    ],
    tips: [
      "Resolved and approved clashes in the report are skipped.",
      "Defining tests and importing reports need the editor role.",
    ],
    ar: {
      what: "مصفوفة لكشف التعارضات بين فرق المهام في المشروع. تحدد كل خلية اختبار تعارض (النوع، والتفاوت، والأولوية، والتكرار، ومجموعات البحث)، ويمكن استيراد تقارير التعارض من Navisworks أو Solibri أو Revizto كملاحظات من نوع Clash.",
      steps: [
        "تأكد من وجود فرق مهام (خطة التسليم ← فرق المهام)؛ إذ تعرضها المصفوفة في الصفوف والأعمدة.",
        "انقر خلية («+») لتعريف الاختبار لهذا الزوج من الفرق.",
        "حدّد «النوع» و«التفاوت المسموح (مم)» و«الأولوية» و«التكرار» و«رمز الاختبار» ومجموعات البحث للجانبين A وB و«ملاحظات / قواعد»، ثم انقر «حفظ».",
        "انقر «⬆ استيراد تقرير التعارضات»، واختر ملف CSV أو الصق التقرير، وحدّد «اسم الاختبار» و«إسناد إلى» و«فريق المهمة المسؤول» والتجميع، ثم انقر «استيراد».",
        "انقر «⬇ اختبارات التعارض CSV» لتصدير تعريفات الاختبارات.",
      ],
      outputs: [
        "تعريفات اختبارات التعارض لكل زوج من فرق المهام",
        "تصدير اختبارات التعارض بصيغة CSV",
        "ملاحظات تعارض في الملاحظات (BCF)، مجمّعة حسب موقع الشبكة أو واحدة لكل تعارض، مع إشعار للمُكلَّف",
      ],
      required: [
        "فريق مهمة واحد على الأقل في خطة التسليم",
        "للاستيراد: تقرير تعارضات يحتوي على صف عناوين وصف تعارض واحد على الأقل (CSV/TSV)",
      ],
      tips: [
        "تُتجاهل التعارضات المحلولة والمعتمدة في التقرير.",
        "يتطلب تعريف الاختبارات واستيراد التقارير دور محرّر.",
      ],
    },
  },
  {
    key: "p.4d",
    what: "Links programme activities to an IFC model by storey and IFC class. Move through time to compare what should be built (planned) with what has been built (actual), and see elements no activity covers.",
    steps: [
      "Under 'Model', choose an IFC file from the project files; the portal reads its elements by storey and class.",
      "Click '+ Activity', or 'Paste from programme' and then 'Add rows', to add activities with code, name, start and finish dates.",
      "For each activity, add storeys and IFC classes (none means all), and fill actual start and finish as work progresses.",
      "Click 'Save' to store the plan.",
      "Switch between 'Planned' and 'Actual' and move the date or timeline slider to see progress in the storey × class grid.",
      "Click '⬇ CSV' to export the activities, or 'Refresh from latest version' after the model is updated.",
    ],
    outputs: [
      "Saved 4D plan linked to the model version",
      "Planned and actual percent complete for any date",
      "Warnings for elements not covered by any activity and for overlapping activities",
      "Activities CSV export",
    ],
    required: [
      "An IFC file uploaded to Files and chosen under 'Model'",
      "Activity name for every activity (must not be empty)",
      "Dates in YYYY-MM-DD format",
    ],
    tips: [
      "Pasted rows use the columns Code, Activity, Start, Finish, Storeys, Classes; separate storeys and classes with \";\".",
      "Choosing the model and editing activities need the editor role.",
    ],
    ar: {
      what: "يربط أنشطة البرنامج الزمني بنموذج IFC حسب الطابق وفئة IFC. تنقّل عبر الزمن لمقارنة ما يجب بناؤه (المخطط) بما تم بناؤه (الفعلي)، واعرض العناصر التي لا يغطيها أي نشاط.",
      steps: [
        "تحت «النموذج»، اختر ملف IFC من ملفات المشروع؛ تقرأ البوابة عناصره حسب الطابق والفئة.",
        "انقر «+ نشاط»، أو «لصق من البرنامج الزمني» ثم «إضافة صفوف»، لإضافة أنشطة بالرمز والاسم وتاريخي البداية والنهاية.",
        "أضف لكل نشاط الطوابق وفئات IFC (عدم التحديد يعني الكل)، واملأ تاريخي البداية والنهاية الفعليين مع تقدم العمل.",
        "انقر «حفظ» لتخزين الخطة.",
        "بدّل بين «مخطط له» و«الفعلي» وحرّك التاريخ أو شريط الجدول الزمني لرؤية التقدم في شبكة الطابق × الفئة.",
        "انقر «⬇ CSV» لتصدير الأنشطة، أو «تحديث من أحدث نسخة» بعد تحديث النموذج.",
      ],
      outputs: [
        "خطة 4D محفوظة مرتبطة بنسخة النموذج",
        "نسبة الإنجاز المخططة والفعلية لأي تاريخ",
        "تحذيرات للعناصر التي لا يغطيها أي نشاط وللأنشطة المتداخلة",
        "تصدير الأنشطة بصيغة CSV",
      ],
      required: [
        "ملف IFC مرفوع في الملفات ومختار تحت «النموذج»",
        "اسم النشاط لكل نشاط (يجب ألا يكون فارغاً)",
        "التواريخ بصيغة YYYY-MM-DD",
      ],
      tips: [
        "تستخدم الصفوف الملصقة الأعمدة Code وActivity وStart وFinish وStoreys وClasses؛ افصل الطوابق والفئات بـ \";\".",
        "يتطلب اختيار النموذج وتعديل الأنشطة دور محرّر.",
      ],
    },
  },
  {
    key: "p.tags",
    what: "Builds asset tags and checks lists of tags against the project's client standard, or against the generic location + equipment format when no client standard is applied.",
    steps: [
      "Read the note at the top to see which tag format is used (client standard or generic).",
      "Under 'Build a tag', fill the 'Location tag' and 'Equipment tag' parts; suggested codes appear where the standard lists them.",
      "Check the result: the page shows the tag, any errors, or 'Valid tag', then click 'Copy tag'.",
      "Under 'Check a list of tags', paste one tag per line (for example a COBie TagNumber column).",
      "Review the valid and invalid counts and duplicate warning, and click '⬇ CSV' to export the results.",
    ],
    outputs: [
      "A tag string copied to the clipboard",
      "Tag check results CSV (tag and result for each line)",
    ],
    required: [],
    tips: [
      "A manager applies the client standard in Project settings under 'Client standard'.",
      "Full tags and equipment-only tags are both accepted in the list check.",
    ],
    ar: {
      what: "ينشئ رموز ترميز الأصول ويفحص قوائم الوسوم وفق معيار العميل في المشروع، أو وفق صيغة الموقع + المعدّة العامة عند عدم تطبيق معيار عميل.",
      steps: [
        "اقرأ الملاحظة في أعلى الصفحة لمعرفة صيغة الوسم المستخدمة (معيار العميل أو الصيغة العامة).",
        "تحت «إنشاء وسم»، املأ أجزاء «رمز الموقع» و«رمز المعدّة»؛ تظهر رموز مقترحة حيث يوفّرها المعيار.",
        "تحقق من النتيجة: تعرض الصفحة الوسم وأي أخطاء أو 'Valid tag'، ثم انقر «نسخ الوسم».",
        "تحت «فحص قائمة وسوم»، الصق وسماً واحداً في كل سطر (مثلاً عمود TagNumber من COBie).",
        "راجع عدد الوسوم الصحيحة وغير الصحيحة وتحذير التكرار، وانقر «⬇ CSV» لتصدير النتائج.",
      ],
      outputs: [
        "نص وسم منسوخ إلى الحافظة",
        "ملف CSV بنتائج فحص الوسوم (الوسم والنتيجة لكل سطر)",
      ],
      required: [],
      tips: [
        "يطبّق المدير معيار العميل في إعدادات المشروع تحت «معيار العميل».",
        "يقبل فحص القائمة الوسوم الكاملة ووسوم المعدّة فقط.",
      ],
    },
  },
  {
    key: "p.quality",
    what: "Runs automated checks against ISO 19650-2 and ISO/IEC 42001 expectations: required document set, document completeness, placeholders, naming, plan dates and dependencies. Shows an overall score, a delivery plan score and daily trends.",
    steps: [
      "Open the page; the checks run automatically and show the overall and delivery plan scores with error, warning and suggestion counts.",
      "Review the 'Document set' and 'Delivery plan' findings; use 'Open planner' to fix plan issues.",
      "Under 'Documents', click a row to see its findings, or 'Open →' to edit the document.",
      "Click '↻ Re-run' after making changes.",
      "Click '📦 Audit evidence pack' or '⬇ CSV' to download the results, and use 'Trends' to follow scores over time.",
    ],
    outputs: [
      "Overall quality score and delivery plan score",
      "Quality report CSV (source, severity, area, reference, finding, clause)",
      "Audit evidence pack (.zip): every document in Word, the quality report and all registers, indexed by ISO clause",
      "Trends CSV with one snapshot per day",
    ],
    required: [],
    tips: [
      "Archived documents are not checked.",
      "Trends build up as the portal records one snapshot each day.",
    ],
    ar: {
      what: "يشغّل فحوصات آلية وفق متطلبات ISO 19650-2 وISO/IEC 42001: مجموعة المستندات المطلوبة، واكتمال المستندات، والنصوص المؤقتة، والتسمية، وتواريخ الخطة واعتمادياتها. ويعرض درجة إجمالية ودرجة لخطة التسليم واتجاهات يومية.",
      steps: [
        "افتح الصفحة؛ تعمل الفحوصات تلقائياً وتعرض الدرجة الإجمالية ودرجة خطة التسليم مع أعداد الأخطاء والتحذيرات والاقتراحات.",
        "راجع نتائج «مجموعة المستندات» و«خطة التسليم»؛ واستخدم 'Open planner' لإصلاح مشكلات الخطة.",
        "تحت «المستندات»، انقر صفاً لرؤية نتائجه، أو «فتح →» لتحرير المستند.",
        "انقر «↻ إعادة التشغيل» بعد إجراء التغييرات.",
        "انقر «📦 حزمة أدلة التدقيق» أو «⬇ CSV» لتنزيل النتائج، واستخدم «الاتجاهات» لمتابعة الدرجات عبر الزمن.",
      ],
      outputs: [
        "درجة الجودة الإجمالية ودرجة خطة التسليم",
        "تقرير الجودة بصيغة CSV (المصدر، الخطورة، المجال، المرجع، النتيجة، البند)",
        "حزمة أدلة التدقيق (‎.zip): كل مستند بصيغة Word، وتقرير الجودة، وجميع السجلات، مفهرسة حسب بنود ISO",
        "ملف CSV للاتجاهات بلقطة واحدة لكل يوم",
      ],
      required: [],
      tips: [
        "لا تُفحص المستندات المؤرشفة.",
        "تتكوّن الاتجاهات تدريجياً مع تسجيل البوابة لقطة واحدة كل يوم.",
      ],
    },
  },
  {
    key: "p.trace",
    what: "Traces each requirement from the EIR/AIR to the BEP response and the MIDP containers that deliver it. Coverage (Delivered, Planned, Response only, Not addressed) updates automatically as containers are shared or published.",
    steps: [
      "Click '+ Paste requirements' to paste one requirement per line (or Ref, Requirement, Category from Excel), or '✨ Extract from document text' to let the AI split pasted text.",
      "Set the 'Source' (for example EIR), then click 'Preview'.",
      "Check the preview and click 'Add … requirements'.",
      "For each requirement, write the BEP response and use '+ link container…' to link MIDP containers.",
      "Click a coverage card to filter, and '⬇ CSV' to export the traceability matrix.",
    ],
    outputs: [
      "Requirement register with references (REQ-001…), BEP responses and linked containers",
      "Coverage status per requirement",
      "Traceability CSV export",
    ],
    required: [
      "Requirement text (pasted or extracted; 'Preview' stays disabled while the box is empty)",
    ],
    tips: [
      "Containers can only be linked once deliverables exist in the delivery plan.",
      "Adding, editing and deleting requirements need the editor role.",
    ],
    ar: {
      what: "يتتبّع كل متطلب من EIR/AIR إلى رد BEP وحاويات MIDP التي تسلّمه. تتحدث التغطية (تم التسليم، مخطط له، رد فقط، لم تتم معالجته) تلقائياً عند مشاركة الحاويات أو نشرها.",
      steps: [
        "انقر «+ لصق المتطلبات» للصق متطلب واحد في كل سطر (أو Ref وRequirement وCategory من Excel)، أو «✨ استخراج من نص المستند» ليقسّم الذكاء الاصطناعي النص الملصق.",
        "حدّد «المصدر» (مثلاً EIR)، ثم انقر «معاينة».",
        "راجع المعاينة وانقر 'Add … requirements'.",
        "اكتب لكل متطلب رد BEP واستخدم «+ ربط حاوية…» لربط حاويات MIDP.",
        "انقر بطاقة تغطية للتصفية، و«⬇ CSV» لتصدير مصفوفة التتبّع.",
      ],
      outputs: [
        "سجل متطلبات بمراجع (REQ-001…) وردود BEP وحاويات مرتبطة",
        "حالة التغطية لكل متطلب",
        "تصدير التتبّع بصيغة CSV",
      ],
      required: [
        "نص المتطلبات (ملصق أو مستخرج؛ يبقى زر «معاينة» معطلاً ما دام المربع فارغاً)",
      ],
      tips: [
        "لا يمكن ربط الحاويات إلا بعد وجود مُخرجات في خطة التسليم.",
        "تتطلب إضافة المتطلبات وتعديلها وحذفها دور محرّر.",
      ],
    },
  },
  {
    key: "p.risks",
    what: "The information delivery risk register required by ISO 19650-2 5.3.6. Each risk has a likelihood × impact score, mitigation, residual score, owner and review date, shown in a heat map of open risks.",
    steps: [
      "Click '+ Risk' to open a new risk.",
      "Enter the risk, category, owner, 'Likelihood (1–5)', 'Impact (1–5)', cause and 'Mitigation / treatment'.",
      "Optionally set residual likelihood and impact, status and 'Next review', then click 'Save'.",
      "Click a heat map cell to filter the list; click a row to edit a risk.",
      "Click '📄 Generate register document' for a controlled register document, or '⬇ CSV' to export.",
    ],
    outputs: [
      "Risk records (R01, R02…) with score and residual score",
      "Risk register document generated in Documents",
      "Risk register CSV export",
    ],
    required: [
      "Risk title (must not be empty; 'Save' stays disabled until entered)",
      "Likelihood and impact (whole numbers 1–5; default 3)",
    ],
    tips: [
      "Scores of 15 or more count as high risks.",
      "Risks past their review date are highlighted; the Risk review reminder automation can chase owners.",
      "Adding and editing need the editor role; only managers can delete a risk.",
    ],
    ar: {
      what: "سجل مخاطر تسليم المعلومات الذي يتطلبه البند 5.3.6 من ISO 19650-2. لكل خطر درجة احتمالية × أثر، وإجراء تخفيف، ودرجة متبقية، ومالك، وتاريخ مراجعة، وتُعرض المخاطر المفتوحة في خريطة حرارية.",
      steps: [
        "انقر «+ خطر» لفتح خطر جديد.",
        "أدخل الخطر والفئة والمالك و«الاحتمالية (1–5)» و«الأثر (1–5)» والسبب و«التخفيف / المعالجة».",
        "يمكنك تحديد الاحتمالية والأثر المتبقيين والحالة و«المراجعة التالية»، ثم انقر «حفظ».",
        "انقر خلية في الخريطة الحرارية لتصفية القائمة؛ وانقر صفاً لتعديل الخطر.",
        "انقر «📄 إنشاء مستند السجل» للحصول على مستند سجل خاضع للرقابة، أو «⬇ CSV» للتصدير.",
      ],
      outputs: [
        "سجلات مخاطر (R01، R02…) بالدرجة والدرجة المتبقية",
        "مستند سجل المخاطر مُنشأ في المستندات",
        "تصدير سجل المخاطر بصيغة CSV",
      ],
      required: [
        "عنوان الخطر (يجب ألا يكون فارغاً؛ يبقى زر «حفظ» معطلاً حتى إدخاله)",
        "الاحتمالية والأثر (أعداد صحيحة من 1 إلى 5؛ القيمة الافتراضية 3)",
      ],
      tips: [
        "تُعدّ الدرجات 15 فأكثر مخاطر عالية.",
        "تُبرز المخاطر التي تجاوزت تاريخ مراجعتها؛ ويمكن لأتمتة Risk review reminder متابعة المالكين.",
        "تتطلب الإضافة والتعديل دور محرّر؛ ولا يحذف الخطر إلا المديرون.",
      ],
    },
  },
  {
    key: "p.hs",
    what: "The health and safety information register (ISO 19650-6). It records hazards and residual risks so the information reaches the people who build, operate, maintain and demolish the asset.",
    steps: [
      "Click '+ H&S item'.",
      "Enter the hazard, location, 'Lifecycle phase', 'Residual risk', status and owner.",
      "Link the supporting 'Information container' from the project files.",
      "Describe the hazard, the 'Control measures' and who it is 'Shared with', then click 'Save'.",
      "Use the phase buttons to filter the list and '⬇ CSV' to export the register.",
    ],
    outputs: [
      "H&S records (HS01, HS02…) with phase, residual risk and linked information container",
      "H&S register CSV export",
      "Notification to the owner when a new item is assigned to them",
    ],
    required: [
      "Hazard (must not be empty; 'Save' stays disabled until entered)",
    ],
    tips: [
      "The summary counts items without linked information, so you can close the gaps.",
      "Adding and editing need the editor role; only managers can delete an item.",
    ],
    ar: {
      what: "سجل معلومات الصحة والسلامة (ISO 19650-6). يوثّق المخاطر والمخاطر المتبقية لكي تصل المعلومات إلى من يبني الأصل ويشغّله ويصونه ويهدمه.",
      steps: [
        "انقر «+ بند صحة وسلامة».",
        "أدخل الخطر والموقع و«مرحلة دورة الحياة» و«الخطر المتبقي» والحالة والمالك.",
        "اربط «حاوية المعلومات» الداعمة من ملفات المشروع.",
        "صِف الخطر و«تدابير التحكم» والجهات في «تمت المشاركة مع»، ثم انقر «حفظ».",
        "استخدم أزرار المراحل لتصفية القائمة و«⬇ CSV» لتصدير السجل.",
      ],
      outputs: [
        "سجلات صحة وسلامة (HS01، HS02…) بالمرحلة والخطر المتبقي وحاوية المعلومات المرتبطة",
        "تصدير سجل الصحة والسلامة بصيغة CSV",
        "إشعار للمالك عند إسناد بند جديد إليه",
      ],
      required: [
        "الخطر (يجب ألا يكون فارغاً؛ يبقى زر «حفظ» معطلاً حتى إدخاله)",
      ],
      tips: [
        "يعرض الملخص عدد البنود غير المرتبطة بمعلومات، لتتمكن من سد الثغرات.",
        "تتطلب الإضافة والتعديل دور محرّر؛ ولا يحذف البند إلا المديرون.",
      ],
    },
  },
  {
    key: "p.handover",
    what: "The PIM → AIM transfer checklist (ISO 19650-2 5.7–5.8, ISO 19650-3). A standard checklist is created on first use, and readiness shows the percentage of applicable items complete.",
    steps: [
      "Review the checklist items grouped by category, with their ISO clause.",
      "Set each item's status: Not started, In progress, Complete or N/A.",
      "Choose an owner and link an evidence file from the CDE; use '⬇' to download linked evidence.",
      "To add a project-specific item, choose a category, type the item and click '+ Add item'.",
      "Track 'Handover readiness' until all applicable items are complete.",
    ],
    outputs: [
      "Handover readiness percentage",
      "Checklist with owner and linked evidence file per item",
    ],
    required: [
      "Item title when adding an item (must not be empty)",
    ],
    tips: [
      "Items set to N/A are left out of the readiness percentage.",
      "Changing items needs the editor role.",
    ],
    ar: {
      what: "قائمة فحص نقل PIM ← AIM ‏(ISO 19650-2 5.7–5.8، ISO 19650-3). تُنشأ قائمة فحص قياسية عند أول استخدام، وتُظهر الجاهزية نسبة البنود المنطبقة المكتملة.",
      steps: [
        "راجع بنود قائمة الفحص المجمّعة حسب الفئة مع بند ISO لكل منها.",
        "حدّد حالة كل بند: لم يبدأ، أو قيد التنفيذ، أو مكتمل، أو لا ينطبق.",
        "اختر مالكاً واربط ملف دليل من CDE؛ واستخدم «⬇» لتنزيل الدليل المرتبط.",
        "لإضافة بند خاص بالمشروع، اختر فئة واكتب البند وانقر «+ إضافة بند».",
        "تابع «جاهزية التسليم النهائي» حتى تكتمل جميع البنود المنطبقة.",
      ],
      outputs: [
        "نسبة جاهزية التسليم النهائي",
        "قائمة فحص بمالك وملف دليل مرتبط لكل بند",
      ],
      required: [
        "عنوان البند عند إضافة بند (يجب ألا يكون فارغاً)",
      ],
      tips: [
        "البنود المحددة بـ «لا ينطبق» لا تدخل في نسبة الجاهزية.",
        "يتطلب تغيير البنود دور محرّر.",
      ],
    },
  },
  {
    key: "p.meetings",
    what: "Kick-off, coordination, progress and model review meetings with standing agendas. Open actions carry forward to the next meeting of the same type, and minutes and the progress report are generated as controlled documents.",
    steps: [
      "Under 'New meeting', choose the meeting type, enter a title and date, then click 'Create with standard agenda'.",
      "In the meeting, set 'Date & time', 'Location / link' and attendees (add external attendees by typing a name and pressing Enter).",
      "Write 'Minutes / decisions' for each agenda item; use '+ Agenda item' to add more.",
      "Add actions with '+ Action', each with an owner, due date and status; changes save automatically.",
      "Set the status (Planned, Held, Minutes issued) and click '📄 Generate minutes'.",
      "On the meetings list, click '📊 Generate progress report' for a project progress report.",
    ],
    outputs: [
      "Meeting records with agenda, minutes and actions",
      "Minutes document generated in Documents (WIP, P01.01)",
      "Progress report document generated in Documents (WIP, P01.01)",
      "Open actions carried forward to the next meeting of the same type",
    ],
    required: [
      "Meeting title (must not be empty)",
      "Meeting type (one of BIM kick-off, BIM coordination, BIM progress, Information model review)",
    ],
    tips: [
      "The 'Open actions' list shows unfinished actions from the latest meeting of each type, with overdue ones highlighted.",
      "Creating and editing meetings needs the editor role; only managers can delete a meeting.",
    ],
    ar: {
      what: "اجتماعات الانطلاق والتنسيق والتقدم ومراجعة النماذج بجداول أعمال ثابتة. تنتقل الإجراءات المفتوحة إلى الاجتماع التالي من النوع نفسه، ويُنشأ المحضر وتقرير التقدم كمستندات خاضعة للرقابة.",
      steps: [
        "تحت «اجتماع جديد»، اختر نوع الاجتماع وأدخل العنوان والتاريخ، ثم انقر «إنشاء بجدول أعمال قياسي».",
        "في الاجتماع، حدّد «التاريخ والوقت» و«الموقع / الرابط» و«الحضور» (أضف الحضور الخارجيين بكتابة الاسم والضغط على Enter).",
        "اكتب «المحضر / القرارات» لكل بند من جدول الأعمال؛ واستخدم «+ بند جدول أعمال» لإضافة المزيد.",
        "أضف الإجراءات بـ «+ إجراء»، ولكل منها مالك وتاريخ استحقاق وحالة؛ تُحفظ التغييرات تلقائياً.",
        "حدّد الحالة (مخطط له، مُنعقد، تم إصدار المحضر) وانقر «📄 إنشاء المحضر».",
        "في قائمة الاجتماعات، انقر «📊 إنشاء تقرير التقدم» للحصول على تقرير تقدم المشروع.",
      ],
      outputs: [
        "سجلات اجتماعات بجدول الأعمال والمحضر والإجراءات",
        "مستند محضر مُنشأ في المستندات (WIP، P01.01)",
        "مستند تقرير تقدم مُنشأ في المستندات (WIP، P01.01)",
        "إجراءات مفتوحة تنتقل إلى الاجتماع التالي من النوع نفسه",
      ],
      required: [
        "عنوان الاجتماع (يجب ألا يكون فارغاً)",
        "نوع الاجتماع (أحد الأنواع: BIM kick-off أو BIM coordination أو BIM progress أو Information model review)",
      ],
      tips: [
        "تعرض قائمة 'Open actions' الإجراءات غير المنتهية من آخر اجتماع من كل نوع، مع إبراز المتأخرة منها.",
        "يتطلب إنشاء الاجتماعات وتعديلها دور محرّر؛ ولا يحذف الاجتماع إلا المديرون.",
      ],
    },
  },
  {
    key: "p.automations",
    what: "Scheduled background jobs that post notifications (and emails, if configured) to the right people: Overdue chaser, Quality review and Risk review reminder. Every run is logged.",
    steps: [
      "Read each automation card to see what it does.",
      "Tick the checkbox to switch an automation on or off.",
      "Choose 'Daily' or 'Weekly' as the frequency.",
      "Click 'Run now' to run it immediately.",
      "Check 'Run history' for the date, trigger and summary of each run.",
    ],
    outputs: [
      "Notifications (and emails, if configured) to the people concerned",
      "Run history entry with a summary for each run",
    ],
    required: [],
    tips: [
      "Only managers can switch automations on or off, change frequency or click 'Run now'.",
      "Quality review sends managers the score, the change since the last run and the top problems.",
    ],
    ar: {
      what: "مهام مجدولة تعمل في الخلفية وترسل إشعارات (ورسائل بريد إلكتروني إن كانت مُعدّة) إلى الأشخاص المعنيين: Overdue chaser وQuality review وRisk review reminder. ويُسجَّل كل تشغيل.",
      steps: [
        "اقرأ بطاقة كل أتمتة لمعرفة ما تقوم به.",
        "حدّد مربع الاختيار لتشغيل الأتمتة أو إيقافها.",
        "اختر «يومي» أو «أسبوعي» للتكرار.",
        "انقر 'Run now' لتشغيلها فوراً.",
        "راجع «سجل التشغيل» لمعرفة تاريخ كل تشغيل ومُشغّله وملخصه.",
      ],
      outputs: [
        "إشعارات (ورسائل بريد إلكتروني إن كانت مُعدّة) للأشخاص المعنيين",
        "قيد في سجل التشغيل مع ملخص لكل تشغيل",
      ],
      required: [],
      tips: [
        "لا يستطيع تشغيل الأتمتة أو إيقافها أو تغيير تكرارها أو النقر على 'Run now' إلا المديرون.",
        "ترسل Quality review إلى المديرين الدرجة والتغيّر منذ آخر تشغيل وأهم المشكلات.",
      ],
    },
  },
  {
    key: "p.training",
    what: "A project manager assigns courses to team members and tracks completion, which comes from lesson progress. Supports capability and competence evidence (ISO 19650-2 5.3.3 / 5.5.2, ISO/IEC 42001 7.2).",
    steps: [
      "Under 'Assign training', choose a 'Course'.",
      "Tick one or more 'Team members'.",
      "Optionally set a 'Due date', then click 'Assign'.",
      "Follow progress per member in the table and the 'Completion' card; overdue assignments are highlighted.",
      "Click '⬇ CSV' to export, or 'Remove' to cancel an assignment.",
    ],
    outputs: [
      "Course assignments with due date and progress",
      "Notification to each assigned member",
      "Training CSV export",
    ],
    required: [
      "Course",
      "At least one team member ('Assign' stays disabled until one is ticked)",
      "Due date, if given, in YYYY-MM-DD format",
    ],
    tips: [
      "Only managers can assign or remove training; members find their assigned courses in Learn.",
    ],
    ar: {
      what: "يُسند مدير المشروع دورات إلى أعضاء الفريق ويتابع إكمالها، المحسوب من التقدم في الدروس. يدعم أدلة القدرة والكفاءة (ISO 19650-2 5.3.3 / 5.5.2، ISO/IEC 42001 7.2).",
      steps: [
        "تحت «إسناد تدريب»، اختر «الدورة».",
        "حدّد عضواً أو أكثر من «أعضاء الفريق».",
        "يمكنك تحديد «تاريخ الاستحقاق»، ثم انقر «إسناد».",
        "تابع التقدم لكل عضو في الجدول وبطاقة «الإكمال»؛ وتُبرز الإسنادات المتأخرة.",
        "انقر «⬇ CSV» للتصدير، أو «إزالة» لإلغاء إسناد.",
      ],
      outputs: [
        "إسنادات دورات بتاريخ الاستحقاق والتقدم",
        "إشعار لكل عضو تم الإسناد إليه",
        "تصدير التدريب بصيغة CSV",
      ],
      required: [
        "الدورة",
        "عضو فريق واحد على الأقل (يبقى زر «إسناد» معطلاً حتى تحديد عضو)",
        "تاريخ الاستحقاق، إن أُدخل، بصيغة YYYY-MM-DD",
      ],
      tips: [
        "لا يُسند التدريب أو يزيله إلا المديرون؛ ويجد الأعضاء الدورات المُسندة إليهم في «تعلّم».",
      ],
    },
  },
  {
    key: "p.team",
    what: "Lists the project members and pending invitations with their roles. Managers add members, change roles and remove members; anyone except the owner can leave the project.",
    steps: [
      "Under 'Add member', enter the colleague's email.",
      "Choose a role: Viewer (read & comment), Editor (create & edit) or Manager (approve, publish, manage team), then click 'Add'.",
      "Change a member's role from the role list in the table.",
      "Click 'Remove' to remove a member, 'Cancel' to cancel a pending invitation, or 'Leave' to leave the project yourself.",
    ],
    outputs: [
      "New member added, or an invitation that is accepted automatically when the person registers with that email",
      "Notification to the member when added or when their role changes",
    ],
    required: [
      "Email (valid email address)",
      "Role (viewer, editor or manager)",
    ],
    tips: [
      "Only managers see the 'Add member' form and can change roles or remove others.",
      "The owner's role cannot be changed and the owner cannot be removed.",
    ],
    ar: {
      what: "يعرض أعضاء المشروع والدعوات المعلّقة مع أدوارهم. يضيف المديرون الأعضاء ويغيّرون الأدوار ويزيلون الأعضاء؛ ويمكن لأي شخص عدا المالك مغادرة المشروع.",
      steps: [
        "تحت «إضافة عضو»، أدخل البريد الإلكتروني للزميل.",
        "اختر دوراً: مُطّلع (قراءة وتعليق)، أو محرّر (إنشاء وتعديل)، أو مدير (اعتماد، نشر، إدارة الفريق)، ثم انقر «إضافة».",
        "غيّر دور العضو من قائمة الأدوار في الجدول.",
        "انقر «إزالة» لإزالة عضو، أو «إلغاء» لإلغاء دعوة معلّقة، أو «مغادرة» لمغادرة المشروع بنفسك.",
      ],
      outputs: [
        "إضافة عضو جديد، أو دعوة تُقبل تلقائياً عندما يسجّل الشخص بهذا البريد الإلكتروني",
        "إشعار للعضو عند إضافته أو عند تغيير دوره",
      ],
      required: [
        "البريد الإلكتروني (عنوان بريد إلكتروني صالح)",
        "الدور (مُطّلع أو محرّر أو مدير)",
      ],
      tips: [
        "لا يرى نموذج «إضافة عضو» ولا يغيّر الأدوار أو يزيل الآخرين إلا المديرون.",
        "لا يمكن تغيير دور المالك ولا إزالته.",
      ],
    },
  },
  {
    key: "p.settings",
    what: "Edits the project details and standards in scope, and applies the client standard used for COBie checks and asset tags. Only project managers can open this page; only the owner can delete the project.",
    steps: [
      "Edit the project name, code, appointing party, location, current stage and description.",
      "Tick the standards in scope (ISO 19650, ISO/IEC 42001), then click 'Save changes'.",
      "Under 'Client standard', choose a standard or 'None (generic checks)', choose a stage or 'Latest stage', then click 'Apply'.",
      "Owner only: click 'Delete project' and type the project code to confirm.",
    ],
    outputs: [
      "Updated project details",
      "Client standard applied to COBie checks and asset tags",
    ],
    required: [
      "Project name (at least 2 characters)",
      "Project code (2–6 letters or digits)",
      "At least one standard in scope ('Save changes' stays disabled otherwise)",
      "To delete: the exact project code typed in the confirmation",
    ],
    tips: [
      "The project code is the first field of every container name.",
      "Deleting a project permanently removes all its documents, files, comments and history.",
      "Client standards are managed under Resources › Client standards.",
    ],
    ar: {
      what: "يعدّل تفاصيل المشروع والمعايير ضمن النطاق، ويطبّق معيار العميل المستخدم في فحوصات COBie وترميز الأصول. لا يفتح هذه الصفحة إلا مديرو المشروع؛ ولا يحذف المشروع إلا المالك.",
      steps: [
        "عدّل اسم المشروع ورمزه والجهة المُعيِّنة والموقع والمرحلة الحالية والوصف.",
        "حدّد المعايير ضمن النطاق (ISO 19650، ISO/IEC 42001)، ثم انقر «حفظ التغييرات».",
        "تحت «معيار العميل»، اختر معياراً أو «لا شيء (فحوصات عامة)»، واختر مرحلة أو «أحدث مرحلة»، ثم انقر «تطبيق».",
        "للمالك فقط: انقر «حذف المشروع» واكتب رمز المشروع للتأكيد.",
      ],
      outputs: [
        "تفاصيل مشروع محدّثة",
        "معيار عميل مطبّق على فحوصات COBie وترميز الأصول",
      ],
      required: [
        "اسم المشروع (حرفان على الأقل)",
        "رمز المشروع (من 2 إلى 6 أحرف أو أرقام)",
        "معيار واحد على الأقل ضمن النطاق (وإلا يبقى زر «حفظ التغييرات» معطلاً)",
        "للحذف: كتابة رمز المشروع بدقة في نافذة التأكيد",
      ],
      tips: [
        "رمز المشروع هو الحقل الأول في اسم كل حاوية.",
        "حذف المشروع يزيل نهائياً جميع مستنداته وملفاته وتعليقاته وسجله.",
        "تُدار معايير العميل من الموارد › معايير العميل.",
      ],
    },
  },
];
