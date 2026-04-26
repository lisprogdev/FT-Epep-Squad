/**
 * ad-trigger.js — FT Epep Squad (v3 · CPM-Optimized)
 * ─────────────────────────────────────────────────────────────────────────────
 * Strategi iklan berdasarkan panduan Adsterra untuk CPM tinggi:
 *
 *  Kombinasi format yang direkomendasikan:
 *    → Popunder  +  Social Bar          ✓ (sudah aktif via script inject)
 *    → Social Bar + Smartlink           ✓ (smartlink di modal / tombol)
 *    → Popunder  +  Native Banner       ✓ (banner ada di HTML tiap halaman)
 *
 *  Prinsip CPM-first:
 *    1. Popunder hanya 1× per kunjungan (klik pertama user)   → alami, tidak spam
 *    2. Timer popunder mulai 5 menit, ulang tiap 8 menit      → user sempat baca
 *    3. Modal muncul 40 detik setelah load                    → user sudah engaged
 *    4. Modal mudah ditutup tanpa paksa tunggu               → bounce rate turun
 *    5. Script Social Bar & popunder anti-AdBlock diinjeksi   → impresi maksimal
 *    6. Tidak ada pop-up (pakai popunder)                     → less intrusive
 *    7. Smartlink hanya di CTA modal & tombol organik         → CTR alami
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════════════
     KONFIGURASI  — sesuaikan di sini
  ═══════════════════════════════════════════════════════════════ */

  /**
   * Smartlink URL (Direct Link / Smartlink Adsterra).
   * Gunakan satu URL yang mewakili situs → Adsterra akan rotasi iklan relevan.
   */
  var SMARTLINK_URL =
    "https://wrathful-piano.com/ba3pV.0_PU3wpSvGbomPVlJZZhDg0w2QOhTikExiNgj/AD1dL/TMYl5-OJTWEf2RM/DdkM";

  /**
   * URL popunder fallback (performanceingredientgoblet) jika smartlink diblokir.
   * Rotasi menggunakan dua URL berbeda.
   */
  var POPUNDER_URLS = [
    SMARTLINK_URL,
    "https://performanceingredientgoblet.com/angtq6ey?key=40a62c67960666e3277ffb4d5b2ebbbd",
  ];

  /* ─── Timing (ms) ──────────────────────────────────────────── */
  var POPUNDER_TIMER_FIRST_MS   = 5  * 60 * 1000; // 5 mnt: popunder timer pertama
  var POPUNDER_TIMER_REPEAT_MS  = 8  * 60 * 1000; // 8 mnt: interval popunder ulang
  var MODAL_FIRST_DELAY_MS      = 40 * 1000;       // 40 dtk: modal pertama muncul
  var MODAL_REPEAT_MS           = 6  * 60 * 1000;  // 6 mnt: modal muncul lagi

  /* ─── Batas sesi ───────────────────────────────────────────── */
  /**
   * Maksimum total popunder per sesi kunjungan.
   * Lebih sedikit = user tidak kabur = bounce rate rendah = CPM naik.
   */
  var MAX_POPUNDER_PER_SESSION = 3;

  /* ═══════════════════════════════════════════════════════════════
     STATE INTERNAL
  ═══════════════════════════════════════════════════════════════ */
  var popunderCount = 0;
  var popUrlIndex   = 0;
  var firstClickDone = false;
  var firstTimer;

  /* ═══════════════════════════════════════════════════════════════
     HELPER
  ═══════════════════════════════════════════════════════════════ */

  function nextPopUrl() {
    var url = POPUNDER_URLS[popUrlIndex % POPUNDER_URLS.length];
    popUrlIndex++;
    return url;
  }

  /** Buka popunder — hanya jika belum mencapai batas sesi */
  function openPopunder() {
    if (popunderCount >= MAX_POPUNDER_PER_SESSION) return;
    popunderCount++;
    try {
      var w = window.open(nextPopUrl(), "_blank");
      if (w) {
        try { w.blur(); }       catch (e) {}
        try { window.focus(); } catch (e) {}
      }
    } catch (e) {}
  }

  /** Inject script iklan ke <head> secara aman */
  function injectScript(src, settingsObj) {
    try {
      var d = document,
          s = d.createElement("script"),
          l = d.scripts[d.scripts.length - 1];
      s.settings = settingsObj || {};
      s.src = src;
      s.async = true;
      s.referrerPolicy = "no-referrer-when-downgrade";
      /* Sisipkan tepat setelah script terakhir agar tidak blokir render */
      l.parentNode.insertBefore(s, l);
    } catch (e) {}
  }

  /* ═══════════════════════════════════════════════════════════════
     A. INJEKSI SCRIPT ADSTERRA
     Kombinasi: Popunder + Social Bar  (rekomendasi Adsterra)
  ═══════════════════════════════════════════════════════════════ */

  /* 1. Social Bar / In-Page Push — zone #6991657
        Format: tidak mengganggu, cocok untuk semua device termasuk iOS */
  injectScript(
    "//sophisticatedpin.com/b.XjVnsudbGplL0EY/W/cU/teZmz9/uZZuU/l/kTPTTOY/5mOlTLE_2CNJTkcztCNUjhk/5UMsTFYw2cMIQW",
    {}
  );

  /* 2. Popunder anti-AdBlock — zone #6991605
        Format: popunder (lebih tidak mengganggu dari pop-up biasa) */
  injectScript(
    "//sophisticatedpin.com/bgX.VXsmdKG/lV0NYKW/cd/dehmM9Qu/Z/UAlDkyPVTkYS5YOUT/Ey2IMFTCMFtBN_jakn5SM/T/YExjNqwd",
    {}
  );

  /* ═══════════════════════════════════════════════════════════════
     B. POPUNDER ON-CLICK (klik pertama saja)
     Prinsip: alami, tidak memaksa → CTR organik → CPM lebih stabil
  ═══════════════════════════════════════════════════════════════ */
  document.addEventListener("click", function () {
    if (firstClickDone) return; /* Hanya sekali per sesi dari klik */
    firstClickDone = true;
    openPopunder();
  }, true);

  /* ═══════════════════════════════════════════════════════════════
     C. POPUNDER BERKALA (mulai setelah user engage 5 menit)
  ═══════════════════════════════════════════════════════════════ */
  firstTimer = window.setTimeout(function () {
    openPopunder();
    window.setInterval(function () {
      openPopunder();
    }, POPUNDER_TIMER_REPEAT_MS);
  }, POPUNDER_TIMER_FIRST_MS);

  window.addEventListener("beforeunload", function () {
    window.clearTimeout(firstTimer);
  });

  /* ═══════════════════════════════════════════════════════════════
     D. MODAL IKLAN OVERLAY  (Social Bar + Smartlink)
     UX-friendly: mudah ditutup, tidak memblokir konten utama,
     muncul setelah user engage 40 detik → bounce rate rendah
  ═══════════════════════════════════════════════════════════════ */

  function injectModalStyles() {
    if (document.getElementById("__adm-style")) return;
    var css = [
      /* Overlay gelap */
      "#__adm{",
        "position:fixed;inset:0;z-index:2147483640;",
        "display:flex;align-items:center;justify-content:center;",
        "background:rgba(0,0,0,0.72);",
        "opacity:0;pointer-events:none;",
        "transition:opacity .3s ease;",
      "}",
      "#__adm.on{opacity:1;pointer-events:auto;}",

      /* Box modal */
      "#__adm-box{",
        "position:relative;width:min(94vw,370px);",
        "background:linear-gradient(160deg,#141414,#1c1c1c);",
        "border:1px solid rgba(230,168,0,.32);",
        "border-radius:.9rem;",
        "padding:1.1rem 1.1rem .9rem;",
        "box-shadow:0 24px 72px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.04);",
        "animation:__adm-in .38s cubic-bezier(.34,1.56,.64,1) both;",
      "}",
      "@keyframes __adm-in{",
        "from{transform:scale(.8) translateY(16px);opacity:0}",
        "to{transform:scale(1) translateY(0);opacity:1}",
      "}",

      /* Close button — besar & mudah diklik (UX friendly) */
      "#__adm-x{",
        "position:absolute;top:.6rem;right:.6rem;",
        "width:2rem;height:2rem;border-radius:50%;",
        "border:1px solid rgba(255,255,255,.15);",
        "background:rgba(255,255,255,.08);",
        "color:#fff;font-size:.85rem;",
        "cursor:pointer;display:grid;place-items:center;",
        "transition:background .2s;line-height:1;",
      "}",
      "#__adm-x:hover{background:rgba(220,50,50,.55);}",

      /* Label */
      "#__adm-lbl{",
        "font-size:.58rem;letter-spacing:.22em;text-transform:uppercase;",
        "color:rgba(230,168,0,.7);margin-bottom:.75rem;font-weight:700;",
      "}",

      /* Area konten iklan */
      "#__adm-slot{",
        "min-height:90px;display:flex;",
        "align-items:center;justify-content:center;",
        "background:rgba(0,0,0,.45);",
        "border:1px solid rgba(255,255,255,.06);",
        "border-radius:.55rem;overflow:hidden;margin-bottom:.85rem;",
      "}",

      /* Footer CTA */
      "#__adm-foot{",
        "display:flex;gap:.6rem;align-items:center;justify-content:flex-end;",
      "}",
      "#__adm-cl{",
        "font-size:.65rem;color:rgba(255,255,255,.45);",
        "background:none;border:none;cursor:pointer;padding:0;",
        "transition:color .2s;",
      "}",
      "#__adm-cl:hover{color:rgba(255,255,255,.75);}",
      "#__adm-cta{",
        "font-size:.65rem;font-weight:700;letter-spacing:.1em;",
        "text-transform:uppercase;",
        "color:#0a0a0a;",
        "background:linear-gradient(135deg,#e6a800,#ffd040);",
        "border:none;border-radius:.4rem;",
        "padding:.45rem 1rem;cursor:pointer;",
        "transition:filter .2s;",
      "}",
      "#__adm-cta:hover{filter:brightness(1.12);}",
    ].join("");
    var el = document.createElement("style");
    el.id = "__adm-style";
    el.textContent = css;
    document.head.appendChild(el);
  }

  var modalBuilt = false;
  var modalBannerLoaded = false;

  function buildModal() {
    if (modalBuilt) return;
    modalBuilt = true;
    injectModalStyles();

    var div = document.createElement("div");
    div.id = "__adm";
    div.setAttribute("role", "dialog");
    div.setAttribute("aria-modal", "true");
    div.setAttribute("aria-label", "Pesan sponsor");
    div.innerHTML =
      '<div id="__adm-box">' +
        '<button id="__adm-x" aria-label="Tutup">&#x2715;</button>' +
        '<p id="__adm-lbl">Sponsor &middot; FT Epep Squad</p>' +
        '<div id="__adm-slot"></div>' +
        '<div id="__adm-foot">' +
          '<button id="__adm-cl" type="button">Lewati</button>' +
          '<button id="__adm-cta" type="button">Lihat Penawaran &#x2192;</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(div);

    /* Handlers — mudah ditutup */
    function closeModal() {
      div.classList.remove("on");
    }
    document.getElementById("__adm-x").addEventListener("click",  closeModal);
    document.getElementById("__adm-cl").addEventListener("click", closeModal);

    /* Klik di luar box juga tutup (UX friendly) */
    div.addEventListener("click", function (e) {
      if (e.target === div) closeModal();
    });

    /* CTA: buka smartlink + tutup modal */
    document.getElementById("__adm-cta").addEventListener("click", function () {
      try { window.open(SMARTLINK_URL, "_blank"); } catch (e) {}
      closeModal();
    });
  }

  function showModal() {
    buildModal();
    /* Load banner zone #6991641 (Social Bar) ke dalam slot modal — sekali saja */
    if (!modalBannerLoaded) {
      modalBannerLoaded = true;
      var slot = document.getElementById("__adm-slot");
      if (slot) {
        var s = document.createElement("script");
        s.src = "//sophisticatedpin.com/bFXBVds.dzGylZ0uYOW/cR/LecmF9kuGZWUVlBkAPfTGY/5LOST/Ed2oNXDAEwt/NfjLkG5aMITqYx0mN/Q-";
        s.async = true;
        s.referrerPolicy = "no-referrer-when-downgrade";
        s.settings = {};
        slot.appendChild(s);
      }
    }
    var el = document.getElementById("__adm");
    if (el) el.classList.add("on");
  }

  function initModal() {
    /* Modal pertama kali setelah 40 detik (user sudah engage) */
    window.setTimeout(function () {
      showModal();
      /* Tampil ulang setiap 6 menit */
      window.setInterval(showModal, MODAL_REPEAT_MS);
    }, MODAL_FIRST_DELAY_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initModal);
  } else {
    initModal();
  }

})();
