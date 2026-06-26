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
};
