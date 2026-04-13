(function () {
  "use strict";

  var STORAGE_KEY = "ft-epep-squad:br-match-1-meta";

  /** Poin peringkat Match 1 (rank 13–15 = 0 untuk mode 15 tim). */
  var RANK_PLACEMENT = { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0 };

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

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function emptyTeam() {
    return { teamName: "", m1Rank: "", m1Kill: "", totalKill: "", totalPoint: "" };
  }

  function getTeamCount(form) {
    var teamEl = form.querySelector('input[name="teamSlot"]:checked');
    return teamEl && teamEl.value === "15" ? 15 : 12;
  }

  function rankPlacementPoints(rankStr) {
    var n = parseInt(rankStr, 10);
    if (isNaN(n) || n < 1) return 0;
    if (RANK_PLACEMENT[n] != null) return RANK_PLACEMENT[n];
    return 0;
  }

  function parseKillField(el) {
    if (!el || el.value == null || el.value === "") return 0;
    var digits = String(el.value).replace(/\D/g, "");
    if (!digits) return 0;
    var n = parseInt(digits, 10);
    if (isNaN(n) || n < 0) return 0;
    return n;
  }

  function updateRowTotalPoint(tr) {
    var rankEl = tr.querySelector('[data-field="m1Rank"]');
    var k1 = tr.querySelector('[data-field="m1Kill"]');
    var tk = tr.querySelector('[data-field="totalKill"]');
    var pt = tr.querySelector('[data-field="totalPoint"]');
    if (!pt) return;
    var placement = rankPlacementPoints(rankEl ? rankEl.value : "");
    var killPts = parseKillField(k1) + parseKillField(tk);
    pt.value = String(placement + killPts);
  }

  function updateAllRowsPoints(tb) {
    if (!tb) return;
    tb.querySelectorAll("[data-team-row]").forEach(function (tr) {
      updateRowTotalPoint(tr);
    });
  }

  function isRankTakenByOther(tb, selfTr, rankVal) {
    if (!rankVal) return false;
    var rows = tb.querySelectorAll("[data-team-row]");
    for (var i = 0; i < rows.length; i++) {
      var tr = rows[i];
      if (tr === selfTr) continue;
      var sel = tr.querySelector('[data-field="m1Rank"]');
      if (sel && String(sel.value) === String(rankVal)) return true;
    }
    return false;
  }

  function dedupeRanksFromTop(tb) {
    var seen = {};
    tb.querySelectorAll("[data-team-row]").forEach(function (tr) {
      var sel = tr.querySelector('[data-field="m1Rank"]');
      if (!sel || !sel.value) return;
      if (seen[sel.value]) sel.value = "";
      else seen[sel.value] = true;
    });
  }

  function buildRankSelectInnerHtml(maxN, current, selfTr, tb) {
    var parts = ['<option value="">—</option>'];
    var cur = String(current || "");
    for (var r = 1; r <= maxN; r++) {
      var sv = String(r);
      if (cur === sv || !isRankTakenByOther(tb, selfTr, sv)) {
        parts.push(
          '<option value="' +
            sv +
            '"' +
            (cur === sv ? " selected" : "") +
            ">#" +
            sv +
            "</option>"
        );
      }
    }
    return parts.join("");
  }

  function refreshRankSelects(tb, maxN) {
    if (!tb) return;
    tb.querySelectorAll("[data-team-row]").forEach(function (tr) {
      var sel = tr.querySelector('[data-field="m1Rank"]');
      if (!sel) return;
      var cur = sel.value;
      sel.innerHTML = buildRankSelectInnerHtml(maxN, cur, tr, tb);
      var ok = false;
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === cur) {
          ok = true;
          break;
        }
      }
      sel.value = ok ? cur : "";
    });
  }

  function readTeamsFromTbody(tb) {
    if (!tb) return [];
    return Array.prototype.map.call(tb.querySelectorAll("[data-team-row]"), function (tr) {
      function v(field) {
        var el = tr.querySelector('[data-field="' + field + '"]');
        return el && el.value != null ? String(el.value) : "";
      }
      return {
        teamName: v("teamName"),
        m1Rank: v("m1Rank"),
        m1Kill: v("m1Kill"),
        totalKill: v("totalKill"),
        totalPoint: v("totalPoint"),
      };
    });
  }

  function mergeTeamsForCount(teams, count) {
    var arr = Array.isArray(teams) ? teams.slice() : [];
    while (arr.length < count) arr.push(emptyTeam());
    return arr.slice(0, count);
  }

  var SELECT_CLASS =
    "w-full cursor-pointer rounded-lg border border-[color-mix(in_srgb,white_10%,transparent)] bg-[color-mix(in_srgb,black_40%,transparent)] px-2 py-1.5 text-[0.78rem] text-[var(--color-text-primary)] outline-none transition focus:border-[color-mix(in_srgb,var(--color-brand-glow)_45%,transparent)] focus:ring-1 focus:ring-[color-mix(in_srgb,var(--color-brand-glow)_25%,transparent)]";

  var INPUT_CLASS =
    "w-full rounded-lg border border-[color-mix(in_srgb,white_10%,transparent)] bg-[color-mix(in_srgb,black_40%,transparent)] px-2 py-1.5 text-[0.78rem] text-[var(--color-text-primary)] outline-none transition focus:border-[color-mix(in_srgb,var(--color-brand-glow)_45%,transparent)] focus:ring-1 focus:ring-[color-mix(in_srgb,var(--color-brand-glow)_25%,transparent)]";

  var TOTAL_PT_CLASS =
    INPUT_CLASS +
    " cursor-default bg-[color-mix(in_srgb,black_55%,transparent)] text-[color-mix(in_srgb,var(--color-brand-glow)_95%,#e2e8f0)]";

  function cellInput(field, value) {
    var v = escapeHtml(value);
    return (
      '<input type="text" data-field="' +
      field +
      '" value="' +
      v +
      '" class="' +
      INPUT_CLASS +
      '" autocomplete="off" />'
    );
  }

  function cellTotalPoint(value) {
    var v = escapeHtml(value);
    return (
      '<input type="text" data-field="totalPoint" value="' +
      v +
      '" readonly tabindex="-1" aria-readonly="true" class="' +
      TOTAL_PT_CLASS +
      '" />'
    );
  }

  function cellRankSelectInitial(maxN, value) {
    var v = escapeHtml(value);
    var parts = ['<option value="">—</option>'];
    for (var r = 1; r <= maxN; r++) {
      var sv = String(r);
      parts.push(
        '<option value="' + sv + '"' + (v === sv ? " selected" : "") + ">#" + sv + "</option>"
      );
    }
    return '<select data-field="m1Rank" class="' + SELECT_CLASS + '">' + parts.join("") + "</select>";
  }

  function renderTeamTable(tb, count, teams) {
    if (!tb) return;
    var merged = mergeTeamsForCount(teams, count);
    var rows = [];
    for (var i = 0; i < count; i++) {
      var t = merged[i] || emptyTeam();
      var no = i + 1;
      rows.push(
        '<tr data-team-row class="bg-[color-mix(in_srgb,var(--color-bg-primary)_25%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-brand)_6%,transparent)]">' +
          '<td class="px-2 py-1.5 text-center font-[family-name:var(--font-heading)] text-[0.72rem] font-bold tabular-nums text-[var(--color-brand-glow)] sm:px-3">' +
          no +
          "</td>" +
          '<td class="px-2 py-1.5 sm:px-3">' +
          cellInput("teamName", t.teamName) +
          "</td>" +
          '<td class="min-w-[10.5rem] w-[11rem] border-l border-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] px-3 py-1.5 sm:px-3.5">' +
          cellRankSelectInitial(count, t.m1Rank) +
          "</td>" +
          '<td class="min-w-[10.5rem] w-[11rem] border-r border-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] px-3 py-1.5 sm:px-3.5">' +
          cellInput("m1Kill", t.m1Kill) +
          "</td>" +
          '<td class="px-2 py-1.5 sm:px-3">' +
          cellInput("totalKill", t.totalKill) +
          "</td>" +
          '<td class="px-2 py-1.5 sm:px-3">' +
          cellTotalPoint(t.totalPoint) +
          "</td>" +
          "</tr>"
      );
    }
    tb.innerHTML = rows.join("");
    dedupeRanksFromTop(tb);
    refreshRankSelects(tb, count);
    updateAllRowsPoints(tb);
  }

  function collectFromForm(form) {
    var snEl = form.querySelector('[name="sessionNumber"]');
    var rawSession = snEl && snEl.value != null ? String(snEl.value) : "";
    var sessionDigits = digitsOnly(rawSession);
    var teamEl = form.querySelector('input[name="teamSlot"]:checked');
    var teamSlot = teamEl && teamEl.value === "15" ? "15" : "12";
    var tb = form.querySelector("#br-match1-teams-tbody");
    return {
      tournamentName: (form.querySelector('[name="tournamentName"]') || {}).value || "",
      season: (form.querySelector('[name="season"]') || {}).value || "",
      playDate: (form.querySelector('[name="playDate"]') || {}).value || "",
      sessionNumber: sessionDigits,
      playTime: (form.querySelector('[name="playTime"]') || {}).value || "",
      teamSlot: teamSlot,
      teams: readTeamsFromTbody(tb),
    };
  }

  function applyToForm(form, data) {
    var tb = form.querySelector("#br-match1-teams-tbody");
    if (!data) {
      if (tb) renderTeamTable(tb, getTeamCount(form), []);
      return;
    }
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
    var t12 = form.querySelector('input[name="teamSlot"][value="12"]');
    var t15 = form.querySelector('input[name="teamSlot"][value="15"]');
    var slot = data.teamSlot;
    if (slot === 15 || slot === "15") {
      if (t15) t15.checked = true;
    } else if (t12) {
      t12.checked = true;
    }
    var cnt = slot === 15 || slot === "15" ? 15 : 12;
    if (tb) renderTeamTable(tb, cnt, data.teams || []);
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

  function formatDateId(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso + "T12:00:00");
      if (isNaN(d.getTime())) return escapeHtml(iso);
      return escapeHtml(
        d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
      );
    } catch (e) {
      return escapeHtml(iso);
    }
  }

  function formatTime(t) {
    if (!t) return "—";
    return escapeHtml(t);
  }

  function buildPosterInnerHTML(meta, teams) {
    var title = meta.tournamentName ? escapeHtml(meta.tournamentName) : "Turnamen";
    var season = meta.season ? escapeHtml(meta.season) : "—";
    var when = formatDateId(meta.playDate);
    var sess = meta.sessionNumber ? escapeHtml(meta.sessionNumber) : "—";
    var tm = formatTime(meta.playTime);
    var fmt = meta.teamSlot === "15" ? "15" : "12";
    var rows = [];
    for (var i = 0; i < teams.length; i++) {
      var r = teams[i] || emptyTeam();
      var trClass = i % 2 === 0 ? "br-m1-poster__tr" : "br-m1-poster__tr br-m1-poster__tr--alt";
      rows.push(
        '<tr class="' +
          trClass +
          '">' +
          '<td class="br-m1-poster__td br-m1-poster__td--no">' +
          (i + 1) +
          '</td><td class="br-m1-poster__td br-m1-poster__td--name">' +
          escapeHtml(r.teamName) +
          '</td><td class="br-m1-poster__td br-m1-poster__td--rk">' +
          escapeHtml(r.m1Rank) +
          '</td><td class="br-m1-poster__td br-m1-poster__td--k">' +
          escapeHtml(r.m1Kill) +
          '</td><td class="br-m1-poster__td br-m1-poster__td--tk">' +
          escapeHtml(r.totalKill) +
          '</td><td class="br-m1-poster__td br-m1-poster__td--pt">' +
          escapeHtml(r.totalPoint) +
          "</td></tr>"
      );
    }
    return (
      '<header class="br-m1-poster__head">' +
      '<p class="br-m1-poster__eyebrow">FT EPEP SQUAD</p>' +
      '<h1 class="br-m1-poster__title">' +
      title +
      "</h1>" +
      '<div class="br-m1-poster__chips">' +
      '<span class="br-m1-poster__chip">Season · ' +
      season +
      '</span><span class="br-m1-poster__chip">' +
      when +
      '</span><span class="br-m1-poster__chip">Sesi ' +
      sess +
      " · " +
      tm +
      '</span><span class="br-m1-poster__chip br-m1-poster__chip--accent">' +
      fmt +
      " Tim</span>" +
      "</div></header>" +
      '<div class="br-m1-poster__rule" aria-hidden="true"></div>' +
      '<p class="br-m1-poster__subhead">Match 1 · Battle Royale</p>' +
      '<div class="br-m1-poster__table-wrap">' +
      '<table class="br-m1-poster__table">' +
      "<thead>" +
      "<tr>" +
      '<th rowspan="2" class="br-m1-poster__th">No</th>' +
      '<th rowspan="2" class="br-m1-poster__th br-m1-poster__th--name">Nama team</th>' +
      '<th colspan="2" class="br-m1-poster__th br-m1-poster__th--match">Match 1</th>' +
      '<th rowspan="2" class="br-m1-poster__th">Total kill</th>' +
      '<th rowspan="2" class="br-m1-poster__th">Total point</th>' +
      "</tr><tr>" +
      '<th class="br-m1-poster__th br-m1-poster__th--sub">Rank</th>' +
      '<th class="br-m1-poster__th br-m1-poster__th--sub">Kill</th>' +
      "</tr></thead>" +
      "<tbody>" +
      rows.join("") +
      "</tbody></table></div>" +
      '<p class="br-m1-poster__footer">Fast tournament · roster resmi</p>'
    );
  }

  function fillPosterCapture(form) {
    var cap = $("br-match1-poster-capture");
    if (!cap || !form) return;
    var tb = form.querySelector("#br-match1-teams-tbody");
    if (tb) updateAllRowsPoints(tb);
    var payload = collectFromForm(form);
    cap.innerHTML =
      '<div class="br-m1-poster-root">' +
      '<div class="br-m1-poster__mesh" aria-hidden="true"></div>' +
      '<div class="br-m1-poster__frame">' +
      buildPosterInnerHTML(payload, payload.teams || []) +
      "</div></div>";
  }

  function getHtmlToImage() {
    var w = typeof window !== "undefined" ? window : {};
    return w.htmlToImage || null;
  }

  function slugFileName(name) {
    var s = String(name || "match-1")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return s || "match-1";
  }

  function bindRosterInteractions(form, tb) {
    if (!form || !tb) return;

    tb.addEventListener("change", function (e) {
      var el = e.target;
      if (!el || !el.getAttribute) return;
      if (el.getAttribute("data-field") === "m1Rank") {
        refreshRankSelects(tb, getTeamCount(form));
        updateAllRowsPoints(tb);
      }
    });

    tb.addEventListener("input", function (e) {
      var el = e.target;
      if (!el || !el.getAttribute) return;
      var f = el.getAttribute("data-field");
      if (f === "m1Kill" || f === "totalKill") {
        var tr = el.closest && el.closest("[data-team-row]");
        if (tr) updateRowTotalPoint(tr);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = $("br-match1-meta-form");
    var btnSave = $("br-match1-meta-save");
    var btnReset = $("br-match1-meta-reset");
    var status = $("br-match1-meta-status");
    var tb = form ? form.querySelector("#br-match1-teams-tbody") : null;
    var dlg = $("br-match1-poster-dialog");
    var btnPreview = $("br-match1-preview-open");
    var btnClose = $("br-match1-poster-close");
    var btnDl = $("br-match1-poster-download");
    var hint = $("br-match1-poster-export-hint");

    if (!form || !btnSave || !btnReset || !tb) return;

    bindRosterInteractions(form, tb);

    var saved = readState();
    if (saved) applyToForm(form, saved);
    else renderTeamTable(tb, getTeamCount(form), []);

    form.querySelectorAll('input[name="teamSlot"]').forEach(function (radio) {
      radio.addEventListener("change", function () {
        var cur = readTeamsFromTbody(tb);
        var cnt = getTeamCount(form);
        renderTeamTable(tb, cnt, mergeTeamsForCount(cur, cnt));
      });
    });

    btnSave.addEventListener("click", function () {
      updateAllRowsPoints(tb);
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
      renderTeamTable(tb, 12, []);
      setStatus(status, "Form dan data tersimpan telah direset.", "warn");
    });

    if (btnPreview && dlg && typeof dlg.showModal === "function") {
      btnPreview.addEventListener("click", function () {
        fillPosterCapture(form);
        dlg.showModal();
        document.dispatchEvent(new CustomEvent("ft-close-sidebar", { bubbles: true }));
      });
    }

    if (btnClose && dlg) {
      btnClose.addEventListener("click", function () {
        dlg.close();
      });
    }

    if (btnDl && dlg) {
      btnDl.addEventListener("click", function () {
        var cap = $("br-match1-poster-capture");
        var h2i = getHtmlToImage();
        if (!cap || !h2i || typeof h2i.toPng !== "function") {
          if (hint) {
            hint.textContent = "Pustaka gambar tidak tersedia. Muat ulang halaman atau periksa jaringan.";
            hint.classList.remove("hidden");
          }
          return;
        }
        if (hint) {
          hint.classList.add("hidden");
          hint.textContent = "";
        }
        btnDl.disabled = true;
        fillPosterCapture(form);
        var runExport = function () {
          h2i
            .toPng(cap, {
              pixelRatio: 2,
              cacheBust: true,
              backgroundColor: "#0f0f0f",
            })
            .then(function (dataUrl) {
              var a = document.createElement("a");
              var name = slugFileName((collectFromForm(form).tournamentName || "") + "-match1-roster");
              a.href = dataUrl;
              a.download = name + ".png";
              a.rel = "noopener";
              document.body.appendChild(a);
              a.click();
              a.remove();
            })
            .catch(function () {
              if (hint) {
                hint.textContent = "Gagal membuat PNG. Coba tutup modal lain atau perkecil data.";
                hint.classList.remove("hidden");
              }
            })
            .finally(function () {
              btnDl.disabled = false;
            });
        };
        requestAnimationFrame(function () {
          requestAnimationFrame(runExport);
        });
      });
    }
  });
})();
