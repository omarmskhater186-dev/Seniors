/*
 * export.js — Seniors Med Word (.docx) export
 *
 * Self-contained, zero-dependency .docx generator. A .docx is a ZIP of XML
 * (OOXML) parts; we build the XML and the ZIP by hand so nothing is fetched
 * from the internet at run-time (it can't be blocked or fail offline).
 *
 * Exposes window.SeniorsExport.downloadDocx(visit, L), where L is a fully
 * localized payload built by app.js (translation + formatting live there).
 * Medication dosing is taken verbatim and rendered right-to-left.
 */
(function () {
  "use strict";

  // House-style palette (no leading '#').
  var AEGEAN = "144053";
  var OCEANA = "489399";
  var BABY = "6dcad6";
  var METAL = "9c9da0";
  var CLOUDY = "dddddd";
  var GREEN = "2e7d32";
  var RED = "c0392b";
  var AMBER = "b8860b";

  var FONT_EN = "Montserrat";
  var FONT_AR = "DG Sahabah";

  // --- XML helpers ----------------------------------------------------------
  function xmlEscape(s) {
    return String(s == null ? "" : s)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function run(text, o) {
    o = o || {};
    var font = o.font || FONT_EN;
    var size = o.size || 22;
    var rpr = [];
    rpr.push('<w:rFonts w:ascii="' + font + '" w:hAnsi="' + font + '" w:cs="' + font + '"/>');
    if (o.bold) rpr.push("<w:b/><w:bCs/>");
    if (o.color) rpr.push('<w:color w:val="' + o.color + '"/>');
    rpr.push('<w:sz w:val="' + size + '"/><w:szCs w:val="' + size + '"/>');
    if (o.rtl) rpr.push("<w:rtl/>");
    var parts = String(text == null ? "" : text)
      .split("\n")
      .map(function (t) {
        return '<w:t xml:space="preserve">' + xmlEscape(t) + "</w:t>";
      })
      .join("<w:br/>");
    return "<w:r><w:rPr>" + rpr.join("") + "</w:rPr>" + parts + "</w:r>";
  }

  function para(runsXml, o) {
    o = o || {};
    var ppr = [];
    if (o.bidi) ppr.push("<w:bidi/>");
    if (o.accent) {
      ppr.push('<w:pBdr><w:bottom w:val="single" w:sz="12" w:space="3" w:color="' + BABY + '"/></w:pBdr>');
    }
    if (o.align) ppr.push('<w:jc w:val="' + o.align + '"/>');
    ppr.push('<w:spacing w:after="' + (o.spacingAfter == null ? 120 : o.spacingAfter) + '"/>');
    return "<w:p><w:pPr>" + ppr.join("") + "</w:pPr>" + runsXml + "</w:p>";
  }

  function tc(pXml, o) {
    o = o || {};
    var inner = "";
    if (o.fill) inner += '<w:shd w:val="clear" w:color="auto" w:fill="' + o.fill + '"/>';
    if (o.leftBorder) {
      inner += '<w:tcBorders><w:left w:val="single" w:sz="24" w:space="0" w:color="' + o.leftBorder + '"/></w:tcBorders>';
    }
    var span = o.colspan ? '<w:gridSpan w:val="' + o.colspan + '"/>' : "";
    return (
      '<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/>' + span + inner +
      '<w:vAlign w:val="center"/></w:tcPr>' + pXml + "</w:tc>"
    );
  }

  function tr(cellsXml) {
    return "<w:tr>" + cellsXml + "</w:tr>";
  }

  function tableBorders(color) {
    return ["top", "left", "bottom", "right", "insideH", "insideV"]
      .map(function (s) {
        return '<w:' + s + ' w:val="single" w:sz="4" w:space="0" w:color="' + color + '"/>';
      })
      .join("");
  }

  // --- Section renderers ----------------------------------------------------
  function sectionTitle(title, A, rtl) {
    return para(run(title, { size: 26, bold: true, color: AEGEAN }), {
      align: A, bidi: rtl, accent: true, spacingAfter: 80,
    });
  }

  function nonePara(L, A, rtl) {
    return para(run(L.noneRecorded, { color: METAL }), { align: A, bidi: rtl, spacingAfter: 160 });
  }

  function textSection(text, L, A, rtl) {
    var value = text && String(text).trim() ? text : L.noneRecorded;
    var color = text && String(text).trim() ? null : METAL;
    return para(run(value, { color: color }), { align: A, bidi: rtl, spacingAfter: 160 });
  }

  function chipsSection(items, L, A, rtl) {
    if (!items || !items.length) return nonePara(L, A, rtl);
    return para(run(items.join("   •   "), {}), { align: A, bidi: rtl, spacingAfter: 160 });
  }

  function pairsSection(pairs, L, A, rtl) {
    if (!pairs || !pairs.length) return nonePara(L, A, rtl);
    return pairs
      .map(function (p) {
        return para(run(p.k + ": ", { bold: true, color: OCEANA }) + run(p.v, {}), {
          align: A, bidi: rtl, spacingAfter: 40,
        });
      })
      .join("");
  }

  function alertsSection(items, L, A, rtl) {
    if (!items || !items.length) return nonePara(L, A, rtl);
    var colorFor = { red: RED, amber: AMBER, green: GREEN };
    return items
      .map(function (a) {
        return para(
          run((a.emoji ? a.emoji + " " : "") + a.text, { color: colorFor[a.tier] || null, bold: true }),
          { align: A, bidi: rtl, spacingAfter: 40 }
        );
      })
      .join("");
  }

  function medTable(list, stopped, L) {
    var header = tr(
      tc(para(run(L.drugCol, { bold: true, color: AEGEAN }), { spacingAfter: 0 }), { fill: CLOUDY }) +
        tc(para(run(L.dosingCol, { bold: true, color: AEGEAN }), { spacingAfter: 0, align: "right" }), { fill: CLOUDY })
    );
    var rows = list
      .map(function (m) {
        var drugRuns = "";
        if (m.badge) {
          drugRuns += run((m.badge.text || "") + "  ", {
            bold: true, color: m.badge.tone === "neg" ? RED : OCEANA,
          });
        }
        drugRuns += run(m.drug, stopped ? { color: METAL } : {});
        return tr(
          tc(para(drugRuns, { spacingAfter: 0 })) +
            tc(para(run(m.dosing, { font: FONT_AR, rtl: true }), { spacingAfter: 0, bidi: true, align: "right" }))
        );
      })
      .join("");
    return (
      "<w:tbl><w:tblPr><w:tblW w:w=\"5000\" w:type=\"pct\"/><w:tblBorders>" +
      tableBorders(CLOUDY) +
      "</w:tblBorders></w:tblPr>" +
      '<w:tblGrid><w:gridCol w:w="4675"/><w:gridCol w:w="4675"/></w:tblGrid>' +
      header + rows + "</w:tbl>"
    );
  }

  function medsSection(s, L, A, rtl) {
    var hasAny = (s.active && s.active.length) || (s.stopped && s.stopped.length);
    if (!hasAny) return nonePara(L, A, rtl);
    var out = "";
    if (s.active && s.active.length) out += medTable(s.active, false, s);
    if (s.stopped && s.stopped.length) {
      out += para(run(s.stoppedLabel, { bold: true, color: RED }), { align: A, bidi: rtl, spacingAfter: 40 });
      out += medTable(s.stopped, true, s);
    }
    out += "<w:p/>";
    return out;
  }

  function labsSection(labs, L, A, rtl) {
    if (!labs || !labs.groups || !labs.groups.length) return nonePara(L, A, rtl);
    var nCols = labs.dates.length + 2;

    var headCells =
      tc(para(run(labs.testLabel, { bold: true, color: AEGEAN }), { spacingAfter: 0 }), { fill: CLOUDY });
    labs.dates.forEach(function (d) {
      headCells += tc(para(run(d.label, { bold: true, color: AEGEAN }), { spacingAfter: 0 }), { fill: CLOUDY });
    });
    headCells += tc(para(run(labs.trendLabel, { bold: true, color: AEGEAN }), { spacingAfter: 0 }), { fill: CLOUDY });

    var body = tr(headCells);
    labs.groups.forEach(function (g) {
      // Green group header row spanning all columns.
      body += tr(
        tc(para(run(g.name, { bold: true, color: "ffffff" }), { spacingAfter: 0 }), {
          fill: GREEN, colspan: nCols,
        })
      );
      g.rows.forEach(function (rrow) {
        var cells = tc(para(run(rrow.name, { bold: true }), { spacingAfter: 0 }), { leftBorder: AEGEAN });
        rrow.cells.forEach(function (c) {
          var opts = c.out ? { bold: true, color: RED } : {};
          cells += tc(para(run(c.value || "", opts), { spacingAfter: 0 }));
        });
        var trendColor = METAL;
        var arrow = "";
        if (rrow.trend) {
          arrow = rrow.trend.arrow;
          trendColor =
            rrow.trend.kind === "improving" ? GREEN : rrow.trend.kind === "worsening" ? RED : METAL;
        }
        cells += tc(para(run(arrow, { color: trendColor, bold: true }), { spacingAfter: 0 }));
        body += tr(cells);
      });
    });

    return (
      "<w:tbl><w:tblPr><w:tblW w:w=\"5000\" w:type=\"pct\"/><w:tblBorders>" +
      tableBorders(CLOUDY) +
      "</w:tblBorders></w:tblPr>" +
      body + "</w:tbl><w:p/>"
    );
  }

  function renderSection(s, L, A, rtl) {
    var out = sectionTitle(s.title, A, rtl);
    if (s.type === "text") out += textSection(s.text, L, A, rtl);
    else if (s.type === "chips") out += chipsSection(s.items, L, A, rtl);
    else if (s.type === "pairs") out += pairsSection(s.pairs, L, A, rtl);
    else if (s.type === "alerts") out += alertsSection(s.items, L, A, rtl);
    else if (s.type === "meds") out += medsSection(s, L, A, rtl);
    else if (s.type === "labs") out += labsSection(s.labs, L, A, rtl);
    else out += nonePara(L, A, rtl);
    return out;
  }

  // --- Document parts -------------------------------------------------------
  var W_NS =
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

  function documentXml(L) {
    var rtl = L.dir === "rtl";
    var A = rtl ? "right" : "left";
    var blocks = [];

    // Case résumé banner (read-first).
    if (L.resume) {
      blocks.push(
        para(run(L.resume.label, { bold: true, color: OCEANA, size: 20 }), {
          align: A, bidi: rtl, spacingAfter: 20,
        })
      );
      blocks.push(
        para(run(L.resume.text, { size: 24 }), { align: A, bidi: rtl, accent: true, spacingAfter: 200 })
      );
    }

    // Patient name + details.
    blocks.push(
      para(run(L.name, { size: 32, bold: true, color: AEGEAN }), { align: A, bidi: rtl, spacingAfter: 40 })
    );
    blocks.push(
      para(run(L.patient.ageLabel + ": ", { bold: true, color: OCEANA }) + run(L.patient.ageValue, {}), {
        align: A, bidi: rtl, spacingAfter: 20,
      })
    );
    blocks.push(
      para(run(L.patient.dateLabel + ": ", { bold: true, color: OCEANA }) + run(L.patient.dateValue, {}), {
        align: A, bidi: rtl, spacingAfter: 20,
      })
    );
    blocks.push(para(run(L.generatedText, { color: METAL, size: 20 }), { align: A, bidi: rtl, spacingAfter: 200 }));

    // Ordered record sections.
    L.sections.forEach(function (s) {
      blocks.push(renderSection(s, L, A, rtl));
    });

    // Verification worklist on a NEW page (detachable, never part of the record).
    if (L.worklist) {
      blocks.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
      blocks.push(
        para(run(L.worklist.head, { bold: true, color: RED, size: 26 }), { align: A, bidi: rtl, spacingAfter: 40 })
      );
      blocks.push(
        para(run(L.worklist.warn, { color: RED, bold: true }), { align: A, bidi: rtl, spacingAfter: 120 })
      );
      L.worklist.items.forEach(function (it) {
        blocks.push(para(run("•  " + it, {}), { align: A, bidi: rtl, spacingAfter: 40 }));
      });
    }

    blocks.push("<w:p/>");

    var sectPr =
      "<w:sectPr>" +
      '<w:headerReference w:type="default" r:id="rId1"/>' +
      '<w:footerReference w:type="default" r:id="rId2"/>' +
      (rtl ? "<w:bidi/>" : "") +
      '<w:pgSz w:w="11906" w:h="16838"/>' +
      '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>' +
      "</w:sectPr>";

    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      "<w:document " + W_NS + "><w:body>" + blocks.join("") + sectPr + "</w:body></w:document>"
    );
  }

  function headerXml(L) {
    var rtl = L.dir === "rtl";
    var p = para(run(L.headerTitle, { size: 22, bold: true, color: AEGEAN }), {
      align: rtl ? "right" : "left", bidi: rtl, accent: true, spacingAfter: 0,
    });
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ' + W_NS + ">" + p + "</w:hdr>";
  }

  function footerXml() {
    var fr = '<w:rPr><w:rFonts w:ascii="' + FONT_EN + '" w:hAnsi="' + FONT_EN + '"/><w:color w:val="' + METAL + '"/></w:rPr>';
    var p =
      '<w:p><w:pPr><w:jc w:val="center"/></w:pPr>' +
      "<w:r>" + fr + '<w:fldChar w:fldCharType="begin"/></w:r>' +
      "<w:r>" + fr + '<w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>' +
      "<w:r>" + fr + '<w:fldChar w:fldCharType="end"/></w:r>' +
      "</w:p>";
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ' + W_NS + ">" + p + "</w:ftr>";
  }

  function stylesXml() {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      "<w:styles " + W_NS + "><w:docDefaults><w:rPrDefault><w:rPr>" +
      '<w:rFonts w:ascii="' + FONT_EN + '" w:hAnsi="' + FONT_EN + '" w:cs="' + FONT_AR + '"/>' +
      '<w:sz w:val="22"/><w:szCs w:val="22"/>' +
      "</w:rPr></w:rPrDefault></w:docDefaults>" +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>' +
      "</w:styles>"
    );
  }

  var CONTENT_TYPES =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' +
    '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' +
    "</Types>";

  var ROOT_RELS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    "</Relationships>";

  var DOC_RELS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' +
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    "</Relationships>";

  // --- ZIP writer (stored / no compression) ---------------------------------
  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(buf) {
    var c = 0xffffffff;
    for (var i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function pushU16(a, n) { a.push(n & 0xff, (n >> 8) & 0xff); }
  function pushU32(a, n) { a.push(n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff); }
  function pushBytes(a, b) { for (var i = 0; i < b.length; i++) a.push(b[i]); }

  function zipStore(files) {
    var enc = new TextEncoder();
    var out = [];
    var central = [];
    var DOSTIME = 0;
    var DOSDATE = 0x0021;

    files.forEach(function (f) {
      var nameBytes = enc.encode(f.name);
      var data = f.data || enc.encode(f.xml);
      var crc = crc32(data);
      var offset = out.length;
      pushU32(out, 0x04034b50); pushU16(out, 20); pushU16(out, 0x0800); pushU16(out, 0);
      pushU16(out, DOSTIME); pushU16(out, DOSDATE);
      pushU32(out, crc); pushU32(out, data.length); pushU32(out, data.length);
      pushU16(out, nameBytes.length); pushU16(out, 0);
      pushBytes(out, nameBytes); pushBytes(out, data);
      central.push({ nameBytes: nameBytes, crc: crc, size: data.length, offset: offset });
    });

    var cdStart = out.length;
    central.forEach(function (c) {
      pushU32(out, 0x02014b50); pushU16(out, 20); pushU16(out, 20); pushU16(out, 0x0800); pushU16(out, 0);
      pushU16(out, DOSTIME); pushU16(out, DOSDATE);
      pushU32(out, c.crc); pushU32(out, c.size); pushU32(out, c.size);
      pushU16(out, c.nameBytes.length); pushU16(out, 0); pushU16(out, 0);
      pushU16(out, 0); pushU16(out, 0); pushU32(out, 0); pushU32(out, c.offset);
      pushBytes(out, c.nameBytes);
    });
    var cdEnd = out.length;

    pushU32(out, 0x06054b50); pushU16(out, 0); pushU16(out, 0);
    pushU16(out, central.length); pushU16(out, central.length);
    pushU32(out, cdEnd - cdStart); pushU32(out, cdStart); pushU16(out, 0);

    return new Uint8Array(out);
  }

  // --- Public API -----------------------------------------------------------
  function buildDocxBytes(visit, L) {
    var parts = [
      { name: "[Content_Types].xml", xml: CONTENT_TYPES },
      { name: "_rels/.rels", xml: ROOT_RELS },
      { name: "word/document.xml", xml: documentXml(L) },
      { name: "word/_rels/document.xml.rels", xml: DOC_RELS },
      { name: "word/styles.xml", xml: stylesXml() },
      { name: "word/header1.xml", xml: headerXml(L) },
      { name: "word/footer1.xml", xml: footerXml() },
    ];
    return zipStore(parts);
  }

  function safeName(s) {
    return String(s || "").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function downloadDocx(visit, L) {
    var bytes = buildDocxBytes(visit, L);
    var blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    var dateStr = visit.date || new Date(visit.createdAt).toISOString().slice(0, 10);
    var filename = (safeName(visit.name) || "Visit record") + " - " + dateStr + ".docx";

    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  if (typeof window !== "undefined") {
    window.SeniorsExport = { downloadDocx: downloadDocx, buildDocxBytes: buildDocxBytes };
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { buildDocxBytes: buildDocxBytes, zipStore: zipStore, crc32: crc32 };
  }
})();
