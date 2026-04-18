(function () {
  "use strict";

  var STORAGE_KEY = "ft-epep-squad:cs-2-team";

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

  function winsNeededForBo(bo) {
    // BO1 -> 1, BO3 -> 2, BO5 -> 3, BO7 -> 4
    return Math.floor((bo || 1) / 2) + 1;
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

  function roundWinsFromScores(roundsArr) {
    var left = 0;
    var right = 0;
    var perRound = [];
    for (var i = 0; i < roundsArr.length; i++) {
      var r = roundsArr[i] || {};
      var ln = r.left === "" ? NaN : parseInt(r.left, 10);
      var rn = r.right === "" ? NaN : parseInt(r.right, 10);
      var w = "";
      if (!isNaN(ln) && !isNaN(rn)) {
        if (ln > rn) {
          left += 1;
          w = "L";
        } else if (rn > ln) {
          right += 1;
          w = "R";
        }
      }
      perRound.push(w);
    }
    return { left: left, right: right, perRound: perRound };
  }

  function roundsNeededForRounde(rounde) {
    // Best-of-rounde inside a match: 5->3, 7->4, 11->6, 13->7
    return Math.floor((rounde || 5) / 2) + 1;
  }

  function computeSeries(matches, rounde) {
    var leftWins = 0;
    var rightWins = 0;
    var perMatch = [];

    var needed = roundsNeededForRounde(rounde);
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i] || {};
      var rr = Array.isArray(m.rounds) ? m.rounds : [];
      var rw = roundWinsFromScores(rr);

      var w = "";
      if (rw.left >= needed) {
        w = "L";
        leftWins += 1;
      } else if (rw.right >= needed) {
        w = "R";
        rightWins += 1;
      }
      perMatch.push({ winner: w, roundWinsLeft: rw.left, roundWinsRight: rw.right });
    }

    return { leftWins: leftWins, rightWins: rightWins, perMatch: perMatch };
  }

  function winnerBadgeHtml(w, teamLeft, teamRight) {
    if (w === "L") {
      return (
        '<span class="inline-flex items-center justify-center rounded-full border border-[color-mix(in_srgb,#5eead4_24%,transparent)] bg-[color-mix(in_srgb,#5eead4_10%,transparent)] px-3 py-1 font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.14em] text-[#b8fff0]">' +
        (teamLeft || "Kiri") +
        "</span>"
      );
    }
    if (w === "R") {
      return (
        '<span class="inline-flex items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-brand-glow)_24%,transparent)] bg-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] px-3 py-1 font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-glow)]">' +
        (teamRight || "Kanan") +
        "</span>"
      );
    }
    return '<span class="inline-flex items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-primary)_45%,transparent)] px-3 py-1 font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">—</span>';
  }

  function renderMatchesAccordion(root, count, matches, teamLeftName, teamRightName, rounde) {
    if (!root) return;
    var html = [];
    var roundsNeeded = roundsNeededForRounde(rounde);
    for (var i = 0; i < count; i++) {
      var m = matches[i] || { rounds: [] };
      var rr = Array.isArray(m.rounds) ? m.rounds : [];
      var rw = roundWinsFromScores(rr);
      var w = "";
      if (rw.left >= roundsNeeded) w = "L";
      else if (rw.right >= roundsNeeded) w = "R";

      var roundRows = [];
      for (var rIdx = 0; rIdx < rounde; rIdx++) {
        var row = rr[rIdx] || { left: "", right: "" };
        roundRows.push(
          '<div class="grid items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-brand)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-primary)_32%,transparent)] px-3 py-2 sm:grid-cols-[5.5rem_1fr_1fr]">' +
            '<p class="m-0 text-[0.7rem] font-semibold text-[var(--color-text-secondary)]">Round ' +
            (rIdx + 1) +
            "</p>" +
            '<label class="grid gap-1.5">' +
            '<span class="sr-only">Skor ' +
            (teamLeftName || "Tim kiri") +
            " Round " +
            (rIdx + 1) +
            "</span>" +
            '<input data-match="' +
            i +
            '" data-round="' +
            rIdx +
            '" data-side="L" inputmode="numeric" placeholder="0" value="' +
            (row.left || "") +
            '" class="w-full rounded-xl border border-[color-mix(in_srgb,white_8%,transparent)] bg-[color-mix(in_srgb,black_30%,transparent)] px-3 py-2.5 text-[0.95rem] text-[var(--color-text-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-text-secondary)_48%,transparent)] focus:border-[color-mix(in_srgb,var(--color-brand-glow)_45%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-bg-primary)_55%,transparent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-brand-glow)_22%,transparent)]" />' +
            "</label>" +
            '<label class="grid gap-1.5">' +
            '<span class="sr-only">Skor ' +
            (teamRightName || "Tim kanan") +
            " Round " +
            (rIdx + 1) +
            "</span>" +
            '<input data-match="' +
            i +
            '" data-round="' +
            rIdx +
            '" data-side="R" inputmode="numeric" placeholder="0" value="' +
            (row.right || "") +
            '" class="w-full rounded-xl border border-[color-mix(in_srgb,white_8%,transparent)] bg-[color-mix(in_srgb,black_30%,transparent)] px-3 py-2.5 text-[0.95rem] text-[var(--color-text-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-text-secondary)_48%,transparent)] focus:border-[color-mix(in_srgb,var(--color-brand-glow)_45%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-bg-primary)_55%,transparent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-brand-glow)_22%,transparent)]" />' +
            "</label>" +
            "</div>"
        );
      }
      html.push(
        '<details class="group px-3 py-3 sm:px-4" ' +
          (i === 0 ? "open" : "") +
          ">" +
          '<summary class="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-[color-mix(in_srgb,var(--color-brand)_14%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-primary)_35%,transparent)] px-3 py-2.5 transition hover:border-[color-mix(in_srgb,var(--color-brand-glow)_26%,transparent)]">' +
          '<div class="min-w-0">' +
          '<p class="m-0 font-[family-name:var(--font-heading)] text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-glow)]">Fase · Final</p>' +
          '<p class="m-0 mt-0.5 text-[0.72rem] text-[var(--color-text-secondary)]">Match ' +
          (i + 1) +
          " · Rounde: " +
          rounde +
          ' · Target: ' +
          roundsNeeded +
          ' win · Skor: ' +
          rw.left +
          " - " +
          rw.right +
          "</p>" +
          "</div>" +
          '<div class="flex shrink-0 items-center gap-2">' +
          winnerBadgeHtml(w, teamLeftName, teamRightName) +
          '<span class="inline-flex size-9 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] bg-[color-mix(in_srgb,black_22%,transparent)] text-[var(--color-text-secondary)] transition group-open:rotate-180" aria-hidden="true">' +
          '<i class="fa-solid fa-chevron-down text-[0.85rem]"></i>' +
          "</span>" +
          "</div>" +
          "</summary>" +
          '<div class="mt-3 grid gap-2.5">' +
          roundRows.join("") +
          "</div>" +
          "</details>"
      );
    }
    root.innerHTML = html.join("");
  }

  function setWinnerLabels(series, teamLeft, teamRight, needed) {
    var wL = $("cs2-wins-left");
    var wR = $("cs2-wins-right");
    var badge = $("cs2-winner-badge");
    if (wL) wL.textContent = String(series.leftWins);
    if (wR) wR.textContent = String(series.rightWins);

    var winner = "";
    if (series.leftWins >= needed) winner = "L";
    else if (series.rightWins >= needed) winner = "R";

    if (badge) {
      if (!winner) {
        badge.classList.add("hidden");
        badge.textContent = "Menang";
      } else {
        badge.classList.remove("hidden");
        badge.textContent = "Menang: " + (winner === "L" ? teamLeft : teamRight);
      }
    }
  }

  function seriesWinnerFromWins(series, bo) {
    var needed = winsNeededForBo(bo);
    if (series.leftWins >= needed) return "L";
    if (series.rightWins >= needed) return "R";
    return "";
  }

  // (tabel ronde diganti accordion match)

  document.addEventListener("DOMContentLoaded", function () {
    var form = $("cs2-form");
    var matchesRoot = $("cs2-matches-accordion");
    var leftNameEl = $("cs2-team-left");
    var rightNameEl = $("cs2-team-right");
    var roundeLabel = $("cs2-rounde-label");
    var boLabel = $("cs2-bo-label");
    var btnReset = $("cs2-reset");
    var bracketOpen = $("cs2-bracket-preview-open");
    var bracketDlg = $("cs2-bracket-dialog");
    var bracketClose = $("cs2-bracket-close");
    var bracketDownload = $("cs2-bracket-download");
    var bracketCapture = $("cs2-bracket-capture");
    var certOpen = $("br-match1-cert-preview-open");
    var certDlg = $("br-match1-cert-dialog");
    var certClose = $("br-match1-cert-close");
    var certCapture = $("br-match1-cert-capture");

    if (!form || !matchesRoot || !leftNameEl || !rightNameEl) return;

    var state = loadState() || {};
    if (state.teamLeft) leftNameEl.value = state.teamLeft;
    if (state.teamRight) rightNameEl.value = state.teamRight;

    function currentRounde() {
      return readInt(readCheckedValue(form, "rounde", "5"), 5);
    }

    function currentBo() {
      return readInt(readCheckedValue(form, "bo", "1"), 1);
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

    // migrate old storage (rounds as match-level score) -> start fresh per-round
    var existingMatches = state.matches;
    if (!existingMatches && Array.isArray(state.rounds)) existingMatches = null;
    var matches = normalizedMatches(currentBo(), currentRounde(), existingMatches);

    function syncMetaLabels() {
      var r = currentRounde();
      var b = currentBo();
      if (roundeLabel) roundeLabel.textContent = String(r);
      if (boLabel) boLabel.textContent = String(b);
    }

    function recomputeAndPaint() {
      var matchCount = currentBo();
      matches = normalizedMatches(matchCount, currentRounde(), matches);
      var teamLeft = (leftNameEl.value || "").trim() || "Team Kiri";
      var teamRight = (rightNameEl.value || "").trim() || "Team Kanan";
      renderMatchesAccordion(matchesRoot, matchCount, matches, teamLeft, teamRight, currentRounde());

      var series = computeSeries(matches, currentRounde());
      var needed = winsNeededForBo(currentBo());
      setWinnerLabels(series, teamLeft, teamRight, needed);
      syncMetaLabels();

      saveState({
        teamLeft: leftNameEl.value || "",
        teamRight: rightNameEl.value || "",
        rounde: currentRounde(),
        bo: currentBo(),
        matches: matches,
      });
    }

    function textById(id) {
      var el = document.getElementById(id);
      if (!el) return "";
      var v = "value" in el ? el.value : el.textContent;
      return String(v == null ? "" : v).trim();
    }

    function safeFilenamePart(s) {
      return String(s || "")
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 60);
    }

    function buildBracketPosterHtml(teamLeft, teamRight, rounde, bo, matchesArr) {
      var series = computeSeries(matchesArr, rounde);
      var needed = winsNeededForBo(bo);
      var winner = seriesWinnerFromWins(series, bo);

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
      metaChips.push("BO" + bo);

      function badgeHtml(label, tone) {
        var base =
          "inline-flex items-center justify-center rounded-full border px-3 py-1 font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.18em]";
        if (tone === "winL")
          return (
            '<span class="' +
            base +
            ' border-[color-mix(in_srgb,#5eead4_28%,transparent)] bg-[color-mix(in_srgb,#5eead4_10%,transparent)] text-[#b8fff0]">' +
            label +
            "</span>"
          );
        if (tone === "winR")
          return (
            '<span class="' +
            base +
            ' border-[color-mix(in_srgb,var(--color-brand-glow)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] text-[var(--color-brand-glow)]">' +
            label +
            "</span>"
          );
        return (
          '<span class="' +
          base +
          ' border-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] bg-[color-mix(in_srgb,black_20%,transparent)] text-[var(--color-text-secondary)]">' +
          label +
          "</span>"
        );
      }

      var finalWinnerTone = winner === "L" ? "winL" : winner === "R" ? "winR" : "neutral";
      var finalWinnerName = winner === "L" ? teamLeft : winner === "R" ? teamRight : "—";
      var finalBadge = badgeHtml("Champion: " + finalWinnerName, finalWinnerTone);

      function matchScoreChip(n) {
        return (
          '<span class="inline-flex min-w-[2.25rem] items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--color-brand)_16%,transparent)] bg-[color-mix(in_srgb,black_22%,transparent)] px-2 py-1 font-[family-name:var(--font-heading)] text-[0.78rem] font-black tabular-nums text-[color-mix(in_srgb,#5eead4_86%,white)]">' +
          n +
          "</span>"
        );
      }

      var totalLeft = 0;
      var totalRight = 0;
      for (var mi = 0; mi < bo; mi++) {
        var pm = series.perMatch[mi] || { roundWinsLeft: 0, roundWinsRight: 0 };
        totalLeft += pm.roundWinsLeft || 0;
        totalRight += pm.roundWinsRight || 0;
      }
      var leftTotalChip = matchScoreChip(totalLeft);
      var rightTotalChip = matchScoreChip(totalRight);

      var finalBracketHtml =
        '<div class="relative mx-auto w-max max-w-full overflow-hidden rounded-[1.6rem] border border-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] bg-[color-mix(in_srgb,black_22%,transparent)] p-6 shadow-[inset_0_0_0_1px_color-mix(in_srgb,white_6%,transparent)]">' +
        '<div class="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" style="background:radial-gradient(ellipse 60% 60% at 50% 50%, color-mix(in_srgb,var(--color-brand-glow)_12%,transparent), transparent 62%);"></div>' +
        '<p class="relative z-[1] m-0 mb-4 text-center font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.22em] text-[color-mix(in_srgb,var(--color-text-secondary)_88%,var(--color-brand-glow))]">Fase · Final</p>' +
        '<div class="relative z-[1] grid items-center gap-5 sm:grid-cols-[1fr_auto_1fr]">' +
        '<div class="min-w-0 rounded-2xl border border-[color-mix(in_srgb,#5eead4_18%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-primary)_35%,transparent)] p-5">' +
        '<div class="grid items-center gap-3" style="grid-template-columns:minmax(10rem,1fr) minmax(2.25rem,auto);">' +
        '<p class="m-0 truncate font-[family-name:var(--font-heading)] text-[1.15rem] font-black uppercase tracking-[0.08em] text-[var(--color-text-primary)]">' +
        teamLeft +
        "</p>" +
        leftTotalChip +
        "</div>" +
        "</div>" +
        '<div class="relative grid place-items-center">' +
        '<div class="grid place-items-center rounded-[1.4rem] border border-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] bg-[color-mix(in_srgb,black_28%,transparent)] px-7 py-6 text-center shadow-[0_0_28px_color-mix(in_srgb,var(--color-brand)_12%,transparent)]">' +
        '<p class="m-0 font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.28em] text-[var(--color-brand-glow)]">CHAMPION</p>' +
        '<p class="m-0 mt-3 max-w-[14rem] truncate font-[family-name:var(--font-heading)] text-[1.25rem] font-black uppercase tracking-[0.1em] text-[color-mix(in_srgb,var(--color-text-primary)_92%,#5eead4)]">' +
        finalWinnerName +
        "</p>" +
        '<div class="mt-3">' +
        finalBadge +
        "</div>" +
        "</div>" +
        // connector lines (like bracket)
        '<div class="pointer-events-none absolute left-0 top-1/2 hidden h-0.5 w-10 -translate-x-full -translate-y-1/2 opacity-80 sm:block" aria-hidden="true" style="background:linear-gradient(90deg, transparent, color-mix(in_srgb,#5eead4_70%,transparent));"></div>' +
        '<div class="pointer-events-none absolute right-0 top-1/2 hidden h-0.5 w-10 translate-x-full -translate-y-1/2 opacity-80 sm:block" aria-hidden="true" style="background:linear-gradient(90deg, color-mix(in_srgb,var(--color-brand-glow)_70%,transparent), transparent);"></div>' +
        "</div>" +
        '<div class="min-w-0 rounded-2xl border border-[color-mix(in_srgb,var(--color-brand-glow)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-primary)_35%,transparent)] p-5 text-right">' +
        '<div class="grid items-center gap-3 justify-items-end" style="grid-template-columns:minmax(2.25rem,auto) minmax(10rem,1fr);">' +
        rightTotalChip +
        '<p class="m-0 truncate font-[family-name:var(--font-heading)] text-[1.15rem] font-black uppercase tracking-[0.08em] text-[var(--color-text-primary)]">' +
        teamRight +
        "</p>" +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>";

      var winnerChip = "";
      if (winner) {
        winnerChip = badgeHtml("Champion: " + (winner === "L" ? teamLeft : teamRight), winner === "L" ? "winL" : "winR");
      } else {
        winnerChip = badgeHtml("Champion: —", "neutral");
      }

      return (
        '<div id="cs2-bracket-poster" style="box-sizing:border-box;max-width:min(1080px,100%);" class="relative inline-block w-max max-w-full overflow-hidden rounded-[2rem] border border-[color-mix(in_srgb,var(--color-brand)_24%,transparent)] bg-[radial-gradient(ellipse_80%_60%_at_20%_10%,color-mix(in_srgb,#5eead4_18%,transparent),transparent_60%),radial-gradient(ellipse_70%_55%_at_90%_20%,color-mix(in_srgb,var(--color-brand)_14%,transparent),transparent_62%),linear-gradient(180deg,color-mix(in_srgb,#07070a_94%,var(--color-bg-primary)),color-mix(in_srgb,var(--color-bg-primary)_92%,black))] p-10 text-[var(--color-text-primary)] shadow-[0_38px_120px_rgba(0,0,0,0.7)] [color-scheme:dark]">' +
        '<div class="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" style="background-image:linear-gradient(color-mix(in_srgb,var(--color-brand)_12%,transparent) 1px, transparent 1px),linear-gradient(90deg,color-mix(in_srgb,var(--color-brand)_10%,transparent) 1px, transparent 1px);background-size:52px 52px;"></div>' +
        '<div class="pointer-events-none absolute -right-[12%] -top-[18%] h-[18rem] w-[18rem] rounded-full opacity-70 blur-[2px]" aria-hidden="true" style="background:radial-gradient(circle,color-mix(in_srgb,#5eead4_38%,transparent),transparent 62%);"></div>' +
        '<div class="relative z-[1] grid w-max max-w-full gap-8">' +
        '<header class="grid w-full min-w-0 gap-4">' +
        '<div class="flex flex-wrap items-center justify-between gap-3">' +
        '<div class="min-w-0">' +
        '<div class="flex items-center gap-3">' +
        '<span class="grid size-11 place-items-center rounded-2xl border border-[color-mix(in_srgb,#5eead4_22%,transparent)] bg-[color-mix(in_srgb,black_22%,transparent)] shadow-[0_0_26px_color-mix(in_srgb,var(--color-brand)_10%,transparent)]">' +
        '<img src="../../img/element/Logo.png" alt="FT Epep Squad" class="h-7 w-7 object-contain" draggable="false" />' +
        "</span>" +
        '<div class="min-w-0">' +
        '<p class="m-0 font-[family-name:var(--font-heading)] text-[0.6rem] font-bold uppercase tracking-[0.26em] text-[var(--color-brand-glow)]">FT Epep Squad</p>' +
        '<p class="m-0 mt-1 text-[0.78rem] font-semibold tracking-wide text-[color-mix(in_srgb,var(--color-text-secondary)_92%,transparent)]">Bracket Poster</p>' +
        "</div>" +
        "</div>" +
        '<h3 class="m-0 mt-2 font-[family-name:var(--font-heading)] text-[clamp(1.75rem,3.2vw,2.35rem)] font-black uppercase tracking-[0.08em] text-[color-mix(in_srgb,var(--color-text-primary)_92%,#5eead4)] [text-shadow:0_2px_34px_rgba(0,0,0,0.55)]">' +
        tourney +
        "</h3>" +
        '<p class="m-0 mt-2 text-[0.9rem] text-[color-mix(in_srgb,var(--color-text-secondary)_90%,transparent)]">Clash Squad · 2 Team</p>' +
        "</div>" +
        '<div class="shrink-0">' +
        winnerChip +
        "</div>" +
        "</div>" +
        '<div class="flex flex-wrap gap-2">' +
        metaChips
          .map(function (c) {
            return badgeHtml(c, "neutral");
          })
          .join("") +
        "</div>" +
        "</header>" +
        '<section class="grid w-full min-w-0 gap-3">' +
        '<div class="flex items-center justify-between gap-3">' +
        '<h4 class="m-0 font-[family-name:var(--font-heading)] text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[var(--color-brand-glow)]">Bracket</h4>' +
        badgeHtml("Match " + bo + " · Rounde " + rounde, "neutral") +
        "</div>" +
        finalBracketHtml +
        "</section>" +
        '<footer class="pt-2">' +
        '<div class="mx-auto flex w-fit items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-brand)_14%,transparent)] bg-[color-mix(in_srgb,black_18%,transparent)] px-4 py-2 text-[0.7rem] tracking-wide text-[color-mix(in_srgb,var(--color-text-secondary)_88%,transparent)]">' +
        '<span class="grid size-7 place-items-center rounded-full border border-[color-mix(in_srgb,#5eead4_18%,transparent)] bg-[color-mix(in_srgb,black_22%,transparent)]">' +
        '<img src="../../img/element/Logo.png" alt="FT Epep Squad" class="h-4 w-4 object-contain" draggable="false" />' +
        "</span>" +
        '<span class="font-[family-name:var(--font-heading)] font-bold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--color-text-primary)_92%,#5eead4)]">FT Epep Squad</span>' +
        "</div>" +
        "</footer>" +
        "</div>" +
        "</div>"
      );
    }

    function renderBracketPosterIntoModal() {
      if (!bracketCapture) return;
      var teamLeft = (leftNameEl.value || "").trim() || "—";
      var teamRight = (rightNameEl.value || "").trim() || "—";
      var r = currentRounde();
      var b = currentBo();
      var normalized = normalizedMatches(b, r, matches);
      bracketCapture.innerHTML = buildBracketPosterHtml(teamLeft, teamRight, r, b, normalized);
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

    function onInput(e) {
      var t = e.target;
      if (!t) return;
      if (!t.hasAttribute("data-match") || !t.hasAttribute("data-round") || !t.hasAttribute("data-side")) return;
      var mIdx = readInt(t.getAttribute("data-match"), -1);
      var rIdx = readInt(t.getAttribute("data-round"), -1);
      var side = String(t.getAttribute("data-side") || "").toUpperCase();
      if (mIdx < 0 || rIdx < 0) return;

      matches = normalizedMatches(currentBo(), currentRounde(), matches);
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

    // initial render
    recomputeAndPaint();

    // handle dynamic count changes
    form.addEventListener("change", function (e) {
      var t = e.target;
      if (!t) return;
      if (t.name === "rounde" || t.name === "bo") recomputeAndPaint();
    });

    leftNameEl.addEventListener("input", recomputeAndPaint);
    rightNameEl.addEventListener("input", recomputeAndPaint);
    matchesRoot.addEventListener("input", onInput);

    if (btnReset) {
      btnReset.addEventListener("click", function () {
        clearState();
        leftNameEl.value = "";
        rightNameEl.value = "";
        matches = normalizedMatches(currentBo(), currentRounde(), []);
        recomputeAndPaint();
      });
    }

    if (bracketOpen && bracketDlg && bracketCapture) {
      bracketOpen.addEventListener("click", function () {
        var desc =
          "Untuk membuka preview poster bracket Clash Squad 2 Team, tinjau iklan di jendela ini terlebih dahulu.";
        var run = function () {
          openBracketModal();
        };
        if (typeof window.ftOpenGateForPreview === "function") window.ftOpenGateForPreview(desc, run);
        else run();
      });
    }

    if (bracketClose) {
      bracketClose.addEventListener("click", closeBracketModal);
    }

    if (bracketDlg) {
      bracketDlg.addEventListener("click", function (e) {
        if (e.target === bracketDlg) closeBracketModal();
      });
    }

    if (bracketDownload) {
      bracketDownload.addEventListener("click", function () {
        if (typeof window.htmlToImage === "undefined" || !bracketCapture) return;
        var poster = document.getElementById("cs2-bracket-poster");
        if (!poster) return;

        var doDl = function () {
          bracketDownload.disabled = true;
          var tourney = safeFilenamePart(textById("br-match1-tournament") || "FT_Epep_Squad");
          var date = safeFilenamePart(textById("br-match1-playdate") || "");
          var file = "CS2_Bracket_" + (tourney ? tourney : "Poster") + (date ? "_" + date : "") + ".png";

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
            .catch(function () {
              // ignore
            })
            .finally(function () {
              bracketDownload.disabled = false;
            });
        };

        if (typeof window.ftOpenDownloadAdGate === "function") {
          window.ftOpenDownloadAdGate("poster bracket Clash Squad 2 Team", doDl);
        } else {
          doDl();
        }
      });
    }

    function escapeHtml(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
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
      return String(prefix || "CS2") + "-" + day + "-" + rnd;
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

    function certArticleChampion(opts) {
      var tierLabel = opts.tierLabel || "Champion";
      var tourney = opts.tournamentName || "—";
      var winnerName = opts.winnerName || "—";
      var bo = opts.bo || 1;
      var rounde = opts.rounde || 5;
      var totalLine = opts.totalLine || "—";
      var dateLine = opts.dateLine || "—";
      var timeLine = opts.timeLine || "—";
      var serial = opts.serial || "";
      return (
        '<article class="br-m1-cert br-m1-cert--classic" data-cert="champion">' +
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
        '</p><div class="br-m1-cert__aside-ico"><i class="fa-solid fa-crown" aria-hidden="true"></i></div>' +
        '<span class="br-m1-cert__aside-tag">Clash Squad · 2 Team</span></div></aside>' +
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
        '<p class="br-m1-cert__position">Champion</p>' +
        '<p class="br-m1-cert__thanks">Clash Squad 2 Team · BO' +
        escapeHtml(String(bo)) +
        " · Rounde " +
        escapeHtml(String(rounde)) +
        " · Total skor " +
        escapeHtml(totalLine) +
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

    function renderCertsIntoModal() {
      if (!certCapture) return;
      var teamLeft = (leftNameEl.value || "").trim() || "—";
      var teamRight = (rightNameEl.value || "").trim() || "—";
      var r = currentRounde();
      var b = currentBo();
      var normalized = normalizedMatches(b, r, matches);
      var series = computeSeries(normalized, r);
      var winnerSide = seriesWinnerFromWins(series, b);
      var winnerName = winnerSide === "L" ? teamLeft : winnerSide === "R" ? teamRight : "—";

      var totalLeft = 0;
      var totalRight = 0;
      for (var mi = 0; mi < b; mi++) {
        var pm = series.perMatch[mi] || { roundWinsLeft: 0, roundWinsRight: 0 };
        totalLeft += pm.roundWinsLeft || 0;
        totalRight += pm.roundWinsRight || 0;
      }

      var tourney = textById("br-match1-tournament") || "FT Epep Squad";
      var playDateIso = textById("br-match1-playdate") || localDateISO();
      var playTime = textById("br-match1-play-time") || "";

      var article = certArticleChampion({
        tierLabel: "Champion",
        tournamentName: tourney,
        winnerName: winnerName,
        bo: b,
        rounde: r,
        totalLine: totalLeft + " - " + totalRight,
        dateLine: fmtDate(playDateIso),
        timeLine: fmtTime(playTime),
        serial: makeSerial("CS2"),
      });

      certCapture.innerHTML = wrapCertSlot("champion", "Champion", article);
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
          "Untuk membuka preview sertifikat Clash Squad 2 Team, tinjau iklan di jendela ini terlebih dahulu.";
        var run = function () {
          openCertModal();
        };
        if (typeof window.ftOpenGateForPreview === "function") window.ftOpenGateForPreview(desc, run);
        else run();
      });
    }
    if (certClose) {
      certClose.addEventListener("click", closeCertModal);
    }
    if (certDlg) {
      certDlg.addEventListener("click", function (e) {
        if (e.target === certDlg) closeCertModal();
      });
    }

    if (certCapture) {
      certCapture.addEventListener("click", function (e) {
        var t = e.target;
        if (!t) return;
        var btn = t.closest ? t.closest("[data-cert-download]") : null;
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
          var file = "CS2_Certificate_" + (tourney ? tourney : "Champion") + (date ? "_" + date : "") + ".png";

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
            .catch(function () {
              // ignore
            })
            .finally(function () {
              btn.disabled = false;
            });
        };

        if (typeof window.ftOpenDownloadAdGate === "function") {
          window.ftOpenDownloadAdGate("sertifikat Clash Squad 2 Team", doDl);
        } else {
          doDl();
        }
      });
    }

  });
})();

