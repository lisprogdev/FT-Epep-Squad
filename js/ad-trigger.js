(function () {
  "use strict";

  var ADSTERRA_SMARTLINK = "";

  var POPUNDER_FIRST_MS = 6 * 60 * 1000;
  var POPUNDER_REPEAT_MS = 10 * 60 * 1000;
  var MAX_POPUNDER_PER_SESSION = 2;
  var MIN_ONCLICK_DELAY_MS = 9 * 1000;
  var ACTIVE_WINDOW_MS = 45 * 1000;

  if (window.__ft_adsterra_popunder_init) return;
  window.__ft_adsterra_popunder_init = true;

  var startTs = Date.now();
  var lastInteractTs = startTs;
  var engaged = false;
  var clickArmed = false;
  var firstTimer;
  var repeatTimer;

  function readSessionInt(key, fallback) {
    try {
      var raw = window.sessionStorage.getItem(key);
      var n = parseInt(raw, 10);
      return isFinite(n) ? n : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeSessionInt(key, value) {
    try {
      window.sessionStorage.setItem(key, String(value));
    } catch (e) {}
  }

  function now() {
    return Date.now();
  }

  function isUserActive() {
    if (document.visibilityState && document.visibilityState !== "visible") return false;
    var t = now();
    return t - lastInteractTs <= ACTIVE_WINDOW_MS;
  }

  function shouldIgnoreClick(target) {
    if (!target || !target.closest) return false;
    if (target.closest("#siderbar, #siderbar-toggle, #siderbar-backdrop")) return true;
    if (target.closest("header, nav, footer, dialog[open]")) return true;
    if (target.closest("[data-siderbar-link], [data-inpage-link]")) return true;
    return false;
  }

  function openPopunder() {
    if (!ADSTERRA_SMARTLINK) return;
    var popCount = readSessionInt("ft_pop_count", 0);
    if (popCount >= MAX_POPUNDER_PER_SESSION) return;
    writeSessionInt("ft_pop_count", popCount + 1);
    writeSessionInt("ft_pop_last_ts", now());
    try {
      var w = window.open(ADSTERRA_SMARTLINK, "_blank");
      if (w) {
        try { w.blur(); }       catch (e) {}
        try { window.focus(); } catch (e) {}
      }
    } catch (e) {}
  }

  function armClick() {
    if (clickArmed) return;
    clickArmed = true;
  }

  function markEngaged() {
    engaged = true;
    armClick();
  }

  function markInteraction() {
    lastInteractTs = now();
  }

  window.addEventListener("scroll", function () {
    markInteraction();
    if (!engaged && (window.scrollY || document.documentElement.scrollTop || 0) > 120) {
      markEngaged();
    }
  }, { passive: true });

  document.addEventListener("pointerdown", function () {
    markInteraction();
    markEngaged();
  }, { passive: true });

  document.addEventListener("keydown", function () {
    markInteraction();
    markEngaged();
  }, { passive: true });

  window.setTimeout(function () {
    armClick();
  }, MIN_ONCLICK_DELAY_MS);

  document.addEventListener("click", function (e) {
    if (!clickArmed) return;
    if (!engaged) return;
    if (shouldIgnoreClick(e && e.target)) return;
    if (now() - startTs < MIN_ONCLICK_DELAY_MS) return;
    openPopunder();
    clickArmed = false;
  }, true);

  firstTimer = window.setTimeout(function () {
    if (engaged && isUserActive()) openPopunder();
    repeatTimer = window.setInterval(function () {
      if (engaged && isUserActive()) openPopunder();
    }, POPUNDER_REPEAT_MS);
  }, POPUNDER_FIRST_MS);

  window.addEventListener("beforeunload", function () {
    window.clearTimeout(firstTimer);
    if (repeatTimer) window.clearInterval(repeatTimer);
  });
})();
