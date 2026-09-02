/* Emma Jane Photography — owner CMS + gallery platform (prototype).
   Persistence is local to this browser: page text/photo edits in localStorage,
   uploaded gallery photos in IndexedDB. A real multi-device site needs a
   backend — flagged for the eventual Claude Code handoff. */
(function () {
  if (window.EJ) return;
  var AUTH = "ej_admin_v1";
  var EDIT = "ej_editmode_v1";
  var TEXT = "ej_text_v1";
  var IMG = "ej_img_v1";
  var ALBUMS = "ej_albums_v1";
  var CLIENTS = "ej_clients_v1";
  var PW = "goldenhour";

  function rj(k) { try { return JSON.parse(localStorage.getItem(k) || "{}"); } catch (e) { return {}; } }
  function wj(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function page() {
    var p = (location.pathname || "").split("/").pop() || "index";
    return decodeURIComponent(p).replace(/\.dc\.html$|\.html$/, "").toLowerCase() || "index";
  }

  /* ---------- stable element paths ---------- */
  function pathOf(el) {
    var parts = [];
    while (el && el !== document.body) {
      var p = el.parentElement;
      if (!p) break;
      parts.unshift(Array.prototype.indexOf.call(p.children, el));
      el = p;
    }
    return parts.join(".");
  }
  function byPath(path) {
    var el = document.body, parts = path.split(".");
    for (var i = 0; i < parts.length; i++) {
      if (!el) return null;
      el = el.children[+parts[i]];
    }
    return el || null;
  }

  var TEXT_SEL = "h1,h2,h3,h4,h5,h6,p,li,span,em,strong,blockquote,figcaption,label,dt,dd,td,th,a";
  function textNodes() {
    var all = Array.prototype.slice.call(document.body.querySelectorAll(TEXT_SEL));
    return all.filter(function (el) {
      if (el.closest("[data-ej-chrome]")) return false;
      if (!el.textContent || !el.textContent.trim()) return false;
      if (el.querySelector(TEXT_SEL)) return false;
      if (el.querySelector("img,svg,input,textarea,select")) return false;
      return true;
    });
  }
  function imgNodes() {
    return Array.prototype.slice.call(document.body.querySelectorAll("img")).filter(function (el) {
      return !el.closest("[data-ej-chrome]") && !el.hasAttribute("data-ej-skip");
    });
  }

  /* ---------- apply saved overrides ---------- */
  function applyOverrides() {
    var t = rj(TEXT)[page()] || {};
    Object.keys(t).forEach(function (k) {
      var el = byPath(k);
      if (el && el.textContent !== t[k]) el.textContent = t[k];
    });
    var im = rj(IMG)[page()] || {};
    Object.keys(im).forEach(function (k) {
      var el = byPath(k);
      if (el && el.tagName === "IMG" && el.getAttribute("src") !== im[k]) el.setAttribute("src", im[k]);
    });
  }

  function saveText(path, val) {
    var all = rj(TEXT); var m = all[page()] || {};
    m[path] = val; all[page()] = m; wj(TEXT, all);
  }
  function saveImg(path, dataUrl) {
    var all = rj(IMG); var m = all[page()] || {};
    m[path] = dataUrl; all[page()] = m;
    if (!wj(IMG, all)) toast("That photo is too large to keep in this browser — try a smaller file.");
  }

  /* ---------- images ---------- */
  function shrink(file, maxSide, quality) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var s = Math.min(1, maxSide / Math.max(img.width, img.height));
        var w = Math.round(img.width * s), h = Math.round(img.height * s);
        var c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { res({ blob: b, w: w, h: h }); }, "image/jpeg", quality || 0.86);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error("bad image")); };
      img.src = url;
    });
  }
  function toDataUrl(blob) {
    return new Promise(function (res) {
      var r = new FileReader();
      r.onload = function () { res(r.result); };
      r.readAsDataURL(blob);
    });
  }

  /* ---------- gallery photo store (IndexedDB) ---------- */
  var dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      var r = indexedDB.open("ej_photos", 1);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains("photos")) d.createObjectStore("photos");
      };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function tx(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction("photos", mode);
        var out = fn(t.objectStore("photos"));
        t.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }

  var urlCache = {};
  function urlFor(id, which) {
    var key = id + ":" + (which || "web");
    if (urlCache[key]) return Promise.resolve(urlCache[key]);
    return tx("readonly", function (s) { return s.get(id); }).then(function (rec) {
      if (!rec) return "";
      var b = which === "thumb" ? (rec.thumb || rec.web) : rec.web;
      urlCache[key] = URL.createObjectURL(b);
      return urlCache[key];
    }).catch(function () { return ""; });
  }

  function addPhoto(file) {
    var id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    return Promise.all([shrink(file, 2400, 0.88), shrink(file, 520, 0.8)]).then(function (r) {
      return tx("readwrite", function (s) {
        s.put({ web: r[0].blob, thumb: r[1].blob, name: file.name || "photograph.jpg", w: r[0].w, h: r[0].h }, id);
      }).then(function () { return { id: id, name: file.name || "photograph.jpg", w: r[0].w, h: r[0].h }; });
    });
  }
  function removePhoto(id) {
    return tx("readwrite", function (s) { s.delete(id); }).catch(function () {});
  }
  function download(id, name) {
    return tx("readonly", function (s) { return s.get(id); }).then(function (rec) {
      if (!rec) return false;
      var u = URL.createObjectURL(rec.web);
      var a = document.createElement("a");
      a.href = u; a.download = name || rec.name || "photograph.jpg";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
      return true;
    });
  }

  /* ---------- seed content ---------- */
  var SEED_ALBUMS = [
    { id: "a-families", name: "Families, at home", note: "Tulsa · morning light", live: true, cover: 0,
      photos: [
        { file: "photos/family-beach.jpg", cap: "the last hour of the day" },
        { file: "photos/portrait-hat.jpg", cap: "" },
        { file: "photos/couple-canal.jpg", cap: "" }
      ] },
    { id: "a-seniors", name: "Seniors", note: "Class of 2026", live: true, cover: 0,
      photos: [
        { file: "photos/senior-golden.jpg", cap: "she picked the field herself" },
        { file: "photos/senior-bridge.jpg", cap: "" },
        { file: "photos/portrait-hat.jpg", cap: "" }
      ] },
    { id: "a-places", name: "Places I keep going back to", note: "Ongoing", live: true, cover: 0,
      photos: [
        { file: "photos/street-alley.jpg", cap: "" },
        { file: "photos/city-bw.jpg", cap: "" },
        { file: "photos/couple-canal.jpg", cap: "quiet water, early" }
      ] }
  ];
  var SEED_CLIENTS = [
    { id: "c-hartley", name: "The Hartleys", code: "goldenfield", shot: "2026-08-09", until: "2026-11-07",
      note: "Mark the ones you'd like printed and I'll get them ordered. The full-size files are yours to keep — I'd back them up somewhere that isn't a phone.",
      photos: [
        { file: "photos/family-beach.jpg" }, { file: "photos/portrait-hat.jpg" },
        { file: "photos/senior-golden.jpg" }, { file: "photos/couple-canal.jpg" },
        { file: "photos/senior-bridge.jpg" }, { file: "photos/street-alley.jpg" }
      ] },
    { id: "c-mae", name: "Renner + Mae", code: "loveletter", shot: "2026-07-19", until: "2026-10-17",
      note: "Everything from the day is here. Take your time.",
      photos: [
        { file: "photos/couple-canal.jpg" }, { file: "photos/city-bw.jpg" },
        { file: "photos/portrait-hat.jpg" }, { file: "photos/family-beach.jpg" }
      ] }
  ];

  function albums() {
    var v = localStorage.getItem(ALBUMS);
    if (!v) { wj(ALBUMS, SEED_ALBUMS); return JSON.parse(JSON.stringify(SEED_ALBUMS)); }
    try { return JSON.parse(v); } catch (e) { return JSON.parse(JSON.stringify(SEED_ALBUMS)); }
  }
  function clients() {
    var v = localStorage.getItem(CLIENTS);
    if (!v) { wj(CLIENTS, SEED_CLIENTS); return JSON.parse(JSON.stringify(SEED_CLIENTS)); }
    try { return JSON.parse(v); } catch (e) { return JSON.parse(JSON.stringify(SEED_CLIENTS)); }
  }

  /* photo record -> displayable src (file path or stored upload) */
  function srcOf(p, which) {
    if (!p) return Promise.resolve("");
    if (p.file) return Promise.resolve(p.file);
    if (p.id) return urlFor(p.id, which);
    return Promise.resolve("");
  }

  /* ---------- edit mode ---------- */
  var editing = false, picker = null, pickTarget = null;

  function styleTag() {
    if (document.getElementById("ej-cms-style")) return;
    var s = document.createElement("style");
    s.id = "ej-cms-style";
    s.textContent =
      '[data-ej-edit]{outline:1px dashed color-mix(in srgb,#31463c 45%,transparent);outline-offset:3px;border-radius:2px;cursor:text}' +
      '[data-ej-edit]:hover{outline:1px dashed #31463c;background:color-mix(in srgb,#31463c 7%,transparent)}' +
      '[data-ej-edit]:focus{outline:1px solid #31463c;background:color-mix(in srgb,#31463c 9%,transparent)}' +
      '[data-ej-pick]{outline:2px dashed color-mix(in srgb,#31463c 55%,transparent);outline-offset:4px;cursor:pointer}' +
      '[data-ej-pick]:hover{outline:2px solid #31463c;opacity:0.86}';
    document.head.appendChild(s);
  }

  function ensurePicker() {
    if (picker) return picker;
    picker = document.createElement("input");
    picker.type = "file";
    picker.accept = "image/*";
    picker.style.display = "none";
    picker.setAttribute("data-ej-chrome", "");
    picker.addEventListener("change", function () {
      var f = picker.files && picker.files[0];
      picker.value = "";
      if (!f || !pickTarget) return;
      var el = pickTarget; pickTarget = null;
      shrink(f, 2200, 0.86).then(function (r) { return toDataUrl(r.blob); }).then(function (u) {
        el.setAttribute("src", u);
        saveImg(pathOf(el), u);
        toast("Photograph replaced.");
      });
    });
    document.body.appendChild(picker);
    return picker;
  }

  function markEditable(on) {
    textNodes().forEach(function (el) {
      if (on) {
        el.setAttribute("data-ej-edit", "");
        el.setAttribute("contenteditable", "true");
        el.spellcheck = false;
        if (el.tagName === "A") el.addEventListener("click", stopNav);
        if (!el.__ejBlur) {
          el.__ejBlur = function () { saveText(pathOf(el), el.textContent); };
          el.addEventListener("blur", el.__ejBlur);
        }
      } else {
        el.removeAttribute("data-ej-edit");
        el.removeAttribute("contenteditable");
        if (el.tagName === "A") el.removeEventListener("click", stopNav);
      }
    });
    imgNodes().forEach(function (el) {
      if (on) {
        el.setAttribute("data-ej-pick", "");
        el.title = "Click to replace this photograph";
        if (!el.__ejPick) {
          el.__ejPick = function (e) {
            if (!editing) return;
            e.preventDefault(); e.stopPropagation();
            pickTarget = el; ensurePicker().click();
          };
          el.addEventListener("click", el.__ejPick, true);
        }
      } else {
        el.removeAttribute("data-ej-pick");
        el.removeAttribute("title");
      }
    });
  }
  function stopNav(e) { if (editing) e.preventDefault(); }

  function setEditing(on) {
    editing = !!on;
    if (editing) localStorage.setItem(EDIT, "1"); else localStorage.removeItem(EDIT);
    styleTag();
    markEditable(editing);
    renderBar();
  }

  /* ---------- toast ---------- */
  var tEl = null, tT = null;
  function toast(msg) {
    if (!tEl) {
      tEl = document.createElement("div");
      tEl.setAttribute("data-ej-chrome", "");
      tEl.setAttribute("role", "status");
      tEl.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:76px;z-index:9999;padding:11px 20px;border-radius:4px;background:#31463c;color:#f5f2ec;font-family:'EB Garamond',Georgia,serif;font-size:1rem;letter-spacing:0.04em;box-shadow:0 10px 30px rgba(49,70,60,0.32);opacity:0;transition:opacity 320ms cubic-bezier(0.33,0,0.15,1);pointer-events:none;max-width:min(92vw,520px);text-align:center";
      document.body.appendChild(tEl);
    }
    tEl.textContent = msg;
    tEl.style.opacity = "1";
    if (tT) clearTimeout(tT);
    tT = setTimeout(function () { tEl.style.opacity = "0"; }, 3200);
  }

  /* ---------- the bar at the bottom of the site ---------- */
  var bar = null;
  function renderBar() {
    if (!bar) {
      bar = document.createElement("div");
      bar.setAttribute("data-ej-chrome", "");
      document.body.appendChild(bar);
    }
    var signed = isAdmin();
    var studio = "Studio.dc.html";
    if (/\.html$/.test(location.pathname) && !/\.dc\.html$/.test(location.pathname)) studio = "studio.html";

    if (!signed) {
      bar.style.cssText = "background:var(--color-bg,#f5f2ec);border-top:1px solid var(--color-border-soft,rgba(68,75,78,0.1));padding:14px 40px;display:flex;justify-content:center;gap:18px;align-items:center;flex-wrap:wrap";
      bar.innerHTML =
        '<button type="button" data-ej="open" style="background:none;border:0;padding:6px 4px;cursor:pointer;font-family:\'EB Garamond\',Georgia,serif;font-size:0.8125rem;letter-spacing:0.24em;text-transform:uppercase;color:color-mix(in srgb,#444b4e 45%,#f5f2ec)">Admin</button>' +
        '<form data-ej="form" style="display:none;gap:10px;align-items:center;flex-wrap:wrap">' +
          '<input data-ej="pw" type="password" placeholder="password" autocomplete="current-password" style="min-height:40px;padding:0 12px;border:1px solid var(--color-border,rgba(68,75,78,0.2));border-radius:2px;background:#fff;font-family:\'EB Garamond\',Georgia,serif;font-size:1rem;color:#444b4e">' +
          '<button type="submit" style="min-height:40px;padding:0 20px;border:1px solid #31463c;border-radius:4px;background:#31463c;color:#f5f2ec;cursor:pointer;font-family:\'EB Garamond\',Georgia,serif;font-size:1rem;letter-spacing:0.14em;text-transform:uppercase">Sign in</button>' +
          '<span data-ej="err" style="font-family:\'Cormorant Garamond\',Georgia,serif;font-style:italic;font-size:1rem;color:#7b4a3a"></span>' +
        '</form>';
      var open = bar.querySelector('[data-ej="open"]');
      var form = bar.querySelector('[data-ej="form"]');
      open.addEventListener("click", function () {
        open.style.display = "none";
        form.style.display = "flex";
        form.querySelector('[data-ej="pw"]').focus();
      });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var v = form.querySelector('[data-ej="pw"]').value;
        if (login(v)) { setEditing(false); renderBar(); toast("Signed in. Turn on editing to change text and photographs."); }
        else form.querySelector('[data-ej="err"]').textContent = "That isn't it.";
      });
      return;
    }

    bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:9998;background:#31463c;color:#f5f2ec;padding:12px 24px;display:flex;align-items:center;justify-content:center;gap:12px 22px;flex-wrap:wrap;box-shadow:0 -6px 24px rgba(49,70,60,0.22);font-family:'EB Garamond',Georgia,serif";
    bar.innerHTML =
      '<span style="font-family:\'Cormorant Garamond\',Georgia,serif;font-style:italic;font-size:1.125rem;opacity:0.9">' +
        (editing ? "Editing — click any words or photograph" : "Signed in as Emma") + '</span>' +
      '<button type="button" data-ej="toggle" style="min-height:40px;padding:0 18px;border:1px solid ' + (editing ? "#f5f2ec" : "rgba(245,242,236,0.6)") + ';border-radius:4px;background:' + (editing ? "#f5f2ec" : "transparent") + ';color:' + (editing ? "#31463c" : "#f5f2ec") + ';cursor:pointer;font-family:inherit;font-size:1rem;letter-spacing:0.14em;text-transform:uppercase">' + (editing ? "Done editing" : "Edit this page") + '</button>' +
      '<a href="' + studio + '" style="min-height:40px;display:inline-flex;align-items:center;padding:0 18px;border:1px solid rgba(245,242,236,0.6);border-radius:4px;color:#f5f2ec;text-decoration:none;font-size:1rem;letter-spacing:0.14em;text-transform:uppercase">Galleries</a>' +
      '<button type="button" data-ej="reset" style="background:none;border:0;padding:6px 4px;cursor:pointer;color:rgba(245,242,236,0.66);font-family:inherit;font-size:0.8125rem;letter-spacing:0.14em;text-transform:uppercase">Undo my edits</button>' +
      '<button type="button" data-ej="out" style="background:none;border:0;padding:6px 4px;cursor:pointer;color:rgba(245,242,236,0.66);font-family:inherit;font-size:0.8125rem;letter-spacing:0.14em;text-transform:uppercase">Sign out</button>';
    bar.querySelector('[data-ej="toggle"]').addEventListener("click", function () { setEditing(!editing); });
    bar.querySelector('[data-ej="out"]').addEventListener("click", function () { setEditing(false); logout(); renderBar(); });
    bar.querySelector('[data-ej="reset"]').addEventListener("click", function () {
      if (!confirm("Put this page's words and photographs back the way they were?")) return;
      var t = rj(TEXT); delete t[page()]; wj(TEXT, t);
      var i = rj(IMG); delete i[page()]; wj(IMG, i);
      location.reload();
    });
    document.body.style.paddingBottom = "72px";
  }

  function isAdmin() { return localStorage.getItem(AUTH) === "1"; }
  function login(pw) {
    if ((pw || "").trim() === PW) { localStorage.setItem(AUTH, "1"); return true; }
    return false;
  }
  function logout() { localStorage.removeItem(AUTH); document.body.style.paddingBottom = ""; }

  /* ---------- boot ---------- */
  var pending = null;
  function refresh() {
    applyOverrides();
    if (editing) markEditable(true);
  }
  function boot() {
    styleTag();
    applyOverrides();
    if (isAdmin() && localStorage.getItem(EDIT) === "1") { editing = true; markEditable(true); }
    renderBar();
    var mo = new MutationObserver(function () {
      if (pending) return;
      pending = setTimeout(function () { pending = null; refresh(); }, 140);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 60); });
  else setTimeout(boot, 60);

  window.EJ = {
    isAdmin: isAdmin, login: login, logout: logout,
    isEditing: function () { return editing; },
    setEditing: setEditing,
    toast: toast,
    albums: albums, saveAlbums: function (l) { return wj(ALBUMS, l); },
    clients: clients, saveClients: function (l) { return wj(CLIENTS, l); },
    addPhoto: addPhoto, removePhoto: removePhoto, urlFor: urlFor, srcOf: srcOf,
    download: download,
    password: PW
  };
})();
