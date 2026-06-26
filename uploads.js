/*
 * uploads.js — Seniors Med file/image attachments (memory-safe)
 *
 * What it guarantees (the old app crashed without these):
 *   - Images are COMPRESSED on upload (downscaled to ~1600px, JPEG ~0.7) before
 *     storing; the original is discarded.
 *   - Files are stored as Blobs in IndexedDB (db.js), never base64 in JSON.
 *   - A small separate thumbnail (~240px) is stored for display; the full blob
 *     is fetched ONLY when a file is opened.
 *   - Single files over 10 MB are rejected; max 20 attachments per visit.
 *   - Object URLs are revoked after use so memory does not accumulate.
 *
 * Exposes window.SeniorsUploads. Translation comes from app.js via configure().
 */
window.SeniorsUploads = (function () {
  "use strict";

  var MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
  var MAX_COUNT = 20;
  var FULL_MAX = 1600;
  var THUMB_MAX = 240;

  var _t = function (k) { return k; };

  function configure(opts) {
    if (opts && typeof opts.t === "function") _t = opts.t;
  }

  // -- tiny DOM helper -------------------------------------------------------
  function elc(tag, opts, children) {
    opts = opts || {};
    var n = document.createElement(tag);
    if (opts.class) n.className = opts.class;
    if (opts.text != null) n.textContent = opts.text;
    if (opts.attrs) for (var k in opts.attrs) n.setAttribute(k, opts.attrs[k]);
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  // -- image compression -----------------------------------------------------
  function getDrawable(file) {
    if (typeof createImageBitmap === "function") {
      return createImageBitmap(file, { imageOrientation: "from-image" })
        .then(function (bmp) {
          return { el: bmp, w: bmp.width, h: bmp.height, cleanup: function () { if (bmp.close) bmp.close(); } };
        })
        .catch(function () { return loadViaImg(file); });
    }
    return loadViaImg(file);
  }

  function loadViaImg(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        resolve({ el: img, w: img.naturalWidth, h: img.naturalHeight, cleanup: function () { URL.revokeObjectURL(url); } });
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("image load failed")); };
      img.src = url;
    });
  }

  function drawScaled(src, maxDim, quality) {
    var ratio = Math.min(1, maxDim / Math.max(src.w, src.h));
    var w = Math.max(1, Math.round(src.w * ratio));
    var h = Math.max(1, Math.round(src.h * ratio));
    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(src.el, 0, 0, w, h);
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error("encode failed")); }, "image/jpeg", quality);
    });
  }

  function encodeImageVariants(file) {
    return getDrawable(file).then(function (src) {
      return drawScaled(src, FULL_MAX, 0.7).then(function (full) {
        return drawScaled(src, THUMB_MAX, 0.6).then(function (thumb) {
          src.cleanup();
          return { full: full, thumb: thumb };
        });
      }).catch(function (e) { src.cleanup(); throw e; });
    });
  }

  function processFile(file) {
    var isPdf = file.type === "application/pdf";
    var isImg = file.type === "image/jpeg" || file.type === "image/png";
    if (!isPdf && !isImg) return Promise.resolve({ error: "unsupported" });
    if (file.size > MAX_FILE_BYTES) return Promise.resolve({ error: "fileTooLarge" });

    if (isPdf) {
      return Promise.resolve({
        meta: { name: file.name, type: "pdf", mime: file.type, size: file.size, thumb: null },
        full: file,
      });
    }
    return encodeImageVariants(file).then(function (v) {
      return {
        meta: { name: file.name, type: "image", mime: "image/jpeg", size: v.full.size, thumb: v.thumb },
        full: v.full,
      };
    });
  }

  // -- public: add files (stores as drafts) ----------------------------------
  function addFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    var errors = [];
    var added = 0;
    var DRAFT = window.SeniorsDB.DRAFT_VISIT_ID;

    return window.SeniorsDB.countByVisit(DRAFT).then(function (startCount) {
      var count = startCount;
      var chain = Promise.resolve();
      files.forEach(function (file) {
        chain = chain.then(function () {
          if (count >= MAX_COUNT) {
            if (errors.indexOf(_t("tooMany")) === -1) errors.push(_t("tooMany"));
            return;
          }
          return processFile(file)
            .then(function (res) {
              if (res.error) {
                errors.push(file.name + " — " + _t(res.error));
                return;
              }
              res.meta.visitId = DRAFT;
              res.meta.createdAt = Date.now();
              return window.SeniorsDB.addAttachment(res.meta, res.full).then(function () {
                added++;
                count++;
              });
            })
            .catch(function () {
              errors.push(file.name + " — " + _t("processError"));
            });
        });
      });
      return chain.then(function () { return { added: added, errors: errors }; });
    });
  }

  // -- public: open the full file (fetched only now) -------------------------
  function openAttachment(id) {
    // Open the tab synchronously (inside the user gesture) to dodge popup blocking.
    var w = window.open("", "_blank");
    return window.SeniorsDB.getFullBlob(id).then(function (blob) {
      if (!blob) { if (w) w.close(); return; }
      var url = URL.createObjectURL(blob);
      if (w) {
        w.location = url;
      } else {
        var a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.click();
      }
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    });
  }

  // -- public: render a list of attachments into a container -----------------
  function card(meta, opts) {
    var thumb = elc("button", { class: "attach-thumb", attrs: { type: "button", "aria-label": _t("attachOpen") } });
    if (meta.type === "image" && meta.thumb) {
      var img = elc("img", { attrs: { alt: meta.name } });
      var url = URL.createObjectURL(meta.thumb);
      img.src = url;
      img.onload = function () { URL.revokeObjectURL(url); };
      thumb.appendChild(img);
    } else {
      thumb.appendChild(elc("span", { class: "attach-icon", text: "📄", attrs: { "aria-hidden": "true" } }));
    }
    thumb.addEventListener("click", function () { openAttachment(meta.id); });

    var label = elc("span", { class: "attach-label", text: meta.name, attrs: { title: meta.name } });
    var children = [thumb, label];

    if (opts.editable) {
      var del = elc("button", {
        class: "btn btn-remove attach-del",
        text: _t("attachDelete"),
        attrs: { type: "button" },
      });
      del.addEventListener("click", function () {
        window.SeniorsDB.deleteAttachment(meta.id).then(function () {
          if (opts.onChange) opts.onChange();
        });
      });
      children.push(del);
    }
    return elc("div", { class: "attach-card" }, children);
  }

  function renderList(container, visitId, opts) {
    opts = opts || {};
    if (!container) return Promise.resolve();
    return window.SeniorsDB.getAttachmentsByVisit(visitId).then(function (list) {
      container.innerHTML = "";
      if (!list.length) {
        if (opts.showEmpty) container.appendChild(elc("p", { class: "muted", text: _t("noneRecorded") }));
        return;
      }
      list.forEach(function (meta) { container.appendChild(card(meta, opts)); });
    });
  }

  return {
    configure: configure,
    addFiles: addFiles,
    renderList: renderList,
    openAttachment: openAttachment,
    LIMITS: { MAX_FILE_BYTES: MAX_FILE_BYTES, MAX_COUNT: MAX_COUNT },
  };
})();
