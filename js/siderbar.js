(function () {
  "use strict";

  /** Urutan section di halaman (scroll spy). */
  var SECTION_IDS = ["beranda", "fitur", "cara-penggunaan", "tools", "mengapa-kami", "faq", "kontak"];

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function openDrawer() {
    var bar = $("#siderbar");
    var backdrop = $("#siderbar-backdrop");
    var toggle = $("#siderbar-toggle");
    if (!bar || !backdrop || !toggle) return;
    bar.classList.add("is-open");
    backdrop.classList.add("is-visible");
    backdrop.removeAttribute("hidden");
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("siderbar-open");
  }

  function closeDrawer() {
    var bar = $("#siderbar");
    var backdrop = $("#siderbar-backdrop");
    var toggle = $("#siderbar-toggle");
    if (!bar || !backdrop || !toggle) return;
    bar.classList.remove("is-open");
    backdrop.classList.remove("is-visible");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("siderbar-open");
    backdrop.setAttribute("hidden", "");
  }

  function setActiveById(id) {
    $$(".siderbar__link[data-siderbar-link]").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var match = href.replace(/^#/, "");
      a.classList.toggle("is-active", match === id);
    });
  }

  function initToggle() {
    var toggle = $("#siderbar-toggle");
    var backdrop = $("#siderbar-backdrop");
    if (!toggle) return;

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      if (open) closeDrawer();
      else openDrawer();
    });

    if (backdrop) {
      backdrop.addEventListener("click", closeDrawer);
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
    });

    window.addEventListener("resize", function () {
      closeDrawer();
    });
  }

  function initNavClicks() {
    $$(".siderbar__link[data-siderbar-link]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        var href = a.getAttribute("href");
        if (!href || href.charAt(0) !== "#") return;
        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          setActiveById(href.slice(1));
        }
        closeDrawer();
      });
    });
  }

  function initScrollSpy() {
    var sections = SECTION_IDS.map(function (id) {
      return document.getElementById(id);
    }).filter(Boolean);

    if (!sections.length) {
      setActiveById("beranda");
      return;
    }

    function updateActiveFromScroll() {
      var y = window.scrollY || document.documentElement.scrollTop;
      var probe = y + Math.min(160, window.innerHeight * 0.22);
      var current = sections[0];
      for (var i = 0; i < sections.length; i++) {
        var el = sections[i];
        var top = el.getBoundingClientRect().top + y;
        if (top <= probe) current = el;
      }
      if (current && current.id) setActiveById(current.id);
    }

    var ticking = false;
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          updateActiveFromScroll();
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateActiveFromScroll, { passive: true });
    updateActiveFromScroll();
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.body.classList.add("has-siderbar");
    initToggle();
    initNavClicks();
    initScrollSpy();
  });
})();
