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
};
