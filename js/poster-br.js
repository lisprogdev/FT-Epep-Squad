(function () {
  function esc(deps, val) {
    if (deps && typeof deps.escapeHtml === "function") return deps.escapeHtml(val);
    return String(val == null ? "" : val);
  }

  function formatDateId(deps, iso) {
    if (!iso) return "—";
    try {
      var d = new Date(String(iso) + "T12:00:00");
      if (isNaN(d.getTime())) return esc(deps, iso);
      return esc(deps, d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }));
    } catch (e) {
      return esc(deps, iso);
    }
  }

  function formatTime(deps, t) {
    if (!t) return "—";
    return esc(deps, t);
  }

  function parseCurrentRankForPoster(rankStr) {
    var n = parseInt(String(rankStr || "").trim(), 10);
    return isNaN(n) || n < 1 ? 0 : n;
  }

  function posterJuaraRowClass(rankStr, rowEven) {
    var n = parseCurrentRankForPoster(rankStr);
    if (n >= 1 && n <= 3) return "br-m1-poster__tr br-m1-poster__tr--juara br-m1-poster__tr--j" + n;
    return rowEven ? "br-m1-poster__tr" : "br-m1-poster__tr br-m1-poster__tr--alt";
  }

  function buildPosterInnerHTML(deps, meta, teams) {
    meta = meta || {};
    teams = teams || [];
    var matchCount = deps && typeof deps.MATCH_COUNT === "number" ? deps.MATCH_COUNT : 1;
    var matchRankField = deps && typeof deps.matchRankField === "function" ? deps.matchRankField : function (m) { return "m" + m + "Rank"; };
    var matchKillField = deps && typeof deps.matchKillField === "function" ? deps.matchKillField : function (m) { return "m" + m + "Kill"; };
    var parseTotalPointSort = deps && typeof deps.parseTotalPointSort === "function" ? deps.parseTotalPointSort : function () { return -Infinity; };
    var computeMvTeamIndexFromKills =
      deps && typeof deps.computeMvTeamIndexFromKills === "function" ? deps.computeMvTeamIndexFromKills : function () { return ""; };
    var resolveTeamDisplayName =
      deps && typeof deps.resolveTeamDisplayName === "function" ? deps.resolveTeamDisplayName : function (n) { return String(n || "—"); };
    var teamKillTotalFromData =
      deps && typeof deps.teamKillTotalFromData === "function" ? deps.teamKillTotalFromData : function () { return 0; };
    var emptyTeam = deps && typeof deps.emptyTeam === "function" ? deps.emptyTeam : function () { return {}; };
    var currentRankField = deps && deps.CURRENT_MATCH_RANK_FIELD ? String(deps.CURRENT_MATCH_RANK_FIELD) : "m1Rank";
    var matchLabelShort = deps && deps.MATCH_LABEL_SHORT != null ? String(deps.MATCH_LABEL_SHORT) : "";

    var title = meta.tournamentName ? esc(deps, meta.tournamentName) : "Turnamen";
    var season = meta.season ? esc(deps, meta.season) : "—";
    var when = formatDateId(deps, meta.playDate);
    var sess = meta.sessionNumber ? esc(deps, meta.sessionNumber) : "—";
    var tm = formatTime(deps, meta.playTime);
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
        '<p class="br-m1-poster__mv-kicker">Kill terbanyak · ' +
        esc(deps, matchLabelShort) +
        "</p>" +
        '<p class="br-m1-poster__mv-label">MVP Team</p>' +
        '<p class="br-m1-poster__mv-name">' +
        esc(deps, mvDisp) +
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

    var matchHeaderMain = [];
    var matchHeaderSub = [];
    for (var mh = 1; mh <= matchCount; mh++) {
      matchHeaderMain.push('<th colspan="2" class="br-m1-poster__th br-m1-poster__th--match">' + esc(deps, "Match " + mh) + "</th>");
      matchHeaderSub.push(
        '<th class="br-m1-poster__th br-m1-poster__th--sub">Rank</th>' +
          '<th class="br-m1-poster__th br-m1-poster__th--sub">Kill</th>'
      );
    }

    var rows = [];
    for (var j = 0; j < order.length; j++) {
      var r = order[j].team;
      var slotNum = order[j].slot;
      var trClass = posterJuaraRowClass(r[currentRankField], j % 2 === 0);
      var rowName = resolveTeamDisplayName(r.teamName, slotNum);
      var rowMatchCells = [];
      for (var rm = 1; rm <= matchCount; rm++) {
        rowMatchCells.push(
          '<td class="br-m1-poster__td br-m1-poster__td--rk">' +
            esc(deps, r[matchRankField(rm)]) +
            '</td><td class="br-m1-poster__td br-m1-poster__td--k">' +
            esc(deps, r[matchKillField(rm)]) +
            "</td>"
        );
      }
      rows.push(
        '<tr class="' +
          trClass +
          '">' +
          '<td class="br-m1-poster__td br-m1-poster__td--no">' +
          (j + 1) +
          '</td><td class="br-m1-poster__td br-m1-poster__td--name">' +
          esc(deps, rowName) +
          "</td>" +
          rowMatchCells.join("") +
          '<td class="br-m1-poster__td br-m1-poster__td--tk">' +
          esc(deps, r.totalKill) +
          '</td><td class="br-m1-poster__td br-m1-poster__td--pt">' +
          esc(deps, r.totalPoint) +
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
      esc(deps, matchLabelShort) +
      " · Battle Royale</p>" +
      '<div class="br-m1-poster__table-wrap">' +
      '<table class="br-m1-poster__table">' +
      "<thead>" +
      "<tr>" +
      '<th rowspan="2" class="br-m1-poster__th">No</th>' +
      '<th rowspan="2" class="br-m1-poster__th br-m1-poster__th--name">Nama team</th>' +
      matchHeaderMain.join("") +
      '<th rowspan="2" class="br-m1-poster__th">Total kill</th>' +
      '<th rowspan="2" class="br-m1-poster__th">Total point</th>' +
      "</tr><tr>" +
      matchHeaderSub.join("") +
      "</tr></thead>" +
      "<tbody>" +
      rows.join("") +
      "</tbody></table></div>" +
      '<p class="br-m1-poster__footer">Fast tournament · roster resmi</p>' +
      mvBlock
    );
  }

  function getPosterExportPixelRatio() {
    var d = typeof window !== "undefined" ? window.devicePixelRatio : 1;
    var x = typeof d === "number" && d > 0 ? d : 1;
    return Math.min(4, Math.max(2, x));
  }

  function getPosterLayoutWidthPx(matchCount) {
    var base = 720;
    var extraPerMatch = 220;
    var w = base + Math.max(0, (matchCount || 1) - 1) * extraPerMatch;
    return Math.min(1280, w);
  }

  var g = typeof window !== "undefined" ? window : {};
  g.ftBrPoster = g.ftBrPoster || {};
  g.ftBrPoster.buildPosterInnerHTML = buildPosterInnerHTML;
  g.ftBrPoster.getPosterExportPixelRatio = getPosterExportPixelRatio;
  g.ftBrPoster.getPosterLayoutWidthPx = getPosterLayoutWidthPx;
})();
