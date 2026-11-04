import type { PageGuide } from "./types";

// Guides for the project pages: overview, appointment & planning, and the CDE (documents and files).
export const GUIDES_PROJECT_A: PageGuide[] = [
  {
    key: "p.summary",
    what: "The project's home page. It shows the project details, the team and the latest activity, with shortcuts to the main work areas.",
    steps: [
      "Check the About card: description, Code, Appointing party, Location, Stage and Created date.",
      "Use the shortcut buttons \"Documents\", \"Files\", \"Delivery\", \"Model & coordination\" and \"Quality\" to jump to those areas.",
      "Review the Team card to see each member and their role (viewer, editor, manager or owner).",
      "Click \"Manage\" on the Team card to add or remove members.",
      "Read Recent activity for the six latest changes and click an entry to open the item it refers to.",
    ],
    outputs: [],
    required: [],
    tips: [
      "Project details are changed in the project settings, which only managers can open.",
    ],
    ar: {
      what: "الصفحة الرئيسية للمشروع. تعرض بيانات المشروع والفريق وآخر الأنشطة، مع اختصارات إلى مجالات العمل الرئيسية.",
      steps: [
        "راجع بطاقة \"حول\": الوصف و\"الرمز\" و\"الطرف المُعيِّن\" و\"الموقع\" و\"المرحلة\" و\"تاريخ الإنشاء\".",
        "استخدم أزرار الاختصار \"المستندات\" و\"الملفات\" و\"التسليم\" و\"النموذج والتنسيق\" و\"الجودة\" للانتقال إلى تلك المجالات.",
        "راجع بطاقة \"الفريق\" لمعرفة كل عضو ودوره (viewer أو editor أو manager أو owner).",
        "انقر \"إدارة\" في بطاقة الفريق لإضافة الأعضاء أو إزالتهم.",
        "اطّلع على \"النشاط الأخير\" لمعرفة آخر ستة تغييرات، وانقر أي عنصر لفتح ما يشير إليه.",
      ],
      outputs: [],
      required: [],
      tips: [
        "تُعدَّل بيانات المشروع من إعدادات المشروع، ولا يفتحها إلا المديرون.",
      ],
    },
  },
  {
    key: "p.activity",
    what: "A log of what happened in the project: uploads, state changes, generated documents, approvals and other edits, newest first.",
    steps: [
      "Open the page to see the latest 100 entries, newest at the top.",
      "Read each line: who did it, what was done and when.",
      "Click an underlined summary to open the document, file or page it refers to.",
    ],
    outputs: [],
    required: [],
    tips: [
      "Only the latest 100 entries are listed.",
      "Manager overrides of failed validation are recorded here with their reason.",
    ],
    ar: {
      what: "سجل لما حدث في المشروع: عمليات الرفع وتغييرات الحالة والمستندات المُنشأة والاعتمادات وغيرها من التعديلات، الأحدث أولًا.",
      steps: [
        "افتح الصفحة لعرض آخر 100 إدخال، والأحدث في الأعلى.",
        "اقرأ كل سطر: من قام بالإجراء، وما الذي تم، ومتى.",
        "انقر الملخص المُسطَّر لفتح المستند أو الملف أو الصفحة التي يشير إليها.",
      ],
      outputs: [],
      required: [],
      tips: [
        "تُعرض آخر 100 إدخال فقط.",
        "تُسجَّل هنا حالات تجاوز المدير لفشل التحقق مع سببها.",
      ],
    },
  },
  {
    key: "p.gates",
    what: "The stage-by-stage process for the project's standards (ISO 19650 and, if selected, ISO/IEC 42001). Track each activity, create the documents it needs and approve the gate at the end of each stage.",
    steps: [
      "Click a stage card in the process map to open that stage; the current stage opens automatically.",
      "Click an activity's status button to cycle it \"To do\" → \"In progress\" → \"Done\" (editors and managers).",
      "Click a \"+ <code>\" button in the Documents column to create the controlled document that activity needs.",
      "When every activity in the stage is Done, a manager clicks \"Approve gate\" and can add an optional approval note.",
      "Click \"Revoke\" (managers) to reopen an approved gate.",
      "Click \"Print status report\" to print all stages with their status.",
    ],
    outputs: [
      "Gate approval record (approver name, date and note)",
      "Notification to project members when a gate is approved",
      "Activity log entry",
      "Printed status report",
    ],
    required: [
      "All activities in the stage marked Done (before \"Approve gate\" can be clicked)",
    ],
    tips: [
      "Only managers can approve or revoke gates; viewers can only read.",
      "Activities of an approved stage are locked until the gate is revoked.",
    ],
    ar: {
      what: "العملية مرحلةً بمرحلة وفق معايير المشروع (ISO 19650، وISO/IEC 42001 إن كان مختارًا). تابع كل نشاط، وأنشئ المستندات التي يحتاجها، واعتمد البوابة في نهاية كل مرحلة.",
      steps: [
        "انقر بطاقة مرحلة في خريطة العملية لفتحها؛ تُفتح المرحلة الحالية تلقائيًا.",
        "انقر زر حالة النشاط لتغييره بالتتابع \"للتنفيذ\" ← \"قيد التنفيذ\" ← \"تم\" (للمحررين والمديرين).",
        "انقر زر \"+ <الرمز>\" في عمود المستندات لإنشاء المستند المضبوط الذي يحتاجه ذلك النشاط.",
        "عندما تكتمل جميع أنشطة المرحلة، ينقر المدير \"اعتماد البوابة\" ويمكنه إضافة ملاحظة اعتماد اختيارية.",
        "انقر \"إبطال\" (للمديرين) لإعادة فتح بوابة معتمدة.",
        "انقر \"طباعة تقرير الحالة\" لطباعة جميع المراحل مع حالتها.",
      ],
      outputs: [
        "سجل اعتماد البوابة (اسم المعتمِد والتاريخ والملاحظة)",
        "إشعار لأعضاء المشروع عند اعتماد بوابة",
        "إدخال في سجل النشاط",
        "تقرير حالة مطبوع",
      ],
      required: [
        "وضع جميع أنشطة المرحلة على \"تم\" (قبل تفعيل زر \"اعتماد البوابة\")",
      ],
      tips: [
        "يعتمد المديرون وحدهم البوابات أو يبطلونها؛ ويقتصر المشاهدون على القراءة.",
        "تُقفل أنشطة المرحلة المعتمدة حتى تُبطَل البوابة.",
      ],
    },
  },
  {
    key: "p.assistant",
    what: "An AI chat that answers questions from this project's records: documents, MIDP, issues, risks, reviews, meetings and requirements. Each answer lists numbered sources you can open.",
    steps: [
      "Click one of the suggested questions, or type your own in the \"Ask about this project…\" box.",
      "Press Enter or click \"Ask\" (Shift+Enter adds a new line).",
      "Read the answer and click a numbered source to open the record it came from.",
      "Ask follow-up questions in the same chat; recent turns are sent as context.",
      "Click \"New chat\" to clear the conversation and start again.",
    ],
    outputs: [
      "Answer with numbered links to the project records it used",
    ],
    required: [
      "A question (not empty)",
    ],
    tips: [
      "The assistant only works when the server has a Claude API key configured.",
      "The chat is kept in your browser session only; it is not saved to the project.",
      "Check key facts in the cited sources before you rely on them.",
    ],
    ar: {
      what: "محادثة بالذكاء الاصطناعي تجيب عن الأسئلة من سجلات هذا المشروع: المستندات وMIDP والملاحظات والمخاطر والمراجعات والاجتماعات والمتطلبات. تتضمن كل إجابة مصادر مرقّمة يمكنك فتحها.",
      steps: [
        "انقر أحد الأسئلة المقترحة، أو اكتب سؤالك في مربع \"اسأل عن هذا المشروع…\".",
        "اضغط Enter أو انقر \"اسأل\" (يضيف Shift+Enter سطرًا جديدًا).",
        "اقرأ الإجابة وانقر أي مصدر مرقّم لفتح السجل الذي أُخذت منه.",
        "اطرح أسئلة متابعة في المحادثة نفسها؛ إذ تُرسل الأدوار الأخيرة كسياق.",
        "انقر \"محادثة جديدة\" لمسح المحادثة والبدء من جديد.",
      ],
      outputs: [
        "إجابة مع روابط مرقّمة إلى سجلات المشروع التي استخدمتها",
      ],
      required: [
        "سؤال (غير فارغ)",
      ],
      tips: [
        "لا يعمل المساعد إلا إذا كان مفتاح Claude API مُعدًّا على الخادم.",
        "تُحفظ المحادثة في جلسة المتصفح فقط، ولا تُحفظ في المشروع.",
        "تحقّق من الحقائق المهمة في المصادر المذكورة قبل الاعتماد عليها.",
      ],
    },
  },
  {
    key: "p.notebook",
    what: "Research notebooks for summarising, comparing or checking a set of sources with AI. Sources can be pasted text, project documents or PDF and text files from the project files. Answers cite the sources and are saved as notes.",
    steps: [
      "Type a title in \"Notebook title, e.g. Compare client EIRs\" and click \"New notebook\" (editors), or open an existing notebook card.",
      "Add sources with \"Add a project document\" or \"Add a project file (PDF or text)\".",
      "Or type a \"Source name\", paste the text below it and click \"Add text source\".",
      "Type a question, e.g. a comparison of handover requirements, and click \"Ask\".",
      "Read the saved note; citations such as [N1] point to the numbered sources.",
      "Use ✕ to remove a source or a note, and \"← All notebooks\" to go back to the list.",
    ],
    outputs: [
      "Saved notes: each question with its AI answer and source citations",
    ],
    required: [
      "Notebook title (to create a notebook)",
      "At least one source (before \"Ask\" is enabled)",
      "Question (at least 3 characters)",
      "Text source: a source name and at least 20 characters of text",
    ],
    tips: [
      "A notebook holds up to 20 sources.",
      "Only PDF, .txt, .md and .csv project files can be added as sources.",
    ],
    ar: {
      what: "دفاتر بحث لتلخيص مجموعة من المصادر أو مقارنتها أو فحصها بالذكاء الاصطناعي. يمكن أن تكون المصادر نصًا ملصقًا أو مستندات المشروع أو ملفات PDF ونصية من ملفات المشروع. تستشهد الإجابات بالمصادر وتُحفظ كملاحظات.",
      steps: [
        "اكتب عنوانًا في \"عنوان الدفتر، مثال: مقارنة EIR الخاصة بالعملاء\" وانقر \"دفتر ملاحظات جديد\" (للمحررين)، أو افتح بطاقة دفتر موجود.",
        "أضف المصادر من \"إضافة مستند للمشروع\" أو \"إضافة ملف للمشروع (PDF أو نص)\".",
        "أو اكتب \"اسم المصدر\" والصق النص تحته وانقر \"إضافة مصدر نصي\".",
        "اكتب سؤالًا، مثل مقارنة متطلبات التسليم، وانقر \"اسأل\".",
        "اقرأ الملاحظة المحفوظة؛ تشير الاستشهادات مثل [N1] إلى المصادر المرقّمة.",
        "استخدم ✕ لإزالة مصدر أو ملاحظة، و\"← جميع الدفاتر\" للعودة إلى القائمة.",
      ],
      outputs: [
        "ملاحظات محفوظة: كل سؤال مع إجابة الذكاء الاصطناعي واستشهادات المصادر",
      ],
      required: [
        "عنوان الدفتر (لإنشاء دفتر)",
        "مصدر واحد على الأقل (قبل تفعيل زر \"اسأل\")",
        "السؤال (3 أحرف على الأقل)",
        "المصدر النصي: اسم المصدر و20 حرفًا على الأقل من النص",
      ],
      tips: [
        "يتسع الدفتر لـ 20 مصدرًا كحد أقصى.",
        "لا يمكن إضافة إلا ملفات المشروع بصيغ PDF و.txt و.md و.csv كمصادر.",
      ],
    },
  },
  {
    key: "p.uses",
    what: "Choose why information is produced on this project (ISO 19650-1 §5.1). The selected uses, with priority and responsible task teams, become the Information Uses Schedule referenced by the EIR and BEP.",
    steps: [
      "Filter the list with \"Search uses…\" or a phase button (\"All phases\", Plan, Design, Construct, Operate).",
      "Click a use's name to read its value, inputs, deliverables and information need.",
      "Tick the checkbox of each use the project needs.",
      "For each selected use, set the Priority (High, Medium or Low), click the responsible task team chips and add Notes.",
      "Click \"Save\".",
      "Click \"Generate schedule\" to create the Information Uses Schedule document, or \"CSV\" to export the selection.",
    ],
    outputs: [
      "Information Uses Schedule (controlled document in WIP, opened in the editor)",
      "CSV export of the selected uses",
    ],
    required: [
      "At least one information use selected (to generate the schedule)",
    ],
    tips: [
      "Task team chips appear only after task teams are added under Teams & milestones.",
      "\"Generate schedule\" saves unsaved changes first.",
      "Selecting uses needs the editor or manager role.",
    ],
    ar: {
      what: "اختر سبب إنتاج المعلومات في هذا المشروع (ISO 19650-1 §5.1). تصبح الاستخدامات المختارة، مع أولويتها وفرق المهام المسؤولة، جدول استخدامات المعلومات الذي يُشار إليه في EIR وBEP.",
      steps: [
        "صفِّ القائمة باستخدام \"ابحث في الاستخدامات…\" أو زر مرحلة (\"جميع المراحل\" أو الخطة أو التصميم أو التنفيذ أو التشغيل).",
        "انقر اسم الاستخدام للاطلاع على قيمته ومدخلاته ومخرجاته ومستوى الحاجة إلى المعلومات.",
        "حدّد مربع الاختيار لكل استخدام يحتاجه المشروع.",
        "لكل استخدام مختار، حدّد \"الأولوية\" (مرتفع أو متوسط أو منخفض)، وانقر شرائح فرق المهام المسؤولة، وأضف \"ملاحظات\".",
        "انقر \"حفظ\".",
        "انقر \"إنشاء الجدول\" لإنشاء مستند جدول استخدامات المعلومات، أو \"CSV\" لتصدير الاختيار.",
      ],
      outputs: [
        "جدول استخدامات المعلومات (مستند مضبوط في حالة WIP يُفتح في المحرر)",
        "تصدير CSV للاستخدامات المختارة",
      ],
      required: [
        "اختيار استخدام معلومات واحد على الأقل (لإنشاء الجدول)",
      ],
      tips: [
        "لا تظهر شرائح فرق المهام إلا بعد إضافة فرق المهام من \"الفرق والمعالم\".",
        "يحفظ زر \"إنشاء الجدول\" التغييرات غير المحفوظة أولًا.",
        "يتطلب اختيار الاستخدامات دور editor أو manager.",
      ],
    },
  },
  {
    key: "p.setup",
    what: "Set up the task teams and the information delivery milestones. Each task team produces its own TIDP, and its originator and role codes drive container names. Milestones are the key decision points from the EIR (ISO 19650-2 5.1.3).",
    steps: [
      "Under Task teams, type the \"Team name\", and optionally the Organization and \"Originator code (3–6)\".",
      "Choose the role code and, optionally, a \"Team lead\" from the project members.",
      "Click \"+ Add task team\".",
      "Under Information delivery milestones, type the milestone name, pick its date and optionally add the \"Purpose / decision\".",
      "Click \"+ Add milestone\".",
      "Use ✕ on a row to delete a team or a milestone.",
    ],
    outputs: [
      "Task teams and milestones used by the MIDP, TIDP, responsibility matrix, LOIN and MRM",
    ],
    required: [
      "Team name",
      "Originator code, if given (3–6 letters or digits)",
      "Milestone name",
      "Milestone date",
    ],
    tips: [
      "A task team that still has TIDP entries cannot be deleted; reassign or delete its containers first.",
      "Deleting a milestone keeps the containers and LOIN entries but clears their milestone.",
      "Adding or deleting needs the editor or manager role.",
    ],
    ar: {
      what: "أعِدّ فرق المهام ومعالم تسليم المعلومات. ينتج كل فريق مهمة TIDP الخاص به، وتحدد رموز المُنشئ والدور أسماء الحاويات. المعالم هي نقاط القرار الرئيسية من EIR (ISO 19650-2 5.1.3).",
      steps: [
        "ضمن \"فرق المهام\"، اكتب \"اسم الفريق\"، واختياريًا المؤسسة و\"رمز المُنشئ (3–6)\".",
        "اختر رمز الدور، واختياريًا \"قائد الفريق\" من أعضاء المشروع.",
        "انقر \"+ إضافة فريق مهمة\".",
        "ضمن \"معالم تسليم المعلومات\"، اكتب اسم المعلم واختر تاريخه، وأضف اختياريًا \"الغرض / القرار\".",
        "انقر \"+ إضافة معلم\".",
        "استخدم ✕ في الصف لحذف فريق أو معلم.",
      ],
      outputs: [
        "فرق مهام ومعالم تُستخدم في MIDP وTIDP ومصفوفة المسؤوليات وLOIN وMRM",
      ],
      required: [
        "اسم الفريق",
        "رمز المُنشئ، إن أُدخل (3–6 أحرف أو أرقام)",
        "اسم المعلم",
        "تاريخ المعلم",
      ],
      tips: [
        "لا يمكن حذف فريق مهمة ما زالت لديه إدخالات TIDP؛ أعِد تعيين حاوياته أو احذفها أولًا.",
        "حذف المعلم يُبقي الحاويات وإدخالات LOIN لكنه يمسح المعلم المرتبط بها.",
        "تتطلب الإضافة أو الحذف دور editor أو manager.",
      ],
    },
  },
  {
    key: "p.raci",
    what: "The responsibility matrix (RACI) shows, for each information item or activity, which task team is Responsible, Accountable, Consulted or Informed (ISO 19650-2 5.4.2).",
    steps: [
      "Type the \"Information / element\" and, optionally, the \"Stage / milestone\", then click \"+ Add row\".",
      "On an empty matrix, click \"Seed from MIDP\" to add one row per planned container, or \"Add ISO 19650-2 activity list\" for a starter list.",
      "Click a cell under a task team to cycle R → A → C → I → R/A.",
      "Fix the rows flagged below the matrix: no accountable party, more than one accountable party, or no responsible party.",
      "Click \"Generate DRM document\" to create the responsibility matrix document.",
    ],
    outputs: [
      "Responsibility matrix (DRM) controlled document in WIP, opened in the editor",
    ],
    required: [
      "At least one task team (added under Teams & milestones)",
      "Information / element for each row",
      "Exactly one A and at least one R per row",
    ],
    tips: [
      "Rows that break the RACI rules are highlighted in the table.",
      "Generating again updates the existing WIP document instead of creating a new one.",
      "Editing needs the editor or manager role.",
    ],
    ar: {
      what: "تبيّن مصفوفة المسؤوليات (RACI) لكل بند معلومات أو نشاط فريقَ المهمة المسؤول عن التنفيذ (R) والمساءَل (A) والمُستشار (C) والمُبلَّغ (I) (ISO 19650-2 5.4.2).",
      steps: [
        "اكتب \"المعلومات / العنصر\"، واختياريًا \"المرحلة / المعلم\"، ثم انقر \"+ إضافة صف\".",
        "في المصفوفة الفارغة، انقر \"توليد من MIDP\" لإضافة صف لكل حاوية مخططة، أو \"إضافة قائمة أنشطة ISO 19650-2\" لقائمة أولية.",
        "انقر خلية تحت فريق مهمة لتغييرها بالتتابع R ← A ← C ← I ← R/A.",
        "عالج الصفوف المُنبَّه عليها أسفل المصفوفة: لا يوجد طرف مساءَل، أو أكثر من طرف مساءَل، أو لا يوجد طرف مسؤول.",
        "انقر \"إنشاء مستند DRM\" لإنشاء مستند مصفوفة المسؤوليات.",
      ],
      outputs: [
        "مستند مضبوط لمصفوفة المسؤوليات (DRM) في حالة WIP يُفتح في المحرر",
      ],
      required: [
        "فريق مهمة واحد على الأقل (يُضاف من \"الفرق والمعالم\")",
        "المعلومات / العنصر لكل صف",
        "حرف A واحد بالضبط وحرف R واحد على الأقل في كل صف",
      ],
      tips: [
        "تُميَّز في الجدول الصفوف التي تخالف قواعد RACI.",
        "إعادة الإنشاء تحدّث مستند WIP الموجود بدلًا من إنشاء مستند جديد.",
        "يتطلب التعديل دور editor أو manager.",
      ],
    },
  },
  {
    key: "p.loin",
    what: "Define the level of information need per element and milestone (ISO 7817-1): geometrical information, alphanumerical information and documentation. Reference these entries in the planner and the EIR.",
    steps: [
      "Check the reference in the first field; it is filled in as the next LOIN number (e.g. LOIN-01).",
      "Type the \"Element\" and, optionally, the \"IFC class\" and \"Purpose\".",
      "Choose the milestone it applies to.",
      "Describe the Geometry, Alphanumeric (properties) and Documentation requirements.",
      "Click \"+ Add LOIN\".",
      "Edit any text cell in the table directly; it saves when you leave the cell. Use ✕ to delete a row.",
    ],
    outputs: [
      "LOIN entries that can be referenced from containers in the delivery plan",
    ],
    required: [
      "Ref (not empty)",
      "Element",
    ],
    tips: [
      "Use the IFC class (e.g. IfcDoor) so the entry matches model elements.",
      "Adding and editing needs the editor or manager role.",
    ],
    ar: {
      what: "حدّد مستوى الحاجة إلى المعلومات لكل عنصر ومعلم (ISO 7817-1): المعلومات الهندسية والمعلومات الأبجدية الرقمية والتوثيق. أشِر إلى هذه الإدخالات في المخطِّط وفي EIR.",
      steps: [
        "تحقّق من المرجع في الحقل الأول؛ إذ يُملأ تلقائيًا برقم LOIN التالي (مثل LOIN-01).",
        "اكتب \"العنصر\"، واختياريًا \"فئة IFC\" و\"الغرض\".",
        "اختر المعلم الذي ينطبق عليه.",
        "صِف متطلبات \"الهندسة\" و\"أبجدي رقمي\" (الخصائص) و\"التوثيق\".",
        "انقر \"+ إضافة LOIN\".",
        "عدّل أي خلية نصية في الجدول مباشرة؛ ويُحفظ التعديل عند مغادرة الخلية. استخدم ✕ لحذف صف.",
      ],
      outputs: [
        "إدخالات LOIN يمكن الإشارة إليها من الحاويات في خطة التسليم",
      ],
      required: [
        "المرجع (غير فارغ)",
        "العنصر",
      ],
      tips: [
        "استخدم فئة IFC (مثل IfcDoor) ليتطابق الإدخال مع عناصر النموذج.",
        "تتطلب الإضافة والتعديل دور editor أو manager.",
      ],
    },
  },
  {
    key: "p.mrm",
    what: "The model responsibility matrix records, for each model element and milestone, which task team models it and at what level of development (LOD). LOD should never go down between milestones.",
    steps: [
      "On an empty matrix, click \"Add starter element list\" to load a standard set of elements.",
      "Or type the Discipline, optionally the System, and the \"Element\", then click \"+ Add element\".",
      "In each milestone column, choose the task team and the LOD; hover an LOD to see its meaning.",
      "Use \"All disciplines\" to filter the rows by discipline.",
      "Review the warnings below the matrix and fix them.",
      "Click \"CSV\" to export the matrix, or \"Generate MRM document\" to create the MRM document.",
    ],
    outputs: [
      "MRM controlled document in WIP, opened in the editor",
      "CSV export of the matrix",
    ],
    required: [
      "At least one task team and one milestone (added under Teams & milestones)",
      "Discipline",
      "Element",
    ],
    tips: [
      "The starter list can only be added while the matrix is empty.",
      "Adding, editing and generating need the editor or manager role; anyone can export the CSV.",
    ],
    ar: {
      what: "تسجّل مصفوفة مسؤولية النمذجة، لكل عنصر في النموذج ولكل معلم، فريقَ المهمة الذي ينمذجه ومستوى التطوير (LOD). يجب ألا ينخفض LOD بين المعالم.",
      steps: [
        "في المصفوفة الفارغة، انقر \"إضافة قائمة عناصر أولية\" لتحميل مجموعة قياسية من العناصر.",
        "أو اكتب \"التخصص\"، واختياريًا \"النظام\"، ثم \"العنصر\"، وانقر \"+ إضافة عنصر\".",
        "في عمود كل معلم، اختر فريق المهمة وLOD؛ ومرّر المؤشر فوق LOD لمعرفة معناه.",
        "استخدم \"جميع التخصصات\" لتصفية الصفوف حسب التخصص.",
        "راجع التحذيرات أسفل المصفوفة وعالجها.",
        "انقر \"CSV\" لتصدير المصفوفة، أو \"إنشاء مستند MRM\" لإنشاء مستند MRM.",
      ],
      outputs: [
        "مستند MRM مضبوط في حالة WIP يُفتح في المحرر",
        "تصدير CSV للمصفوفة",
      ],
      required: [
        "فريق مهمة واحد ومعلم واحد على الأقل (يُضافان من \"الفرق والمعالم\")",
        "التخصص",
        "العنصر",
      ],
      tips: [
        "لا يمكن إضافة القائمة الأولية إلا عندما تكون المصفوفة فارغة.",
        "تتطلب الإضافة والتعديل والإنشاء دور editor أو manager؛ ويمكن لأي عضو تصدير CSV.",
      ],
    },
  },
  {
    key: "p.contract",
    what: "AI review of an appointment, contract or BIM specification for ISO 19650 information-management obligations, such as the information protocol, EIR, BEP, MIDP/TIDP, CDE, IP and licence, liability, security and handover. It is a checklist aid, not legal advice.",
    steps: [
      "Choose a PDF or .txt file, or paste the contract text into \"Paste contract text…\".",
      "Click \"Review document\" and wait (it can take up to a minute).",
      "Read the Summary.",
      "Check the table: each Obligation is marked present, partial or missing, with Evidence and a Recommendation.",
      "Pass the \"Points for legal review\" to your legal adviser.",
    ],
    outputs: [
      "On-screen review: summary, obligation checklist with status, evidence and recommendations, and points for legal review",
    ],
    required: [
      "A PDF or .txt file (up to 25 MB), or pasted text (at least 200 characters)",
    ],
    tips: [
      "The result is not saved; copy what you need before leaving the page.",
      "Running a review needs the editor or manager role.",
    ],
    ar: {
      what: "مراجعة بالذكاء الاصطناعي لعقد التعيين أو العقد أو مواصفات BIM بحثًا عن التزامات إدارة المعلومات وفق ISO 19650، مثل بروتوكول المعلومات وEIR وBEP وMIDP/TIDP وCDE والملكية الفكرية والترخيص والمسؤولية والأمن والتسليم. هذه أداة مساعدة كقائمة تحقق، وليست استشارة قانونية.",
      steps: [
        "اختر ملف PDF أو .txt، أو الصق نص العقد في \"الصق نص العقد…\".",
        "انقر \"مراجعة المستند\" وانتظر (قد يستغرق ذلك حتى دقيقة).",
        "اقرأ \"الملخص\".",
        "افحص الجدول: يُوسم كل \"الالتزام\" بأنه موجود أو جزئي أو مفقود، مع \"الدليل\" و\"التوصية\".",
        "سلّم \"نقاط للمراجعة القانونية\" إلى مستشارك القانوني.",
      ],
      outputs: [
        "مراجعة على الشاشة: ملخص، وقائمة التزامات مع الحالة والأدلة والتوصيات، ونقاط للمراجعة القانونية",
      ],
      required: [
        "ملف PDF أو .txt (حتى 25 ميغابايت)، أو نص ملصق (200 حرف على الأقل)",
      ],
      tips: [
        "لا تُحفظ النتيجة؛ انسخ ما تحتاجه قبل مغادرة الصفحة.",
        "يتطلب تشغيل المراجعة دور editor أو manager.",
      ],
    },
  },
  {
    key: "p.documents",
    what: "The register of controlled documents (EIR, BEP, MIDP, policies and others) created from the template library, with their revision, CDE status, review state and author.",
    steps: [
      "Find a document with \"Search documents…\" or filter by state with \"All states\" (WIP, SHARED, PUBLISHED, ARCHIVED).",
      "Click \"+ New document\" (editors and managers).",
      "Choose the Template and, if offered, a house template under \"Start from\".",
      "Optionally type a Title, and edit the \"Container name / document number\" (replace XXX with your originator code).",
      "Click \"Create document\"; the new document opens in the editor.",
      "Click any row to open a document; WIP documents show \"Edit\" for editors.",
    ],
    outputs: [
      "New controlled document in WIP, filled in with the project details",
    ],
    required: [
      "Template",
    ],
    tips: [
      "Documents such as the MIDP or the responsibility matrix are generated from their data page; the dialog then shows \"Open …\" and \"Generate … now\" instead of \"Create document\".",
      "A comment badge on a row shows the number of open comments.",
    ],
    ar: {
      what: "سجل المستندات المضبوطة (EIR وBEP وMIDP والسياسات وغيرها) المُنشأة من مكتبة القوالب، مع إصدارها وحالتها في CDE وحالة المراجعة والمؤلف.",
      steps: [
        "ابحث عن مستند عبر \"ابحث في المستندات…\" أو صفِّ حسب الحالة عبر \"جميع الحالات\" (WIP وSHARED وPUBLISHED وARCHIVED).",
        "انقر \"+ مستند جديد\" (للمحررين والمديرين).",
        "اختر \"قالب\"، وإن ظهر خيار \"البدء من\" فاختر قالبًا خاصًا بالمؤسسة.",
        "اكتب \"العنوان\" اختياريًا، وعدّل \"اسم الحاوية / رقم المستند\" (استبدل XXX برمز المُنشئ الخاص بك).",
        "انقر \"إنشاء مستند\"؛ فيُفتح المستند الجديد في المحرر.",
        "انقر أي صف لفتح المستند؛ وتعرض مستندات WIP زر \"تعديل\" للمحررين.",
      ],
      outputs: [
        "مستند مضبوط جديد في حالة WIP مملوء ببيانات المشروع",
      ],
      required: [
        "القالب",
      ],
      tips: [
        "تُنشأ مستندات مثل MIDP أو مصفوفة المسؤوليات من صفحة بياناتها؛ فيعرض مربع الحوار عندئذٍ \"فتح …\" و\"إنشاء … الآن\" بدلًا من \"إنشاء مستند\".",
        "تبيّن شارة التعليقات في الصف عدد التعليقات المفتوحة.",
      ],
    },
  },
  {
    key: "p.files",
    what: "The project's CDE file store, organised in folders by state: WIP, Shared, Published and Archived. Upload any format, keep version history, set the container name, status, suitability and revision, and comment on files.",
    steps: [
      "Choose a folder in the Folders tree; click \"+ Folder\" to create a subfolder inside it.",
      "Click \"Upload files\" or drag files onto the folder area.",
      "Click a file to open its details and set the Container name, CDE state, Suitability and Revision, or use \"Move to folder\".",
      "Click \"Upload new version\" to add a new version of the selected file; download any version with ⬇.",
      "For IFC or COBie files, click \"Validate now\" or open the validation results.",
      "Add comments to the file in the Comments section.",
    ],
    outputs: [
      "Stored file with version history",
      "Notification to the other project members on upload and on state change",
      "Automatic validation of .ifc files and COBie .xlsx files",
      "Activity log entries",
    ],
    required: [
      "A selected folder",
      "At least one file to upload",
    ],
    tips: [
      "Only managers can set PUBLISHED or ARCHIVED, delete files or delete empty folders.",
      "A file whose latest version failed validation cannot leave WIP; a manager can override with a reason that is logged.",
      "Viewers can browse, download and comment but cannot upload or edit.",
    ],
    ar: {
      what: "مخزن ملفات CDE الخاص بالمشروع، منظّم في مجلدات حسب الحالة: WIP وShared وPublished وArchived. ارفع أي صيغة، واحتفظ بسجل الإصدارات، وحدّد اسم الحاوية والحالة والملاءمة والإصدار، وعلّق على الملفات.",
      steps: [
        "اختر مجلدًا من شجرة المجلدات؛ وانقر \"+ مجلد\" لإنشاء مجلد فرعي داخله.",
        "انقر \"رفع الملفات\" أو اسحب الملفات إلى منطقة المجلد.",
        "انقر ملفًا لفتح تفاصيله وتحديد \"اسم الحاوية\" و\"حالة CDE\" و\"الملاءمة\" و\"الإصدار\"، أو استخدم \"نقل إلى مجلد\".",
        "انقر \"رفع نسخة جديدة\" لإضافة نسخة جديدة من الملف المحدد؛ ونزّل أي نسخة عبر ⬇.",
        "لملفات IFC أو COBie، انقر \"تحقق الآن\" أو افتح نتائج التحقق.",
        "أضف تعليقات على الملف في قسم \"التعليقات\".",
      ],
      outputs: [
        "ملف مخزَّن مع سجل الإصدارات",
        "إشعار لأعضاء المشروع الآخرين عند الرفع وعند تغيير الحالة",
        "تحقق تلقائي من ملفات .ifc وملفات COBie بصيغة .xlsx",
        "إدخالات في سجل النشاط",
      ],
      required: [
        "مجلد محدد",
        "ملف واحد على الأقل للرفع",
      ],
      tips: [
        "يقتصر على المديرين تعيين PUBLISHED أو ARCHIVED وحذف الملفات وحذف المجلدات الفارغة.",
        "لا يمكن نقل ملف من WIP إذا فشل التحقق من أحدث نسخة منه؛ ويمكن للمدير التجاوز مع ذكر سبب يُسجَّل.",
        "يمكن للمشاهدين التصفح والتنزيل والتعليق، لكن لا يمكنهم الرفع أو التعديل.",
      ],
    },
  },
];
