/**
 * ad-trigger.js — FT Epep Squad (v4)
 * ─────────────────────────────────────────────────────────────────────────────
 * JARINGAN IKLAN:
 *   1. Adsterra  → performanceingredientgoblet.com  (terpasang langsung di HTML)
 *   2. HilltopAds → sophisticatedpin.com + wrathful-piano.com  (diatur di sini)
 *
 * KOMBINASI FORMAT (rekomendasi CPM tinggi):
 *   ✓ Popunder (HilltopAds #6991605)  +  Social Bar (HilltopAds #6991657)
 *   ✓ Social Bar  +  Smartlink HilltopAds (wrathful-piano.com)
 *   ✓ Popunder    +  Native Banner Adsterra (sudah ada di HTML)
 *
 * STRATEGI:
 *   A. Inject script HilltopAds (Social Bar #6991657 + Banner #6991641×2)
 *   B. Popunder on-click pertama → smartlink HilltopAds
 *   C. Popunder timer (5 menit pertama, ulang 8 menit) — maks 3× per sesi
 *   D. Modal iklan overlay dengan banner HilltopAds #6991641
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════════════
     KONFIGURASI
  ═══════════════════════════════════════════════════════════════ */

  /* HilltopAds — Direct URL (zone #6991605) */
  var HILLTOP_SMARTLINK =
    "https://wrathful-piano.com/b.3eVw0JPO3bpXvwbfmoV/JgZIDl0G2ZOZTGkFx/Nkj_A/1MLoTyYi5-OOT/EN2TM/D/kC";

  /* Adsterra — Smartlink */
  var ADSTERRA_SMARTLINK =
    "https://performanceingredientgoblet.com/angtq6ey?key=40a62c67960666e3277ffb4d5b2ebbbd";

  /* Rotasi URL popunder: HilltopAds & Adsterra bergantian */
  var POPUNDER_URLS = [
    HILLTOP_SMARTLINK,
    ADSTERRA_SMARTLINK,
    HILLTOP_SMARTLINK,
    ADSTERRA_SMARTLINK,
  ];

  /* ─── Timing ──────────────────────────────────────────────── */
  var POPUNDER_FIRST_MS  = 5 * 60 * 1000;  // 5 menit
  var POPUNDER_REPEAT_MS = 8 * 60 * 1000;  // 8 menit
  var MODAL_FIRST_MS     = 40 * 1000;       // 40 detik
  var MODAL_REPEAT_MS    = 6 * 60 * 1000;  // 6 menit

  /* Maks popunder per sesi (mencegah bounce rate tinggi) */
  var MAX_POPUNDER = 3;

  /* ─── HilltopAds Zone #6991657 — Social Bar (BARU) ───────── */
  var HILLTOP_6991657_SRC =
    "//sophisticatedpin.com/bHXWVPsVd.GXlV0LYkWNcR/zeRm/9cuAZlUBlykxPXTxYB5/OST/E/2kNhTJcrtVN/jdka5vM_TxY/2LMPQf";

  /* ─── HilltopAds Zone #6991641 — Banner (BARU, 2 kode) ───── */
  var HILLTOP_6991641_SRC_A =
    "//sophisticatedpin.com/bgXeVks.dTGBlj0XYHWrcY/teYma9GupZWUVlFk_PxTIYv5UOWTOEl2VNgDVE/taNCjQk/5QMpTJYJ0iNKQ_";
  var HILLTOP_6991641_SRC_B =
    "//sophisticatedpin.com/bhX.VQsPdrGMl_0/YdWxcT/Cejm/9cuaZbUUlMkbPTTSYv5jO/TjEP2hMfj-UItUN/j/kY5/MwTBYvyeOSQW";

  /* ═══════════════════════════════════════════════════════════════
     STATE
  ═══════════════════════════════════════════════════════════════ */
  var popCount     = 0;
  var popIdx       = 0;
  var firstClicked = false;
  var firstTimer;

  /* ═══════════════════════════════════════════════════════════════
     HELPER
  ═══════════════════════════════════════════════════════════════ */

  function nextPopUrl() {
    var url = POPUNDER_URLS[popIdx % POPUNDER_URLS.length];
    popIdx++;
    return url;
  }

  function openPopunder() {
    if (popCount >= MAX_POPUNDER) return;
    popCount++;
    try {
      var w = window.open(nextPopUrl(), "_blank");
      if (w) {
        try { w.blur(); }       catch (e) {}
        try { window.focus(); } catch (e) {}
      }
    } catch (e) {}
  }

  /**
   * Inject script dengan pola standar HilltopAds:
   * (function(param){ ... l.parentNode.insertBefore(s, l); })(settingsObj)
   */
  function injectHilltopScript(src, settingsObj) {
    try {
      var d = document,
          s = d.createElement("script"),
          l = d.scripts[d.scripts.length - 1];
      s.settings        = settingsObj || {};
      s.src             = src;
      s.async           = true;
      s.referrerPolicy  = "no-referrer-when-downgrade";
      l.parentNode.insertBefore(s, l);
    } catch (e) {}
  }

  /* ═══════════════════════════════════════════════════════════════
     A. INJECT SCRIPT HILLTOPADS
  ═══════════════════════════════════════════════════════════════ */

  /* Zone #6991657 — Social Bar (format paling tidak mengganggu) */
  injectHilltopScript(HILLTOP_6991657_SRC, {});

  /* Zone #6991641 — Banner (2 kode berbeda, inject keduanya) */
  injectHilltopScript(HILLTOP_6991641_SRC_A, {});
  injectHilltopScript(HILLTOP_6991641_SRC_B, {});

  /* ═══════════════════════════════════════════════════════════════
     B. POPUNDER ON-CLICK (klik pertama user saja)
  ═══════════════════════════════════════════════════════════════ */
  document.addEventListener("click", function () {
    if (firstClicked) return;
    firstClicked = true;
    openPopunder();
  }, true);

  /* ═══════════════════════════════════════════════════════════════
     C. POPUNDER BERKALA
  ═══════════════════════════════════════════════════════════════ */
  firstTimer = window.setTimeout(function () {
    openPopunder();
    window.setInterval(openPopunder, POPUNDER_REPEAT_MS);
  }, POPUNDER_FIRST_MS);

  window.addEventListener("beforeunload", function () {
    window.clearTimeout(firstTimer);
  });

  /* ═══════════════════════════════════════════════════════════════
     D. MODAL IKLAN OVERLAY  (HilltopAds #6991641 + Smartlink CTA)
     Muncul setelah user engaged 40 detik → bounce rate rendah
  ═══════════════════════════════════════════════════════════════ */

  function injectModalCSS() {
    if (document.getElementById("__adm-css")) return;
    var css = [
      "#__adm{position:fixed;inset:0;z-index:2147483640;",
        "display:flex;align-items:center;justify-content:center;",
        "background:rgba(0,0,0,0.72);opacity:0;pointer-events:none;",
        "transition:opacity .3s ease;}",
      "#__adm.on{opacity:1;pointer-events:auto;}",
      "#__adm-box{position:relative;width:min(94vw,380px);",
        "background:linear-gradient(160deg,#111,#1a1a1a);",
        "border:1px solid rgba(230,168,0,.30);border-radius:.9rem;",
        "padding:1.1rem 1.1rem .9rem;",
        "box-shadow:0 24px 72px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.04);",
        "animation:__adm-pop .38s cubic-bezier(.34,1.56,.64,1) both;}",
      "@keyframes __adm-pop{",
        "from{transform:scale(.82) translateY(14px);opacity:0}",
        "to{transform:scale(1) translateY(0);opacity:1}}",
      "#__adm-x{position:absolute;top:.6rem;right:.6rem;",
        "width:2rem;height:2rem;border-radius:50%;",
        "border:1px solid rgba(255,255,255,.15);",
        "background:rgba(255,255,255,.08);color:#fff;font-size:.85rem;",
        "cursor:pointer;display:grid;place-items:center;",
        "transition:background .2s;line-height:1;}",
      "#__adm-x:hover{background:rgba(220,50,50,.55);}",
      "#__adm-lbl{font-size:.58rem;letter-spacing:.22em;text-transform:uppercase;",
        "color:rgba(230,168,0,.72);margin-bottom:.75rem;font-weight:700;}",
      /* Label jaringan */
      "#__adm-net{font-size:.55rem;letter-spacing:.14em;color:rgba(255,255,255,.28);",
        "margin-bottom:.5rem;text-transform:uppercase;}",
      "#__adm-slot{min-height:100px;display:flex;align-items:center;",
        "justify-content:center;background:rgba(0,0,0,.45);",
        "border:1px solid rgba(255,255,255,.06);border-radius:.55rem;",
        "overflow:hidden;margin-bottom:.85rem;}",
      "#__adm-foot{display:flex;gap:.6rem;align-items:center;justify-content:flex-end;}",
      "#__adm-cl{font-size:.65rem;color:rgba(255,255,255,.42);",
        "background:none;border:none;cursor:pointer;padding:0;",
        "transition:color .2s;}",
      "#__adm-cl:hover{color:rgba(255,255,255,.72);}",
      "#__adm-cta{font-size:.65rem;font-weight:700;letter-spacing:.1em;",
        "text-transform:uppercase;color:#0a0a0a;",
        "background:linear-gradient(135deg,#e6a800,#ffd040);",
        "border:none;border-radius:.4rem;padding:.45rem 1rem;",
        "cursor:pointer;transition:filter .2s;}",
      "#__adm-cta:hover{filter:brightness(1.12);}",
    ].join("");
    var el = document.createElement("style");
    el.id = "__adm-css";
    el.textContent = css;
    document.head.appendChild(el);
  }

  var modalBuilt  = false;
  var slotLoaded  = false;

  function buildModal() {
    if (modalBuilt) return;
    modalBuilt = true;
    injectModalCSS();

    var div = document.createElement("div");
    div.id = "__adm";
    div.setAttribute("role", "dialog");
    div.setAttribute("aria-modal", "true");
    div.setAttribute("aria-label", "Pesan sponsor");
    div.innerHTML =
      '<div id="__adm-box">' +
        '<button id="__adm-x" aria-label="Tutup">&#x2715;</button>' +
        '<p id="__adm-lbl">Sponsor · FT Epep Squad</p>' +
        '<p id="__adm-net">HilltopAds · zone #6991641</p>' +
        '<div id="__adm-slot"></div>' +
        '<div id="__adm-foot">' +
          '<button id="__adm-cl" type="button">Lewati</button>' +
          '<button id="__adm-cta" type="button">Lihat Penawaran &#x2192;</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(div);

    function close() { div.classList.remove("on"); }

    document.getElementById("__adm-x").addEventListener("click",  close);
    document.getElementById("__adm-cl").addEventListener("click", close);
    div.addEventListener("click", function (e) { if (e.target === div) close(); });

    /* CTA: buka smartlink HilltopAds */
    document.getElementById("__adm-cta").addEventListener("click", function () {
      try { window.open(HILLTOP_SMARTLINK, "_blank"); } catch (e) {}
      close();
    });
  }

  function showModal() {
    buildModal();

    /* Load banner HilltopAds #6991641 (kode A) ke dalam slot — sekali saja */
    if (!slotLoaded) {
      slotLoaded = true;
      var slot = document.getElementById("__adm-slot");
      if (slot) {
        var s = document.createElement("script");
        s.src             = HILLTOP_6991641_SRC_A;
        s.async           = true;
        s.referrerPolicy  = "no-referrer-when-downgrade";
        s.settings        = {};
        slot.appendChild(s);
      }
    }

    var el = document.getElementById("__adm");
    if (el) el.classList.add("on");
  }

  function initModal() {
    window.setTimeout(function () {
      showModal();
      window.setInterval(showModal, MODAL_REPEAT_MS);
    }, MODAL_FIRST_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initModal);
  } else {
    initModal();
  }

})();
