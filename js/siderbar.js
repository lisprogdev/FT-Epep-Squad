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
    bar.dataset.open = "true";
    backdrop.removeAttribute("hidden");
    backdrop.setAttribute("aria-hidden", "false");
    backdrop.dataset.visible = "true";
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("siderbar-open");
  }

  function closeDrawer() {
    var bar = $("#siderbar");
    var backdrop = $("#siderbar-backdrop");
    var toggle = $("#siderbar-toggle");
    if (!bar || !backdrop || !toggle) return;
    delete bar.dataset.open;
    backdrop.setAttribute("hidden", "");
    backdrop.setAttribute("aria-hidden", "true");
    delete backdrop.dataset.visible;
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("siderbar-open");
  }

  function activeIdFromHref(href) {
    if (!href) return "";
    if (href.charAt(0) === "#") return href.slice(1);
    if (/tools\.html/i.test(href)) return "tools";
    return "";
  }

  function setActiveById(id) {
    $$("[data-siderbar-link]").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var match = activeIdFromHref(href);
      if (match === id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
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
    $$("[data-siderbar-link]").forEach(function (a) {
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
      if (/tools\.html$/i.test(window.location.pathname || "")) {
        setActiveById("tools");
      } else {
        setActiveById("beranda");
      }
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
    initToggle();
    initNavClicks();
    initScrollSpy();
  });
})();
