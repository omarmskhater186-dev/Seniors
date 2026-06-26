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
      sectionResume: "Case résumé",
      sectionCurrent: "Current situation",
      sectionVitals: "Vital signs",
      addAlert: "+ Add alert",
      alertText: "Alert (one short line)",
      sectionLabs: "Laboratory investigations",
      sectionAlerts: "Alerts",
      sectionAssessment: "Assessment",
      sectionActionPlan: "Action plan",
      medications: "Medications",
      drugName: "Drug name",
      dosing: "Dosing instructions (Arabic)",
      addMed: "+ Add medication",
      removeMed: "Remove",
      addOther: "+ Add other",
      otherPlaceholder: "Other condition",
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
      medStatus: "Status",
      stoppedThisVisit: "Stopped this visit",
      addLab: "+ Add lab result",
      labTest: "Investigation",
      labTrend: "Trend",
      labSelect: "Select investigation",
      labDate: "Date",
      labValue: "Value",
      noMeds: "No medications recorded.",
      notProvided: "—",
      exportWord: "Download Word record",
      sectionWorklist: "Verification worklist (internal)",
      addWorklistItem: "+ Add item",
      worklistItem: "Item to verify",
      worklistHead: "PRE-ISSUE VERIFICATION · INTERNAL WORKLIST",
      worklistWarn:
        "Not part of the patient record. Do not send to the family. Do not upload to Medesk. Delete before issuing.",
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
      sectionResume: "ملخص الحالة",
      sectionCurrent: "الوضع الحالي",
      sectionVitals: "العلامات الحيوية",
      addAlert: "+ إضافة تنبيه",
      alertText: "تنبيه (سطر واحد قصير)",
      sectionLabs: "الفحوصات المخبرية",
      sectionAlerts: "التنبيهات",
      sectionAssessment: "التقييم",
      sectionActionPlan: "خطة العمل",
      medications: "الأدوية",
      drugName: "اسم الدواء",
      dosing: "تعليمات الجرعة",
      addMed: "+ إضافة دواء",
      removeMed: "حذف",
      addOther: "+ إضافة أخرى",
      otherPlaceholder: "حالة أخرى",
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
      medStatus: "الحالة",
      stoppedThisVisit: "أُوقفت هذه الزيارة",
      addLab: "+ إضافة نتيجة مختبر",
      labTest: "الفحص",
      labTrend: "الاتجاه",
      labSelect: "اختر الفحص",
      labDate: "التاريخ",
      labValue: "القيمة",
      noMeds: "لا توجد أدوية مسجلة.",
      notProvided: "—",
      exportWord: "تنزيل سجل Word",
      sectionWorklist: "قائمة التحقق قبل الإصدار (داخلية)",
      addWorklistItem: "+ إضافة عنصر",
      worklistItem: "عنصر للتحقق",
      worklistHead: "التحقق قبل الإصدار · قائمة عمل داخلية",
      worklistWarn:
        "ليست جزءًا من سجل المريض. لا ترسلها إلى العائلة. لا ترفعها إلى Medesk. احذفها قبل الإصدار.",
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
    document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
      node.setAttribute("aria-label", t(node.getAttribute("data-i18n-aria")));
    });

    document.title = t("appTitle");
    $("langToggle").textContent = t("langToggle");

    // Rebuild config-driven inputs so their labels follow the new language.
    buildVitalsInputs();
    buildGeriatricInputs();
    buildLabInputs();
    buildAlertInputs();
    buildWorklistInputs();
    buildProblemChips();

    if (state.lastRecord) {
      renderInto($("recordOutput"), buildRecordView(state.lastRecord));
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
  // Geriatric assessment inputs (built from config)
  // ---------------------------------------------------------------------------
  function buildGeriatricInputs() {
    const grid = $("geriatricGrid");
    if (!grid) return;
    const prev = {};
    grid.querySelectorAll("[data-geriatric]").forEach((c) => {
      prev[c.getAttribute("data-geriatric")] = c.value;
    });

    grid.innerHTML = "";
    (CFG.geriatric || []).forEach((f) => {
      let control;
      if (f.type === "select") {
        control = el("select", {
          attrs: { id: `ger-${f.id}`, "data-geriatric": f.id },
        });
        control.appendChild(el("option", { text: t("notProvided"), attrs: { value: "" } }));
        (f.options || []).forEach((o) => {
          control.appendChild(el("option", { text: cfgLabel(o), attrs: { value: o.id } }));
        });
      } else {
        control = el("input", {
          attrs: { id: `ger-${f.id}`, type: "text", autocomplete: "off", "data-geriatric": f.id },
        });
      }
      if (prev[f.id] != null) control.value = prev[f.id];

      grid.appendChild(
        el("div", { class: "field" }, [
          el("label", { attrs: { for: `ger-${f.id}` }, text: cfgLabel(f) }),
          control,
        ])
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Verification worklist input rows (internal only)
  // ---------------------------------------------------------------------------
  function makeWorklistRow(text) {
    const input = el("input", {
      class: "worklist-text",
      attrs: { type: "text", autocomplete: "off", "aria-label": t("worklistItem") },
    });
    if (text) input.value = text;
    const removeBtn = el("button", {
      class: "btn btn-remove",
      attrs: { type: "button", "data-i18n": "removeMed" },
      text: t("removeMed"),
    });
    const row = el("div", { class: "worklist-row" }, [
      el("div", { class: "field" }, [input]),
      el("div", { class: "med-row__remove" }, [removeBtn]),
    ]);
    removeBtn.addEventListener("click", () => row.remove());
    return row;
  }

  function readWorklistRows() {
    const items = [];
    document.querySelectorAll("#worklistRows .worklist-row").forEach((r) => {
      const v = r.querySelector(".worklist-text").value.trim();
      if (v) items.push(v);
    });
    return items;
  }

  function buildWorklistInputs() {
    const wrap = $("worklistRows");
    if (!wrap) return;
    const existing = readWorklistRows();
    wrap.innerHTML = "";
    if (!existing.length) wrap.appendChild(makeWorklistRow());
    else existing.forEach((v) => wrap.appendChild(makeWorklistRow(v)));
  }

  // ---------------------------------------------------------------------------
  // Alert input rows (tiered)
  // ---------------------------------------------------------------------------
  function makeAlertRow(data) {
    data = data || {};
    const tierSel = el("select", { class: "alert-tier" });
    (CFG.alertTiers || []).forEach((tr) => {
      tierSel.appendChild(
        el("option", { text: `${tr.emoji} ${cfgLabel(tr)}`, attrs: { value: tr.id } })
      );
    });
    if (data.tier) tierSel.value = data.tier;

    const textInput = el("input", {
      class: "alert-text",
      attrs: { type: "text", autocomplete: "off", "aria-label": t("alertText") },
    });
    if (data.text) textInput.value = data.text;

    const removeBtn = el("button", {
      class: "btn btn-remove",
      attrs: { type: "button", "data-i18n": "removeMed" },
      text: t("removeMed"),
    });
    const row = el("div", { class: "alert-row" }, [
      el("div", { class: "field" }, [tierSel]),
      el("div", { class: "field" }, [textInput]),
      el("div", { class: "med-row__remove" }, [removeBtn]),
    ]);
    removeBtn.addEventListener("click", () => row.remove());
    return row;
  }

  function readAlertRows() {
    const rows = [];
    document.querySelectorAll("#alertRows .alert-row").forEach((r) => {
      const text = r.querySelector(".alert-text").value.trim();
      if (text) rows.push({ tier: r.querySelector(".alert-tier").value, text });
    });
    return rows;
  }

  function buildAlertInputs() {
    const wrap = $("alertRows");
    if (!wrap) return;
    const existing = readAlertRows();
    wrap.innerHTML = "";
    if (!existing.length) wrap.appendChild(makeAlertRow());
    else existing.forEach((d) => wrap.appendChild(makeAlertRow(d)));
  }

  // ---------------------------------------------------------------------------
  // Laboratory investigation input rows (built from config catalog)
  // ---------------------------------------------------------------------------
  function labTestSelect(selectedId) {
    const sel = el("select", { class: "lab-test", attrs: { "aria-label": t("labSelect") } });
    sel.appendChild(el("option", { text: t("labSelect"), attrs: { value: "" } }));
    (CFG.labs || []).forEach((group) => {
      const og = el("optgroup", { attrs: { label: cfgLabel(group) } });
      (group.tests || []).forEach((tst) => {
        const label = cfgLabel(tst) + (tst.unit ? ` (${tst.unit})` : "");
        og.appendChild(el("option", { text: label, attrs: { value: tst.id } }));
      });
      sel.appendChild(og);
    });
    if (selectedId) sel.value = selectedId;
    return sel;
  }

  function makeLabRow(data) {
    data = data || {};
    const testSel = labTestSelect(data.testId);
    const dateInput = el("input", {
      class: "lab-date",
      attrs: { type: "date", "aria-label": t("labDate") },
    });
    if (data.date) dateInput.value = data.date;
    const valueInput = el("input", {
      class: "lab-value",
      attrs: { type: "text", inputmode: "decimal", autocomplete: "off", "aria-label": t("labValue") },
    });
    if (data.value) valueInput.value = data.value;

    const removeBtn = el("button", {
      class: "btn btn-remove",
      attrs: { type: "button", "data-i18n": "removeMed" },
      text: t("removeMed"),
    });
    const row = el("div", { class: "lab-row" }, [
      el("div", { class: "field" }, [testSel]),
      el("div", { class: "field" }, [dateInput]),
      el("div", { class: "field" }, [valueInput]),
      el("div", { class: "med-row__remove" }, [removeBtn]),
    ]);
    removeBtn.addEventListener("click", () => row.remove());
    return row;
  }

  function readLabRows() {
    const rows = [];
    document.querySelectorAll("#labRows .lab-row").forEach((r) => {
      rows.push({
        testId: r.querySelector(".lab-test").value,
        date: r.querySelector(".lab-date").value,
        value: r.querySelector(".lab-value").value.trim(),
      });
    });
    return rows;
  }

  function buildLabInputs() {
    const wrap = $("labRows");
    if (!wrap) return;
    const existing = readLabRows();
    wrap.innerHTML = "";
    if (!existing.length) {
      wrap.appendChild(makeLabRow());
    } else {
      existing.forEach((d) => wrap.appendChild(makeLabRow(d)));
    }
  }

  // ---------------------------------------------------------------------------
  // Problem list chips (built from config; supports free-text "other")
  // ---------------------------------------------------------------------------
  function makeChip(id, label, on) {
    const chip = el("button", {
      class: "chip" + (on ? " chip--on" : ""),
      attrs: { type: "button", "aria-pressed": on ? "true" : "false", "data-problem-id": id },
      text: label,
    });
    chip.addEventListener("click", () => {
      const now = chip.getAttribute("aria-pressed") === "true";
      chip.setAttribute("aria-pressed", now ? "false" : "true");
      chip.classList.toggle("chip--on", !now);
    });
    return chip;
  }

  function makeCustomChip(text) {
    const chip = el("button", {
      class: "chip chip--on chip--custom",
      attrs: { type: "button", "aria-pressed": "true", "data-problem-text": text },
    });
    chip.appendChild(document.createTextNode(text + " "));
    chip.appendChild(el("span", { class: "chip__x", text: "×", attrs: { "aria-hidden": "true" } }));
    chip.addEventListener("click", () => chip.remove());
    return chip;
  }

  function buildProblemChips() {
    const wrap = $("problemChips");
    if (!wrap) return;
    // Preserve current selection / custom entries across a rebuild.
    const selected = new Set();
    const customs = [];
    wrap.querySelectorAll(".chip").forEach((ch) => {
      const id = ch.getAttribute("data-problem-id");
      const text = ch.getAttribute("data-problem-text");
      if (id && ch.getAttribute("aria-pressed") === "true") selected.add(id);
      if (text) customs.push(text);
    });

    wrap.innerHTML = "";
    (CFG.problems || []).forEach((pr) => {
      wrap.appendChild(makeChip(pr.id, cfgLabel(pr), selected.has(pr.id)));
    });
    customs.forEach((text) => wrap.appendChild(makeCustomChip(text)));
  }

  function addCustomProblem() {
    const inp = $("problemOther");
    const v = inp.value.trim();
    if (!v) return;
    $("problemChips").appendChild(makeCustomChip(v));
    inp.value = "";
    inp.focus();
  }

  // ---------------------------------------------------------------------------
  // Medication rows
  // ---------------------------------------------------------------------------
  // Shared <datalist> of brand names (from config) for the drug-name fields.
  function buildDrugDatalist() {
    let dl = $("drugListOptions");
    if (!dl) {
      dl = el("datalist", { attrs: { id: "drugListOptions" } });
      document.body.appendChild(dl);
    }
    dl.innerHTML = "";
    (CFG.drugs || []).forEach((name) => {
      dl.appendChild(el("option", { attrs: { value: name } }));
    });
  }

  function buildMedRow() {
    const id = ++medCounter;

    const drugLabel = el("label", {
      attrs: { for: `drug-${id}`, "data-i18n": "drugName" },
      text: t("drugName"),
    });
    const drugInput = el("input", {
      class: "drug",
      // `list` links to the shared brand-name datalist for searchable suggestions.
      attrs: { id: `drug-${id}`, type: "text", autocomplete: "off", list: "drugListOptions" },
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

    // Change-status selector (new / unchanged / increased / decreased / stopped).
    const codeLabel = el("label", {
      attrs: { for: `code-${id}`, "data-i18n": "medStatus" },
      text: t("medStatus"),
    });
    const codeSelect = el("select", {
      class: "med-code",
      attrs: { id: `code-${id}`, "data-medcode": "" },
    });
    (CFG.medCodes || []).forEach((c) => {
      const label = (c.symbol ? c.symbol + " " : "") + cfgLabel(c);
      codeSelect.appendChild(el("option", { text: label, attrs: { value: c.id } }));
    });
    codeSelect.value = "unchanged";

    const removeBtn = el("button", {
      class: "btn btn-remove",
      attrs: { type: "button", "data-i18n": "removeMed" },
      text: t("removeMed"),
    });
    removeBtn.addEventListener("click", () => row.remove());

    const row = el("div", { class: "med-row" }, [
      el("div", { class: "field" }, [drugLabel, drugInput]),
      el("div", { class: "field" }, [doseLabel, doseInput]),
      el("div", { class: "field" }, [codeLabel, codeSelect]),
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
        const codeEl = row.querySelector(".med-code");
        const code = codeEl ? codeEl.value : "unchanged";
        if (drug || dosing) meds.push({ drug, dosing, code });
      });

    const vitals = {};
    document.querySelectorAll("#vitalsGrid input[data-vital]").forEach((i) => {
      const val = i.value.trim();
      if (val) vitals[i.getAttribute("data-vital")] = val;
    });

    const geriatric = {};
    document.querySelectorAll("#geriatricGrid [data-geriatric]").forEach((c) => {
      const val = c.value.trim();
      if (val) geriatric[c.getAttribute("data-geriatric")] = val;
    });

    const labs = readLabRows().filter((r) => r.testId && r.value);
    const alerts = readAlertRows();
    const verification = readWorklistRows();

    const problems = [];
    document.querySelectorAll("#problemChips .chip").forEach((ch) => {
      if (ch.getAttribute("aria-pressed") !== "true") return;
      const id = ch.getAttribute("data-problem-id");
      const text = ch.getAttribute("data-problem-text");
      if (id) problems.push({ id });
      else if (text) problems.push({ text });
    });

    return {
      createdAt: Date.now(),
      name: $("patientName").value.trim(),
      age: $("age").value.trim(),
      date: $("visitDate").value, // YYYY-MM-DD or ""
      caseResume: $("caseResume").value.trim(),
      problems,
      geriatric,
      currentSituation: $("currentSituation").value.trim(),
      vitals,
      labs,
      alerts,
      assessment: $("assessment").value.trim(),
      actionPlan: $("actionPlan").value.trim(),
      meds,
      verification,
    };
  }

  function resetForm() {
    $("visitForm").reset();
    $("problemChips").innerHTML = "";
    $("labRows").innerHTML = "";
    $("alertRows").innerHTML = "";
    $("worklistRows").innerHTML = "";
    buildVitalsInputs();
    buildGeriatricInputs();
    buildLabInputs();
    buildAlertInputs();
    buildWorklistInputs();
    buildProblemChips();
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

  function problemsBlock(visit) {
    const list = visit.problems || [];
    if (!list.length) return null;
    return el(
      "div",
      { class: "chips chips--readonly" },
      list.map((pr) => {
        let label;
        if (pr.id) {
          const item = (CFG.problems || []).find((x) => x.id === pr.id);
          label = item ? cfgLabel(item) : pr.id;
        } else {
          label = pr.text;
        }
        return el("span", { class: "chip chip--on", text: label });
      })
    );
  }

  function resumeBanner(visit) {
    if (!visit.caseResume) return null;
    return el("div", { class: "case-resume" }, [
      el("p", { class: "case-resume__label", text: t("sectionResume") }),
      el("p", { class: "case-resume__text", text: visit.caseResume }),
    ]);
  }

  function alertsBlock(visit) {
    const alerts = visit.alerts || [];
    if (!alerts.length) return null;
    return el(
      "div",
      { class: "alert-list" },
      alerts.map((a) => {
        const tier = (CFG.alertTiers || []).find((x) => x.id === a.tier);
        const emoji = tier ? tier.emoji : "•";
        return el("div", { class: `alert alert--${a.tier}` }, [
          el("span", { class: "alert__icon", text: emoji, attrs: { "aria-hidden": "true" } }),
          el("span", { class: "alert__text", text: a.text }),
        ]);
      })
    );
  }

  function geriatricBlock(visit) {
    const g = visit.geriatric || {};
    const items = (CFG.geriatric || []).filter((f) => g[f.id]);
    if (!items.length) return null;
    return el(
      "dl",
      { class: "rec-grid" },
      items.map((f) => {
        let value = g[f.id];
        if (f.type === "select") {
          const opt = (f.options || []).find((o) => o.id === value);
          value = opt ? cfgLabel(opt) : value;
        }
        return el("div", { class: "info-pair" }, [
          el("dt", { text: cfgLabel(f) }),
          el("dd", { text: value }),
        ]);
      })
    );
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

  // Trend for a test: arrow shows numeric movement; colour shows whether the
  // value moved toward (improving) or away from (worsening) the normal range.
  function computeTrend(test, orderedValues) {
    const seq = orderedValues.filter((n) => isFinite(n));
    if (seq.length < 2) return null;
    const prev = seq[seq.length - 2];
    const cur = seq[seq.length - 1];
    if (cur === prev) return { arrow: "→", kind: "stable" };
    const arrow = cur > prev ? "↑" : "↓";
    let kind = "stable";
    if (test.low != null || test.high != null) {
      const dist = (v) => {
        if (test.low != null && v < test.low) return test.low - v;
        if (test.high != null && v > test.high) return v - test.high;
        return 0;
      };
      const dp = dist(prev);
      const dc = dist(cur);
      if (dc < dp) kind = "improving";
      else if (dc > dp) kind = "worsening";
    }
    return { arrow, kind };
  }

  function findTest(testId) {
    for (const group of CFG.labs || []) {
      const found = (group.tests || []).find((x) => x.id === testId);
      if (found) return { group, test: found };
    }
    return null;
  }

  function labsBlock(visit) {
    const entries = (visit.labs || []).filter((e) => e.testId && e.value && String(e.value).trim());
    if (!entries.length) return null;

    const dates = Array.from(new Set(entries.map((e) => e.date || ""))).sort();
    const byTest = {};
    entries.forEach((e) => {
      (byTest[e.testId] = byTest[e.testId] || {})[e.date || ""] = String(e.value).trim();
    });

    const headCells = [el("th", { class: "lab-name-h", text: t("labTest") })];
    dates.forEach((d) =>
      headCells.push(el("th", { text: d ? formatDate(d) : t("notProvided") }))
    );
    headCells.push(el("th", { class: "lab-trend-h", text: t("labTrend") }));

    const tbody = el("tbody", {});
    (CFG.labs || []).forEach((group) => {
      const tests = (group.tests || []).filter((tst) => byTest[tst.id]);
      if (!tests.length) return;
      tbody.appendChild(
        el("tr", { class: "lab-group" }, [
          el("td", {
            class: "lab-group__cell",
            attrs: { colspan: String(dates.length + 2) },
            text: cfgLabel(group),
          }),
        ])
      );
      tests.forEach((tst) => {
        const cells = [
          el("td", { class: "lab-name", text: cfgLabel(tst) + (tst.unit ? ` (${tst.unit})` : "") }),
        ];
        const ordered = [];
        dates.forEach((d) => {
          const v = byTest[tst.id][d];
          const td = el("td", { class: "lab-val" });
          if (v != null && v !== "") {
            const num = parseFloat(v);
            if (isFinite(num)) {
              ordered.push(num);
              const out =
                (tst.low != null && num < tst.low) || (tst.high != null && num > tst.high);
              if (out) td.classList.add("lab-out");
            }
            td.textContent = v;
          }
          cells.push(td);
        });
        const trend = computeTrend(tst, ordered);
        const trendCell = el("td", { class: "lab-trend" });
        if (trend) {
          trendCell.appendChild(
            el("span", { class: `trend trend--${trend.kind}`, text: trend.arrow })
          );
        }
        cells.push(trendCell);
        tbody.appendChild(el("tr", { class: "lab-data-row" }, cells));
      });
    });

    if (!tbody.children.length) return null;
    const table = el("table", { class: "lab-table" }, [
      el("thead", {}, [el("tr", {}, headCells)]),
      tbody,
    ]);
    return el("div", { class: "lab-wrap" }, [table]);
  }

  function medBadge(code) {
    const c = (CFG.medCodes || []).find((x) => x.id === code);
    if (!c || c.tone === "neutral") return null;
    return el("span", {
      class: `med-badge med-badge--${c.tone}`,
      text: (c.symbol ? c.symbol + " " : "") + cfgLabel(c),
    });
  }

  function medTable(list, stopped) {
    const thead = el("thead", {}, [
      el("tr", {}, [
        el("th", { text: t("medColDrug") }),
        el("th", { text: t("medColDosing") }),
      ]),
    ]);
    const rows = list.map((m) => {
      const drugCell = el("td", { class: "med-drug" });
      const badge = medBadge(m.code);
      if (badge) {
        drugCell.appendChild(badge);
        drugCell.appendChild(document.createTextNode(" "));
      }
      drugCell.appendChild(document.createTextNode(m.drug || t("notProvided")));
      // Dosing cell is always Arabic, right-to-left, shown verbatim.
      const doseCell = el("td", {
        class: "med-dose arabic",
        text: m.dosing || t("notProvided"),
        attrs: { dir: "rtl", lang: "ar" },
      });
      return el("tr", {}, [drugCell, doseCell]);
    });
    return el("table", { class: "med-table" + (stopped ? " med-table--stopped" : "") }, [
      thead,
      el("tbody", {}, rows),
    ]);
  }

  function medsBlock(visit) {
    const meds = visit.meds || [];
    if (!meds.length) return null;
    const active = meds.filter((m) => m.code !== "stopped");
    const stopped = meds.filter((m) => m.code === "stopped");

    const wrap = el("div", { class: "rec-meds" });
    if (active.length) wrap.appendChild(medTable(active, false));
    if (stopped.length) {
      wrap.appendChild(el("h5", { class: "med-stopped-title", text: t("stoppedThisVisit") }));
      wrap.appendChild(medTable(stopped, true));
    }
    return wrap;
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
      recordSection("sectionProblems", problemsBlock(visit)),
      recordSection("sectionGeriatric", geriatricBlock(visit)),
      recordSection("sectionCurrent", textBlock(visit.currentSituation || visit.notes)),
      recordSection("sectionVitals", vitalsBlock(visit)),
      recordSection("sectionLabs", labsBlock(visit)),
      recordSection("sectionAlerts", alertsBlock(visit)),
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

    const top = [resumeBanner(visit), head, info].filter(Boolean);
    return el("article", { class: "record" }, top.concat(sections, [actions]));
  }

  // The verification worklist is a separate, detachable block AFTER the record
  // — never part of the patient record body.
  function worklistBlock(visit) {
    const items = visit.verification || [];
    if (!items.length) return null;
    return el("section", { class: "worklist" }, [
      el("h3", { class: "worklist__head", text: t("worklistHead") }),
      el("p", { class: "worklist__warn", text: t("worklistWarn") }),
      el(
        "ul",
        { class: "worklist__items" },
        items.map((it) => el("li", { text: it }))
      ),
    ]);
  }

  // A full record view: the record card plus its detachable worklist (if any).
  function buildRecordView(visit) {
    const view = el("div", { class: "record-view" }, [buildRecordCard(visit)]);
    const wl = worklistBlock(visit);
    if (wl) view.appendChild(wl);
    return view;
  }

  // Lab data shaped for the exporter (mirrors labsBlock aggregation).
  function buildLabsExport(visit) {
    const entries = (visit.labs || []).filter((e) => e.testId && e.value && String(e.value).trim());
    if (!entries.length) return null;
    const dates = Array.from(new Set(entries.map((e) => e.date || ""))).sort();
    const byTest = {};
    entries.forEach((e) => {
      (byTest[e.testId] = byTest[e.testId] || {})[e.date || ""] = String(e.value).trim();
    });
    const groups = [];
    (CFG.labs || []).forEach((group) => {
      const tests = (group.tests || []).filter((tst) => byTest[tst.id]);
      if (!tests.length) return;
      const rows = tests.map((tst) => {
        const ordered = [];
        const cells = dates.map((d) => {
          const v = byTest[tst.id][d];
          if (v == null || v === "") return { value: "" };
          const num = parseFloat(v);
          let out = false;
          if (isFinite(num)) {
            ordered.push(num);
            out = (tst.low != null && num < tst.low) || (tst.high != null && num > tst.high);
          }
          return { value: v, out };
        });
        return {
          name: cfgLabel(tst) + (tst.unit ? ` (${tst.unit})` : ""),
          cells,
          trend: computeTrend(tst, ordered),
        };
      });
      groups.push({ name: cfgLabel(group), rows });
    });
    return {
      dates: dates.map((d) => ({ label: d ? formatDate(d) : t("notProvided") })),
      testLabel: t("labTest"),
      trendLabel: t("labTrend"),
      groups,
    };
  }

  // Full localized payload for the .docx exporter (single source of truth).
  function buildExportLabels(visit) {
    const name = visit.name || t("notProvided");
    const ageValue =
      visit.age !== "" && visit.age != null ? `${visit.age} ${t("years")}` : t("notProvided");

    const problems = (visit.problems || []).map((pr) => {
      if (pr.id) {
        const it = (CFG.problems || []).find((x) => x.id === pr.id);
        return it ? cfgLabel(it) : pr.id;
      }
      return pr.text;
    });

    const geriatric = (CFG.geriatric || [])
      .filter((f) => (visit.geriatric || {})[f.id])
      .map((f) => {
        let val = visit.geriatric[f.id];
        if (f.type === "select") {
          const o = (f.options || []).find((x) => x.id === val);
          val = o ? cfgLabel(o) : val;
        }
        return { k: cfgLabel(f), v: val };
      });

    const vitals = (CFG.vitals || [])
      .filter((v) => (visit.vitals || {})[v.id])
      .map((v) => ({ k: cfgLabel(v), v: visit.vitals[v.id] + (v.unit ? ` ${v.unit}` : "") }));

    const alerts = (visit.alerts || []).map((a) => {
      const tier = (CFG.alertTiers || []).find((x) => x.id === a.tier);
      return { tier: a.tier, emoji: tier ? tier.emoji : "", text: a.text };
    });

    const mapMed = (m) => {
      const c = (CFG.medCodes || []).find((x) => x.id === m.code);
      const badge =
        c && c.tone !== "neutral"
          ? { text: (c.symbol ? c.symbol + " " : "") + cfgLabel(c), tone: c.tone }
          : null;
      return { badge, drug: m.drug || t("notProvided"), dosing: m.dosing || t("notProvided") };
    };
    const activeMeds = (visit.meds || []).filter((m) => m.code !== "stopped").map(mapMed);
    const stoppedMeds = (visit.meds || []).filter((m) => m.code === "stopped").map(mapMed);

    return {
      lang: state.lang,
      dir: state.lang === "ar" ? "rtl" : "ltr",
      headerTitle: `${t("recordHeading")} — ${name}`,
      name,
      generatedText: `${t("generatedOn")}: ${formatTimestamp(visit.createdAt)}`,
      noneRecorded: t("noneRecorded"),
      patient: {
        ageLabel: t("age"),
        ageValue,
        dateLabel: t("visitDate"),
        dateValue: formatDate(visit.date),
      },
      resume: visit.caseResume ? { label: t("sectionResume"), text: visit.caseResume } : null,
      sections: [
        { type: "chips", title: t("sectionProblems"), items: problems },
        { type: "pairs", title: t("sectionGeriatric"), pairs: geriatric },
        { type: "text", title: t("sectionCurrent"), text: visit.currentSituation || visit.notes || "" },
        { type: "pairs", title: t("sectionVitals"), pairs: vitals },
        { type: "labs", title: t("sectionLabs"), labs: buildLabsExport(visit) },
        { type: "alerts", title: t("sectionAlerts"), items: alerts },
        { type: "text", title: t("sectionAssessment"), text: visit.assessment },
        { type: "text", title: t("sectionActionPlan"), text: visit.actionPlan },
        {
          type: "meds",
          title: t("medications"),
          active: activeMeds,
          stopped: stoppedMeds,
          stoppedLabel: t("stoppedThisVisit"),
          drugCol: t("medColDrug"),
          dosingCol: t("medColDosing"),
        },
      ],
      worklist:
        visit.verification && visit.verification.length
          ? { head: t("worklistHead"), warn: t("worklistWarn"), items: visit.verification.slice() }
          : null,
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
    visits.forEach((v) => list.appendChild(buildRecordView(v)));
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
    renderInto($("recordOutput"), buildRecordView(visit));
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

    buildDrugDatalist();
    buildVitalsInputs();
    buildGeriatricInputs();
    buildLabInputs();
    buildAlertInputs();
    buildWorklistInputs();
    buildProblemChips();
    $("medsList").appendChild(buildMedRow());

    $("addLab").addEventListener("click", () => {
      $("labRows").appendChild(makeLabRow());
    });

    $("addAlert").addEventListener("click", () => {
      $("alertRows").appendChild(makeAlertRow());
    });

    $("addWorklist").addEventListener("click", () => {
      $("worklistRows").appendChild(makeWorklistRow());
    });

    $("addProblem").addEventListener("click", addCustomProblem);
    $("problemOther").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addCustomProblem();
      }
    });

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
