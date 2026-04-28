(function () {
  function esc(deps, val) {
    if (deps && typeof deps.escapeHtml === "function") return deps.escapeHtml(val);
    return String(val == null ? "" : val);
  }

  function formatTime(deps, t) {
    if (!t) return "—";
    return esc(deps, t);
  }

  function formatDateLongId(deps, iso) {
    if (!iso) return "—";
    try {
      var d = new Date(String(iso) + "T12:00:00");
      if (isNaN(d.getTime())) return esc(deps, iso);
      return esc(
        deps,
        d.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    } catch (e) {
      return esc(deps, iso);
    }
  }

  function certPositionTitleId(kindKey, rankNum) {
    if (kindKey === "mvp") return "MVP";
    if (rankNum === 1) return "Champion";
    if (rankNum === 2) return "Runner-up";
    if (rankNum === 3) return "Third Place";
    return "—";
  }

  function certAchievementTextId(deps, kindKey, rankNum, tournamentRaw) {
    var tn = String(tournamentRaw || "").trim() || "turnamen";
    var matchEventLabel = deps && deps.MATCH_EVENT_LABEL != null ? String(deps.MATCH_EVENT_LABEL) : "match";
    if (kindKey === "mvp") {
      return (
        "Diberikan atas prestasi tim dengan total eliminasi tertinggi pada " +
        matchEventLabel +
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
      matchEventLabel +
      ' dalam rangka "' +
      tn +
      "\"."
    );
  }

  function certThanksTextId(deps, tournamentRaw, seasonRaw, playDateIso) {
    var tn = String(tournamentRaw || "").trim() || "turnamen ini";
    var ss = String(seasonRaw || "").trim();
    var dateTxt = formatDateLongId(deps, playDateIso);
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

  function buildCertificateSerial(deps, kindKey, meta, slotNum) {
    var digitsOnly = deps && typeof deps.digitsOnly === "function" ? deps.digitsOnly : function (s) { return String(s || "").replace(/\D/g, ""); };
    var pad2 = deps && typeof deps.pad2 === "function" ? deps.pad2 : function (n) { return (n < 10 ? "0" : "") + n; };
    var matchNo = deps && deps.MATCH_NO != null ? String(deps.MATCH_NO) : "1";
    var dPart = "00000000";
    if (meta && meta.playDate) {
      var dg = digitsOnly(meta.playDate);
      if (dg.length >= 8) dPart = dg.slice(0, 8);
      else {
        try {
          var d = new Date(String(meta.playDate) + "T12:00:00");
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
    var n = typeof slotNum === "number" && slotNum > 0 ? slotNum : parseInt(String(slotNum || ""), 10);
    var sl = !isNaN(n) && n > 0 ? ("000" + n).slice(-3) : "000";
    return "FT-BR-M" + matchNo + "-" + k + "-" + dPart + "-S" + ses + "-" + sl;
  }

  function parseCurrentRankForPoster(rankStr) {
    var n = parseInt(String(rankStr || "").trim(), 10);
    return isNaN(n) || n < 1 ? 0 : n;
  }

  function findTeamByCurrentMatchRank(deps, teams, rankN) {
    if (!teams || !teams.length) return null;
    var currentRankField = deps && deps.CURRENT_MATCH_RANK_FIELD ? String(deps.CURRENT_MATCH_RANK_FIELD) : "m1Rank";
    var emptyTeam = deps && typeof deps.emptyTeam === "function" ? deps.emptyTeam : function () { return {}; };
    for (var i = 0; i < teams.length; i++) {
      var n = parseInt(String((teams[i] || {})[currentRankField] || "").trim(), 10);
      if (n === rankN) return { slot: i + 1, team: teams[i] || emptyTeam() };
    }
    return null;
  }

  function wrapCertSlot(deps, kindKey, tierLabel, articleHtml) {
    var k = esc(deps, kindKey);
    var lbl = esc(deps, tierLabel);
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

  function certArticleEmpty(deps, kindKey, tierLabel, hintLine, positionLabel) {
    var matchTag = deps && deps.MATCH_TAG_BR != null ? String(deps.MATCH_TAG_BR) : "BR";
    var mvpCls = kindKey === "mvp" ? " br-m1-cert--mvp" : "";
    var posEsc = esc(deps, positionLabel || "—");
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
      esc(deps, tierLabel) +
      '</p><div class="br-m1-cert__aside-ico br-m1-cert__aside-ico--dim"><i class="fa-solid fa-lock" aria-hidden="true"></i></div>' +
      '<span class="br-m1-cert__aside-tag">' +
      esc(deps, matchTag) +
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
      esc(deps, hintLine) +
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

  function certArticleFilled(deps, opts) {
    opts = opts || {};
    var kindKey = opts.kindKey;
    var iconClass = opts.iconClass;
    var tierLabel = opts.tierLabel;
    var matchTag = deps && deps.MATCH_TAG_BR != null ? String(deps.MATCH_TAG_BR) : "BR";
    var matchLabel = opts.matchLabel != null ? String(opts.matchLabel) : deps && deps.MATCH_LABEL_BR != null ? String(deps.MATCH_LABEL_BR) : "Battle Royale";
    var tournamentName =
      opts.tournamentName != null && String(opts.tournamentName).trim() !== ""
        ? String(opts.tournamentName).trim()
        : "—";
    var participantName = opts.participantName || "—";
    var positionTitle = opts.positionTitle || "—";
    var thanksEsc = esc(deps, certThanksTextId(deps, tournamentName, opts.season, opts.playDateIso));
    var sessRaw = opts.sessionNumber != null && String(opts.sessionNumber).trim() !== "" ? String(opts.sessionNumber).trim() : "";
    var sessionDisp = sessRaw !== "" ? esc(deps, sessRaw) : "—";
    var timeDisp = formatTime(deps, opts.playTime);
    var achievementEsc = esc(deps, opts.achievementText || "");
    var serialEsc = esc(deps, opts.serialRaw || "");
    var organizerEsc = esc(deps, opts.organizerName != null ? String(opts.organizerName) : "FT Epep Squad");
    var matchLabelEsc = esc(deps, matchLabel);
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
      esc(deps, tierLabel) +
      '</p><div class="br-m1-cert__aside-ico"><i class="' +
      iconClass +
      '" aria-hidden="true"></i></div>' +
      '<span class="br-m1-cert__aside-tag">' +
      esc(deps, matchTag) +
      "</span></div></aside>" +
      '<div class="br-m1-cert__body">' +
      '<p class="br-m1-cert__brand">Fast Tournament · FT Epep Squad</p>' +
      '<p class="br-m1-cert__event">' +
      esc(deps, tournamentName) +
      "</p>" +
      '<div class="br-m1-cert__focus">' +
      '<h2 class="br-m1-cert__title">Certifikat Of Achievement</h2>' +
      '<p class="br-m1-cert__presented">Diberikan kepada</p>' +
      '<p class="br-m1-cert__winner">' +
      esc(deps, participantName) +
      "</p>" +
      '<p class="br-m1-cert__as">Sebagai</p>' +
      '<p class="br-m1-cert__position">' +
      esc(deps, positionTitle) +
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
      matchLabelEsc +
      " · Sesi " +
      sessionDisp +
      " · " +
      timeDisp +
      "</p></div></article>"
    );
  }

  function buildCertificatesHTML(deps, meta, teams) {
    meta = meta || {};
    teams = teams || [];
    var resolveTeamDisplayName =
      deps && typeof deps.resolveTeamDisplayName === "function" ? deps.resolveTeamDisplayName : function (n) { return String(n || "—"); };
    var computeMvTeamIndexFromKills =
      deps && typeof deps.computeMvTeamIndexFromKills === "function" ? deps.computeMvTeamIndexFromKills : function () { return ""; };
    var teamKillTotalFromData =
      deps && typeof deps.teamKillTotalFromData === "function" ? deps.teamKillTotalFromData : function () { return 0; };
    var emptyTeam = deps && typeof deps.emptyTeam === "function" ? deps.emptyTeam : function () { return {}; };
    var matchLabelBr = deps && deps.MATCH_LABEL_BR != null ? String(deps.MATCH_LABEL_BR) : "Battle Royale";

    var eventRaw = meta.tournamentName || "";
    var parts = [];

    function pushPlacement(rankNum, kindKey, iconClass, tierText) {
      var hit = findTeamByCurrentMatchRank(deps, teams, rankNum);
      if (!hit) {
        parts.push(
          wrapCertSlot(
            deps,
            kindKey,
            tierText,
            certArticleEmpty(deps, kindKey, tierText, "RANK #" + rankNum + " · BELUM TERISI", certPositionTitleId(kindKey, rankNum))
          )
        );
        return;
      }
      var nm = resolveTeamDisplayName(hit.team.teamName, hit.slot);
      parts.push(
        wrapCertSlot(
          deps,
          kindKey,
          tierText,
          certArticleFilled(deps, {
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
            achievementText: certAchievementTextId(deps, kindKey, rankNum, eventRaw),
            serialRaw: buildCertificateSerial(deps, kindKey, meta, hit.slot),
            organizerName: "FT Epep Squad",
            matchLabel: matchLabelBr,
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
        wrapCertSlot(
          deps,
          "mvp",
          "MVP",
          certArticleEmpty(deps, "mvp", "MVP", "Data MVP belum tersedia (kill tim).", certPositionTitleId("mvp", 0))
        )
      );
    } else {
      var t = teams[mvIx - 1] || emptyTeam();
      var mvName = resolveTeamDisplayName(t.teamName, mvIx);
      var kills = teamKillTotalFromData(t);
      parts.push(
        wrapCertSlot(
          deps,
          "mvp",
          "MVP",
          certArticleFilled(deps, {
            kindKey: "mvp",
            iconClass: "fa-solid fa-crosshairs",
            tierLabel: "MVP",
            tournamentName: eventRaw,
            season: meta.season,
            participantName: mvName,
            positionTitle: certPositionTitleId("mvp", 0),
            playDateIso: meta.playDate,
            sessionNumber: meta.sessionNumber,
            playTime: meta.playTime,
            achievementText: certAchievementTextId(deps, "mvp", 0, eventRaw) + " Total kill tim: " + kills + ".",
            serialRaw: buildCertificateSerial(deps, "mvp", meta, mvIx),
            organizerName: "FT Epep Squad",
            matchLabel: matchLabelBr,
          })
        )
      );
    }

    return parts.join("");
  }

  function getCertA4LandscapePx() {
    return { w: 1123, h: 794 };
  }

  function certFileSlugFromKind(kind) {
    var k = String(kind || "");
    if (k === "j1") return "top-1";
    if (k === "j2") return "top-2";
    if (k === "j3") return "top-3";
    if (k === "mvp") return "mvp";
    return k ? k : "cert";
  }

  var g = typeof window !== "undefined" ? window : {};
  g.ftBrCertificate = g.ftBrCertificate || {};
  g.ftBrCertificate.buildCertificatesHTML = buildCertificatesHTML;
  g.ftBrCertificate.getCertA4LandscapePx = getCertA4LandscapePx;
  g.ftBrCertificate.certFileSlugFromKind = certFileSlugFromKind;
  g.ftBrCertificate.buildCertificateSerial = buildCertificateSerial;
  g.ftBrCertificate.parseCurrentRankForPoster = parseCurrentRankForPoster;
})();
