/**
 * ad-trigger.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sistem iklan agresif untuk FT Epep Squad:
 *  1. Klik pertama user di halaman mana saja → buka tab iklan (popunder)
 *  2. Setelah 2 menit sejak halaman dimuat → buka tab iklan otomatis
 *  3. Setiap N menit berikutnya → buka tab iklan lagi (berulang)
 *
 * URL iklan diambil dari daftar AD_URLS secara rotasi agar tidak terlalu
 * kentara sebagai spam domain yang sama.
 * ─────────────────────────────────────────────────────────────────────────────
 */
(function () {
  "use strict";

  /* ── Konfigurasi ─────────────────────────────────────────────────── */
  var AD_URLS = [
    "https://performanceingredientgoblet.com/angtq6ey?key=40a62c67960666e3277ffb4d5b2ebbbd",
    "https://performanceingredientgoblet.com/angtq6ey?key=40a62c67960666e3277ffb4d5b2ebbbd",
    "https://performanceingredientgoblet.com/angtq6ey?key=40a62c67960666e3277ffb4d5b2ebbbd",
  ];

  /** Jeda sebelum iklan pertama otomatis muncul (ms). Default 2 menit. */
  var FIRST_AD_DELAY_MS = 2 * 60 * 1000;   // 2 menit

  /** Interval iklan berikutnya setelah yang pertama (ms). Default 3 menit. */
  var REPEAT_AD_INTERVAL_MS = 3 * 60 * 1000; // 3 menit

  /** Minimum jeda antar dua popunder (ms) agar tidak double-fire saat klik
   *  lebih cepat dari ini setelah popunder terakhir dibuka. */
  var CLICK_COOLDOWN_MS = 30 * 1000; // 30 detik

  /* ── State internal ──────────────────────────────────────────────── */
  var adIndex = 0;
  var lastClickAdAt = 0;
  var firstClickDone = false;
  var timerAdCount = 0;

  /* ── Helper: ambil URL iklan berikutnya secara rotasi ───────────── */
  function nextAdUrl() {
    var url = AD_URLS[adIndex % AD_URLS.length];
    adIndex++;
    return url;
  }

  /* ── Buka tab iklan ─────────────────────────────────────────────── */
  function openAdTab() {
    try {
      var w = window.open(nextAdUrl(), "_blank");
      if (w) {
        /* Beberapa browser popunder: pindahkan fokus kembali ke tab utama */
        try { w.blur(); } catch (e) {}
        try { window.focus(); } catch (e) {}
      }
    } catch (e) { /* diabaikan jika diblokir browser */ }
  }

  /* ── 1. Popunder on-click ──────────────────────────────────────── */
  document.addEventListener(
    "click",
    function () {
      var now = Date.now();

      /* Klik pertama: langsung buka iklan tanpa cooldown */
      if (!firstClickDone) {
        firstClickDone = true;
        lastClickAdAt = now;
        openAdTab();
        return;
      }

      /* Klik berikutnya: hanya buka iklan jika sudah lewat cooldown */
      if (now - lastClickAdAt >= CLICK_COOLDOWN_MS) {
        lastClickAdAt = now;
        openAdTab();
      }
    },
    true /* capture: menangkap sebelum handler lain, termasuk link navigasi */
  );

  /* ── 2. Timer iklan pertama (2 menit setelah halaman dimuat) ─────── */
  var firstTimer = window.setTimeout(function () {
    timerAdCount++;
    openAdTab();

    /* ── 3. Iklan berulang setiap REPEAT_AD_INTERVAL_MS ─────────── */
    window.setInterval(function () {
      timerAdCount++;
      openAdTab();
    }, REPEAT_AD_INTERVAL_MS);
  }, FIRST_AD_DELAY_MS);

  /* Cleanup jika halaman di-unload sebelum timer pertama tiba */
  window.addEventListener("beforeunload", function () {
    window.clearTimeout(firstTimer);
  });
})();
