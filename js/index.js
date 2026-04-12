(function () {
  "use strict";

  function initAOS() {
    if (typeof AOS === "undefined") return;
    AOS.init({
      duration: 800,
      once: true,
      offset: 56,
      easing: "ease-out-cubic",
    });
  }

  function initHeroTilt() {
    var card = document.querySelector("#hero-visual-card");
    var zone = document.querySelector("#hero-visual-zone");
    if (!card || !zone || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var max = 9;
    var raf = null;

    function onMove(e) {
      var rect = zone.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      var rx = (-y * max).toFixed(2);
      var ry = (x * max).toFixed(2);

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        card.style.transform = "rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateZ(0)";
      });
    }

    function reset() {
      if (raf) cancelAnimationFrame(raf);
      card.style.transform = "";
    }

    zone.addEventListener("pointermove", onMove, { passive: true });
    zone.addEventListener("pointerleave", reset);
  }

  function initHeroScroll() {
    var link = document.querySelector('[data-hero-scroll][href^="#"]');
    if (!link) return;
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (!id || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function initPageHashLinks() {
    document
      .querySelectorAll(
        '[data-inpage-link][href^="#"]'
      )
      .forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (!id || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function initHeroCtaGate() {
    var dialog = document.getElementById("hero-cta-gate");
    if (!dialog || typeof dialog.showModal !== "function") return;

    var slot = document.getElementById("hero-modal-ad-slot");
    var btnGo = document.getElementById("hero-cta-gate-go");
    var btnCancel = document.getElementById("hero-cta-gate-cancel");
    var chk = document.getElementById("hero-cta-gate-ack");
    var titleEl = document.getElementById("hero-cta-gate-title");
    var descEl = document.getElementById("hero-cta-gate-desc");
    var countdownEl = document.getElementById("hero-cta-gate-countdown");

    var pendingHash = null;
    var pendingUrl = null;
    var lastTrigger = null;
    var minUntil = 0;
    var tickIv = null;

    function clearTick() {
      if (tickIv) {
        clearInterval(tickIv);
        tickIv = null;
      }
    }

    function loadModalAdOnce() {
      if (!slot || slot.getAttribute("data-ad-loaded") === "1") return;
      slot.setAttribute("data-ad-loaded", "1");
      var wrap = document.createElement("div");
      wrap.className = "site-ads__unit flex w-full justify-center";
      var opts = document.createElement("script");
      opts.textContent =
        'atOptions = { key: "2b39ed5a6df1bc66366ef9e91d1b3efc", format: "iframe", height: 300, width: 160, params: {} };';
      wrap.appendChild(opts);
      var inv = document.createElement("script");
      inv.async = true;
      inv.src = "https://performanceingredientgoblet.com/2b39ed5a6df1bc66366ef9e91d1b3efc/invoke.js";
      wrap.appendChild(inv);
      slot.appendChild(wrap);
    }

    function updateCountdownText() {
      if (!countdownEl) return;
      var now = Date.now();
      if (now < minUntil) {
        var s = Math.max(0, Math.ceil((minUntil - now) / 1000));
        countdownEl.textContent =
          "Tunggu " + s + " detik sambil meninjau iklan. Setelah itu centang pernyataan di bawah untuk mengaktifkan Lanjutkan.";
        return;
      }
      if (chk && !chk.checked) {
        countdownEl.textContent =
          "Centang pernyataan di bawah jika Anda sudah meninjau atau mengetuk area iklan, lalu ketuk Lanjutkan.";
        return;
      }
      if (pendingUrl && /tools\.html/i.test(pendingUrl)) {
        countdownEl.textContent = "Anda dapat melanjutkan ke halaman Tools.";
      } else if (pendingUrl) {
        countdownEl.textContent = "Anda dapat melanjutkan ke tujuan yang dipilih.";
      } else {
        countdownEl.textContent = "Anda dapat melanjutkan ke bagian yang dipilih.";
      }
    }

    function updateGoButton() {
      if (!btnGo) return;
      var ready = Date.now() >= minUntil && chk && chk.checked;
      btnGo.disabled = !ready;
      updateCountdownText();
    }

    function startTick() {
      clearTick();
      tickIv = setInterval(updateGoButton, 300);
      updateGoButton();
    }

    function openGate(hash, url, heading, desc, trigger) {
      pendingHash = hash || null;
      pendingUrl = url || null;
      lastTrigger = trigger || null;
      if (titleEl) titleEl.textContent = heading;
      if (descEl) descEl.textContent = desc;
      if (chk) chk.checked = false;
      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      minUntil = Date.now() + (reduced ? 2200 : 5500);
      loadModalAdOnce();
      startTick();
      document.dispatchEvent(new CustomEvent("ft-close-sidebar", { bubbles: true }));
      dialog.showModal();
      if (btnCancel) btnCancel.focus();
    }

    document.querySelectorAll("[data-hero-cta-gate-target]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var sel = btn.getAttribute("data-hero-cta-gate-target");
        if (!sel || sel.length < 2) return;
        if (sel === "#fitur") {
          openGate(
            sel,
            null,
            "Tinjau iklan",
            "Untuk membuka bagian Fitur-fitur kami, tinjau iklan di jendela ini terlebih dahulu.",
            btn
          );
        } else if (sel === "#kontak") {
          openGate(
            sel,
            null,
            "Tinjau iklan",
            "Untuk membuka bagian Kontak (Untuk EO), tinjau iklan di jendela ini terlebih dahulu.",
            btn
          );
        } else {
          openGate(sel, null, "Tinjau iklan", "Tinjau iklan di bawah sebelum melanjutkan.", btn);
        }
      });
    });

    document.querySelectorAll("[data-hero-cta-gate-url]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (e.defaultPrevented) return;
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var raw = a.getAttribute("data-hero-cta-gate-url");
        if (!raw) return;
        e.preventDefault();
        var gateDesc =
          a.getAttribute("data-hero-cta-gate-desc") ||
          "Untuk melanjutkan, tinjau iklan di jendela ini terlebih dahulu.";
        openGate(null, raw, "Tinjau iklan", gateDesc, a);
      });
    });

    if (chk) chk.addEventListener("change", updateGoButton);

    if (btnGo) {
      btnGo.addEventListener("click", function () {
        if (btnGo.disabled) return;
        if (!pendingHash && !pendingUrl) return;
        var hash = pendingHash;
        var url = pendingUrl;
        pendingHash = null;
        pendingUrl = null;
        dialog.close();
        clearTick();
        if (url) {
          window.location.assign(url);
        } else if (hash) {
          var target = document.querySelector(hash);
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    if (btnCancel) {
      btnCancel.addEventListener("click", function () {
        dialog.close();
      });
    }

    dialog.addEventListener("close", function () {
      pendingHash = null;
      pendingUrl = null;
      clearTick();
      if (chk) chk.checked = false;
      if (lastTrigger && typeof lastTrigger.focus === "function") {
        try {
          lastTrigger.focus();
        } catch (e) {
          /* ignore */
        }
      }
      lastTrigger = null;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initAOS();
    initHeroTilt();
    initHeroScroll();
    initPageHashLinks();
    initHeroCtaGate();
  });
})();
