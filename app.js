/*
 * app.js — Seniors Med
 *
 * A bilingual (EN/AR, RTL-aware) geriatric visit record. The record is built
 * from ordered sections; data persists in IndexedDB (db.js); records export to
 * Word (export.js); editable clinical lists live in config.js.
 */
(function () {
  "use strict";

  var CFG = window.SeniorsConfig || {};

  // ---------------------------------------------------------------------------
  // Translations
  // ---------------------------------------------------------------------------
  const I18N = {
    en: {
      appTitle: "Seniors Med",
      appSubtitle: "Geriatric clinic visit record",
      langToggle: "العربية",
      visitHeading: "New visit",
      sectionPatient: "Patient",
      patientName: "Patient name",
      age: "Age",
      visitDate: "Date of visit",
      sectionProblems: "Problem list",
      sectionGeriatric: "Geriatric assessment",
      sectionCurrent: "Current situation",
      sectionVitals: "Vital signs",
      sectionLabs: "Laboratory investigations",
      sectionAlerts: "Alerts",
      sectionAssessment: "Assessment",
      sectionActionPlan: "Action plan",
      medications: "Medications",
      drugName: "Drug name",
      dosing: "Dosing instructions (Arabic)",
      addMed: "+ Add medication",
      removeMed: "Remove",
      generate: "Generate record",
      recordHeading: "Visit record",
      savedHeading: "Saved records",
      noRecords: "No saved records yet.",
      noneRecorded: "None recorded.",
      requiredName: "Please enter the patient name.",
      years: "years",
      generatedOn: "Generated",
      medColDrug: "Drug",
      medColDosing: "Dosing",
      noMeds: "No medications recorded.",
      notProvided: "—",
      exportWord: "Download Word record",
    },
    ar: {
      appTitle: "سينيورز ميد",
      appSubtitle: "سجل زيارة عيادة المسنّين",
      langToggle: "English",
      visitHeading: "زيارة جديدة",
      sectionPatient: "المريض",
      patientName: "اسم المريض",
      age: "العمر",
      visitDate: "تاريخ الزيارة",
      sectionProblems: "قائمة المشكلات",
      sectionGeriatric: "تقييم المسنّين",
      sectionCurrent: "الوضع الحالي",
      sectionVitals: "العلامات الحيوية",
      sectionLabs: "الفحوصات المخبرية",
      sectionAlerts: "التنبيهات",
      sectionAssessment: "التقييم",
      sectionActionPlan: "خطة العمل",
      medications: "الأدوية",
      drugName: "اسم الدواء",
      dosing: "تعليمات الجرعة",
      addMed: "+ إضافة دواء",
      removeMed: "حذف",
      generate: "إنشاء السجل",
      recordHeading: "سجل الزيارة",
      savedHeading: "السجلات المحفوظة",
      noRecords: "لا توجد سجلات محفوظة بعد.",
      noneRecorded: "لا يوجد تسجيل.",
      requiredName: "الرجاء إدخال اسم المريض.",
      years: "سنة",
      generatedOn: "أُنشئ في",
      medColDrug: "الدواء",
      medColDosing: "الجرعة",
      noMeds: "لا توجد أدوية مسجلة.",
      notProvided: "—",
      exportWord: "تنزيل سجل Word",
    },
  };

  const state = {
    lang: "en",
    lastRecord: null, // most recently generated visit (re-render on toggle)
  };

  let medCounter = 0;

  function t(key) {
    return I18N[state.lang][key] || key;
  }

  // Bilingual label for a config item ({en, ar}).
  function cfgLabel(item) {
    return (item && (item[state.lang] || item.en)) || "";
  }

  // ---------------------------------------------------------------------------
  // Small DOM helpers
  // ---------------------------------------------------------------------------
  function el(tag, opts = {}, children = []) {
    const node = document.createElement(tag);
    if (opts.class) node.className = opts.class;
    if (opts.text != null) node.textContent = opts.text;
    if (opts.html != null) node.innerHTML = opts.html;
    if (opts.attrs) {
      for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
    }
    for (const child of children) {
      if (child) node.appendChild(child);
    }
    return node;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function renderInto(container, node) {
    container.innerHTML = "";
    container.appendChild(node);
  }

  // ---------------------------------------------------------------------------
  // Language handling
  // ---------------------------------------------------------------------------
  function applyLanguage(lang) {
    state.lang = lang;
    localStorage.setItem("seniors-med-lang", lang);

    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.getAttribute("data-i18n"));
    });

    document.title = t("appTitle");
    $("langToggle").textContent = t("langToggle");

    // Rebuild config-driven inputs so their labels follow the new language.
    buildVitalsInputs();

    if (state.lastRecord) {
      renderInto($("recordOutput"), buildRecordCard(state.lastRecord));
    }
    loadSaved();
  }

  // ---------------------------------------------------------------------------
  // Vital signs inputs (built from config)
  // ---------------------------------------------------------------------------
  function buildVitalsInputs() {
    const grid = $("vitalsGrid");
    if (!grid) return;
    // Preserve any values already typed when rebuilding (e.g. on language switch).
    const prev = {};
    grid.querySelectorAll("input[data-vital]").forEach((i) => {
      prev[i.getAttribute("data-vital")] = i.value;
    });

    grid.innerHTML = "";
    (CFG.vitals || []).forEach((v) => {
      const labelText = cfgLabel(v) + (v.unit ? ` (${v.unit})` : "");
      const input = el("input", {
        attrs: { id: `vital-${v.id}`, type: "text", autocomplete: "off", "data-vital": v.id },
      });
      if (prev[v.id] != null) input.value = prev[v.id];
      const field = el("div", { class: "field" }, [
        el("label", { attrs: { for: `vital-${v.id}` }, text: labelText }),
        input,
      ]);
      grid.appendChild(field);
    });
  }

  // ---------------------------------------------------------------------------
  // Medication rows
  // ---------------------------------------------------------------------------
  function buildMedRow() {
    const id = ++medCounter;

    const drugLabel = el("label", {
      attrs: { for: `drug-${id}`, "data-i18n": "drugName" },
      text: t("drugName"),
    });
    const drugInput = el("input", {
      class: "drug",
      attrs: { id: `drug-${id}`, type: "text", autocomplete: "off" },
    });

    const doseLabel = el("label", {
      attrs: { for: `dose-${id}`, "data-i18n": "dosing" },
      text: t("dosing"),
    });
    // Dosing is always Arabic, always right-to-left, regardless of UI language.
    const doseInput = el("input", {
      class: "dosing arabic",
      attrs: { id: `dose-${id}`, type: "text", dir: "rtl", lang: "ar" },
    });

    const removeBtn = el("button", {
      class: "btn btn-remove",
      attrs: { type: "button", "data-i18n": "removeMed" },
      text: t("removeMed"),
    });
    removeBtn.addEventListener("click", () => row.remove());

    const row = el("div", { class: "med-row" }, [
      el("div", { class: "field" }, [drugLabel, drugInput]),
      el("div", { class: "field" }, [doseLabel, doseInput]),
      el("div", { class: "med-row__remove" }, [removeBtn]),
    ]);

    return row;
  }

  // ---------------------------------------------------------------------------
  // Read the form into a plain visit object
  // ---------------------------------------------------------------------------
  function collectForm() {
    const meds = [];
    $("medsList")
      .querySelectorAll(".med-row")
      .forEach((row) => {
        const drug = row.querySelector(".drug").value.trim();
        const dosing = row.querySelector(".dosing").value.trim();
        if (drug || dosing) meds.push({ drug, dosing });
      });

    const vitals = {};
    document.querySelectorAll("#vitalsGrid input[data-vital]").forEach((i) => {
      const val = i.value.trim();
      if (val) vitals[i.getAttribute("data-vital")] = val;
    });

    return {
      createdAt: Date.now(),
      name: $("patientName").value.trim(),
      age: $("age").value.trim(),
      date: $("visitDate").value, // YYYY-MM-DD or ""
      currentSituation: $("currentSituation").value.trim(),
      vitals,
      assessment: $("assessment").value.trim(),
      actionPlan: $("actionPlan").value.trim(),
      meds,
    };
  }

  function resetForm() {
    $("visitForm").reset();
    buildVitalsInputs();
    $("medsList").innerHTML = "";
    $("medsList").appendChild(buildMedRow());
  }

  // ---------------------------------------------------------------------------
  // Formatting helpers
  // ---------------------------------------------------------------------------
  function formatDate(value) {
    if (!value) return t("notProvided");
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const locale = state.lang === "ar" ? "ar-EG" : "en-GB";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  }

  function formatTimestamp(ms) {
    const d = new Date(ms);
    const locale = state.lang === "ar" ? "ar-EG" : "en-GB";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }

  // ---------------------------------------------------------------------------
  // Record rendering
  // ---------------------------------------------------------------------------
  function infoRow(labelKey, valueText) {
    return el("div", { class: "info-pair" }, [
      el("dt", { text: t(labelKey) }),
      el("dd", { text: valueText }),
    ]);
  }

  // A record section: Aegean header + content, or "None recorded." when empty.
  function recordSection(titleKey, contentNode) {
    const body = contentNode || el("p", { class: "muted", text: t("noneRecorded") });
    return el("section", { class: "rec-section" }, [
      el("h4", { class: "rec-section__title", text: t(titleKey) }),
      body,
    ]);
  }

  // Free-text block → node or null when empty.
  function textBlock(value) {
    if (!value) return null;
    return el("p", { class: "rec-text", text: value });
  }

  function vitalsBlock(visit) {
    const vitals = visit.vitals || {};
    const items = (CFG.vitals || []).filter((v) => vitals[v.id]);
    if (!items.length) return null;
    return el(
      "dl",
      { class: "rec-grid" },
      items.map((v) =>
        el("div", { class: "info-pair" }, [
          el("dt", { text: cfgLabel(v) }),
          el("dd", { text: vitals[v.id] + (v.unit ? ` ${v.unit}` : "") }),
        ])
      )
    );
  }

  function medsBlock(visit) {
    if (!visit.meds || !visit.meds.length) return null;
    const thead = el("thead", {}, [
      el("tr", {}, [
        el("th", { text: t("medColDrug") }),
        el("th", { text: t("medColDosing") }),
      ]),
    ]);
    const rows = visit.meds.map((m) =>
      el("tr", {}, [
        el("td", { class: "med-drug", text: m.drug || t("notProvided") }),
        // Dosing cell is always Arabic, right-to-left, shown verbatim.
        el("td", {
          class: "med-dose arabic",
          text: m.dosing || t("notProvided"),
          attrs: { dir: "rtl", lang: "ar" },
        }),
      ])
    );
    return el("table", { class: "med-table" }, [thead, el("tbody", {}, rows)]);
  }

  function buildRecordCard(visit) {
    const head = el("header", { class: "record-head" }, [
      el("h3", { class: "record-name", text: visit.name || t("notProvided") }),
      el("span", {
        class: "record-meta",
        text: `${t("generatedOn")}: ${formatTimestamp(visit.createdAt)}`,
      }),
    ]);

    const ageText =
      visit.age !== "" && visit.age != null ? `${visit.age} ${t("years")}` : t("notProvided");
    const info = el("dl", { class: "record-info" }, [
      infoRow("age", ageText),
      infoRow("visitDate", formatDate(visit.date)),
    ]);

    // Ordered sections. Empty ones render "None recorded."
    const sections = [
      recordSection("sectionProblems", null), // Stage 2
      recordSection("sectionGeriatric", null), // Stage 3
      recordSection("sectionCurrent", textBlock(visit.currentSituation || visit.notes)),
      recordSection("sectionVitals", vitalsBlock(visit)),
      recordSection("sectionLabs", null), // Stage 5
      recordSection("sectionAlerts", null), // Stage 6
      recordSection("sectionAssessment", textBlock(visit.assessment)),
      recordSection("sectionActionPlan", textBlock(visit.actionPlan)),
      recordSection("medications", medsBlock(visit)),
    ];

    // Export button.
    const exportBtn = el("button", {
      class: "btn btn-secondary btn-export",
      attrs: { type: "button", "data-i18n": "exportWord" },
      text: t("exportWord"),
    });
    exportBtn.addEventListener("click", () => {
      try {
        window.SeniorsExport.downloadDocx(visit, buildExportLabels(visit));
      } catch (err) {
        console.error("Word export failed:", err);
        alert(t("exportWord") + " — error.");
      }
    });
    const actions = el("div", { class: "record-actions" }, [exportBtn]);

    return el("article", { class: "record" }, [head, info].concat(sections, [actions]));
  }

  // Localized labels/values for the .docx exporter (single source of truth).
  function buildExportLabels(visit) {
    const name = visit.name || t("notProvided");
    const ageValue =
      visit.age !== "" && visit.age != null ? `${visit.age} ${t("years")}` : t("notProvided");
    return {
      lang: state.lang,
      dir: state.lang === "ar" ? "rtl" : "ltr",
      headerTitle: `${t("recordHeading")} — ${name}`,
      name,
      ageLabel: t("age"),
      ageValue,
      dateLabel: t("visitDate"),
      dateValue: formatDate(visit.date),
      generatedText: `${t("generatedOn")}: ${formatTimestamp(visit.createdAt)}`,
      notesLabel: t("sectionCurrent"),
      notesValue: visit.currentSituation || visit.notes || "",
      medsLabel: t("medications"),
      drugCol: t("medColDrug"),
      dosingCol: t("medColDosing"),
      noMeds: t("noMeds"),
      notProvided: t("notProvided"),
    };
  }

  // ---------------------------------------------------------------------------
  // Saved records list
  // ---------------------------------------------------------------------------
  async function loadSaved() {
    let visits = [];
    try {
      visits = await window.SeniorsDB.getAllVisits();
    } catch (err) {
      console.error("Failed to load saved records:", err);
    }

    const list = $("savedList");
    const empty = $("noRecords");
    list.innerHTML = "";

    if (!visits.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    visits.forEach((v) => list.appendChild(buildRecordCard(v)));
  }

  // ---------------------------------------------------------------------------
  // Generate + save
  // ---------------------------------------------------------------------------
  async function handleGenerate(event) {
    event.preventDefault();

    const visit = collectForm();
    const errorEl = $("formError");

    if (!visit.name) {
      errorEl.textContent = t("requiredName");
      errorEl.hidden = false;
      $("patientName").focus();
      return;
    }
    errorEl.hidden = true;

    try {
      await window.SeniorsDB.saveVisit(visit);
    } catch (err) {
      console.error("Failed to save record:", err);
      errorEl.textContent = String(err);
      errorEl.hidden = false;
      return;
    }

    state.lastRecord = visit;
    renderInto($("recordOutput"), buildRecordCard(visit));
    $("recordSection").hidden = false;
    resetForm();
    await loadSaved();
    $("recordSection").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  function init() {
    const saved = localStorage.getItem("seniors-med-lang");
    applyLanguage(saved === "ar" ? "ar" : "en");

    buildVitalsInputs();
    $("medsList").appendChild(buildMedRow());

    $("addMed").addEventListener("click", () => {
      $("medsList").appendChild(buildMedRow());
    });

    $("langToggle").addEventListener("click", () => {
      applyLanguage(state.lang === "en" ? "ar" : "en");
    });

    $("visitForm").addEventListener("submit", handleGenerate);

    loadSaved();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
