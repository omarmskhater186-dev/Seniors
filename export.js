/*
 * export.js — Seniors Med Word (.docx) export
 *
 * Self-contained, zero-dependency .docx generator. A .docx is a ZIP of XML
 * (OOXML) parts; we build the XML and the ZIP by hand so nothing is fetched
 * from the internet at run-time (it can't be blocked or fail offline).
 *
 * Exposes window.SeniorsExport.downloadDocx(visit, L), where L holds the
 * already-localized labels/values built by app.js (single source of truth for
 * translation and date formatting). Medication dosing is taken verbatim from
 * the visit and rendered right-to-left in the Arabic font.
 */
(function () {
  "use strict";

  // House-style palette (no leading '#').
  var AEGEAN = "144053"; // headings / section titles
  var OCEANA = "489399"; // secondary headings / labels
  var BABY = "6dcad6";   // accent lines
  var METAL = "9c9da0";  // muted text
  var CLOUDY = "dddddd"; // table header fill / borders

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

  // A run of text. Splits on newlines into <w:br/> breaks.
  function run(text, o) {
    o = o || {};
    var font = o.font || FONT_EN;
    var size = o.size || 22; // half-points (22 = 11pt)
    var rpr = [];
    rpr.push('<w:rFonts w:ascii="' + font + '" w:hAnsi="' + font + '" w:cs="' + font + '"/>');
    if (o.bold) rpr.push("<w:b/><w:bCs/>");
    if (o.color) rpr.push('<w:color w:val="' + o.color + '"/>');
    rpr.push('<w:sz w:val="' + size + '"/><w:szCs w:val="' + size + '"/>');
    if (o.rtl) rpr.push("<w:rtl/>");
    var text_parts = String(text == null ? "" : text)
      .split("\n")
      .map(function (t) {
        return '<w:t xml:space="preserve">' + xmlEscape(t) + "</w:t>";
      })
      .join("<w:br/>");
    return "<w:r><w:rPr>" + rpr.join("") + "</w:rPr>" + text_parts + "</w:r>";
  }

  function para(runsXml, o) {
    o = o || {};
    var ppr = [];
    if (o.bidi) ppr.push("<w:bidi/>");
    if (o.accent) {
      ppr.push(
        '<w:pBdr><w:bottom w:val="single" w:sz="12" w:space="3" w:color="' +
          BABY +
          '"/></w:pBdr>'
      );
    }
    if (o.align) ppr.push('<w:jc w:val="' + o.align + '"/>');
    ppr.push('<w:spacing w:after="' + (o.spacingAfter == null ? 120 : o.spacingAfter) + '"/>');
    return "<w:p><w:pPr>" + ppr.join("") + "</w:pPr>" + runsXml + "</w:p>";
  }

  function tc(pXml, o) {
    o = o || {};
    var shd = o.fill ? '<w:shd w:val="clear" w:color="auto" w:fill="' + o.fill + '"/>' : "";
    return (
      '<w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/>' +
      shd +
      '<w:vAlign w:val="center"/></w:tcPr>' +
      pXml +
      "</w:tc>"
    );
  }

  function tr(cellsXml) {
    return "<w:tr>" + cellsXml + "</w:tr>";
  }

  function medsTable(meds, L) {
    var sides = ["top", "left", "bottom", "right", "insideH", "insideV"];
    var borders = sides
      .map(function (s) {
        return '<w:' + s + ' w:val="single" w:sz="4" w:space="0" w:color="' + CLOUDY + '"/>';
      })
      .join("");

    var headerRow = tr(
      tc(para(run(L.drugCol, { bold: true, color: AEGEAN }), { spacingAfter: 0 }), { fill: CLOUDY }) +
        tc(para(run(L.dosingCol, { bold: true, color: AEGEAN }), { spacingAfter: 0, align: "right" }), {
          fill: CLOUDY,
        })
    );

    var bodyRows = meds
      .map(function (m) {
        var drug = m.drug && m.drug.trim() ? m.drug : L.notProvided;
        var dose = m.dosing && m.dosing.trim() ? m.dosing : L.notProvided;
        return tr(
          tc(para(run(drug, {}), { spacingAfter: 0 })) +
            // Dosing: always right-to-left, Arabic font, verbatim.
            tc(
              para(run(dose, { font: FONT_AR, rtl: true }), {
                spacingAfter: 0,
                bidi: true,
                align: "right",
              })
            )
        );
      })
      .join("");

    return (
      "<w:tbl><w:tblPr>" +
      '<w:tblW w:w="5000" w:type="pct"/>' +
      "<w:tblBorders>" +
      borders +
      "</w:tblBorders>" +
      '<w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>' +
      "</w:tblPr>" +
      '<w:tblGrid><w:gridCol w:w="4675"/><w:gridCol w:w="4675"/></w:tblGrid>' +
      headerRow +
      bodyRows +
      "</w:tbl>"
    );
  }

  // --- Document parts -------------------------------------------------------
  var W_NS =
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

  function documentXml(visit, L) {
    var rtl = L.dir === "rtl";
    var A = rtl ? "right" : "left";
    var norm = { align: A, bidi: rtl };

    function normPara(runsXml, extra) {
      var o = { align: A, bidi: rtl };
      if (extra) for (var k in extra) o[k] = extra[k];
      return para(runsXml, o);
    }

    var blocks = [];

    // Title (patient name) with baby-blue accent rule.
    blocks.push(
      normPara(run(L.name, { size: 32, bold: true, color: AEGEAN }), { accent: true, spacingAfter: 160 })
    );

    // Patient details: label (Oceana) + value.
    blocks.push(
      normPara(run(L.ageLabel + ": ", { bold: true, color: OCEANA }) + run(L.ageValue, {}))
    );
    blocks.push(
      normPara(run(L.dateLabel + ": ", { bold: true, color: OCEANA }) + run(L.dateValue, {}))
    );

    // Generated timestamp (muted).
    blocks.push(normPara(run(L.generatedText, { color: METAL, size: 20 }), { spacingAfter: 200 }));

    // Visit notes.
    blocks.push(normPara(run(L.notesLabel, { size: 26, bold: true, color: AEGEAN }), { accent: true }));
    blocks.push(normPara(run(L.notesValue, {}), { spacingAfter: 200 }));

    // Medications.
    blocks.push(normPara(run(L.medsLabel, { size: 26, bold: true, color: AEGEAN }), { accent: true }));
    if (visit.meds && visit.meds.length) {
      blocks.push(medsTable(visit.meds, L));
    } else {
      blocks.push(normPara(run(L.noMeds, { color: METAL })));
    }

    // A trailing empty paragraph is required after a table before sectPr.
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
      "<w:document " +
      W_NS +
      "><w:body>" +
      blocks.join("") +
      sectPr +
      "</w:body></w:document>"
    );
  }

  function headerXml(L) {
    var rtl = L.dir === "rtl";
    var p = para(run(L.headerTitle, { size: 22, bold: true, color: AEGEAN }), {
      align: rtl ? "right" : "left",
      bidi: rtl,
      accent: true,
      spacingAfter: 0,
    });
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ' + W_NS + ">" + p + "</w:hdr>";
  }

  function footerXml() {
    // Page number only, centered.
    var p =
      '<w:p><w:pPr><w:jc w:val="center"/></w:pPr>' +
      '<w:r><w:rPr><w:rFonts w:ascii="' + FONT_EN + '" w:hAnsi="' + FONT_EN + '"/><w:color w:val="' + METAL + '"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>' +
      '<w:r><w:rPr><w:rFonts w:ascii="' + FONT_EN + '" w:hAnsi="' + FONT_EN + '"/><w:color w:val="' + METAL + '"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>' +
      '<w:r><w:rPr><w:rFonts w:ascii="' + FONT_EN + '" w:hAnsi="' + FONT_EN + '"/><w:color w:val="' + METAL + '"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>' +
      "</w:p>";
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ' + W_NS + ">" + p + "</w:ftr>";
  }

  function stylesXml() {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      "<w:styles " +
      W_NS +
      "><w:docDefaults><w:rPrDefault><w:rPr>" +
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

  function pushU16(a, n) {
    a.push(n & 0xff, (n >> 8) & 0xff);
  }
  function pushU32(a, n) {
    a.push(n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff);
  }
  function pushBytes(a, bytes) {
    for (var i = 0; i < bytes.length; i++) a.push(bytes[i]);
  }

  function zipStore(files) {
    var enc = new TextEncoder();
    var out = [];
    var central = [];
    var DOSTIME = 0;
    var DOSDATE = 0x0021; // 1980-01-01 (a valid DOS date)

    files.forEach(function (f) {
      var nameBytes = enc.encode(f.name);
      var data = f.data || enc.encode(f.xml);
      var crc = crc32(data);
      var offset = out.length;

      pushU32(out, 0x04034b50);
      pushU16(out, 20);
      pushU16(out, 0x0800); // UTF-8 names
      pushU16(out, 0); // method: stored
      pushU16(out, DOSTIME);
      pushU16(out, DOSDATE);
      pushU32(out, crc);
      pushU32(out, data.length);
      pushU32(out, data.length);
      pushU16(out, nameBytes.length);
      pushU16(out, 0);
      pushBytes(out, nameBytes);
      pushBytes(out, data);

      central.push({ nameBytes: nameBytes, crc: crc, size: data.length, offset: offset });
    });

    var cdStart = out.length;
    central.forEach(function (c) {
      pushU32(out, 0x02014b50);
      pushU16(out, 20);
      pushU16(out, 20);
      pushU16(out, 0x0800);
      pushU16(out, 0);
      pushU16(out, DOSTIME);
      pushU16(out, DOSDATE);
      pushU32(out, c.crc);
      pushU32(out, c.size);
      pushU32(out, c.size);
      pushU16(out, c.nameBytes.length);
      pushU16(out, 0);
      pushU16(out, 0);
      pushU16(out, 0);
      pushU16(out, 0);
      pushU32(out, 0);
      pushU32(out, c.offset);
      pushBytes(out, c.nameBytes);
    });
    var cdEnd = out.length;

    pushU32(out, 0x06054b50);
    pushU16(out, 0);
    pushU16(out, 0);
    pushU16(out, central.length);
    pushU16(out, central.length);
    pushU32(out, cdEnd - cdStart);
    pushU32(out, cdStart);
    pushU16(out, 0);

    return new Uint8Array(out);
  }

  // --- Public API -----------------------------------------------------------
  function buildDocxBytes(visit, L) {
    var parts = [
      { name: "[Content_Types].xml", xml: CONTENT_TYPES },
      { name: "_rels/.rels", xml: ROOT_RELS },
      { name: "word/document.xml", xml: documentXml(visit, L) },
      { name: "word/_rels/document.xml.rels", xml: DOC_RELS },
      { name: "word/styles.xml", xml: stylesXml() },
      { name: "word/header1.xml", xml: headerXml(L) },
      { name: "word/footer1.xml", xml: footerXml() },
    ];
    return zipStore(parts);
  }

  function safeName(s) {
    return String(s || "")
      .replace(/[\\/:*?"<>|]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
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
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  if (typeof window !== "undefined") {
    window.SeniorsExport = { downloadDocx: downloadDocx, buildDocxBytes: buildDocxBytes };
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { buildDocxBytes: buildDocxBytes, zipStore: zipStore, crc32: crc32 };
  }
})();
