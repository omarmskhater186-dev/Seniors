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
};
