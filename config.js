/*
 * config.js — editable clinical lists for Seniors Med.
 *
 * This is the ONE place to customize the app's clinical content. Each list
 * grows over the build stages. Every item has an `id` and bilingual labels
 * (`en` / `ar`). Edit/extend these arrays freely — the UI rebuilds from them.
 *
 * Loaded before app.js as window.SeniorsConfig.
 */
window.SeniorsConfig = {
  // Stage 1 — Vital signs captured each visit.
  vitals: [
    { id: "bp", en: "Blood pressure", ar: "ضغط الدم", unit: "mmHg" },
    { id: "hr", en: "Heart rate", ar: "معدل النبض", unit: "bpm" },
    { id: "rr", en: "Respiratory rate", ar: "معدل التنفس", unit: "/min" },
    { id: "temp", en: "Temperature", ar: "درجة الحرارة", unit: "°C" },
    { id: "spo2", en: "Oxygen saturation", ar: "تشبع الأكسجين", unit: "%" },
    { id: "weight", en: "Weight", ar: "الوزن", unit: "kg" },
    { id: "glucose", en: "Blood glucose", ar: "سكر الدم", unit: "mg/dL" },
  ],

  // Stage 2 — Common geriatric conditions for the problem-list picker.
  problems: [
    { id: "t2dm", en: "Type 2 diabetes", ar: "السكري من النوع الثاني" },
    { id: "htn", en: "Hypertension", ar: "ارتفاع ضغط الدم" },
    { id: "ihd", en: "Ischaemic heart disease", ar: "مرض القلب الإقفاري" },
    { id: "af", en: "Atrial fibrillation", ar: "الرجفان الأذيني" },
    { id: "hf", en: "Heart failure", ar: "قصور القلب" },
    { id: "ckd", en: "Chronic kidney disease", ar: "مرض الكلى المزمن" },
    { id: "dementia", en: "Cognitive impairment / dementia", ar: "ضعف إدراكي / خَرَف" },
    { id: "falls", en: "Recurrent falls", ar: "السقوط المتكرر" },
    { id: "oa", en: "Osteoarthritis", ar: "الفصال العظمي" },
    { id: "osteoporosis", en: "Osteoporosis", ar: "هشاشة العظام" },
    { id: "copd", en: "COPD", ar: "الانسداد الرئوي المزمن" },
    { id: "stroke", en: "Stroke / TIA", ar: "سكتة دماغية / نوبة إقفارية عابرة" },
    { id: "depression", en: "Depression", ar: "الاكتئاب" },
    { id: "parkinsons", en: "Parkinson's disease", ar: "مرض باركنسون" },
    { id: "hypothyroid", en: "Hypothyroidism", ar: "قصور الغدة الدرقية" },
    { id: "bph", en: "Benign prostatic hyperplasia", ar: "تضخم البروستاتا الحميد" },
    { id: "incontinence", en: "Urinary incontinence", ar: "سلس البول" },
    { id: "anaemia", en: "Anaemia", ar: "فقر الدم" },
  ],

  // Stage 3 — Structured geriatric assessment fields.
  // type "select" uses `options` (each {id, en, ar}); type "text" is free text.
  geriatric: [
    {
      id: "cognition", en: "Cognition", ar: "الإدراك", type: "select",
      options: [
        { id: "normal", en: "Normal", ar: "طبيعي" },
        { id: "mci", en: "Mild impairment", ar: "ضعف خفيف" },
        { id: "moderate", en: "Moderate impairment", ar: "ضعف متوسط" },
        { id: "severe", en: "Severe impairment", ar: "ضعف شديد" },
        { id: "dementia", en: "Known dementia", ar: "خَرَف معروف" },
      ],
    },
    {
      id: "mood", en: "Mood", ar: "المزاج", type: "select",
      options: [
        { id: "normal", en: "Normal", ar: "طبيعي" },
        { id: "low", en: "Low mood", ar: "مزاج منخفض" },
        { id: "anxiety", en: "Anxiety", ar: "قلق" },
        { id: "depression", en: "Depression screen positive", ar: "فحص اكتئاب إيجابي" },
      ],
    },
    {
      id: "mobility", en: "Mobility", ar: "الحركة", type: "select",
      options: [
        { id: "independent", en: "Independent", ar: "مستقل" },
        { id: "stick", en: "Uses a stick", ar: "يستخدم عصا" },
        { id: "walker", en: "Uses a walker", ar: "يستخدم مشاية" },
        { id: "wheelchair", en: "Wheelchair", ar: "كرسي متحرك" },
        { id: "bedbound", en: "Bedbound", ar: "طريح الفراش" },
      ],
    },
    {
      id: "falls", en: "Falls", ar: "السقوط", type: "select",
      options: [
        { id: "none", en: "None", ar: "لا يوجد" },
        { id: "one", en: "One in last year", ar: "مرة في العام الماضي" },
        { id: "recurrent", en: "Recurrent", ar: "متكرر" },
      ],
    },
    {
      id: "continence", en: "Continence", ar: "التحكم في الإخراج", type: "select",
      options: [
        { id: "continent", en: "Continent", ar: "متحكم" },
        { id: "urinary", en: "Urinary incontinence", ar: "سلس بولي" },
        { id: "faecal", en: "Faecal incontinence", ar: "سلس برازي" },
        { id: "double", en: "Double incontinence", ar: "سلس مزدوج" },
        { id: "catheter", en: "Catheter", ar: "قسطرة" },
      ],
    },
    {
      id: "nutrition", en: "Nutrition", ar: "التغذية", type: "select",
      options: [
        { id: "good", en: "Good", ar: "جيدة" },
        { id: "atrisk", en: "At risk", ar: "معرّض للخطر" },
        { id: "malnourished", en: "Malnourished", ar: "سوء تغذية" },
      ],
    },
    {
      id: "vision", en: "Vision", ar: "البصر", type: "select",
      options: [
        { id: "normal", en: "Normal", ar: "طبيعي" },
        { id: "glasses", en: "Corrected (glasses)", ar: "مصحّح (نظارة)" },
        { id: "impaired", en: "Impaired", ar: "ضعيف" },
        { id: "severe", en: "Severe / blind", ar: "شديد / كفيف" },
      ],
    },
    {
      id: "hearing", en: "Hearing", ar: "السمع", type: "select",
      options: [
        { id: "normal", en: "Normal", ar: "طبيعي" },
        { id: "aid", en: "Hearing aid", ar: "سماعة طبية" },
        { id: "impaired", en: "Impaired", ar: "ضعيف" },
      ],
    },
    {
      id: "sleep", en: "Sleep", ar: "النوم", type: "select",
      options: [
        { id: "good", en: "Good", ar: "جيد" },
        { id: "poor", en: "Poor", ar: "ضعيف" },
        { id: "insomnia", en: "Insomnia", ar: "أرق" },
      ],
    },
    {
      id: "polypharmacy", en: "Polypharmacy", ar: "تعدد الأدوية", type: "select",
      options: [
        { id: "no", en: "No (under 5)", ar: "لا (أقل من 5)" },
        { id: "yes", en: "Yes (5–9)", ar: "نعم (5–9)" },
        { id: "severe", en: "Severe (10+)", ar: "شديد (10+)" },
      ],
    },
    {
      id: "adl", en: "Functional status (ADL)", ar: "الحالة الوظيفية (ADL)", type: "select",
      options: [
        { id: "independent", en: "Independent", ar: "مستقل" },
        { id: "some", en: "Needs some help", ar: "يحتاج بعض المساعدة" },
        { id: "dependent", en: "Dependent", ar: "معتمد على الغير" },
      ],
    },
    {
      id: "iadl", en: "Functional status (IADL)", ar: "الحالة الوظيفية (IADL)", type: "select",
      options: [
        { id: "independent", en: "Independent", ar: "مستقل" },
        { id: "some", en: "Needs some help", ar: "يحتاج بعض المساعدة" },
        { id: "dependent", en: "Dependent", ar: "معتمد على الغير" },
      ],
    },
    { id: "social", en: "Social support", ar: "الدعم الاجتماعي", type: "text" },
    {
      id: "skin", en: "Skin / pressure areas", ar: "الجلد / مناطق الضغط", type: "select",
      options: [
        { id: "intact", en: "Intact", ar: "سليم" },
        { id: "atrisk", en: "At risk", ar: "معرّض للخطر" },
        { id: "ulcer", en: "Pressure ulcer present", ar: "توجد قرحة ضغط" },
      ],
    },
    {
      id: "pain", en: "Pain", ar: "الألم", type: "select",
      options: [
        { id: "none", en: "None", ar: "لا يوجد" },
        { id: "mild", en: "Mild", ar: "خفيف" },
        { id: "moderate", en: "Moderate", ar: "متوسط" },
        { id: "severe", en: "Severe", ar: "شديد" },
      ],
    },
  ],

  // Stage 4 — Medication change codes (badges shown beside each drug).
  // tone: "pos" (new/increase), "neg" (decrease/stop), "neutral" (unchanged → no badge).
  medCodes: [
    { id: "new", symbol: "✱", en: "New", ar: "جديد", tone: "pos" },
    { id: "unchanged", symbol: "", en: "Unchanged", ar: "بدون تغيير", tone: "neutral" },
    { id: "increased", symbol: "↑", en: "Increased", ar: "زيادة الجرعة", tone: "pos" },
    { id: "decreased", symbol: "↓", en: "Decreased", ar: "إنقاص الجرعة", tone: "neg" },
    { id: "stopped", symbol: "✕", en: "Stopped", ar: "إيقاف", tone: "neg" },
  ],

  // Stage 6 — Alert tiers (one short line each).
  alertTiers: [
    { id: "red", emoji: "🔴", en: "Urgent", ar: "عاجل" },
    { id: "amber", emoji: "🟡", en: "Needs attention", ar: "يحتاج انتباه" },
    { id: "green", emoji: "🟢", en: "Reassuring", ar: "مطمئن" },
  ],

  // Stage 5 — Laboratory catalog: groups → tests with units and normal ranges.
  // `low`/`high` are the reference range used to flag out-of-range values and
  // to judge trend direction (improving/worsening). Omit them for free values.
  labs: [
    {
      id: "cbc", en: "Complete blood count", ar: "تعداد الدم الكامل",
      tests: [
        { id: "hb", en: "Haemoglobin", ar: "الهيموغلوبين", unit: "g/dL", low: 12, high: 17 },
        { id: "wbc", en: "White cell count", ar: "كريات الدم البيضاء", unit: "10⁹/L", low: 4, high: 11 },
        { id: "plt", en: "Platelets", ar: "الصفائح", unit: "10⁹/L", low: 150, high: 400 },
      ],
    },
    {
      id: "renal", en: "Renal function", ar: "وظائف الكلى",
      tests: [
        { id: "creat", en: "Creatinine", ar: "الكرياتينين", unit: "mg/dL", low: 0.6, high: 1.3 },
        { id: "urea", en: "Urea", ar: "اليوريا", unit: "mg/dL", low: 15, high: 45 },
        { id: "egfr", en: "eGFR", ar: "معدل الترشيح الكبيبي", unit: "mL/min", low: 60, high: 120 },
        { id: "k", en: "Potassium", ar: "البوتاسيوم", unit: "mmol/L", low: 3.5, high: 5.1 },
        { id: "na", en: "Sodium", ar: "الصوديوم", unit: "mmol/L", low: 135, high: 145 },
      ],
    },
    {
      id: "glyc", en: "Glycaemic control", ar: "ضبط السكري",
      tests: [
        { id: "hba1c", en: "HbA1c", ar: "السكر التراكمي", unit: "%", low: 4, high: 6.5 },
        { id: "fbg", en: "Fasting glucose", ar: "سكر صائم", unit: "mg/dL", low: 70, high: 110 },
      ],
    },
    {
      id: "lipids", en: "Lipids", ar: "الدهون",
      tests: [
        { id: "ldl", en: "LDL cholesterol", ar: "الكوليسترول الضار", unit: "mg/dL", low: 0, high: 100 },
        { id: "hdl", en: "HDL cholesterol", ar: "الكوليسترول النافع", unit: "mg/dL", low: 40, high: 200 },
        { id: "tg", en: "Triglycerides", ar: "الدهون الثلاثية", unit: "mg/dL", low: 0, high: 150 },
      ],
    },
    {
      id: "liver", en: "Liver function", ar: "وظائف الكبد",
      tests: [
        { id: "alt", en: "ALT", ar: "ALT", unit: "U/L", low: 0, high: 40 },
        { id: "ast", en: "AST", ar: "AST", unit: "U/L", low: 0, high: 40 },
        { id: "alb", en: "Albumin", ar: "الألبومين", unit: "g/dL", low: 3.5, high: 5 },
      ],
    },
    {
      id: "other", en: "Other", ar: "أخرى",
      tests: [
        { id: "tsh", en: "TSH", ar: "الهرمون المحفز للغدة الدرقية", unit: "mIU/L", low: 0.4, high: 4 },
        { id: "vitd", en: "Vitamin D", ar: "فيتامين د", unit: "ng/mL", low: 30, high: 100 },
        { id: "b12", en: "Vitamin B12", ar: "فيتامين ب12", unit: "pg/mL", low: 200, high: 900 },
      ],
    },
  ],
};
