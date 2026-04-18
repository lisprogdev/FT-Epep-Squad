(function () {
  "use strict";

  var STORAGE_KEY = "ft-epep-squad:cs-4-team";

  function $(id) {
    return document.getElementById(id);
  }

  function readCheckedValue(form, name, fallback) {
    if (!form) return fallback;
    var el = form.querySelector('input[name="' + name + '"]:checked');
    if (!el) return fallback;
    var v = el.value != null ? String(el.value).trim() : "";
    return v !== "" ? v : fallback;
  }

  function readInt(v, fallback) {
    var n = parseInt(String(v == null ? "" : v).trim(), 10);
    return isNaN(n) ? fallback : n;
  }

  function safeScore(v) {
    if (v == null || v === "") return "";
    var n = parseInt(String(v).replace(/[^\d]/g, ""), 10);
    if (isNaN(n) || n < 0) return "";
    return String(n);
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY + ":" + location.pathname);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY + ":" + location.pathname, JSON.stringify(state || {}));
    } catch (e) {
      // ignore
    }
  }

  function clearState() {
    try {
      localStorage.removeItem(STORAGE_KEY + ":" + location.pathname);
    } catch (e) {
      // ignore
    }
  }

  function roundsNeededForRounde(rounde) {
    return Math.floor((rounde || 5) / 2) + 1;
  }

  function winsNeededForBo(bo) {
    return Math.floor((bo || 1) / 2) + 1;
  }

  /** Target win ronde per fase: mengikuti BO dan dibatasi jumlah ronde (Rounde). */
  function matchWinsNeeded(rounde, bo) {
    return Math.min(winsNeededForBo(bo), roundsNeededForRounde(rounde));
  }

  function roundWinsFromScores(roundsArr) {
    var left = 0;
    var right = 0;
    for (var i = 0; i < roundsArr.length; i++) {
      var r = roundsArr[i] || {};
      var ln = r.left === "" ? NaN : parseInt(r.left, 10);
      var rn = r.right === "" ? NaN : parseInt(r.right, 10);
      if (!isNaN(ln) && !isNaN(rn)) {
        if (ln > rn) left += 1;
        else if (rn > ln) right += 1;
      }
    }
    return { left: left, right: right };
  }

  function matchWinnerFromRoundWins(rw, needed) {
    if (!rw) return "";
    if (rw.left >= needed) return "L";
    if (rw.right >= needed) return "R";
    return "";
  }

  function computeMatchSummary(match, rounde, bo) {
    var rr = match && Array.isArray(match.rounds) ? match.rounds : [];
    var rw = roundWinsFromScores(rr);
    var needed = matchWinsNeeded(rounde, bo);
    var w = matchWinnerFromRoundWins(rw, needed);
    return { winner: w, roundWinsLeft: rw.left, roundWinsRight: rw.right, needed: needed };
  }

  function normalizedMatches(matchCount, rounde, existing) {
    var arr = Array.isArray(existing) ? existing.slice() : [];
    while (arr.length < matchCount) arr.push({ rounds: [] });
    if (arr.length > matchCount) arr = arr.slice(0, matchCount);

    for (var m = 0; m < arr.length; m++) {
      var rr = arr[m] && Array.isArray(arr[m].rounds) ? arr[m].rounds.slice() : [];
      while (rr.length < rounde) rr.push({ left: "", right: "" });
      if (rr.length > rounde) rr = rr.slice(0, rounde);
      for (var r = 0; r < rr.length; r++) {
        rr[r] = { left: safeScore(rr[r].left), right: safeScore(rr[r].right) };
      }
      arr[m] = { rounds: rr };
    }
    return arr;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function safeFilenamePart(s) {
    return String(s || "")
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60);
  }

  function textById(id) {
    var el = document.getElementById(id);
    if (!el) return "";
    var v = "value" in el ? el.value : el.textContent;
    return String(v == null ? "" : v).trim();
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function localDateISO(d) {
    var x = d || new Date();
    return x.getFullYear() + "-" + pad2(x.getMonth() + 1) + "-" + pad2(x.getDate());
  }

  function fmtDate(iso) {
    var s = String(iso || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "—";
    var parts = s.split("-");
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function fmtTime(hm) {
    var s = String(hm || "").trim();
    if (!/^\d{2}:\d{2}$/.test(s)) return "—";
    return s;
  }

  function makeSerial(prefix) {
    var day = localDateISO().replace(/-/g, "");
    var rnd = Math.floor(Math.random() * 9000 + 1000);
    return String(prefix || "CS4") + "-" + day + "-" + rnd;
  }

  function badgeHtml(label, tone) {
    var base =
      "inline-flex items-center justify-center rounded-full border px-3 py-1 font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.18em]";
    if (tone === "win")
      return (
        '<span class="' +
        base +
        ' border-[color-mix(in_srgb,#5eead4_28%,transparent)] bg-[color-mix(in_srgb,#5eead4_10%,transparent)] text-[#b8fff0]">' +
        escapeHtml(label) +
        "</span>"
      );
    return (
      '<span class="' +
      base +
      ' border-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] bg-[color-mix(in_srgb,black_20%,transparent)] text-[var(--color-text-secondary)]">' +
      escapeHtml(label) +
      "</span>"
    );
  }

  function renderMatchesAccordion(root, rounde, matches, teams, bronzeEnabled, bo) {
    if (!root) return;
    var needed = matchWinsNeeded(rounde, bo);

    var sf1 = computeMatchSummary(matches[0], rounde, bo);
    var sf2 = computeMatchSummary(matches[1], rounde, bo);

    var sf1WinnerName = sf1.winner === "L" ? teams[0] : sf1.winner === "R" ? teams[1] : "Winner SF1";
    var sf2WinnerName = sf2.winner === "L" ? teams[2] : sf2.winner === "R" ? teams[3] : "Winner SF2";
    var sf1LoserName = sf1.winner === "L" ? teams[1] : sf1.winner === "R" ? teams[0] : "Loser SF1";
    var sf2LoserName = sf2.winner === "L" ? teams[3] : sf2.winner === "R" ? teams[2] : "Loser SF2";

    var matchMeta = [
      { label: "Semifinal 1", phaseLine: "Fase · Semifinal 1", left: teams[0], right: teams[1] },
      { label: "Semifinal 2", phaseLine: "Fase · Semifinal 2", left: teams[2], right: teams[3] },
    ];
    if (bronzeEnabled) {
      matchMeta.push({ label: "Bronze", phaseLine: "Fase · Bronze (Perebutan 3)", left: sf1LoserName, right: sf2LoserName });
    }
    matchMeta.push({ label: "Final", phaseLine: "Fase · Final", left: sf1WinnerName, right: sf2WinnerName });

    var matchCount = bronzeEnabled ? 4 : 3;

    function roundRowsHtml(matchIdx, leftName, rightName) {
      var m = matches[matchIdx] || { rounds: [] };
      var rr = Array.isArray(m.rounds) ? m.rounds : [];
      var out = [];
      for (var rIdx = 0; rIdx < rounde; rIdx++) {
        var row = rr[rIdx] || { left: "", right: "" };
        out.push(
          '<div class="grid items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-brand)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-primary)_32%,transparent)] px-3 py-2 sm:grid-cols-[5.5rem_1fr_1fr]">' +
            '<p class="m-0 text-[0.7rem] font-semibold text-[var(--color-text-secondary)]">Round ' +
            (rIdx + 1) +
            "</p>" +
            '<label class="grid gap-1.5">' +
            '<span class="sr-only">Skor ' +
            escapeHtml(leftName) +
            " Round " +
            (rIdx + 1) +
            "</span>" +
            '<input data-match="' +
            matchIdx +
            '" data-round="' +
            rIdx +
            '" data-side="L" inputmode="numeric" placeholder="0" value="' +
            (row.left || "") +
            '" class="w-full rounded-xl border border-[color-mix(in_srgb,white_8%,transparent)] bg-[color-mix(in_srgb,black_30%,transparent)] px-3 py-2.5 text-[0.95rem] text-[var(--color-text-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-text-secondary)_48%,transparent)] focus:border-[color-mix(in_srgb,var(--color-brand-glow)_45%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-bg-primary)_55%,transparent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-brand-glow)_22%,transparent)]" />' +
            "</label>" +
            '<label class="grid gap-1.5">' +
            '<span class="sr-only">Skor ' +
            escapeHtml(rightName) +
            " Round " +
            (rIdx + 1) +
            "</span>" +
            '<input data-match="' +
            matchIdx +
            '" data-round="' +
            rIdx +
            '" data-side="R" inputmode="numeric" placeholder="0" value="' +
            (row.right || "") +
            '" class="w-full rounded-xl border border-[color-mix(in_srgb,white_8%,transparent)] bg-[color-mix(in_srgb,black_30%,transparent)] px-3 py-2.5 text-[0.95rem] text-[var(--color-text-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-text-secondary)_48%,transparent)] focus:border-[color-mix(in_srgb,var(--color-brand-glow)_45%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-bg-primary)_55%,transparent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-brand-glow)_22%,transparent)]" />' +
            "</label>" +
            "</div>"
        );
      }
      return out.join("");
    }

    function summaryWinnerChip(w, leftName, rightName) {
      var name = w === "L" ? leftName : w === "R" ? rightName : "—";
      return badgeHtml("Menang: " + name, w ? "win" : "neutral");
    }

    var html = [];
    for (var i = 0; i < matchCount; i++) {
      var msum = computeMatchSummary(matches[i], rounde, bo);
      var meta = matchMeta[i];
      html.push(
        '<details class="group px-3 py-3 sm:px-4" ' +
          (i === 0 ? "open" : "") +
          ">" +
          '<summary class="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-[color-mix(in_srgb,var(--color-brand)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-primary)_35%,transparent)] px-3 py-2.5 transition hover:border-[color-mix(in_srgb,var(--color-brand-glow)_26%,transparent)]">' +
          '<div class="min-w-0">' +
          '<p class="m-0 font-[family-name:var(--font-heading)] text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-glow)]">' +
          escapeHtml(meta.phaseLine) +
          "</p>" +
          '<p class="m-0 mt-0.5 text-[0.68rem] text-[var(--color-text-secondary)]">' +
          escapeHtml(meta.label) +
          " · " +
          escapeHtml(meta.left) +
          " vs " +
          escapeHtml(meta.right) +
          " · Target: " +
          needed +
          " win · Skor: " +
          msum.roundWinsLeft +
          " - " +
          msum.roundWinsRight +
          "</p>" +
          "</div>" +
          '<div class="flex shrink-0 items-center gap-2">' +
          summaryWinnerChip(msum.winner, meta.left, meta.right) +
          '<span class="inline-flex size-9 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] bg-[color-mix(in_srgb,black_22%,transparent)] text-[var(--color-text-secondary)] transition group-open:rotate-180" aria-hidden="true">' +
          '<i class="fa-solid fa-chevron-down text-[0.85rem]"></i>' +
          "</span>" +
          "</div>" +
          "</summary>" +
          '<div class="mt-3 grid gap-2.5">' +
          roundRowsHtml(i, meta.left, meta.right) +
          "</div>" +
          "</details>"
      );
    }
    root.innerHTML = html.join("");
  }

  function computeChampion(teams, matches, rounde, bronzeEnabled, bo) {
    var sf1 = computeMatchSummary(matches[0], rounde, bo);
    var sf2 = computeMatchSummary(matches[1], rounde, bo);
    var finalIdx = bronzeEnabled ? 3 : 2;
    var final = computeMatchSummary(matches[finalIdx], rounde, bo);

    var leftFinalName = sf1.winner === "L" ? teams[0] : sf1.winner === "R" ? teams[1] : "";
    var rightFinalName = sf2.winner === "L" ? teams[2] : sf2.winner === "R" ? teams[3] : "";

    if (final.winner === "L") return leftFinalName || "—";
    if (final.winner === "R") return rightFinalName || "—";
    return "";
  }

  function buildBracketPosterHtml(teams, rounde, matches, bronzeEnabled, bo) {
    var tourney = textById("br-match1-tournament") || "FT Epep Squad";
    var season = textById("br-match1-season");
    var playDate = textById("br-match1-playdate");
    var session = textById("br-match1-session-number");
    var playTime = textById("br-match1-play-time");

    var metaChips = [];
    if (season) metaChips.push("Season " + season);
    if (playDate) metaChips.push(playDate);
    if (playTime) metaChips.push(playTime);
    if (session) metaChips.push("Sesi " + session);
    metaChips.push("Rounde " + rounde);
    metaChips.push("BO " + bo);

    var champion = computeChampion(teams, matches, rounde, bronzeEnabled, bo) || "—";
    var championChip = badgeHtml("Champion: " + champion, champion && champion !== "—" ? "win" : "neutral");

    // Poster: SF kiri/kanan = round menang di semi; tengah = bronze (opsional) + final + champion.
    var needed = matchWinsNeeded(rounde, bo);
    var s0 = computeMatchSummary(matches[0], rounde, bo);
    var s1 = computeMatchSummary(matches[1], rounde, bo);
    var finalIdx = bronzeEnabled ? 3 : 2;
    var fin = computeMatchSummary(matches[finalIdx], rounde, bo);
    var brz = bronzeEnabled ? computeMatchSummary(matches[2], rounde, bo) : null;

    function scoreChip(n) {
      return (
        '<span class="inline-flex min-w-[2.25rem] items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--color-brand)_16%,transparent)] bg-[color-mix(in_srgb,black_22%,transparent)] px-2 py-1 font-[family-name:var(--font-heading)] text-[0.78rem] font-black tabular-nums text-[color-mix(in_srgb,#5eead4_86%,white)]">' +
        n +
        "</span>"
      );
    }

    function teamCard(name, total) {
      return (
        '<div class="min-w-0 rounded-2xl border border-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-primary)_35%,transparent)] p-5">' +
        '<div class="grid items-center gap-3" style="grid-template-columns:minmax(10rem,1fr) minmax(2.25rem,auto);">' +
        '<p class="m-0 truncate font-[family-name:var(--font-heading)] text-[1.05rem] font-black uppercase tracking-[0.08em] text-[var(--color-text-primary)]">' +
        escapeHtml(name) +
        "</p>" +
        scoreChip(total) +
        "</div>" +
        "</div>"
      );
    }

    /** Satu panel Final — garis dari SF cukup dari SVG rel saja, hindari dobel garis. */
    function finalMatchBlock(lName, lRw, rName, rRw) {
      return (
        '<div class="rounded-xl border border-[color-mix(in_srgb,var(--color-brand)_22%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-primary)_36%,transparent)] p-4 shadow-[inset_0_0_0_1px_color-mix(in_srgb,white_4%,transparent)]">' +
        '<div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">' +
        '<div class="flex min-w-0 flex-1 items-center justify-between gap-3">' +
        '<p class="m-0 truncate font-[family-name:var(--font-heading)] text-[0.92rem] font-black uppercase tracking-[0.06em] text-[var(--color-text-primary)]">' +
        escapeHtml(lName) +
        "</p>" +
        scoreChip(lRw) +
        "</div>" +
        '<p class="m-0 shrink-0 text-center font-[family-name:var(--font-heading)] text-[0.62rem] font-black uppercase tracking-[0.2em] text-[color-mix(in_srgb,var(--color-text-secondary)_85%,var(--color-brand-glow))]">VS</p>' +
        '<div class="flex min-w-0 flex-1 items-center justify-between gap-3">' +
        '<p class="m-0 truncate text-right font-[family-name:var(--font-heading)] text-[0.92rem] font-black uppercase tracking-[0.06em] text-[var(--color-text-primary)]">' +
        escapeHtml(rName) +
        "</p>" +
        scoreChip(rRw) +
        "</div>" +
        "</div>" +
        "</div>"
      );
    }

    var sf1WinName = s0.winner === "L" ? teams[0] : s0.winner === "R" ? teams[1] : "Winner SF1";
    var sf2WinName = s1.winner === "L" ? teams[2] : s1.winner === "R" ? teams[3] : "Winner SF2";
    var sf1LoserName = s0.winner === "L" ? teams[1] : s0.winner === "R" ? teams[0] : "Loser SF1";
    var sf2LoserName = s1.winner === "L" ? teams[3] : s1.winner === "R" ? teams[2] : "Loser SF2";

    var flowLine = bronzeEnabled
      ? "Single elimination · 4 → 2 → bronze → 1"
      : "Single elimination · 4 → 2 → 1";
    var bronzeSectionHtml = "";
    if (bronzeEnabled && brz) {
      bronzeSectionHtml =
        '<p class="m-0 mb-2 w-full text-center font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.26em] text-[color-mix(in_srgb,var(--color-text-secondary)_88%,var(--color-brand-glow))] lg:mb-[0.65rem]">Fase · Bronze (Perebutan 3)</p>' +
        '<div class="relative w-max rounded-[1.35rem] border border-[color-mix(in_srgb,var(--color-brand)_22%,transparent)] bg-[color-mix(in_srgb,black_26%,transparent)] p-5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,white_5%,transparent)] mb-3">' +
        finalMatchBlock(sf1LoserName, brz.roundWinsLeft, sf2LoserName, brz.roundWinsRight) +
        '<div class="mx-auto mt-3 w-fit">' +
        badgeHtml("Agregat bronze · " + brz.roundWinsLeft + "-" + brz.roundWinsRight + " · target " + needed, "neutral") +
        "</div>" +
        "</div>";
    }

    // Rel bracket: satu warna (#5eead4). Tanpa bronze: satu horizontal ke final. Dengan bronze: cabang dari tengah ke atas (bronze) + ke bawah (grand final).
    var bracketRailLeft;
    var bracketRailRight;
    if (bronzeEnabled) {
      bracketRailLeft =
        '<div class="relative z-0 hidden w-[2.75rem] shrink-0 self-stretch lg:block" aria-hidden="true">' +
        '<svg class="absolute inset-0 h-full w-full overflow-visible text-[#5eead4]" preserveAspectRatio="none" viewBox="0 0 48 100">' +
        '<path fill="none" stroke="currentColor" stroke-width="1.35" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" opacity="0.62" d="M0 23 L15 23 L15 50 L15 77 L0 77" />' +
        '<path fill="none" stroke="currentColor" stroke-width="1.35" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" opacity="0.78" d="M15 50 L15 32 L48 32" />' +
        '<path fill="none" stroke="currentColor" stroke-width="1.35" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" opacity="0.78" d="M15 50 L15 68 L48 68" />' +
        "</svg></div>";
      bracketRailRight =
        '<div class="relative z-0 hidden w-[2.75rem] shrink-0 self-stretch lg:block" aria-hidden="true">' +
        '<svg class="absolute inset-0 h-full w-full overflow-visible text-[#5eead4]" preserveAspectRatio="none" viewBox="0 0 48 100">' +
        '<path fill="none" stroke="currentColor" stroke-width="1.35" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" opacity="0.62" d="M48 23 L33 23 L33 50 L33 77 L48 77" />' +
        '<path fill="none" stroke="currentColor" stroke-width="1.35" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" opacity="0.78" d="M33 50 L33 32 L0 32" />' +
        '<path fill="none" stroke="currentColor" stroke-width="1.35" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" opacity="0.78" d="M33 50 L33 68 L0 68" />' +
        "</svg></div>";
    } else {
      bracketRailLeft =
        '<div class="relative z-0 hidden w-[2.35rem] shrink-0 self-stretch lg:block" aria-hidden="true">' +
        '<svg class="absolute inset-0 h-full w-full overflow-visible text-[#5eead4]" preserveAspectRatio="none" viewBox="0 0 34 100">' +
        '<path fill="none" stroke="currentColor" stroke-width="1.35" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" opacity="0.58" d="M0 23 L15 23 L15 50 L15 77 L0 77" />' +
        '<path fill="none" stroke="currentColor" stroke-width="1.35" vector-effect="non-scaling-stroke" stroke-linecap="round" opacity="0.75" d="M15 50 L34 50" />' +
        "</svg></div>";
      bracketRailRight =
        '<div class="relative z-0 hidden w-[2.35rem] shrink-0 self-stretch lg:block" aria-hidden="true">' +
        '<svg class="absolute inset-0 h-full w-full overflow-visible text-[#5eead4]" preserveAspectRatio="none" viewBox="0 0 34 100">' +
        '<path fill="none" stroke="currentColor" stroke-width="1.35" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" opacity="0.58" d="M34 23 L19 23 L19 50 L19 77 L34 77" />' +
        '<path fill="none" stroke="currentColor" stroke-width="1.35" vector-effect="non-scaling-stroke" stroke-linecap="round" opacity="0.75" d="M19 50 L0 50" />' +
        "</svg></div>";
    }
    var bracketStackVert =
      '<div class="pointer-events-none flex justify-center py-1 lg:hidden" aria-hidden="true">' +
      '<div class="h-8 w-px rounded-full bg-gradient-to-b from-transparent via-[color-mix(in_srgb,#5eead4_55%,transparent)] to-transparent"></div>' +
      "</div>";

    var bracket =
      '<div class="relative w-max overflow-hidden rounded-[1.6rem] border border-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] bg-[color-mix(in_srgb,black_22%,transparent)] p-6 shadow-[inset_0_0_0_1px_color-mix(in_srgb,white_6%,transparent)]">' +
      '<div class="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" style="background:radial-gradient(ellipse 60% 60% at 50% 50%, color-mix(in_srgb,var(--color-brand-glow)_12%,transparent), transparent 62%);"></div>' +
      '<p class="relative z-[1] m-0 mb-4 text-center font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.24em] text-[color-mix(in_srgb,var(--color-text-secondary)_88%,var(--color-brand-glow))] lg:hidden">' +
      escapeHtml(flowLine) +
      "</p>" +
      '<div class="relative z-[1] flex w-max flex-col items-center gap-2 lg:flex-row lg:flex-nowrap lg:items-start lg:justify-center lg:gap-x-0">' +
      '<div class="grid w-max shrink-0 gap-3">' +
      '<p class="m-0 font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.2em] text-[color-mix(in_srgb,#7ff5e4_88%,var(--color-text-secondary))]">Fase · Semifinal 1</p>' +
      '<div class="flex w-max flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">' +
      '<div class="grid w-max gap-3">' +
      teamCard(teams[0], s0.roundWinsLeft) +
      teamCard(teams[1], s0.roundWinsRight) +
      "</div>" +
      bracketRailLeft +
      "</div>" +
      '<div class="mx-auto w-fit">' +
      badgeHtml("Agregat SF1 · " + s0.roundWinsLeft + "-" + s0.roundWinsRight + " · target " + needed, "neutral") +
      "</div>" +
      "</div>" +
      bracketStackVert +
      '<div class="flex w-max shrink-0 flex-col items-center gap-0 py-1">' +
      bronzeSectionHtml +
      '<p class="m-0 mb-2 w-full text-center font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.26em] text-[var(--color-brand-glow)] lg:mb-[0.65rem]">Fase · Final</p>' +
      '<div class="relative w-max rounded-[1.35rem] border border-[color-mix(in_srgb,var(--color-brand)_22%,transparent)] bg-[color-mix(in_srgb,black_26%,transparent)] p-5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,white_5%,transparent)]">' +
      finalMatchBlock(sf1WinName, fin.roundWinsLeft, sf2WinName, fin.roundWinsRight) +
      '<div class="mx-auto mt-3 w-fit">' +
      badgeHtml("Agregat final · " + fin.roundWinsLeft + "-" + fin.roundWinsRight + " · target " + needed, "neutral") +
      "</div>" +
      "</div>" +
      '<div class="pointer-events-none flex h-6 w-full items-center justify-center lg:h-7" aria-hidden="true">' +
      '<div class="h-full w-px rounded-full bg-gradient-to-b from-[color-mix(in_srgb,#5eead4_50%,transparent)] via-[color-mix(in_srgb,var(--color-brand-glow)_55%,transparent)] to-[color-mix(in_srgb,#5eead4_35%,transparent)]"></div>' +
      "</div>" +
      '<div class="w-max rounded-[1.4rem] border border-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] bg-[color-mix(in_srgb,black_28%,transparent)] px-6 py-5 text-center shadow-[0_0_28px_color-mix(in_srgb,var(--color-brand)_12%,transparent)]">' +
      '<p class="m-0 font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.28em] text-[var(--color-brand-glow)]">Fase · Champion</p>' +
      '<p class="m-0 mt-2 max-w-[20rem] truncate font-[family-name:var(--font-heading)] text-[1.1rem] font-black uppercase tracking-[0.08em] text-[color-mix(in_srgb,var(--color-text-primary)_92%,#5eead4)]">' +
      escapeHtml(champion) +
      "</p>" +
      '<div class="mt-2">' +
      championChip +
      "</div>" +
      "</div>" +
      "</div>" +
      bracketStackVert +
      '<div class="grid w-max shrink-0 gap-3">' +
      '<p class="m-0 text-right font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.2em] text-[color-mix(in_srgb,var(--color-brand-glow)_90%,var(--color-text-secondary))]">Fase · Semifinal 2</p>' +
      '<div class="flex w-max flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">' +
      bracketRailRight +
      '<div class="grid w-max gap-3">' +
      teamCard(teams[2], s1.roundWinsLeft) +
      teamCard(teams[3], s1.roundWinsRight) +
      "</div>" +
      "</div>" +
      '<div class="mx-auto w-fit">' +
      badgeHtml("Agregat SF2 · " + s1.roundWinsLeft + "-" + s1.roundWinsRight + " · target " + needed, "neutral") +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>";

    return (
      '<div id="cs4-bracket-poster" style="box-sizing:border-box;width:max-content;max-width:min(1240px,100vw);" class="relative inline-block overflow-hidden rounded-[2rem] border border-[color-mix(in_srgb,var(--color-brand)_24%,transparent)] bg-[radial-gradient(ellipse_80%_60%_at_20%_10%,color-mix(in_srgb,#5eead4_18%,transparent),transparent_60%),radial-gradient(ellipse_70%_55%_at_90%_20%,color-mix(in_srgb,var(--color-brand)_14%,transparent),transparent_62%),linear-gradient(180deg,color-mix(in_srgb,#07070a_94%,var(--color-bg-primary)),color-mix(in_srgb,var(--color-bg-primary)_92%,black))] p-10 text-[var(--color-text-primary)] shadow-[0_38px_120px_rgba(0,0,0,0.7)] [color-scheme:dark]">' +
      '<div class="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" style="background-image:linear-gradient(color-mix(in_srgb,var(--color-brand)_12%,transparent) 1px, transparent 1px),linear-gradient(90deg,color-mix(in_srgb,var(--color-brand)_10%,transparent) 1px, transparent 1px);background-size:52px 52px;"></div>' +
      '<div class="pointer-events-none absolute -right-[12%] -top-[18%] h-[18rem] w-[18rem] rounded-full opacity-70 blur-[2px]" aria-hidden="true" style="background:radial-gradient(circle,color-mix(in_srgb,#5eead4_38%,transparent),transparent 62%);"></div>' +
      '<div class="relative z-[1] grid w-max gap-8">' +
      '<header class="grid w-full gap-4">' +
      '<div class="flex flex-wrap items-center justify-between gap-3">' +
      '<div class="min-w-0">' +
      '<div class="flex items-center gap-3">' +
      '<span class="grid size-11 place-items-center rounded-2xl border border-[color-mix(in_srgb,#5eead4_22%,transparent)] bg-[color-mix(in_srgb,black_22%,transparent)] shadow-[0_0_26px_color-mix(in_srgb,var(--color-brand)_10%,transparent)]">' +
      '<img src="../../img/element/Logo.png" alt="FT Epep Squad" class="h-7 w-7 object-contain" draggable="false" />' +
      "</span>" +
      '<div class="min-w-0">' +
      '<p class="m-0 font-[family-name:var(--font-heading)] text-[0.6rem] font-bold uppercase tracking-[0.26em] text-[var(--color-brand-glow)]">FT Epep Squad</p>' +
      '<p class="m-0 mt-1 text-[0.78rem] font-semibold tracking-wide text-[color-mix(in_srgb,var(--color-text-secondary)_92%,transparent)]">Bracket Poster</p>' +
      "</div></div>" +
      '<h3 class="m-0 mt-2 font-[family-name:var(--font-heading)] text-[clamp(1.75rem,3.2vw,2.35rem)] font-black uppercase tracking-[0.08em] text-[color-mix(in_srgb,var(--color-text-primary)_92%,#5eead4)] [text-shadow:0_2px_34px_rgba(0,0,0,0.55)]">' +
      escapeHtml(tourney) +
      "</h3>" +
      '<p class="m-0 mt-2 text-[0.9rem] text-[color-mix(in_srgb,var(--color-text-secondary)_90%,transparent)]">Clash Squad · 4 Team</p>' +
      "</div>" +
      '<div class="shrink-0">' +
      championChip +
      "</div></div>" +
      '<div class="flex flex-wrap gap-2">' +
      metaChips
        .map(function (c) {
          return badgeHtml(c, "neutral");
        })
        .join("") +
      "</div>" +
      "</header>" +
      '<section class="grid w-max gap-3">' +
      '<div class="flex flex-wrap items-center justify-between gap-3">' +
      '<h4 class="m-0 font-[family-name:var(--font-heading)] text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[var(--color-brand-glow)]">Bracket</h4>' +
      '<div class="flex flex-wrap items-center gap-2">' +
      badgeHtml("Rounde " + rounde, "neutral") +
      badgeHtml("BO " + bo, "neutral") +
      "</div></div>" +
      bracket +
      "</section>" +
      '<footer class="pt-2"><div class="mx-auto flex w-fit items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-brand)_14%,transparent)] bg-[color-mix(in_srgb,black_18%,transparent)] px-4 py-2 text-[0.7rem] tracking-wide text-[color-mix(in_srgb,var(--color-text-secondary)_88%,transparent)]">' +
      '<span class="grid size-7 place-items-center rounded-full border border-[color-mix(in_srgb,#5eead4_18%,transparent)] bg-[color-mix(in_srgb,black_22%,transparent)]">' +
      '<img src="../../img/element/Logo.png" alt="FT Epep Squad" class="h-4 w-4 object-contain" draggable="false" />' +
      "</span>" +
      '<span class="font-[family-name:var(--font-heading)] font-bold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--color-text-primary)_92%,#5eead4)]">FT Epep Squad</span>' +
      "</div></footer>" +
      "</div></div>"
    );
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

  function certArticlePlacement(opts) {
    var dataCert = opts.dataCert || "placement";
    var tierLabel = opts.tierLabel || "—";
    var positionTitle = opts.positionTitle || "—";
    var tourney = opts.tournamentName || "—";
    var winnerName = opts.winnerName || "—";
    var thanksLine = opts.thanksLine || "—";
    var dateLine = opts.dateLine || "—";
    var timeLine = opts.timeLine || "—";
    var serial = opts.serial || "";
    var asideTag = opts.asideTag || "Clash Squad · 4 Team";
    var iconClass = opts.iconClass || "fa-solid fa-award";
    var extraArticleClass = opts.extraArticleClass ? " " + opts.extraArticleClass : "";
    return (
      '<article class="br-m1-cert br-m1-cert--classic' +
      extraArticleClass +
      '" data-cert="' +
      escapeHtml(dataCert) +
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
      escapeHtml(iconClass) +
      '" aria-hidden="true"></i></div>' +
      '<span class="br-m1-cert__aside-tag">' +
      escapeHtml(asideTag) +
      "</span></div></aside>" +
      '<div class="br-m1-cert__body">' +
      '<p class="br-m1-cert__brand">Fast Tournament · FT Epep Squad</p>' +
      '<p class="br-m1-cert__event">' +
      escapeHtml(tourney) +
      "</p>" +
      '<div class="br-m1-cert__focus">' +
      '<h2 class="br-m1-cert__title">Certificate Of Achievement</h2>' +
      '<p class="br-m1-cert__presented">Diberikan kepada</p>' +
      '<p class="br-m1-cert__winner">' +
      escapeHtml(winnerName) +
      "</p>" +
      '<p class="br-m1-cert__as">Sebagai</p>' +
      '<p class="br-m1-cert__position">' +
      escapeHtml(positionTitle) +
      "</p>" +
      '<p class="br-m1-cert__thanks">' +
      escapeHtml(thanksLine) +
      "</p></div>" +
      '<footer class="br-m1-cert__sign">' +
      '<div class="br-m1-cert__serial">' +
      '<span class="br-m1-cert__serial-lbl">Nomor seri</span>' +
      '<code class="br-m1-cert__serial-code">' +
      escapeHtml(serial || "—") +
      "</code></div>" +
      '<div class="br-m1-cert__eo">' +
      '<span class="br-m1-cert__eo-line" aria-hidden="true"></span>' +
      '<span class="br-m1-cert__eo-name">FT Epep Squad</span>' +
      '<span class="br-m1-cert__eo-role">Penyelenggara / EO</span></div></footer>' +
      '<p class="br-m1-cert__footline">' +
      escapeHtml(dateLine) +
      " · " +
      escapeHtml(timeLine) +
      " · " +
      escapeHtml("Fast Tournament") +
      "</p>" +
      "</div></article>"
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = $("cs4-form") || $("cs2-form");
    var matchesRoot = $("cs4-matches-accordion");
    var team1El = $("cs4-team-1");
    var team2El = $("cs4-team-2");
    var team3El = $("cs4-team-3");
    var team4El = $("cs4-team-4");
    var roundeLabel = $("cs4-rounde-label");
    var boLabel = $("cs4-bo-label");
    var bronzeEl = $("cs4-bronze-enabled");
    var mvpEl = $("cs4-mvp-team");
    var mvpWrap = $("cs4-mvp-wrap");
    var championBadge = $("cs4-champion-badge");
    var btnReset = $("cs4-reset") || $("cs2-reset");

    var bracketOpen = $("cs4-bracket-preview-open");
    var bracketDlg = $("cs4-bracket-dialog");
    var bracketClose = $("cs4-bracket-close");
    var bracketDownload = $("cs4-bracket-download");
    var bracketCapture = $("cs4-bracket-capture");

    var certOpen = $("br-match1-cert-preview-open");
    var certDlg = $("br-match1-cert-dialog");
    var certClose = $("br-match1-cert-close");
    var certCapture = $("br-match1-cert-capture");

    if (!form || !matchesRoot || !team1El || !team2El || !team3El || !team4El) return;

    function currentRounde() {
      return readInt(readCheckedValue(form, "rounde", "5"), 5);
    }

    function currentBo() {
      return readInt(readCheckedValue(form, "bo", "1"), 1);
    }

    function bronzeEnabledNow() {
      return !!(bronzeEl && bronzeEl.checked);
    }

    function matchCountNow() {
      return bronzeEnabledNow() ? 4 : 3;
    }

    function migrateMatchesForCount(nextCount, prevCount, arr) {
      var a = Array.isArray(arr) ? arr.slice() : [];
      if (nextCount === 4 && prevCount === 3 && a.length >= 3) {
        var fin = a[2];
        return [a[0], a[1], { rounds: [] }, fin];
      }
      if (nextCount === 3 && prevCount === 4 && a.length >= 4) {
        return [a[0], a[1], a[3]];
      }
      return a;
    }

    var state = loadState() || {};
    if (state.t1) team1El.value = state.t1;
    if (state.t2) team2El.value = state.t2;
    if (state.t3) team3El.value = state.t3;
    if (state.t4) team4El.value = state.t4;

    if (state.bronze != null && bronzeEl) bronzeEl.checked = !!state.bronze;
    if (state.mvp != null && mvpEl) mvpEl.value = state.mvp;
    if (state.bo != null) {
      var boRadio = form.querySelector('input[name="bo"][value="' + String(state.bo) + '"]');
      if (boRadio) boRadio.checked = true;
    }

    var initialCount = matchCountNow();
    var loadedMatches = state.matches;
    if (Array.isArray(loadedMatches)) {
      if (initialCount === 4 && loadedMatches.length === 3) {
        loadedMatches = migrateMatchesForCount(4, 3, loadedMatches);
      } else if (initialCount === 3 && loadedMatches.length === 4) {
        loadedMatches = migrateMatchesForCount(3, 4, loadedMatches);
      }
    }

    var matches = normalizedMatches(initialCount, currentRounde(), loadedMatches);

    function teamsNow() {
      return [
        (team1El.value || "").trim() || "—",
        (team2El.value || "").trim() || "—",
        (team3El.value || "").trim() || "—",
        (team4El.value || "").trim() || "—",
      ];
    }

    function syncMetaLabels() {
      if (roundeLabel) roundeLabel.textContent = String(currentRounde());
      if (boLabel) boLabel.textContent = String(currentBo());
      if (mvpWrap) {
        if (bronzeEnabledNow()) mvpWrap.classList.remove("hidden");
        else mvpWrap.classList.add("hidden");
      }
    }

    function recomputeAndPaint() {
      var cnt = matchCountNow();
      matches = normalizedMatches(cnt, currentRounde(), matches);
      var t = teamsNow();
      var bo = currentBo();
      var bronzeOn = bronzeEnabledNow();
      renderMatchesAccordion(matchesRoot, currentRounde(), matches, t, bronzeOn, bo);
      syncMetaLabels();

      var champ = computeChampion(t, matches, currentRounde(), bronzeOn, bo);
      if (championBadge) {
        if (!champ) {
          championBadge.classList.add("hidden");
          championBadge.textContent = "Champion";
        } else {
          championBadge.classList.remove("hidden");
          championBadge.textContent = "Champion: " + champ;
        }
      }

      saveState({
        t1: team1El.value || "",
        t2: team2El.value || "",
        t3: team3El.value || "",
        t4: team4El.value || "",
        rounde: currentRounde(),
        bo: currentBo(),
        bronze: bronzeOn,
        mvp: mvpEl ? mvpEl.value || "" : "",
        matches: matches,
      });
    }

    function onInput(e) {
      var t = e.target;
      if (!t) return;
      if (!t.hasAttribute("data-match") || !t.hasAttribute("data-round") || !t.hasAttribute("data-side")) return;
      var mIdx = readInt(t.getAttribute("data-match"), -1);
      var rIdx = readInt(t.getAttribute("data-round"), -1);
      var side = String(t.getAttribute("data-side") || "").toUpperCase();
      if (mIdx < 0 || rIdx < 0) return;

      matches = normalizedMatches(matchCountNow(), currentRounde(), matches);
      var m = matches[mIdx] || { rounds: [] };
      var rr = Array.isArray(m.rounds) ? m.rounds.slice() : [];
      while (rr.length <= rIdx) rr.push({ left: "", right: "" });
      var row = rr[rIdx] || { left: "", right: "" };
      if (side === "L") row = { left: safeScore(t.value), right: row.right || "" };
      else if (side === "R") row = { left: row.left || "", right: safeScore(t.value) };
      rr[rIdx] = row;
      matches[mIdx] = { rounds: rr };
      recomputeAndPaint();
    }

    recomputeAndPaint();

    form.addEventListener("change", function (e) {
      var t = e.target;
      if (!t) return;
      if (t.name === "rounde" || t.name === "bo") {
        recomputeAndPaint();
        return;
      }
      if (t.id === "cs4-bronze-enabled") {
        var prev = matches.length;
        var next = t.checked ? 4 : 3;
        matches = migrateMatchesForCount(next, prev, matches);
        recomputeAndPaint();
      }
    });

    team1El.addEventListener("input", recomputeAndPaint);
    team2El.addEventListener("input", recomputeAndPaint);
    team3El.addEventListener("input", recomputeAndPaint);
    team4El.addEventListener("input", recomputeAndPaint);
    if (mvpEl) mvpEl.addEventListener("input", recomputeAndPaint);
    matchesRoot.addEventListener("input", onInput);

    if (btnReset) {
      btnReset.addEventListener("click", function () {
        clearState();
        team1El.value = "";
        team2El.value = "";
        team3El.value = "";
        team4El.value = "";
        if (mvpEl) mvpEl.value = "";
        matches = normalizedMatches(matchCountNow(), currentRounde(), []);
        recomputeAndPaint();
      });
    }

    function renderBracketPosterIntoModal() {
      if (!bracketCapture) return;
      bracketCapture.innerHTML = buildBracketPosterHtml(
        teamsNow(),
        currentRounde(),
        matches,
        bronzeEnabledNow(),
        currentBo()
      );
    }

    function openBracketModal() {
      if (!bracketDlg || typeof bracketDlg.showModal !== "function") return;
      renderBracketPosterIntoModal();
      bracketDlg.showModal();
      document.dispatchEvent(new CustomEvent("ft-close-sidebar", { bubbles: true }));
    }

    function closeBracketModal() {
      if (!bracketDlg) return;
      bracketDlg.close();
    }

    if (bracketOpen && bracketDlg && bracketCapture) {
      bracketOpen.addEventListener("click", function () {
        var desc =
          "Untuk membuka preview poster bracket Clash Squad 4 Team, tinjau iklan di jendela ini terlebih dahulu.";
        var run = function () {
          openBracketModal();
        };
        if (typeof window.ftOpenGateForPreview === "function") window.ftOpenGateForPreview(desc, run);
        else run();
      });
    }
    if (bracketClose) bracketClose.addEventListener("click", closeBracketModal);
    if (bracketDlg) {
      bracketDlg.addEventListener("click", function (e) {
        if (e.target === bracketDlg) closeBracketModal();
      });
    }

    if (bracketDownload) {
      bracketDownload.addEventListener("click", function () {
        if (typeof window.htmlToImage === "undefined" || !bracketCapture) return;
        var poster = document.getElementById("cs4-bracket-poster");
        if (!poster) return;

        var doDl = function () {
          bracketDownload.disabled = true;
          var tourney = safeFilenamePart(textById("br-match1-tournament") || "FT_Epep_Squad");
          var date = safeFilenamePart(textById("br-match1-playdate") || "");
          var file = "CS4_Bracket_" + (tourney ? tourney : "Poster") + (date ? "_" + date : "") + ".png";
          window.htmlToImage
            .toPng(poster, { pixelRatio: 2, cacheBust: true, backgroundColor: "#050507" })
            .then(function (dataUrl) {
              var a = document.createElement("a");
              a.download = file;
              a.href = dataUrl;
              document.body.appendChild(a);
              a.click();
              a.remove();
            })
            .catch(function () {})
            .finally(function () {
              bracketDownload.disabled = false;
            });
        };

        if (typeof window.ftOpenDownloadAdGate === "function") {
          window.ftOpenDownloadAdGate("poster bracket Clash Squad 4 Team", doDl);
        } else {
          doDl();
        }
      });
    }

    function renderCertsIntoModal() {
      if (!certCapture) return;
      var t = teamsNow();
      var bronzeOn = bronzeEnabledNow();
      var bo = currentBo();
      var r = currentRounde();
      var sf1 = computeMatchSummary(matches[0], r, bo);
      var sf2 = computeMatchSummary(matches[1], r, bo);
      var finIdx = bronzeOn ? 3 : 2;
      var fin = computeMatchSummary(matches[finIdx], r, bo);
      var leftFinal = sf1.winner === "L" ? t[0] : sf1.winner === "R" ? t[1] : "";
      var rightFinal = sf2.winner === "L" ? t[2] : sf2.winner === "R" ? t[3] : "";
      var champ = computeChampion(t, matches, r, bronzeOn, bo) || "—";
      var runner = "";
      if (fin.winner === "L") runner = rightFinal || "—";
      else if (fin.winner === "R") runner = leftFinal || "—";
      else runner = "—";

      var finTotal = fin.roundWinsLeft + " - " + fin.roundWinsRight;
      var thanksFinal = "Clash Squad 4 Team · Rounde " + r + " · BO " + bo + " · Total skor final " + finTotal;

      var tourney = textById("br-match1-tournament") || "FT Epep Squad";
      var playDateIso = textById("br-match1-playdate") || localDateISO();
      var playTime = textById("br-match1-play-time") || "";
      var dateLine = fmtDate(playDateIso);
      var timeLine = fmtTime(playTime);

      var parts = [];
      parts.push(
        wrapCertSlot(
          "champion",
          "Champion",
          certArticlePlacement({
            dataCert: "champion",
            tierLabel: "Champion",
            positionTitle: "Champion",
            tournamentName: tourney,
            winnerName: champ,
            thanksLine: thanksFinal,
            dateLine: dateLine,
            timeLine: timeLine,
            serial: makeSerial("CS4"),
            asideTag: "Clash Squad · 4 Team",
            iconClass: "fa-solid fa-crown",
          })
        )
      );
      parts.push(
        wrapCertSlot(
          "runnerup",
          "Runner-up",
          certArticlePlacement({
            dataCert: "runnerup",
            tierLabel: "Runner-up",
            positionTitle: "Runner-up",
            tournamentName: tourney,
            winnerName: runner,
            thanksLine: thanksFinal,
            dateLine: dateLine,
            timeLine: timeLine,
            serial: makeSerial("CS4"),
            asideTag: "Clash Squad · 4 Team",
            iconClass: "fa-solid fa-medal",
          })
        )
      );

      if (bronzeOn) {
        var sf1L = sf1.winner === "L" ? t[1] : sf1.winner === "R" ? t[0] : "";
        var sf2L = sf2.winner === "L" ? t[3] : sf2.winner === "R" ? t[2] : "";
        var br = computeMatchSummary(matches[2], r, bo);
        var bronzeWinner = br.winner === "L" ? sf1L || "—" : br.winner === "R" ? sf2L || "—" : "—";
        var brTotal = br.roundWinsLeft + " - " + br.roundWinsRight;
        var thanksBronze =
          "Clash Squad 4 Team · Rounde " + r + " · BO " + bo + " · Total skor bronze " + brTotal;
        parts.push(
          wrapCertSlot(
            "bronze",
            "Juara 3",
            certArticlePlacement({
              dataCert: "bronze",
              tierLabel: "Juara 3",
              positionTitle: "Juara 3 (Bronze)",
              tournamentName: tourney,
              winnerName: bronzeWinner,
              thanksLine: thanksBronze,
              dateLine: dateLine,
              timeLine: timeLine,
              serial: makeSerial("CS4"),
              asideTag: "Clash Squad · 4 Team",
              iconClass: "fa-solid fa-award",
            })
          )
        );

        var mvpName = (mvpEl && mvpEl.value ? mvpEl.value : "").trim() || "—";
        parts.push(
          wrapCertSlot(
            "mvp",
            "MVP Team",
            certArticlePlacement({
              dataCert: "mvp",
              tierLabel: "MVP Team",
              positionTitle: "MVP Team",
              tournamentName: tourney,
              winnerName: mvpName,
              thanksLine: "Penghargaan Tim MVP · Clash Squad 4 Team · Rounde " + r + " · BO " + bo,
              dateLine: dateLine,
              timeLine: timeLine,
              serial: makeSerial("CS4"),
              asideTag: "Clash Squad · 4 Team",
              iconClass: "fa-solid fa-star",
              extraArticleClass: "br-m1-cert--mvp",
            })
          )
        );
      }

      certCapture.innerHTML = parts.join("");
    }

    function openCertModal() {
      if (!certDlg || typeof certDlg.showModal !== "function") return;
      renderCertsIntoModal();
      certDlg.showModal();
      document.dispatchEvent(new CustomEvent("ft-close-sidebar", { bubbles: true }));
    }

    function closeCertModal() {
      if (!certDlg) return;
      certDlg.close();
    }

    if (certOpen && certDlg && certCapture) {
      certOpen.addEventListener("click", function () {
        var desc =
          "Untuk membuka preview sertifikat Clash Squad 4 Team, tinjau iklan di jendela ini terlebih dahulu.";
        var run = function () {
          openCertModal();
        };
        if (typeof window.ftOpenGateForPreview === "function") window.ftOpenGateForPreview(desc, run);
        else run();
      });
    }
    if (certClose) certClose.addEventListener("click", closeCertModal);
    if (certDlg) {
      certDlg.addEventListener("click", function (e) {
        if (e.target === certDlg) closeCertModal();
      });
    }

    if (certCapture) {
      certCapture.addEventListener("click", function (e) {
        var t0 = e.target;
        if (!t0) return;
        var btn = t0.closest ? t0.closest("[data-cert-download]") : null;
        if (!btn) return;
        if (typeof window.htmlToImage === "undefined") return;

        var slotKey = String(btn.getAttribute("data-cert-download") || "");
        var article = certCapture.querySelector('[data-cert="' + slotKey + '"]');
        if (!article) article = certCapture.querySelector(".br-m1-cert");
        if (!article) return;

        var doDl = function () {
          btn.disabled = true;
          var tourney = safeFilenamePart(textById("br-match1-tournament") || "FT_Epep_Squad");
          var date = safeFilenamePart(textById("br-match1-playdate") || "");
          var file =
            "CS4_Certificate_" +
            slotKey +
            "_" +
            (tourney ? tourney : "Cert") +
            (date ? "_" + date : "") +
            ".png";

          window.htmlToImage
            .toPng(article, { pixelRatio: 2, cacheBust: true, backgroundColor: "#f6f0df" })
            .then(function (dataUrl) {
              var a = document.createElement("a");
              a.download = file;
              a.href = dataUrl;
              document.body.appendChild(a);
              a.click();
              a.remove();
            })
            .catch(function () {})
            .finally(function () {
              btn.disabled = false;
            });
        };

        if (typeof window.ftOpenDownloadAdGate === "function") {
          window.ftOpenDownloadAdGate("sertifikat Clash Squad 4 Team", doDl);
        } else {
          doDl();
        }
      });
    }
  });
})();
