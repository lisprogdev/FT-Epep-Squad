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
    var card = document.querySelector(".hero__visual-card");
    var zone = document.querySelector(".hero__visual-shell");
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
    var link = document.querySelector('.hero__scroll[href^="#"]');
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
    document.querySelectorAll('.cara__link[href^="#"], .mengapa__inline[href^="#"]').forEach(function (a) {
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

  document.addEventListener("DOMContentLoaded", function () {
    initAOS();
    initHeroTilt();
    initHeroScroll();
    initPageHashLinks();
  });
})();
