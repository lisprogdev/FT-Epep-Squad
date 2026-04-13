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

  var toastSeq = 0;

  /** Peringatan & error: modal tema proyek (bukan toast / alert browser). */
  function showBrMatch1NoticeModal(kind, message) {
    var dlg = $("br-match1-notice-dialog");
    var titleEl = $("br-match1-notice-title");
    var msgEl = $("br-match1-notice-msg");
    if (!dlg || !msgEl || !message) return;
    var k = kind === "error" ? "error" : "warn";
    dlg.classList.remove("br-m1-notice-dialog--warn", "br-m1-notice-dialog--error");
    dlg.classList.add(k === "error" ? "br-m1-notice-dialog--error" : "br-m1-notice-dialog--warn");
    var titles = { error: "Gagal", warn: "Peringatan" };
    var icons = { error: "fa-solid fa-circle-xmark", warn: "fa-solid fa-triangle-exclamation" };
    if (titleEl) titleEl.textContent = titles[k];
    msgEl.textContent = message;
    var iconI = dlg.querySelector(".br-m1-notice-dialog__icon-fa");
    if (iconI) iconI.className = icons[k] + " br-m1-notice-dialog__icon-fa";
    if (typeof dlg.showModal !== "function") return;
    if (dlg.open) dlg.close();
    dlg.showModal();
    document.dispatchEvent(new CustomEvent("ft-close-sidebar", { bubbles: true }));
  }

  function dismissBrMatch1Toast(node) {
    if (!node || !node.parentNode) return;
    node.classList.remove("br-m1-toast--in");
    node.classList.add("br-m1-toast--out");
    window.setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 320);
  }

  /** kind: "success" | "error" | "warn" — sukses = toast ringan; peringatan & gagal = modal. */
  function showBrMatch1Toast(kind, message) {
    if (!message) return;
    var k0 = kind === "success" || kind === "error" || kind === "warn" ? kind : "warn";
    if (k0 === "error" || k0 === "warn") {
      showBrMatch1NoticeModal(k0, message);
      return;
    }
    var root = $("br-match1-toast-root");
    if (!root) return;
    var title = "Berhasil";
    var icon = "fa-solid fa-circle-check";
    var div = document.createElement("div");
    div.id = "br-m1-toast-" + ++toastSeq;
    div.className = "br-m1-toast br-m1-toast--success";
    div.setAttribute("role", "status");
    div.innerHTML =
      '<div class="br-m1-toast__shine" aria-hidden="true"></div>' +
      '<div class="br-m1-toast__inner">' +
      '<span class="br-m1-toast__icon-wrap" aria-hidden="true"><i class="' +
      icon +
      ' br-m1-toast__icon"></i></span>' +
      '<div class="br-m1-toast__text">' +
      '<p class="br-m1-toast__title">' +
      escapeHtml(title) +
      '</p><p class="br-m1-toast__msg">' +
      escapeHtml(message) +
      '</p></div><button type="button" class="br-m1-toast__close" data-toast-close aria-label="Tutup notifikasi">' +
      '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      "</div>";
    root.appendChild(div);
    window.requestAnimationFrame(function () {
      div.classList.add("br-m1-toast--in");
    });
    var hideT = window.setTimeout(function () {
      dismissBrMatch1Toast(div);
    }, 4800);
    var btn = div.querySelector("[data-toast-close]");
    if (btn) {
      btn.addEventListener("click", function () {
        window.clearTimeout(hideT);
        dismissBrMatch1Toast(div);
      });
    }
  }

  function emptyTeam() {
    return { teamName: "", m1Rank: "", m1Kill: "", totalKill: "", totalPoint: "" };
  }

  function defaultTeamName(slotNo) {
    return "Team " + slotNo;
  }

  function resolveTeamDisplayName(raw, slotNo) {
    var s = raw != null ? String(raw).trim() : "";
    return s !== "" ? s : defaultTeamName(slotNo);
  }

  function getTeamCount(form) {
    var teamEl = form.querySelector('input[name="teamSlot"]:checked');
    return teamEl && teamEl.value === "15" ? 15 : 12;
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  /** YYYY-MM-DD zona waktu lokal */
  function localDateISO(d) {
    var x = d || new Date();
    return x.getFullYear() + "-" + pad2(x.getMonth() + 1) + "-" + pad2(x.getDate());
  }

  /** HH:mm zona waktu lokal */
  function localTimeHM(d) {
    var x = d || new Date();
    return pad2(x.getHours()) + ":" + pad2(x.getMinutes());
  }

  /**
   * Tanggal main: min = hari ini, default hari ini jika kosong/lampau.
   * Jam: jika tanggal = hari ini, min = jam sekarang (tidak bisa pilih jam lampau); jika tanggal mendatang, tanpa min jam.
   */
  function clampPlayDateAndSyncTime(form) {
    if (!form) return;
    var pd = form.querySelector('[name="playDate"]');
    var pt = form.querySelector('[name="playTime"]');
    if (!pd) return;
    var today = localDateISO();
    pd.setAttribute("min", today);
    if (!pd.value || pd.value < today) pd.value = today;
    if (!pt) return;
    if (pd.value === today) {
      var nowHm = localTimeHM();
      pt.setAttribute("min", nowHm);
      if (!pt.value) pt.value = nowHm;
      else if (pt.value < nowHm) pt.value = nowHm;
    } else {
      pt.removeAttribute("min");
    }
  }

  function rankPlacementPoints(rankStr) {
    var n = parseInt(rankStr, 10);
    if (isNaN(n) || n < 1) return 0;
    if (RANK_PLACEMENT[n] != null) return RANK_PLACEMENT[n];
    return 0;
  }

  function parseKillValue(val) {
    if (val == null || val === "") return 0;
    var digits = String(val).replace(/\D/g, "");
    if (!digits) return 0;
    var n = parseInt(digits, 10);
    return isNaN(n) || n < 0 ? 0 : n;
  }

  function parseKillField(el) {
    return parseKillValue(el && el.value);
  }

  function teamKillTotalFromData(team) {
    var t = team || emptyTeam();
    return parseKillValue(t.m1Kill) + parseKillValue(t.totalKill);
  }

  /** Slot 1-based tim dengan total kill terbesar (m1Kill + totalKill); seri → slot lebih kecil. Kosong jika semua 0. */
  function computeMvTeamIndexFromKills(teams) {
    if (!teams || !teams.length) return "";
    var bestK = -1;
    var bestIdx = -1;
    for (var i = 0; i < teams.length; i++) {
      var k = teamKillTotalFromData(teams[i]);
      if (k > bestK) {
        bestK = k;
        bestIdx = i;
      }
    }
    if (bestIdx < 0 || bestK <= 0) return "";
    return String(bestIdx + 1);
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

  var SELECT_CLASS_CENTER = SELECT_CLASS + " text-center";

  var INPUT_CLASS =
    "w-full rounded-lg border border-[color-mix(in_srgb,white_10%,transparent)] bg-[color-mix(in_srgb,black_40%,transparent)] px-2 py-1.5 text-[0.78rem] text-[var(--color-text-primary)] outline-none transition focus:border-[color-mix(in_srgb,var(--color-brand-glow)_45%,transparent)] focus:ring-1 focus:ring-[color-mix(in_srgb,var(--color-brand-glow)_25%,transparent)]";

  var TOTAL_PT_CLASS =
    INPUT_CLASS +
    " text-center cursor-default bg-[color-mix(in_srgb,black_55%,transparent)] text-[color-mix(in_srgb,var(--color-brand-glow)_95%,#e2e8f0)]";

  function cellInput(field, value, centered) {
    var v = escapeHtml(value);
    var cls = centered ? INPUT_CLASS + " text-center" : INPUT_CLASS;
    return (
      '<input type="text" data-field="' +
      field +
      '" value="' +
      v +
      '" class="' +
      cls +
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

  /** Rank sudah dipakai baris lain di data merge (render awal). */
  function rankTakenInMerge(merged, ownIdx, rankVal) {
    if (!rankVal) return false;
    for (var j = 0; j < merged.length; j++) {
      if (j === ownIdx) continue;
      var o = merged[j];
      if (o && String(o.m1Rank || "") === String(rankVal)) return true;
    }
    return false;
  }

  /** Opsi rank: sembunyikan # yang sudah dipilih tim lain; baris ini tetap bisa melihat ranknya sendiri. */
  function buildRankSelectHtmlForRow(maxN, ownIdx, merged) {
    var self = merged[ownIdx] || emptyTeam();
    var cur = String(self.m1Rank || "").trim();
    var parts = ['<option value="">—</option>'];
    for (var r = 1; r <= maxN; r++) {
      var sv = String(r);
      if (cur === sv || !rankTakenInMerge(merged, ownIdx, sv)) {
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
    return '<select data-field="m1Rank" class="' + SELECT_CLASS_CENTER + '">' + parts.join("") + "</select>";
  }

  function renderTeamTable(tb, count, teams) {
    if (!tb) return;
    var merged = mergeTeamsForCount(teams, count);
    var rows = [];
    for (var i = 0; i < count; i++) {
      var t = merged[i] || emptyTeam();
      var no = i + 1;
      var rawName = t.teamName != null ? String(t.teamName).trim() : "";
      var nameVal = rawName !== "" ? rawName : defaultTeamName(no);
      rows.push(
        '<tr data-team-row class="bg-[color-mix(in_srgb,var(--color-bg-primary)_25%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--color-brand)_6%,transparent)]">' +
          '<td class="px-2 py-1.5 text-center align-middle font-[family-name:var(--font-heading)] text-[0.72rem] font-bold tabular-nums text-[var(--color-brand-glow)] sm:px-3">' +
          no +
          "</td>" +
          '<td class="px-2 py-1.5 align-middle sm:px-3">' +
          cellInput("teamName", nameVal) +
          "</td>" +
          '<td class="min-w-[5.25rem] w-[5.75rem] border-l border-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] px-1.5 py-1.5 text-center align-middle sm:min-w-[9rem] sm:w-[10rem] sm:px-3 sm:py-1.5 lg:min-w-[10.5rem] lg:w-[11rem] lg:px-3.5">' +
          buildRankSelectHtmlForRow(count, i, merged) +
          "</td>" +
          '<td class="min-w-[5.25rem] w-[5.75rem] border-r border-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] px-1.5 py-1.5 text-center align-middle sm:min-w-[9rem] sm:w-[10rem] sm:px-3 sm:py-1.5 lg:min-w-[10.5rem] lg:w-[11rem] lg:px-3.5">' +
          cellInput("m1Kill", t.m1Kill, true) +
          "</td>" +
          '<td class="px-2 py-1.5 text-center align-middle sm:px-3">' +
          cellInput("totalKill", t.totalKill, true) +
          "</td>" +
          '<td class="px-2 py-1.5 text-center align-middle sm:px-3">' +
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
    var teams = readTeamsFromTbody(tb);
    var mvTeamIndex = computeMvTeamIndexFromKills(teams);
    return {
      tournamentName: (form.querySelector('[name="tournamentName"]') || {}).value || "",
      season: (form.querySelector('[name="season"]') || {}).value || "",
      playDate: (form.querySelector('[name="playDate"]') || {}).value || "",
      sessionNumber: sessionDigits,
      playTime: (form.querySelector('[name="playTime"]') || {}).value || "",
      teamSlot: teamSlot,
      mvTeamIndex: mvTeamIndex,
      teams: teams,
    };
  }

  function applyToForm(form, data) {
    var tb = form.querySelector("#br-match1-teams-tbody");
    if (!data) {
      if (tb) renderTeamTable(tb, getTeamCount(form), []);
      clampPlayDateAndSyncTime(form);
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
    clampPlayDateAndSyncTime(form);
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
    var mvIxStr = computeMvTeamIndexFromKills(teams);
    var mvIx = mvIxStr !== "" ? parseInt(mvIxStr, 10) : NaN;
    var mvBlock = "";
    if (!isNaN(mvIx) && mvIx >= 1 && mvIx <= teams.length) {
      var rMv = teams[mvIx - 1] || emptyTeam();
      var mvDisp = resolveTeamDisplayName(rMv.teamName, mvIx);
      var mvKills = teamKillTotalFromData(rMv);
      mvBlock =
        '<div class="br-m1-poster__mv">' +
        '<div class="br-m1-poster__mv-glow" aria-hidden="true"></div>' +
        '<div class="br-m1-poster__mv-inner">' +
        '<div class="br-m1-poster__mv-icon" aria-hidden="true">\u2605</div>' +
        '<p class="br-m1-poster__mv-kicker">Kill terbanyak · Match 1</p>' +
        '<p class="br-m1-poster__mv-label">MVP Team</p>' +
        '<p class="br-m1-poster__mv-name">' +
        escapeHtml(mvDisp) +
        '</p><p class="br-m1-poster__mv-slot">Slot #' +
        mvIx +
        " · " +
        mvKills +
        " kill</p></div></div>";
    }
    var rows = [];
    for (var i = 0; i < teams.length; i++) {
      var r = teams[i] || emptyTeam();
      var trClass = i % 2 === 0 ? "br-m1-poster__tr" : "br-m1-poster__tr br-m1-poster__tr--alt";
      var rowName = resolveTeamDisplayName(r.teamName, i + 1);
      rows.push(
        '<tr class="' +
          trClass +
          '">' +
          '<td class="br-m1-poster__td br-m1-poster__td--no">' +
          (i + 1) +
          '</td><td class="br-m1-poster__td br-m1-poster__td--name">' +
          escapeHtml(rowName) +
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
    var brandStrip =
      '<div class="br-m1-poster__brand">' +
      '<img src="../../img/element/Logo.png" alt="" class="br-m1-poster__brand-logo" width="56" height="56" decoding="async" loading="eager" />' +
      '<div class="br-m1-poster__brand-meta">' +
      '<span class="br-m1-poster__brand-name">FT Epep Squad</span>' +
      '<span class="br-m1-poster__brand-link" translate="no">ft-epep-squad.web.id</span>' +
      "</div></div>";
    return (
      brandStrip +
      '<header class="br-m1-poster__head">' +
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
      '<p class="br-m1-poster__footer">Fast tournament · roster resmi</p>' +
      mvBlock
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
    var noticeDlg = $("br-match1-notice-dialog");
    var noticeOk = $("br-match1-notice-ok");
    if (noticeDlg) {
      noticeDlg.addEventListener("click", function (e) {
        if (e.target === noticeDlg) noticeDlg.close();
      });
    }
    if (noticeDlg && noticeOk) {
      noticeOk.addEventListener("click", function () {
        noticeDlg.close();
      });
    }

    var form = $("br-match1-meta-form");
    var btnReset = $("br-match1-meta-reset");
    var tb = form ? form.querySelector("#br-match1-teams-tbody") : null;
    var dlg = $("br-match1-poster-dialog");
    var btnPreview = $("br-match1-preview-open");
    var btnClose = $("br-match1-poster-close");
    var btnDl = $("br-match1-poster-download");
    if (!form || !btnReset || !tb) return;

    bindRosterInteractions(form, tb);

    var saved = readState();
    if (saved) applyToForm(form, saved);
    else renderTeamTable(tb, getTeamCount(form), []);
    clampPlayDateAndSyncTime(form);

    var pdEl = form.querySelector('[name="playDate"]');
    var ptEl = form.querySelector('[name="playTime"]');
    function onPlayDateTimeAdjust() {
      clampPlayDateAndSyncTime(form);
    }
    if (pdEl) {
      pdEl.addEventListener("change", onPlayDateTimeAdjust);
      pdEl.addEventListener("input", onPlayDateTimeAdjust);
    }
    if (ptEl) ptEl.addEventListener("change", onPlayDateTimeAdjust);

    var AUTOSAVE_MS = 420;
    var saveTimer = null;
    var posterRaf = null;
    var lastWrittenJson = "";

    function syncBaselineFromForm() {
      if (tb) updateAllRowsPoints(tb);
      lastWrittenJson = JSON.stringify(collectFromForm(form));
    }

    function flushPersist() {
      if (tb) updateAllRowsPoints(tb);
      var payload = collectFromForm(form);
      var json = JSON.stringify(payload);
      if (!writeState(payload)) {
        showBrMatch1Toast(
          "error",
          "Tidak bisa menyimpan otomatis — penyimpanan penuh, private mode, atau diblokir browser."
        );
        return false;
      }
      lastWrittenJson = json;
      return true;
    }

    function scheduleAutosave() {
      if (saveTimer) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(function () {
        saveTimer = null;
        flushPersist();
      }, AUTOSAVE_MS);
    }

    function schedulePosterRefresh() {
      if (!dlg || !dlg.open) return;
      if (posterRaf != null) window.cancelAnimationFrame(posterRaf);
      posterRaf = window.requestAnimationFrame(function () {
        posterRaf = null;
        fillPosterCapture(form);
      });
    }

    function onFormDirty() {
      schedulePosterRefresh();
      scheduleAutosave();
    }

    syncBaselineFromForm();

    form.addEventListener("input", onFormDirty);
    form.addEventListener("change", onFormDirty);

    function flushPendingSave() {
      if (!saveTimer) return;
      window.clearTimeout(saveTimer);
      saveTimer = null;
      flushPersist();
    }

    window.addEventListener("beforeunload", function (e) {
      flushPendingSave();
      if (tb) updateAllRowsPoints(tb);
      var now = JSON.stringify(collectFromForm(form));
      if (now !== lastWrittenJson) {
        e.preventDefault();
        e.returnValue = "";
      }
    });

    window.addEventListener("pagehide", function () {
      flushPendingSave();
    });

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") flushPendingSave();
      else if (document.visibilityState === "visible") clampPlayDateAndSyncTime(form);
    });

    form.querySelectorAll('input[name="teamSlot"]').forEach(function (radio) {
      radio.addEventListener("change", function () {
        var cur = readTeamsFromTbody(tb);
        var cnt = getTeamCount(form);
        renderTeamTable(tb, cnt, mergeTeamsForCount(cur, cnt));
        onFormDirty();
      });
    });

    btnReset.addEventListener("click", function () {
      clearState();
      form.reset();
      renderTeamTable(tb, 12, []);
      clampPlayDateAndSyncTime(form);
      syncBaselineFromForm();
      showBrMatch1Toast("warn", "Form dan data lokal telah direset. Tanggal & jam disetel ke sekarang.");
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
          showBrMatch1Toast(
            "error",
            "Pustaka gambar tidak tersedia. Muat ulang halaman atau periksa jaringan."
          );
          return;
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
              showBrMatch1Toast("success", "Poster PNG berhasil dibuat dan sedang diunduh.");
            })
            .catch(function () {
              showBrMatch1Toast(
                "error",
                "Gagal membuat PNG. Coba tutup modal lain, kurangi ukuran data, atau gunakan peramban lain."
              );
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
