(function () {
  "use strict";

  var MATCH_NO = "1";
  var MATCH_LABEL_SHORT = "Match " + MATCH_NO;
  var MATCH_LABEL_BR = MATCH_LABEL_SHORT + " — Battle Royale (BR)";
  var MATCH_TAG_BR = MATCH_LABEL_SHORT + " · BR";
  var MATCH_EVENT_LABEL = MATCH_LABEL_SHORT + " Battle Royale";
  var MATCH_WORD_LOWER = "match " + MATCH_NO;
  var STORAGE_KEY = "ft-epep-squad:br-match-" + MATCH_NO + "-meta";

  /** Poin peringkat match aktif (rank 13–15 = 0 untuk mode 15 tim). */
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
    if (!form) return 12;
    var teamEl = form.querySelector('input[name="teamSlot"]:checked');
    var raw = teamEl && teamEl.value != null ? String(teamEl.value).trim() : "";
    var n = parseInt(raw, 10);
    if (!isNaN(n) && n > 1) return n;
    return raw === "15" ? 15 : 12;
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

  /** Angka untuk urut poster: poin kosong/tidak valid di bawah (sort desc). */
  function parseTotalPointSort(val) {
    if (val == null || val === "") return -Infinity;
    var s = String(val).trim().replace(/\s/g, "").replace(",", ".");
    if (s === "") return -Infinity;
    var n = parseFloat(s);
    return isNaN(n) ? -Infinity : n;
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
    var rawSlot = teamEl && teamEl.value != null ? String(teamEl.value).trim() : "";
    var slotN = parseInt(rawSlot, 10);
    var teamSlot = !isNaN(slotN) && slotN > 1 ? String(slotN) : rawSlot === "15" ? "15" : "12";
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
    var slot = data.teamSlot;
    var slotStr = slot != null ? String(slot).trim() : "";
    var slotN = parseInt(slotStr, 10);
    var safeSlotStr = slotStr.replace(/"/g, "");
    var slotRadio = safeSlotStr !== "" ? form.querySelector('input[name="teamSlot"][value="' + safeSlotStr + '"]') : null;
    var hasSlotRadio = !!(slotRadio && slotRadio.type === "radio");
    if (hasSlotRadio) slotRadio.checked = true;

    // Jika data lama tersimpan (mis. 12/15) tapi halaman ini memaksa slot lain (mis. 2 team),
    // prioritaskan pilihan yang tersedia di form.
    var cnt = hasSlotRadio
      ? !isNaN(slotN) && slotN > 1
        ? slotN
        : slotStr === "15"
          ? 15
          : 12
      : getTeamCount(form);
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

  /** Tanggal panjang untuk sertifikat (Bahasa Indonesia). */
  function formatDateLongId(iso) {
    if (!iso) return "—";
    try {
      var d = new Date(iso + "T12:00:00");
      if (isNaN(d.getTime())) return escapeHtml(iso);
      return escapeHtml(
        d.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    } catch (e) {
      return escapeHtml(iso);
    }
  }

  function certPositionTitleId(kindKey, rankNum) {
    if (kindKey === "mvp") return "MVP";
    if (rankNum === 1) return "Champion";
    if (rankNum === 2) return "Runner-up";
    if (rankNum === 3) return "Third Place";
    return "—";
  }

  function certAchievementTextId(kindKey, rankNum, tournamentRaw) {
    var tn = String(tournamentRaw || "").trim() || "turnamen";
    if (kindKey === "mvp") {
      return (
        "Diberikan atas prestasi tim dengan total eliminasi tertinggi pada " +
        MATCH_EVENT_LABEL +
        ' dalam rangka "' +
        tn +
        "\"."
      );
    }
    var r = rankNum || 0;
    return (
      "Diberikan atas pencapaian placement peringkat ke-" +
      r +
      " pada " +
      MATCH_EVENT_LABEL +
      ' dalam rangka "' +
      tn +
      "\"."
    );
  }

  function certThanksTextId(tournamentRaw, seasonRaw, playDateIso) {
    var tn = String(tournamentRaw || "").trim() || "turnamen ini";
    var ss = String(seasonRaw || "").trim();
    var dateTxt = formatDateLongId(playDateIso);
    var seasonTxt = ss ? " Season " + ss : "";
    return (
      "Terima kasih atas dedikasi, sportivitas, dan komitmen luar biasa yang telah Anda tunjukkan selama rangkaian kompetisi " +
      '"' +
      tn +
      '"' +
      seasonTxt +
      " yang diselenggarakan pada " +
      dateTxt +
      ". Semoga pencapaian ini menjadi motivasi untuk terus berkembang, menjaga konsistensi performa tim, serta meraih hasil yang lebih tinggi pada pertandingan berikutnya."
    );
  }

  /** Nomor seri unik deterministik (unduh PNG / arsip). */
  function buildCertificateSerial(kindKey, meta, slotNum) {
    var dPart = "00000000";
    if (meta && meta.playDate) {
      var dg = digitsOnly(meta.playDate);
      if (dg.length >= 8) dPart = dg.slice(0, 8);
      else {
        try {
          var d = new Date(meta.playDate + "T12:00:00");
          if (!isNaN(d.getTime())) {
            dPart = d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
          }
        } catch (e) {}
      }
    }
    var ses = digitsOnly(String((meta && meta.sessionNumber) || "0"));
    if (!ses) ses = "0";
    if (ses.length > 4) ses = ses.slice(-4);
    var k = kindKey === "j1" ? "J1" : kindKey === "j2" ? "J2" : kindKey === "j3" ? "J3" : "MVP";
    var n =
      typeof slotNum === "number" && slotNum > 0
        ? slotNum
        : parseInt(String(slotNum || ""), 10);
    var sl = !isNaN(n) && n > 0 ? ("000" + n).slice(-3) : "000";
    return "FT-BR-M" + MATCH_NO + "-" + k + "-" + dPart + "-S" + ses + "-" + sl;
  }

  function formatTime(t) {
    if (!t) return "—";
    return escapeHtml(t);
  }

  /** Rank Match 1 (angka); 1–3 dipakai untuk tanda podium di poster. */
  function parseM1RankForPoster(rankStr) {
    var n = parseInt(String(rankStr || "").trim(), 10);
    return isNaN(n) || n < 1 ? 0 : n;
  }

  function posterJuaraRowClass(rankStr, rowEven) {
    var n = parseM1RankForPoster(rankStr);
    if (n >= 1 && n <= 3) return "br-m1-poster__tr br-m1-poster__tr--juara br-m1-poster__tr--j" + n;
    return rowEven ? "br-m1-poster__tr" : "br-m1-poster__tr br-m1-poster__tr--alt";
  }

  function findTeamByM1Rank(teams, rankN) {
    if (!teams || !teams.length) return null;
    for (var i = 0; i < teams.length; i++) {
      var n = parseInt(String((teams[i] || {}).m1Rank || "").trim(), 10);
      if (n === rankN) return { slot: i + 1, team: teams[i] || emptyTeam() };
    }
    return null;
  }

  function wrapCertSlot(kindKey, tierLabel, articleHtml) {
    var k = escapeHtml(kindKey);
    var lbl = escapeHtml(tierLabel);
    return (
      '<section class="br-m1-cert-slot" data-cert-slot="' +
      k +
      '">' +
      '<div class="br-m1-cert-toolbar">' +
      '<div class="br-m1-cert-toolbar__left">' +
      '<span class="br-m1-cert-toolbar__badge" title="Ekspor raster"><i class="fa-solid fa-file-image" aria-hidden="true"></i> PNG</span>' +
      '<span class="br-m1-cert-toolbar__dim">A4 mendatar · 297 × 210 mm</span></div>' +
      '<button type="button" class="br-m1-cert-toolbar__dl" data-cert-download="' +
      k +
      '" aria-label="Unduh sertifikat ' +
      lbl +
      '">' +
      '<span class="br-m1-cert-toolbar__dl-shine" aria-hidden="true"></span>' +
      '<i class="fa-solid fa-cloud-arrow-down br-m1-cert-toolbar__dl-ico" aria-hidden="true"></i>' +
      '<span class="br-m1-cert-toolbar__dl-text">Unduh</span>' +
      '<span class="br-m1-cert-toolbar__dl-tier">' +
      lbl +
      "</span></button></div>" +
      '<div class="br-m1-cert-viewport">' +
      articleHtml +
      "</div></section>"
    );
  }

  function certArticleEmpty(kindKey, tierLabel, hintLine, positionLabel) {
    var mvpCls = kindKey === "mvp" ? " br-m1-cert--mvp" : "";
    var posEsc = escapeHtml(positionLabel || "—");
    return (
      '<article class="br-m1-cert br-m1-cert--classic br-m1-cert--empty' +
      mvpCls +
      '" data-cert="' +
      kindKey +
      '">' +
      '<div class="br-m1-cert__waterback" aria-hidden="true"></div>' +
      '<aside class="br-m1-cert__aside">' +
      '<div class="br-m1-cert__aside-inner">' +
      '<div class="br-m1-cert__aside-brandstack">' +
      '<img src="../../img/element/Logo.png" alt="" class="br-m1-cert__aside-logo" width="48" height="48" decoding="async" loading="lazy" />' +
      '<div class="br-m1-cert__aside-brandblock">' +
      '<span class="br-m1-cert__aside-brand-name">FT Epep Squad</span>' +
      '<span class="br-m1-cert__aside-brand-line">Fast Tournament</span></div></div>' +
      '<p class="br-m1-cert__aside-tier br-m1-cert__aside-tier--ghost">' +
      escapeHtml(tierLabel) +
      '</p><div class="br-m1-cert__aside-ico br-m1-cert__aside-ico--dim"><i class="fa-solid fa-lock" aria-hidden="true"></i></div>' +
      '<span class="br-m1-cert__aside-tag">' +
      escapeHtml(MATCH_TAG_BR) +
      "</span></div></aside>" +
      '<div class="br-m1-cert__body">' +
      '<p class="br-m1-cert__brand">Fast Tournament · FT Epep Squad</p>' +
      '<p class="br-m1-cert__event br-m1-cert__event--dim">—</p>' +
      '<div class="br-m1-cert__focus">' +
      '<h2 class="br-m1-cert__title">Certifikat Of Achievement</h2>' +
      '<p class="br-m1-cert__presented br-m1-cert__presented--dim">Diberikan kepada</p>' +
      '<p class="br-m1-cert__winner br-m1-cert__winner--dim">—</p>' +
      '<p class="br-m1-cert__as br-m1-cert__as--dim">Sebagai</p>' +
      '<p class="br-m1-cert__position br-m1-cert__position--dim">' +
      posEsc +
      '</p><p class="br-m1-cert__thanks br-m1-cert__thanks--dim">Terima kasih atas partisipasi pada turnamen ini. Nama turnamen, season, dan tanggal akan tampil setelah data dilengkapi.</p></div>' +
      '<p class="br-m1-cert__warn">' +
      escapeHtml(hintLine) +
      '</p><p class="br-m1-cert__subhint">Isi roster: rank unik per slot · MVP dari total kill.</p>' +
      '<footer class="br-m1-cert__sign">' +
      '<div class="br-m1-cert__serial">' +
      '<span class="br-m1-cert__serial-lbl">Nomor seri</span>' +
      '<code class="br-m1-cert__serial-code br-m1-cert__dd--dim">—</code></div>' +
      '<div class="br-m1-cert__eo">' +
      '<span class="br-m1-cert__eo-line" aria-hidden="true"></span>' +
      '<span class="br-m1-cert__eo-name">FT Epep Squad</span>' +
      '<span class="br-m1-cert__eo-role">Penyelenggara / EO</span></div></footer>' +
      '<p class="br-m1-cert__footline br-m1-cert__footline--dim">— · — · —</p>' +
      "</div></article>"
    );
  }

  /**
   * opts: kindKey, iconClass, tierLabel, tournamentName, participantName, positionTitle,
   * playDateIso, sessionNumber, playTime, achievementText (raw), serialRaw, rankNum (optional), slotNum (optional)
   */
  function certArticleFilled(opts) {
    var kindKey = opts.kindKey;
    var iconClass = opts.iconClass;
    var tierLabel = opts.tierLabel;
    var tournamentName =
      opts.tournamentName != null && String(opts.tournamentName).trim() !== ""
        ? String(opts.tournamentName).trim()
        : "—";
    var participantName = opts.participantName || "—";
    var positionTitle = opts.positionTitle || "—";
    var thanksEsc = escapeHtml(certThanksTextId(tournamentName, opts.season, opts.playDateIso));
    var sessRaw = opts.sessionNumber != null && String(opts.sessionNumber).trim() !== "" ? String(opts.sessionNumber).trim() : "";
    var sessionDisp = sessRaw !== "" ? escapeHtml(sessRaw) : "—";
    var timeDisp = formatTime(opts.playTime);
    var achievementEsc = escapeHtml(opts.achievementText || "");
    var serialEsc = escapeHtml(opts.serialRaw || "");
    var organizerEsc = escapeHtml(opts.organizerName != null ? String(opts.organizerName) : "FT Epep Squad");
    var matchLabelEsc = escapeHtml(opts.matchLabel != null ? String(opts.matchLabel) : MATCH_LABEL_BR);
    var mvpCls = kindKey === "mvp" ? " br-m1-cert--mvp" : "";
    return (
      '<article class="br-m1-cert br-m1-cert--classic' +
      mvpCls +
      '" data-cert="' +
      kindKey +
      '">' +
      '<div class="br-m1-cert__waterback" aria-hidden="true"></div>' +
      '<aside class="br-m1-cert__aside">' +
      '<div class="br-m1-cert__aside-inner">' +
      '<div class="br-m1-cert__aside-brandstack">' +
      '<img src="../../img/element/Logo.png" alt="" class="br-m1-cert__aside-logo" width="48" height="48" decoding="async" loading="lazy" />' +
      '<div class="br-m1-cert__aside-brandblock">' +
      '<span class="br-m1-cert__aside-brand-name">FT Epep Squad</span>' +
      '<span class="br-m1-cert__aside-brand-line">Fast Tournament</span></div></div>' +
      '<p class="br-m1-cert__aside-tier">' +
      escapeHtml(tierLabel) +
      '</p><div class="br-m1-cert__aside-ico"><i class="' +
      iconClass +
      '" aria-hidden="true"></i></div>' +
      '<span class="br-m1-cert__aside-tag">' +
      escapeHtml(MATCH_TAG_BR) +
      "</span></div></aside>" +
      '<div class="br-m1-cert__body">' +
      '<p class="br-m1-cert__brand">Fast Tournament · FT Epep Squad</p>' +
      '<p class="br-m1-cert__event">' +
      escapeHtml(tournamentName) +
      "</p>" +
      '<div class="br-m1-cert__focus">' +
      '<h2 class="br-m1-cert__title">Certifikat Of Achievement</h2>' +
      '<p class="br-m1-cert__presented">Diberikan kepada</p>' +
      '<p class="br-m1-cert__winner">' +
      escapeHtml(participantName) +
      "</p>" +
      '<p class="br-m1-cert__as">Sebagai</p>' +
      '<p class="br-m1-cert__position">' +
      escapeHtml(positionTitle) +
      '</p><p class="br-m1-cert__thanks">' +
      thanksEsc +
      "</p></div>" +
      '<footer class="br-m1-cert__sign">' +
      '<div class="br-m1-cert__serial">' +
      '<span class="br-m1-cert__serial-lbl">Nomor seri</span>' +
      '<code class="br-m1-cert__serial-code">' +
      serialEsc +
      "</code></div>" +
      '<div class="br-m1-cert__eo">' +
      '<span class="br-m1-cert__eo-line" aria-hidden="true"></span>' +
      '<span class="br-m1-cert__eo-name">' +
      organizerEsc +
      "</span>" +
      '<span class="br-m1-cert__eo-role">Tanda tangan / Penyelenggara</span></div></footer>' +
      '<p class="br-m1-cert__footline">' +
      escapeHtml(tournamentName) +
      " · Sesi " +
      sessionDisp +
      " · " +
      timeDisp +
      "</p></div></article>"
    );
  }

  function buildCertificatesHTML(meta, teams) {
    teams = teams || [];
    var eventRaw = meta.tournamentName || "";
    var parts = [];

    function pushPlacement(rankNum, kindKey, iconClass, tierText) {
      var hit = findTeamByM1Rank(teams, rankNum);
      if (!hit) {
        parts.push(
          wrapCertSlot(
            kindKey,
            tierText,
            certArticleEmpty(kindKey, tierText, "RANK #" + rankNum + " · BELUM TERISI", certPositionTitleId(kindKey, rankNum))
          )
        );
        return;
      }
      var nm = resolveTeamDisplayName(hit.team.teamName, hit.slot);
      parts.push(
        wrapCertSlot(
          kindKey,
          tierText,
          certArticleFilled({
            kindKey: kindKey,
            iconClass: iconClass,
            tierLabel: tierText,
            tournamentName: eventRaw,
            season: meta.season,
            participantName: nm,
            positionTitle: certPositionTitleId(kindKey, rankNum),
            playDateIso: meta.playDate,
            sessionNumber: meta.sessionNumber,
            playTime: meta.playTime,
            achievementText: certAchievementTextId(kindKey, rankNum, eventRaw),
            serialRaw: buildCertificateSerial(kindKey, meta, hit.slot),
            organizerName: "FT Epep Squad",
            matchLabel: MATCH_LABEL_BR,
          })
        )
      );
    }

    pushPlacement(1, "j1", "fa-solid fa-trophy", "TOP 1");
    pushPlacement(2, "j2", "fa-solid fa-angles-up", "TOP 2");
    pushPlacement(3, "j3", "fa-solid fa-angles-up", "TOP 3");

    var mvStr = computeMvTeamIndexFromKills(teams);
    var mvIx = mvStr !== "" ? parseInt(mvStr, 10) : NaN;
    if (isNaN(mvIx) || mvIx < 1 || mvIx > teams.length) {
      parts.push(
        wrapCertSlot("mvp", "MVP", certArticleEmpty("mvp", "MVP", "Data MVP belum tersedia (kill tim).", certPositionTitleId("mvp", 0)))
      );
    } else {
      var t = teams[mvIx - 1] || emptyTeam();
      var nm = resolveTeamDisplayName(t.teamName, mvIx);
      var kills = teamKillTotalFromData(t);
      parts.push(
        wrapCertSlot(
          "mvp",
          "MVP",
          certArticleFilled({
            kindKey: "mvp",
            iconClass: "fa-solid fa-crosshairs",
            tierLabel: "MVP",
            tournamentName: eventRaw,
            season: meta.season,
            participantName: nm,
            positionTitle: certPositionTitleId("mvp", 0),
            playDateIso: meta.playDate,
            sessionNumber: meta.sessionNumber,
            playTime: meta.playTime,
            achievementText:
              certAchievementTextId("mvp", 0, eventRaw) + " Total kill tim: " + kills + ".",
            serialRaw: buildCertificateSerial("mvp", meta, mvIx),
            organizerName: "FT Epep Squad",
            matchLabel: MATCH_LABEL_BR,
          })
        )
      );
    }

    return parts.join("");
  }

  function buildPosterInnerHTML(meta, teams) {
    var title = meta.tournamentName ? escapeHtml(meta.tournamentName) : "Turnamen";
    var season = meta.season ? escapeHtml(meta.season) : "—";
    var when = formatDateId(meta.playDate);
    var sess = meta.sessionNumber ? escapeHtml(meta.sessionNumber) : "—";
    var tm = formatTime(meta.playTime);
    var fmt = meta.teamSlot != null && String(meta.teamSlot).trim() !== "" ? String(meta.teamSlot).trim() : "12";
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
        '<p class="br-m1-poster__mv-kicker">Kill terbanyak · ' +
        escapeHtml(MATCH_LABEL_SHORT) +
        "</p>" +
        '<p class="br-m1-poster__mv-label">MVP Team</p>' +
        '<p class="br-m1-poster__mv-name">' +
        escapeHtml(mvDisp) +
        '</p><p class="br-m1-poster__mv-slot">Slot #' +
        mvIx +
        " · " +
        mvKills +
        " kill</p></div></div>";
    }
    var order = [];
    for (var i = 0; i < teams.length; i++) {
      order.push({ slot: i + 1, team: teams[i] || emptyTeam() });
    }
    order.sort(function (a, b) {
      var pa = parseTotalPointSort(a.team.totalPoint);
      var pb = parseTotalPointSort(b.team.totalPoint);
      if (pb !== pa) return pb - pa;
      return a.slot - b.slot;
    });
    var rows = [];
    for (var j = 0; j < order.length; j++) {
      var r = order[j].team;
      var slotNum = order[j].slot;
      var trClass = posterJuaraRowClass(r.m1Rank, j % 2 === 0);
      var rowName = resolveTeamDisplayName(r.teamName, slotNum);
      rows.push(
        '<tr class="' +
          trClass +
          '">' +
          '<td class="br-m1-poster__td br-m1-poster__td--no">' +
          (j + 1) +
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
      '<p class="br-m1-poster__subhead">' +
      escapeHtml(MATCH_LABEL_SHORT) +
      " · Battle Royale</p>" +
      '<div class="br-m1-poster__table-wrap">' +
      '<table class="br-m1-poster__table">' +
      "<thead>" +
      "<tr>" +
      '<th rowspan="2" class="br-m1-poster__th">No</th>' +
      '<th rowspan="2" class="br-m1-poster__th br-m1-poster__th--name">Nama team</th>' +
      '<th colspan="2" class="br-m1-poster__th br-m1-poster__th--match">' +
      escapeHtml(MATCH_LABEL_SHORT) +
      "</th>" +
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

  function fillCertificatesCapture(form) {
    var root = $("br-match1-cert-capture");
    if (!root || !form) return;
    var elTb = form.querySelector("#br-match1-teams-tbody");
    if (elTb) updateAllRowsPoints(elTb);
    var payload = collectFromForm(form);
    root.innerHTML = buildCertificatesHTML(payload, payload.teams || []);
  }

  function getHtmlToImage() {
    var w = typeof window !== "undefined" ? window : {};
    return w.htmlToImage || null;
  }

  /** Resolusi raster: minimal 2×; ikuti DPR perangkat (hingga 4) agar tidak kalah tajam dari preview. */
  function getPosterExportPixelRatio() {
    var d = typeof window !== "undefined" ? window.devicePixelRatio : 1;
    var x = typeof d === "number" && d > 0 ? d : 1;
    return Math.min(4, Math.max(2, x));
  }

  /** A4 horizontal — lebar × tinggi (px) setara ~96 CSS dpi untuk ekspor PNG. */
  function getCertA4LandscapePx() {
    return { w: 1123, h: 794 };
  }

  function certFileSlugFromKind(kind) {
    var k = String(kind || "");
    if (k === "j1") return "top-1";
    if (k === "j2") return "top-2";
    if (k === "j3") return "top-3";
    if (k === "mvp") return "mvp";
    return slugFileName(k) || "cert";
  }

  function whenFontsReady() {
    if (typeof document === "undefined") return Promise.resolve();
    var f = document.fonts;
    if (f && typeof f.ready !== "undefined" && f.ready && typeof f.ready.then === "function") return f.ready;
    return Promise.resolve();
  }

  function nextFrame() {
    return new Promise(function (resolve) {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(resolve);
      });
    });
  }

  function slugFileName(name) {
    var s = String(name || "match-1")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return s || "match-1";
  }

  function initFtAds() {
    var nodes = document.querySelectorAll("[data-ft-ad][data-ft-ad-key]");
    if (!nodes || !nodes.length) return;
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el || el.getAttribute("data-ft-ad-loaded") === "1") continue;
      var key = el.getAttribute("data-ft-ad-key");
      var format = el.getAttribute("data-ft-ad-format") || "iframe";
      var w = parseInt(el.getAttribute("data-ft-ad-width") || "0", 10) || 0;
      var h = parseInt(el.getAttribute("data-ft-ad-height") || "0", 10) || 0;
      try {
        window.atOptions = { key: key, format: format, height: h, width: w, params: {} };
        var s = document.createElement("script");
        s.src = "https://performanceingredientgoblet.com/" + key + "/invoke.js";
        s.async = true;
        el.appendChild(s);
        el.setAttribute("data-ft-ad-loaded", "1");
      } catch (e) {
        // ignore
      }
    }
  }

  function initBrAlertAdDialog() {
    var dlg = document.getElementById("br-match-alert-ad-dialog");
    var closeBtn = document.getElementById("br-match-alert-ad-close");
    var cd = document.getElementById("br-match-alert-ad-countdown");
    if (!dlg || !closeBtn || !cd || typeof dlg.showModal !== "function") return;
    var key = "ft-br-alert-ad:" + location.pathname;
    if (sessionStorage.getItem(key) === "1") return;
    var left = 8;
    function paint() {
      if (left > 0) {
        cd.textContent = "Iklan alert aktif, lanjutkan dalam " + left + " detik...";
        closeBtn.disabled = true;
      } else {
        cd.textContent = "Selesai. Anda bisa lanjutkan.";
        closeBtn.disabled = false;
      }
    }
    setTimeout(function () {
      try {
        dlg.showModal();
      } catch (e) {
        return;
      }
      paint();
      var t = setInterval(function () {
        left -= 1;
        paint();
        if (left <= 0) clearInterval(t);
      }, 1000);
      closeBtn.addEventListener("click", function () {
        if (closeBtn.disabled) return;
        sessionStorage.setItem(key, "1");
        dlg.close();
      });
      dlg.addEventListener("click", function (e) {
        if (e.target === dlg && !closeBtn.disabled) {
          sessionStorage.setItem(key, "1");
          dlg.close();
        }
      });
    }, 1400);
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
    var dlgCert = $("br-match1-cert-dialog");
    var btnPreview = $("br-match1-preview-open");
    var btnCertPreview = $("br-match1-cert-preview-open");
    var btnClose = $("br-match1-poster-close");
    var btnCertClose = $("br-match1-cert-close");
    var btnDl = $("br-match1-poster-download");
    if (!form || !btnReset || !tb) return;

    bindRosterInteractions(form, tb);

    var gateDlg = $("hero-cta-gate");
    var gateTitle = $("hero-cta-gate-title");
    var gateDesc = $("hero-cta-gate-desc");
    var gateCountdown = $("hero-cta-gate-countdown");
    var gateSlot = $("hero-modal-ad-slot");
    var gateAck = $("hero-cta-gate-ack");
    var gateGo = $("hero-cta-gate-go");
    var gateCancel = $("hero-cta-gate-cancel");
    var gateActive = false;
    var gateUntil = 0;
    var gateTick = null;
    var gateProceed = null;

    function clearGateTick() {
      if (gateTick) {
        window.clearInterval(gateTick);
        gateTick = null;
      }
    }

    function resetGateState() {
      gateActive = false;
      gateUntil = 0;
      gateProceed = null;
      clearGateTick();
      if (gateAck) gateAck.checked = false;
      if (gateGo) gateGo.disabled = true;
    }

    function ensureGateAdLoaded() {
      if (!gateSlot || gateSlot.getAttribute("data-ad-loaded") === "1") return;
      gateSlot.setAttribute("data-ad-loaded", "1");
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
      gateSlot.appendChild(wrap);
    }

    function updateGateUi() {
      if (!gateActive) return;
      var now = Date.now();
      var readyTime = now >= gateUntil;
      var readyAck = !!(gateAck && gateAck.checked);
      if (gateGo) gateGo.disabled = !(readyTime && readyAck);
      if (!gateCountdown) return;
      if (!readyTime) {
        var s = Math.max(0, Math.ceil((gateUntil - now) / 1000));
        gateCountdown.textContent =
          "Tunggu " + s + " detik sambil meninjau iklan. Setelah itu centang pernyataan untuk membuka preview.";
      } else if (!readyAck) {
        gateCountdown.textContent =
          "Centang pernyataan di bawah bila Anda sudah meninjau iklan, lalu ketuk Lanjutkan.";
      } else {
        gateCountdown.textContent = "Preview siap dibuka.";
      }
    }

    function openGateForPreview(descText, proceedFn) {
      if (!gateDlg || typeof gateDlg.showModal !== "function" || !gateGo || !gateAck) {
        proceedFn();
        return;
      }
      gateActive = true;
      gateProceed = typeof proceedFn === "function" ? proceedFn : null;
      if (gateTitle) gateTitle.textContent = "Tinjau iklan";
      if (gateDesc) gateDesc.textContent = descText;
      if (gateAck) gateAck.checked = false;
      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gateUntil = Date.now() + (reduced ? 2200 : 5500);
      ensureGateAdLoaded();
      updateGateUi();
      clearGateTick();
      gateTick = window.setInterval(updateGateUi, 300);
      gateDlg.showModal();
      document.dispatchEvent(new CustomEvent("ft-close-sidebar", { bubbles: true }));
    }

    if (gateAck) {
      gateAck.addEventListener("change", function () {
        updateGateUi();
      });
    }
    if (gateGo) {
      gateGo.addEventListener("click", function () {
        if (!gateActive || gateGo.disabled) return;
        var run = gateProceed;
        if (gateDlg && gateDlg.open) gateDlg.close();
        resetGateState();
        if (typeof run === "function") run();
      });
    }
    if (gateCancel) {
      gateCancel.addEventListener("click", function () {
        if (gateActive && gateDlg && gateDlg.open) gateDlg.close();
      });
    }
    if (gateDlg) {
      gateDlg.addEventListener("close", function () {
        if (!gateActive) return;
        resetGateState();
      });
    }

    var dlGateDlg = $("br-match1-download-gate-dialog");
    var dlGateDesc = $("br-match1-download-gate-desc");
    var dlGateStatus = $("br-match1-download-gate-status");
    var dlGateProgress = $("br-match1-download-gate-progress");
    var dlGateCounter = $("br-match1-download-gate-counter");
    var dlGateOpenAd = $("br-match1-download-gate-open-ad");
    var dlGateCancel = $("br-match1-download-gate-cancel");
    var dlGateContinue = $("br-match1-download-gate-continue");
    var dlGateTick = null;
    var dlGateCtx = {
      active: false,
      actionLabel: "",
      requiredMs: 30000,
      elapsedMs: 0,
      opened: false,
      adWin: null,
      proceedFn: null,
      lastNow: 0,
      wasAdOpen: false,
    };

    function clearDlGateTick() {
      if (dlGateTick) {
        window.clearInterval(dlGateTick);
        dlGateTick = null;
      }
    }

    function formatMmSs(ms) {
      var sec = Math.max(0, Math.ceil(ms / 1000));
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    }

    function resetDownloadGateState() {
      clearDlGateTick();
      dlGateCtx.active = false;
      dlGateCtx.actionLabel = "";
      dlGateCtx.elapsedMs = 0;
      dlGateCtx.opened = false;
      dlGateCtx.adWin = null;
      dlGateCtx.proceedFn = null;
      dlGateCtx.lastNow = 0;
      dlGateCtx.wasAdOpen = false;
      if (dlGateContinue) dlGateContinue.disabled = true;
      if (dlGateProgress) dlGateProgress.style.width = "0%";
      if (dlGateCounter) dlGateCounter.textContent = "00:30";
      if (dlGateStatus) dlGateStatus.textContent = 'Klik "Buka iklan di tab baru", lalu kunjungi selama 30 detik.';
    }

    function updateDownloadGateUi() {
      if (!dlGateCtx.active) return;
      var now = Date.now();
      var delta = dlGateCtx.lastNow ? now - dlGateCtx.lastNow : 0;
      dlGateCtx.lastNow = now;
      var adOpen = !!(dlGateCtx.adWin && !dlGateCtx.adWin.closed);
      if (dlGateCtx.opened && dlGateCtx.wasAdOpen && !adOpen) {
        /* User keluar/menutup tab iklan: reset verifikasi dari awal */
        dlGateCtx.elapsedMs = 0;
        dlGateCtx.opened = false;
        dlGateCtx.adWin = null;
        dlGateCtx.wasAdOpen = false;
      }
      var counting = dlGateCtx.opened && adOpen && (document.hidden || !document.hasFocus());
      if (counting && delta > 0 && delta < 2500) {
        dlGateCtx.elapsedMs = Math.min(dlGateCtx.requiredMs, dlGateCtx.elapsedMs + delta);
      }
      dlGateCtx.wasAdOpen = adOpen;
      var done = dlGateCtx.opened && dlGateCtx.elapsedMs >= dlGateCtx.requiredMs;
      if (dlGateContinue) dlGateContinue.disabled = !done;
      var remain = Math.max(0, dlGateCtx.requiredMs - dlGateCtx.elapsedMs);
      if (dlGateCounter) dlGateCounter.textContent = formatMmSs(remain);
      if (dlGateProgress) {
        var pct = Math.max(0, Math.min(100, (dlGateCtx.elapsedMs / dlGateCtx.requiredMs) * 100));
        dlGateProgress.style.width = pct + "%";
      }
      if (dlGateStatus) {
        if (!dlGateCtx.opened) {
          dlGateStatus.textContent = 'Klik "Buka iklan di tab baru" untuk memulai verifikasi kunjungan 30 detik.';
        } else if (done) {
          dlGateStatus.textContent = "Verifikasi selesai. Anda bisa melanjutkan unduhan " + dlGateCtx.actionLabel + ".";
        } else if (!adOpen) {
          dlGateStatus.textContent =
            "Tab iklan ditutup/ditinggalkan, verifikasi direset. Buka lagi iklan dan kunjungi penuh 30 detik.";
        } else {
          dlGateStatus.textContent =
            "Kunjungi tab iklan hingga hitungan selesai. Sisa waktu verifikasi: " + formatMmSs(remain) + ".";
        }
      }
    }

    function openDownloadAdGate(actionLabel, proceedFn) {
      if (!dlGateDlg || typeof dlGateDlg.showModal !== "function" || !dlGateContinue) {
        if (typeof proceedFn === "function") proceedFn();
        return;
      }
      resetDownloadGateState();
      dlGateCtx.active = true;
      dlGateCtx.actionLabel = actionLabel || "file";
      dlGateCtx.proceedFn = typeof proceedFn === "function" ? proceedFn : null;
      dlGateCtx.lastNow = Date.now();
      if (dlGateDesc) {
        dlGateDesc.textContent =
          "Untuk mengunduh " +
          dlGateCtx.actionLabel +
          ", buka iklan di tab baru dan kunjungi minimal 30 detik. Setelah hitungan selesai, tombol lanjut akan aktif.";
      }
      updateDownloadGateUi();
      clearDlGateTick();
      dlGateTick = window.setInterval(updateDownloadGateUi, 250);
      dlGateDlg.showModal();
      document.dispatchEvent(new CustomEvent("ft-close-sidebar", { bubbles: true }));
      if (dlGateOpenAd) dlGateOpenAd.focus();
    }

    if (dlGateDlg) {
      dlGateDlg.addEventListener("click", function (e) {
        if (e.target === dlGateDlg) dlGateDlg.close();
      });
      dlGateDlg.addEventListener("close", function () {
        if (!dlGateCtx.active) return;
        resetDownloadGateState();
      });
    }
    if (dlGateOpenAd) {
      dlGateOpenAd.addEventListener("click", function () {
        if (!dlGateCtx.active) return;
        var adUrl = "https://performanceingredientgoblet.com/angtq6ey?key=40a62c67960666e3277ffb4d5b2ebbbd";
        var w = window.open("about:blank", "_blank");
        if (!w) {
          if (dlGateStatus) {
            dlGateStatus.textContent = "Popup diblokir browser. Izinkan popup, lalu klik lagi tombol buka iklan.";
          }
          return;
        }
        try {
          w.location.href = adUrl;
        } catch (e) {}
        dlGateCtx.opened = true;
        dlGateCtx.adWin = w;
        dlGateCtx.lastNow = Date.now();
        dlGateCtx.wasAdOpen = true;
        updateDownloadGateUi();
      });
    }
    if (dlGateCancel) {
      dlGateCancel.addEventListener("click", function () {
        if (dlGateDlg && dlGateDlg.open) dlGateDlg.close();
      });
    }
    if (dlGateContinue) {
      dlGateContinue.addEventListener("click", function () {
        if (dlGateContinue.disabled || !dlGateCtx.active) return;
        var run = dlGateCtx.proceedFn;
        if (dlGateDlg && dlGateDlg.open) dlGateDlg.close();
        resetDownloadGateState();
        if (typeof run === "function") run();
      });
    }

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
    var certRaf = null;
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

    function scheduleCertRefresh() {
      if (!dlgCert || !dlgCert.open) return;
      if (certRaf != null) window.cancelAnimationFrame(certRaf);
      certRaf = window.requestAnimationFrame(function () {
        certRaf = null;
        fillCertificatesCapture(form);
      });
    }

    function onFormDirty() {
      schedulePosterRefresh();
      scheduleCertRefresh();
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

    var dlgResetConfirm = $("br-match1-reset-confirm-dialog");
    var btnResetCancel = $("br-match1-reset-confirm-cancel");
    var btnResetApply = $("br-match1-reset-confirm-apply");

    function performBrMatch1MetaReset() {
      clearState();
      form.reset();
      renderTeamTable(tb, getTeamCount(form), []);
      clampPlayDateAndSyncTime(form);
      syncBaselineFromForm();
      showBrMatch1Toast("success", "Form dan data lokal telah direset. Tanggal & jam disetel ke sekarang.");
    }

    if (dlgResetConfirm) {
      dlgResetConfirm.addEventListener("click", function (e) {
        if (e.target === dlgResetConfirm) dlgResetConfirm.close();
      });
    }
    if (dlgResetConfirm && btnResetCancel) {
      btnResetCancel.addEventListener("click", function () {
        dlgResetConfirm.close();
      });
    }
    if (dlgResetConfirm && btnResetApply) {
      btnResetApply.addEventListener("click", function () {
        dlgResetConfirm.close();
        performBrMatch1MetaReset();
      });
    }

    btnReset.addEventListener("click", function () {
      if (dlgResetConfirm && typeof dlgResetConfirm.showModal === "function") {
        dlgResetConfirm.showModal();
        document.dispatchEvent(new CustomEvent("ft-close-sidebar", { bubbles: true }));
      } else {
        performBrMatch1MetaReset();
      }
    });

    if (btnPreview && dlg && typeof dlg.showModal === "function") {
      btnPreview.addEventListener("click", function () {
        openGateForPreview(
          "Untuk membuka preview poster " + MATCH_LABEL_SHORT + ", tinjau iklan di jendela ini terlebih dahulu.",
          function () {
            fillPosterCapture(form);
            dlg.showModal();
            document.dispatchEvent(new CustomEvent("ft-close-sidebar", { bubbles: true }));
          }
        );
      });
    }

    if (btnCertPreview && dlgCert && typeof dlgCert.showModal === "function") {
      btnCertPreview.addEventListener("click", function () {
        openGateForPreview(
          "Untuk membuka preview sertifikat " + MATCH_LABEL_SHORT + ", tinjau iklan di jendela ini terlebih dahulu.",
          function () {
            fillCertificatesCapture(form);
            dlgCert.showModal();
            document.dispatchEvent(new CustomEvent("ft-close-sidebar", { bubbles: true }));
          }
        );
      });
    }

    if (btnClose && dlg) {
      btnClose.addEventListener("click", function () {
        dlg.close();
      });
    }

    if (btnCertClose && dlgCert) {
      btnCertClose.addEventListener("click", function () {
        dlgCert.close();
      });
    }
    if (dlgCert) {
      dlgCert.addEventListener("click", function (e) {
        if (e.target === dlgCert) dlgCert.close();
      });
    }

    var capCertRoot = $("br-match1-cert-capture");
    if (capCertRoot && form) {
      capCertRoot.addEventListener("click", function (e) {
        var btn = e.target.closest && e.target.closest("[data-cert-download]");
        if (!btn || !capCertRoot.contains(btn)) return;
        var kind = btn.getAttribute("data-cert-download");
        if (!kind || (kind !== "j1" && kind !== "j2" && kind !== "j3" && kind !== "mvp")) return;
        openDownloadAdGate("sertifikat " + certFileSlugFromKind(kind), function () {
          var slot = capCertRoot.querySelector('[data-cert-slot="' + kind + '"]');
          var viewport = slot && slot.querySelector(".br-m1-cert-viewport");
          var h2i = getHtmlToImage();
          if (!viewport || !h2i || typeof h2i.toPng !== "function") {
            showBrMatch1Toast(
              "error",
              "Pustaka gambar tidak tersedia. Muat ulang halaman atau periksa jaringan."
            );
            return;
          }
          btn.disabled = true;
          btn.classList.add("br-m1-cert-toolbar__dl--busy");
          var a4 = getCertA4LandscapePx();
          viewport.classList.add("br-m1-cert-viewport--export");
          viewport.style.width = a4.w + "px";
          viewport.style.height = a4.h + "px";
          var pr = getPosterExportPixelRatio();
          whenFontsReady()
            .then(function () {
              return nextFrame();
            })
            .then(function () {
              return h2i.toPng(viewport, {
                pixelRatio: pr,
                cacheBust: true,
                backgroundColor: "#0a0a0c",
              });
            })
            .then(function (dataUrl) {
              var a = document.createElement("a");
              var base =
                slugFileName(
                  (collectFromForm(form).tournamentName || "") +
                    "-match" +
                    MATCH_NO +
                    "-cert-" +
                    certFileSlugFromKind(kind)
                ) ||
                "match" + MATCH_NO + "-cert-" + certFileSlugFromKind(kind);
              a.href = dataUrl;
              a.download = base + ".png";
              a.rel = "noopener";
              document.body.appendChild(a);
              a.click();
              a.remove();
              showBrMatch1Toast("success", "Sertifikat PNG (A4 horizontal) sedang diunduh.");
            })
            .catch(function () {
              showBrMatch1Toast(
                "error",
                "Gagal membuat PNG sertifikat. Coba lagi atau gunakan peramban lain."
              );
            })
            .finally(function () {
              viewport.classList.remove("br-m1-cert-viewport--export");
              viewport.style.width = "";
              viewport.style.height = "";
              btn.disabled = false;
              btn.classList.remove("br-m1-cert-toolbar__dl--busy");
            });
        });
      });
    }

    if (btnDl && dlg) {
      btnDl.addEventListener("click", function () {
        openDownloadAdGate("poster " + MATCH_WORD_LOWER, function () {
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
          cap.classList.add("br-m1-poster-capture--hires-export");
          var prevCapW = cap.style.width;
          var prevCapMaxW = cap.style.maxWidth;
          /* Samakan hasil export mobile vs desktop: paksa kanvas poster ke lebar desktop saat raster. */
          cap.style.width = "720px";
          cap.style.maxWidth = "720px";
          var pr = getPosterExportPixelRatio();
          whenFontsReady()
            .then(function () {
              return nextFrame();
            })
            .then(function () {
              /* Jangan set width/height manual — bisa tidak sama dengan layout klon SVG dan memperparah geser isi */
              return h2i.toPng(cap, {
                pixelRatio: pr,
                cacheBust: true,
                backgroundColor: "#0f0f0f",
              });
            })
            .then(function (dataUrl) {
              var a = document.createElement("a");
              var name = slugFileName((collectFromForm(form).tournamentName || "") + "-match" + MATCH_NO + "-roster");
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
              cap.classList.remove("br-m1-poster-capture--hires-export");
              cap.style.width = prevCapW;
              cap.style.maxWidth = prevCapMaxW;
              btnDl.disabled = false;
            });
        });
      });
    }

    initFtAds();
    initBrAlertAdDialog();
  });
})();
