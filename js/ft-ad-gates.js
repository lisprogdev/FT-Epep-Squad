/**
 * Modal iklan untuk preview (hero-cta-gate) dan unduhan (br-match1-download-gate-dialog).
 * Dipakai halaman Clash Squad dan lainnya yang memakai markup ID yang sama dengan BR match.
 */
(function () {
  function $(id) {
    return document.getElementById(id);
  }

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
    var inv = document.createElement("script");
    inv.async = true;
    inv.setAttribute("data-cfasync", "false");
    inv.src = "https://performanceingredientgoblet.com/02ad4c20f6520397f8dd0da3a374ae68/invoke.js";
    wrap.appendChild(inv);
    var ctr = document.createElement("div");
    ctr.id = "container-02ad4c20f6520397f8dd0da3a374ae68";
    wrap.appendChild(ctr);
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
      if (typeof proceedFn === "function") proceedFn();
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
    gateAck.addEventListener("change", updateGateUi);
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
  var DL_AD_URL = "https://performanceingredientgoblet.com/angtq6ey?key=40a62c67960666e3277ffb4d5b2ebbbd";

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
      if (!DL_AD_URL) {
        if (dlGateStatus) dlGateStatus.textContent = "Iklan dinonaktifkan.";
        return;
      }
      var w = window.open("about:blank", "_blank");
      if (!w) {
        if (dlGateStatus) {
          dlGateStatus.textContent = "Popup diblokir browser. Izinkan popup, lalu klik lagi tombol buka iklan.";
        }
        return;
      }
      try {
        w.location.href = DL_AD_URL;
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

  window.ftOpenGateForPreview = openGateForPreview;
  window.ftOpenDownloadAdGate = openDownloadAdGate;
})();
