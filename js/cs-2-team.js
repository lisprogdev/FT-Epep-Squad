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

  function computeSeries(rounds) {
    var leftWins = 0;
    var rightWins = 0;
    var perRound = [];

    for (var i = 0; i < rounds.length; i++) {
      var r = rounds[i] || {};
      var l = r.left;
      var rr = r.right;
      var ln = l === "" ? NaN : parseInt(l, 10);
      var rn = rr === "" ? NaN : parseInt(rr, 10);
      var w = ""; // L / R / ""
      if (!isNaN(ln) && !isNaN(rn)) {
        if (ln > rn) {
          leftWins += 1;
          w = "L";
        } else if (rn > ln) {
          rightWins += 1;
          w = "R";
        }
      }
      perRound.push(w);
    }

    return { leftWins: leftWins, rightWins: rightWins, perRound: perRound };
  }

  function renderRounds(tbody, count, rounds, teamLeftName, teamRightName) {
    if (!tbody) return;
    var rows = [];
    for (var i = 0; i < count; i++) {
      var r = rounds[i] || { left: "", right: "" };
      rows.push(
        '<tr class="bg-[color-mix(in_srgb,var(--color-bg-primary)_18%,transparent)]">' +
          '<td class="px-3 py-2 text-center align-middle font-[family-name:var(--font-heading)] text-[0.62rem] font-bold tracking-[0.08em] text-[var(--color-text-primary)]">' +
          (i + 1) +
          "</td>" +
          '<td class="px-3 py-2 align-middle">' +
          '<input data-round-left="' +
          i +
          '" inputmode="numeric" placeholder="0" value="' +
          (r.left || "") +
          '" class="w-full min-w-[8rem] rounded-lg border border-[color-mix(in_srgb,white_8%,transparent)] bg-[color-mix(in_srgb,black_28%,transparent)] px-3 py-2 text-[0.9rem] text-[var(--color-text-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-text-secondary)_48%,transparent)] focus:border-[color-mix(in_srgb,var(--color-brand-glow)_45%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-bg-primary)_55%,transparent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-brand-glow)_22%,transparent)]" aria-label="Skor ' +
          (teamLeftName || "Tim kiri") +
          " ronde " +
          (i + 1) +
          '">' +
          "</td>" +
          '<td class="px-3 py-2 align-middle">' +
          '<input data-round-right="' +
          i +
          '" inputmode="numeric" placeholder="0" value="' +
          (r.right || "") +
          '" class="w-full min-w-[8rem] rounded-lg border border-[color-mix(in_srgb,white_8%,transparent)] bg-[color-mix(in_srgb,black_28%,transparent)] px-3 py-2 text-[0.9rem] text-[var(--color-text-primary)] outline-none transition placeholder:text-[color-mix(in_srgb,var(--color-text-secondary)_48%,transparent)] focus:border-[color-mix(in_srgb,var(--color-brand-glow)_45%,transparent)] focus:bg-[color-mix(in_srgb,var(--color-bg-primary)_55%,transparent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-brand-glow)_22%,transparent)]" aria-label="Skor ' +
          (teamRightName || "Tim kanan") +
          " ronde " +
          (i + 1) +
          '">' +
          "</td>" +
          '<td class="px-3 py-2 text-center align-middle">' +
          '<span data-round-winner="' +
          i +
          '" class="inline-flex min-w-[5.5rem] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-primary)_45%,transparent)] px-2.5 py-1 font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">—</span>' +
          "</td>" +
          "</tr>"
      );
    }
    tbody.innerHTML = rows.join("");
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

  function paintRoundWinners(perRound, teamLeft, teamRight) {
    for (var i = 0; i < perRound.length; i++) {
      var el = document.querySelector('[data-round-winner="' + i + '"]');
      if (!el) continue;
      var w = perRound[i];
      if (w === "L") {
        el.textContent = teamLeft || "Kiri";
        el.className =
          "inline-flex min-w-[5.5rem] items-center justify-center rounded-full border border-[color-mix(in_srgb,#5eead4_24%,transparent)] bg-[color-mix(in_srgb,#5eead4_10%,transparent)] px-2.5 py-1 font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.14em] text-[#b8fff0]";
      } else if (w === "R") {
        el.textContent = teamRight || "Kanan";
        el.className =
          "inline-flex min-w-[5.5rem] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-brand-glow)_24%,transparent)] bg-[color-mix(in_srgb,var(--color-brand)_10%,transparent)] px-2.5 py-1 font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.14em] text-[var(--color-brand-glow)]";
      } else {
        el.textContent = "—";
        el.className =
          "inline-flex min-w-[5.5rem] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-primary)_45%,transparent)] px-2.5 py-1 font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]";
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = $("br-match1-meta-form");
    var roundsTbody = $("cs2-rounds-tbody");
    var leftNameEl = $("cs2-team-left");
    var rightNameEl = $("cs2-team-right");
    var roundeLabel = $("cs2-rounde-label");
    var boLabel = $("cs2-bo-label");
    var btnReset = $("br-match1-meta-reset");
    var bracketBtn = $("br-match1-preview-open");
    var bracketDlg = $("br-match1-poster-dialog");
    var bracketClose = $("br-match1-poster-close");
    var bracketCap = $("br-match1-poster-capture");

    if (!form || !roundsTbody || !leftNameEl || !rightNameEl) return;

    var state = loadState() || {};
    if (state.teamLeft) leftNameEl.value = state.teamLeft;
    if (state.teamRight) rightNameEl.value = state.teamRight;

    function currentRounde() {
      return readInt(readCheckedValue(form, "rounde", "5"), 5);
    }

    function currentBo() {
      return readInt(readCheckedValue(form, "bo", "1"), 1);
    }

    function normalizedRounds(count, existing) {
      var arr = Array.isArray(existing) ? existing.slice() : [];
      while (arr.length < count) arr.push({ left: "", right: "" });
      if (arr.length > count) arr = arr.slice(0, count);
      for (var i = 0; i < arr.length; i++) {
        arr[i] = { left: safeScore(arr[i].left), right: safeScore(arr[i].right) };
      }
      return arr;
    }

    var rounds = normalizedRounds(currentRounde(), state.rounds);

    function syncMetaLabels() {
      var r = currentRounde();
      var b = currentBo();
      if (roundeLabel) roundeLabel.textContent = String(r);
      if (boLabel) boLabel.textContent = String(b);
    }

    function recomputeAndPaint() {
      var rCount = currentRounde();
      rounds = normalizedRounds(rCount, rounds);
      var teamLeft = (leftNameEl.value || "").trim() || "Team Kiri";
      var teamRight = (rightNameEl.value || "").trim() || "Team Kanan";
      renderRounds(roundsTbody, rCount, rounds, teamLeft, teamRight);

      var series = computeSeries(rounds);
      var needed = winsNeededForBo(currentBo());
      paintRoundWinners(series.perRound, teamLeft, teamRight);
      setWinnerLabels(series, teamLeft, teamRight, needed);
      syncMetaLabels();

      saveState({
        teamLeft: leftNameEl.value || "",
        teamRight: rightNameEl.value || "",
        rounde: rCount,
        bo: currentBo(),
        rounds: rounds,
      });

      paintBracketCapture();
    }

    function onInput(e) {
      var t = e.target;
      if (!t) return;
      var idx;
      if (t.hasAttribute("data-round-left")) {
        idx = readInt(t.getAttribute("data-round-left"), -1);
        if (idx >= 0) rounds[idx] = { left: safeScore(t.value), right: (rounds[idx] || {}).right || "" };
        recomputeAndPaint();
      } else if (t.hasAttribute("data-round-right")) {
        idx = readInt(t.getAttribute("data-round-right"), -1);
        if (idx >= 0) rounds[idx] = { left: (rounds[idx] || {}).left || "", right: safeScore(t.value) };
        recomputeAndPaint();
      }
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
    roundsTbody.addEventListener("input", onInput);

    if (btnReset) {
      btnReset.addEventListener("click", function () {
        clearState();
        leftNameEl.value = "";
        rightNameEl.value = "";
        rounds = normalizedRounds(currentRounde(), []);
        recomputeAndPaint();
      });
    }

    function winnerFromSeries(series, needed) {
      if (series.leftWins >= needed) return "L";
      if (series.rightWins >= needed) return "R";
      return "";
    }

    function paintBracketCapture() {
      if (!bracketCap) return;
      var teamLeft = (leftNameEl.value || "").trim() || "Team Kiri";
      var teamRight = (rightNameEl.value || "").trim() || "Team Kanan";
      var series = computeSeries(rounds);
      var bo = currentBo();
      var needed = winsNeededForBo(bo);
      var w = winnerFromSeries(series, needed);
      var winnerName = w === "L" ? teamLeft : w === "R" ? teamRight : "—";

      bracketCap.innerHTML =
        '<section class="w-full min-w-0 overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-brand)_28%,transparent)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--color-bg-secondary)_78%,transparent),color-mix(in_srgb,var(--color-bg-primary)_92%,transparent))] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.36)] sm:p-5">' +
        '<div class="mb-4 flex flex-wrap items-start justify-between gap-3">' +
        '<div>' +
        '<p class="m-0 mb-1 font-[family-name:var(--font-heading)] text-[0.58rem] font-bold uppercase tracking-[0.22em] text-[color-mix(in_srgb,#7ff5e4_88%,var(--color-text-secondary))]">Clash Squad · Single Elimination</p>' +
        '<h3 class="m-0 font-[family-name:var(--font-heading)] text-[1.05rem] font-extrabold uppercase tracking-[0.08em] text-[var(--color-text-primary)]">Grand Final (2 Team)</h3>' +
        "</div>" +
        '<div class="text-right">' +
        '<p class="m-0 text-[0.72rem] text-[var(--color-text-secondary)]">BO' +
        bo +
        ' · Butuh <strong class="text-[var(--color-text-primary)]">' +
        needed +
        "</strong> win</p>" +
        '<p class="m-0 mt-1 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,#5eead4_22%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-primary)_55%,transparent)] px-3 py-1 text-[0.78rem] font-semibold text-[var(--color-text-primary)]">' +
        '<span>' +
        series.leftWins +
        "</span><span class=\"text-[var(--color-text-secondary)]\">-</span><span>" +
        series.rightWins +
        "</span></p>" +
        "</div>" +
        "</div>" +
        // Bracket visual (terhubung): kiri/kanan -> grand final -> winner
        '<div class="relative mt-3 overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] bg-[color-mix(in_srgb,black_18%,transparent)] p-4 sm:p-5">' +
        '<div class="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_18%_12%,color-mix(in_srgb,#5eead4_12%,transparent),transparent_55%),radial-gradient(circle_at_75%_85%,color-mix(in_srgb,var(--color-brand)_10%,transparent),transparent_60%)]"></div>' +
        '<div class="relative grid gap-4 md:grid-cols-[1fr_1fr_1fr] md:items-center">' +
        // Left team box
        '<div class="relative rounded-2xl border border-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-primary)_45%,transparent)] p-4">' +
        '<p class="m-0 mb-2 font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-glow)]">Tim kiri</p>' +
        '<p class="m-0 text-[1.05rem] font-bold text-[var(--color-text-primary)]">' +
        teamLeft +
        "</p>" +
        '<p class="m-0 mt-2 text-[0.72rem] text-[var(--color-text-secondary)]">Win: <strong class="text-[var(--color-text-primary)]">' +
        series.leftWins +
        "</strong></p>" +
        // connector stub
        '<div class="pointer-events-none absolute right-[-0.85rem] top-1/2 hidden h-px w-7 -translate-y-1/2 bg-[color-mix(in_srgb,var(--color-brand-glow)_55%,transparent)] md:block"></div>' +
        "</div>" +
        // Grand final node
        '<div class="relative mx-auto w-full max-w-[22rem] rounded-2xl border border-[color-mix(in_srgb,#5eead4_22%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-primary)_55%,transparent)] p-4 text-center shadow-[0_0_28px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]">' +
        '<p class="m-0 font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.2em] text-[color-mix(in_srgb,#7ff5e4_88%,var(--color-text-secondary))]">Grand Final</p>' +
        '<p class="m-0 mt-2 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,#5eead4_22%,transparent)] bg-[color-mix(in_srgb,black_25%,transparent)] px-3 py-1 text-[0.82rem] font-semibold text-[var(--color-text-primary)]">' +
        '<span>' +
        series.leftWins +
        "</span><span class=\"text-[var(--color-text-secondary)]\">-</span><span>" +
        series.rightWins +
        "</span></p>" +
        '<p class="m-0 mt-2 text-[0.72rem] text-[var(--color-text-secondary)]">BO' +
        bo +
        " · target " +
        needed +
        " win</p>" +
        // connector stubs (left/right)
        '<div class="pointer-events-none absolute left-[-0.85rem] top-1/2 hidden h-px w-7 -translate-y-1/2 bg-[color-mix(in_srgb,var(--color-brand-glow)_55%,transparent)] md:block"></div>' +
        '<div class="pointer-events-none absolute right-[-0.85rem] top-1/2 hidden h-px w-7 -translate-y-1/2 bg-[color-mix(in_srgb,var(--color-brand-glow)_55%,transparent)] md:block"></div>' +
        "</div>" +
        // Right team box
        '<div class="relative rounded-2xl border border-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-primary)_45%,transparent)] p-4">' +
        '<p class="m-0 mb-2 font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-glow)]">Tim kanan</p>' +
        '<p class="m-0 text-[1.05rem] font-bold text-[var(--color-text-primary)]">' +
        teamRight +
        "</p>" +
        '<p class="m-0 mt-2 text-[0.72rem] text-[var(--color-text-secondary)]">Win: <strong class="text-[var(--color-text-primary)]">' +
        series.rightWins +
        "</strong></p>" +
        '<div class="pointer-events-none absolute left-[-0.85rem] top-1/2 hidden h-px w-7 -translate-y-1/2 bg-[color-mix(in_srgb,var(--color-brand-glow)_55%,transparent)] md:block"></div>' +
        "</div>" +
        "</div>" +
        // Winner lane (connected from Grand Final)
        '<div class="relative mt-5 grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">' +
        '<div class="hidden md:block"></div>' +
        '<div class="relative mx-auto flex w-full max-w-[26rem] items-center justify-center">' +
        '<div class="pointer-events-none absolute left-1/2 top-[-1.1rem] hidden h-5 w-px -translate-x-1/2 bg-[color-mix(in_srgb,var(--color-brand-glow)_55%,transparent)] md:block"></div>' +
        '<div class="w-full rounded-2xl border border-[color-mix(in_srgb,#5eead4_26%,transparent)] bg-[linear-gradient(120deg,color-mix(in_srgb,#5eead4_12%,transparent),color-mix(in_srgb,var(--color-bg-primary)_65%,transparent))] p-4 text-center">' +
        '<p class="m-0 inline-flex items-center justify-center gap-2 font-[family-name:var(--font-heading)] text-[0.55rem] font-bold uppercase tracking-[0.2em] text-[color-mix(in_srgb,#7ff5e4_88%,var(--color-text-secondary))]">' +
        '<span class="inline-flex size-8 items-center justify-center rounded-xl border border-[color-mix(in_srgb,#5eead4_24%,transparent)] bg-[color-mix(in_srgb,black_22%,transparent)] text-[0.9rem] text-[#b8fff0]">\ud83c\udfc6</span>' +
        "Winner" +
        "</p>" +
        '<p class="m-0 mt-2 text-[1.15rem] font-extrabold text-[var(--color-text-primary)]">' +
        winnerName +
        "</p>" +
        "</div>" +
        "</div>" +
        '<div class="hidden md:block"></div>' +
        "</div>" +
        "</div>" +
        "</section>";
    }

    if (bracketBtn && bracketDlg && typeof bracketDlg.showModal === "function") {
      bracketBtn.addEventListener("click", function () {
        paintBracketCapture();
        bracketDlg.showModal();
      });
    }

    if (bracketClose && bracketDlg) {
      bracketClose.addEventListener("click", function () {
        bracketDlg.close();
      });
      bracketDlg.addEventListener("click", function (e) {
        if (e.target === bracketDlg) bracketDlg.close();
      });
    }
  });
})();

