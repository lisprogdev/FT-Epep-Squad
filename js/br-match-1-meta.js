(function () {
  "use strict";

  var STORAGE_KEY = "ft-epep-squad:br-match-1-meta";

  function $(id) {
    return document.getElementById(id);
  }

  function readState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || typeof o !== "object") return null;
      return o;
    } catch (e) {
      return null;
    }
  }

  function writeState(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  function digitsOnly(str) {
    return String(str || "").replace(/\D/g, "");
  }

  function collectFromForm(form) {
    var snEl = form.querySelector('[name="sessionNumber"]');
    var rawSession = snEl && snEl.value != null ? String(snEl.value) : "";
    var sessionDigits = digitsOnly(rawSession);
    return {
      tournamentName: (form.querySelector('[name="tournamentName"]') || {}).value || "",
      season: (form.querySelector('[name="season"]') || {}).value || "",
      playDate: (form.querySelector('[name="playDate"]') || {}).value || "",
      sessionNumber: sessionDigits,
      playTime: (form.querySelector('[name="playTime"]') || {}).value || "",
    };
  }

  function applyToForm(form, data) {
    if (!data) return;
    var tn = form.querySelector('[name="tournamentName"]');
    var se = form.querySelector('[name="season"]');
    var pd = form.querySelector('[name="playDate"]');
    var sn = form.querySelector('[name="sessionNumber"]');
    var pt = form.querySelector('[name="playTime"]');
    if (tn) tn.value = data.tournamentName || "";
    if (se) se.value = data.season || "";
    if (pd) pd.value = data.playDate || "";
    if (sn) {
      if (data.sessionNumber != null && String(data.sessionNumber) !== "") {
        sn.value = digitsOnly(data.sessionNumber) || "";
      } else if (data.session) {
        sn.value = digitsOnly(data.session) || "";
      } else {
        sn.value = "";
      }
    }
    if (pt) pt.value = data.playTime || "";
  }

  function setStatus(el, message, tone) {
    if (!el) return;
    el.textContent = message || "";
    el.classList.remove("text-teal-400", "text-amber-400", "text-red-400", "opacity-0");
    if (tone === "warn") el.classList.add("text-amber-400");
    else if (tone === "err") el.classList.add("text-red-400");
    else el.classList.add("text-teal-400");
    if (!message) {
      el.classList.add("opacity-0");
      return;
    }
    window.clearTimeout(el._ftHideT);
    el._ftHideT = window.setTimeout(function () {
      el.textContent = "";
      el.classList.add("opacity-0");
    }, 3200);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = $("br-match1-meta-form");
    var btnSave = $("br-match1-meta-save");
    var btnReset = $("br-match1-meta-reset");
    var status = $("br-match1-meta-status");
    if (!form || !btnSave || !btnReset) return;

    var saved = readState();
    applyToForm(form, saved);

    btnSave.addEventListener("click", function () {
      var payload = collectFromForm(form);
      if (!writeState(payload)) {
        setStatus(status, "Tidak bisa menyimpan (penyimpanan penuh atau diblokir).", "err");
        return;
      }
      setStatus(status, "Tersimpan di perangkat ini.", "ok");
    });

    btnReset.addEventListener("click", function () {
      clearState();
      form.reset();
      setStatus(status, "Form dan data tersimpan telah direset.", "warn");
    });
  });
})();
