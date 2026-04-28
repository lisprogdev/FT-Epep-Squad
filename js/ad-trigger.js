(function () {
  "use strict";

  var POPUNDER_FIRST_MS = 5 * 60 * 1000;
  var POPUNDER_REPEAT_MS = 8 * 60 * 1000;
  var MAX_POPUNDER = 3;

  var ADSTERRA_SMARTLINK =
    "https://performanceingredientgoblet.com/angtq6ey?key=40a62c67960666e3277ffb4d5b2ebbbd";

  var popCount = 0;
  var firstClicked = false;
  var firstTimer;

  function openPopunder() {
    if (popCount >= MAX_POPUNDER) return;
    popCount++;
    try {
      var w = window.open(ADSTERRA_SMARTLINK, "_blank");
      if (w) {
        try { w.blur(); }       catch (e) {}
        try { window.focus(); } catch (e) {}
      }
    } catch (e) {}
  }

  document.addEventListener("click", function () {
    if (firstClicked) return;
    firstClicked = true;
    openPopunder();
  }, true);

  firstTimer = window.setTimeout(function () {
    openPopunder();
    window.setInterval(openPopunder, POPUNDER_REPEAT_MS);
  }, POPUNDER_FIRST_MS);

  window.addEventListener("beforeunload", function () {
    window.clearTimeout(firstTimer);
  });
})();
