/**
 * Dorong satu peristiwa per halaman ke dataLayer — nama peristiwa = objek yang diukur.
 * Dipakai oleh GA4 (gtag) atau GTM: buat pemicu "Custom Event" dengan nama yang sama.
 */
(function () {
  window.dataLayer = window.dataLayer || [];
  var path = (window.location.pathname || "/").replace(/\/+/g, "/");
  var l = path.toLowerCase();
  var tail = l.split("/").pop() || "";

  var event = "view_other_page";
  if (l === "/" || tail === "index.html" || l.endsWith("/index.html")) {
    event = "view_home";
  } else if (l.indexOf("battle-royale") !== -1) {
    event = "view_battle_royale_hub";
  } else if (l.indexOf("clash-squad") !== -1 && l.indexOf("/cs/") === -1) {
    event = "view_clash_squad_hub";
  } else if (tail === "tools.html" || l.indexOf("/tools.html") !== -1) {
    event = "view_tools_hub";
  } else {
    var br = l.match(/\/br\/match-(\d+)\.html$/);
    if (br) {
      event = "view_br_match_" + br[1];
    } else if (l.indexOf("/cs/2-team") !== -1 || l.indexOf("2-team.html") !== -1) {
      event = "view_cs_2_team_tool";
    } else if (l.indexOf("/cs/4-team") !== -1 || l.indexOf("4-team.html") !== -1) {
      event = "view_cs_4_team_tool";
    }
  }

  var measuredObject = event.replace(/^view_/, "");
  window.dataLayer.push({
    event: event,
    measured_object: measuredObject,
    page_path: path,
  });
})();
