/*
 * app.js — Seniors Med (first slice)
 *
 * Responsibilities:
 *   - English / Arabic language toggle with full RTL mirroring
 *   - Add / remove medication rows (Arabic dosing field is always RTL)
 *   - Generate a clean, formatted visit record from the form
 *   - Save records to IndexedDB and render the persisted list
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Translations
  // ---------------------------------------------------------------------------
  const I18N = {
    en: {
      appTitle: "Seniors Med",
      appSubtitle: "Geriatric clinic visit record",
      langToggle: "العربية",
      visitHeading: "New visit",
      patientName: "Patient name",
      age: "Age",
      visitDate: "Date of visit",
      notes: "Visit notes",
      medications: "Medications",
      drugName: "Drug name",
      dosing: "Dosing instructions (Arabic)",
      addMed: "+ Add medication",
      removeMed: "Remove",
      generate: "Generate record",
      recordHeading: "Visit record",
      savedHeading: "Saved records",
      noRecords: "No saved records yet.",
      requiredName: "Please enter the patient name.",
      years: "years",
      generatedOn: "Generated",
      medColDrug: "Drug",
      medColDosing: "Dosing",
      noMeds: "No medications recorded.",
      noNotes: "No notes.",
      notProvided: "—",
    },
    ar: {
      appTitle: "سينيورز ميد",
      appSubtitle: "سجل زيارة عيادة المسنّين",
      langToggle: "English",
      visitHeading: "زيارة جديدة",
      patientName: "اسم المريض",
      age: "العمر",
      visitDate: "تاريخ الزيارة",
      notes: "ملاحظات الزيارة",
      medications: "الأدوية",
      drugName: "اسم الدواء",
      dosing: "تعليمات الجرعة",
      addMed: "+ إضافة دواء",
      removeMed: "حذف",
      generate: "إنشاء السجل",
      recordHeading: "سجل الزيارة",
      savedHeading: "السجلات المحفوظة",
      noRecords: "لا توجد سجلات محفوظة بعد.",
      requiredName: "الرجاء إدخال اسم المريض.",
      years: "سنة",
      generatedOn: "أُنشئ في",
      medColDrug: "الدواء",
      medColDosing: "الجرعة",
      noMeds: "لا توجد أدوية مسجلة.",
      noNotes: "لا توجد ملاحظات.",
      notProvided: "—",
    },
  };

  const state = {
    lang: "en",
    lastRecord: null, // the most recently generated visit (for re-render on toggle)
  };

  let medCounter = 0;

  function t(key) {
    return I18N[state.lang][key] || key;
  }

  // ---------------------------------------------------------------------------
  // Small DOM helpers
  // ---------------------------------------------------------------------------
  function el(tag, opts = {}, children = []) {
    const node = document.createElement(tag);
    if (opts.class) node.className = opts.class;
    if (opts.text != null) node.textContent = opts.text;
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

  // ---------------------------------------------------------------------------
  // Language handling
  // ---------------------------------------------------------------------------
  function applyLanguage(lang) {
    state.lang = lang;
    localStorage.setItem("seniors-med-lang", lang);

    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";

    // Update every translatable element.
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.getAttribute("data-i18n"));
    });

    document.title = t("appTitle");
    $("langToggle").textContent = t("langToggle");

    // Re-render dynamic content so its labels follow the new language.
    if (state.lastRecord) {
      renderInto($("recordOutput"), buildRecordCard(state.lastRecord));
    }
    loadSaved();
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

    return {
      createdAt: Date.now(),
      name: $("patientName").value.trim(),
      age: $("age").value.trim(),
      date: $("visitDate").value, // YYYY-MM-DD or ""
      notes: $("notes").value.trim(),
      meds,
    };
  }

  function resetForm() {
    $("visitForm").reset();
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
  // Build a formatted record card from a visit object
  // ---------------------------------------------------------------------------
  function infoRow(labelKey, valueText) {
    return el("div", { class: "info-pair" }, [
      el("dt", { text: t(labelKey) }),
      el("dd", { text: valueText }),
    ]);
  }

  function buildRecordCard(visit) {
    // Header: patient name + generated timestamp
    const head = el("header", { class: "record-head" }, [
      el("h3", { class: "record-name", text: visit.name || t("notProvided") }),
      el("span", {
        class: "record-meta",
        text: `${t("generatedOn")}: ${formatTimestamp(visit.createdAt)}`,
      }),
    ]);

    // Patient info
    const ageText =
      visit.age !== "" && visit.age != null
        ? `${visit.age} ${t("years")}`
        : t("notProvided");

    const info = el("dl", { class: "record-info" }, [
      infoRow("age", ageText),
      infoRow("visitDate", formatDate(visit.date)),
    ]);

    // Notes
    const notesBlock = el("div", { class: "record-notes" }, [
      el("dt", { text: t("notes") }),
      el("dd", { text: visit.notes || t("noNotes") }),
    ]);

    // Medications table
    let medsBlock;
    if (visit.meds && visit.meds.length) {
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
      medsBlock = el("table", { class: "med-table" }, [thead, el("tbody", {}, rows)]);
    } else {
      medsBlock = el("p", { class: "muted", text: t("noMeds") });
    }

    const medsSection = el("div", { class: "record-meds" }, [
      el("h4", { text: t("medications") }),
      medsBlock,
    ]);

    return el("article", { class: "record" }, [head, info, notesBlock, medsSection]);
  }

  function renderInto(container, node) {
    container.innerHTML = "";
    container.appendChild(node);
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

    // Show the generated record and refresh the saved list.
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
