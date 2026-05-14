/**
 * FT VPN / proxy guard (client-side).
 *
 * Uses ipregistry.co JSON API (CORS-friendly). For production traffic, create a free API key at
 * https://ipregistry.co/ and set it on the script tag: data-ipregistry-key="YOUR_KEY_HERE".
 * The built-in "tryout" key is rate-limited and intended for development only.
 *
 * Limitation: pure browser checks cannot be 100% reliable; sophisticated VPNs may evade IP DBs.
 *
 * Script options (attributes on this <script> tag):
 * - data-ipregistry-key="..." — API key (default: tryout)
 * - data-on-error="allow" | "block" — if the check fails (network, quota, invalid JSON). Default allow.
 * - data-timeout-ms="12000" — fetch timeout in ms
 * - data-block-hosting="1" — also block when security.is_cloud_provider is true (more false positives)
 */
(function () {
  if (window.__FT_VPN_GUARD__) return;
  window.__FT_VPN_GUARD__ = true;

  var script =
    document.currentScript ||
    document.querySelector('script[src*="vpn-guard.js"][data-ft-vpn-guard]') ||
    document.querySelector('script[src*="vpn-guard.js"]');

  function attr(name, fallback) {
    if (!script || !script.getAttribute) return fallback;
    var v = script.getAttribute(name);
    return v === null || v === "" ? fallback : v;
  }

  var apiKey = attr("data-ipregistry-key", "tryout");
  var onError = (attr("data-on-error", "allow") || "allow").toLowerCase();
  var blockHosting = attr("data-block-hosting", "") === "1";
  var timeoutMs = parseInt(attr("data-timeout-ms", "12000"), 10);
  if (!isFinite(timeoutMs) || timeoutMs < 2000) timeoutMs = 12000;

  var OVERLAY_ID = "ft-vpn-guard-overlay";

  function ensureOverlay() {
    var el = document.getElementById(OVERLAY_ID);
    if (el) return el;
    el = document.createElement("div");
    el.id = OVERLAY_ID;
    el.setAttribute("role", "alertdialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-live", "assertive");
    el.setAttribute("aria-label", "Pemeriksaan jaringan");
    el.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:24px",
      "box-sizing:border-box",
      "background:#070707",
      "color:#e8e8e8",
      "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
      "text-align:center",
      "line-height:1.55",
    ].join(";");
    el.innerHTML =
      '<div style="max-width:28rem">' +
      '<p style="margin:0 0 10px;font-size:0.78rem;letter-spacing:0.12em;text-transform:uppercase;opacity:0.75">Keamanan</p>' +
      '<p id="' +
      OVERLAY_ID +
      '-msg" style="margin:0;font-size:1rem;font-weight:600">Memverifikasi koneksi Anda…</p>' +
      '<p style="margin:12px 0 0;font-size:0.85rem;opacity:0.78">Mohon tunggu. Jangan tutup halaman ini.</p>' +
      "</div>";
    (document.documentElement || document.body).appendChild(el);
    if (document.body) document.body.style.overflow = "hidden";
    return el;
  }

  function setMessage(html) {
    var overlay = document.getElementById(OVERLAY_ID);
    var msg = document.getElementById(OVERLAY_ID + "-msg");
    if (msg) msg.innerHTML = html;
    else if (overlay) overlay.innerHTML = html;
  }

  function removeOverlay() {
    var el = document.getElementById(OVERLAY_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
    if (document.body) document.body.style.overflow = "";
    try {
      window.dispatchEvent(new CustomEvent("ft-vpn-guard-allowed", { bubbles: true }));
    } catch (_) {}
  }

  function lockUser(reasonHtml) {
    document.documentElement.setAttribute("data-ft-vpn-locked", "1");
    ensureOverlay();
    setMessage(
      reasonHtml ||
        "Akses diblokir: koneksi terdeteksi sebagai VPN, proxy, Tor, atau jaringan anonim."
    );
    if (document.body) document.body.style.overflow = "hidden";
    try {
      window.dispatchEvent(new CustomEvent("ft-vpn-guard-blocked", { bubbles: true }));
    } catch (_) {}
  }

  function isRiskySecurity(sec) {
    if (!sec || typeof sec !== "object") return false;
    if (sec.is_vpn || sec.is_proxy || sec.is_tor || sec.is_tor_exit || sec.is_relay || sec.is_anonymous)
      return true;
    if (blockHosting && sec.is_cloud_provider) return true;
    return false;
  }

  function fetchWithTimeout(url, ms) {
    var ctrl = new AbortController();
    var id = setTimeout(function () {
      ctrl.abort();
    }, ms);
    return fetch(url, {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
      signal: ctrl.signal,
    }).finally(function () {
      clearTimeout(id);
    });
  }

  ensureOverlay();

  var url = "https://api.ipregistry.co/?key=" + encodeURIComponent(apiKey);

  fetchWithTimeout(url, timeoutMs)
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      if (!data) throw new Error("empty");
      var sec = data.security;
      if (isRiskySecurity(sec)) {
        lockUser(
          "Akses terkunci untuk halaman ini.<br><span style=\"display:block;margin-top:10px;font-weight:500;font-size:0.92rem;opacity:0.88\">Nonaktifkan VPN, proxy, Tor, atau layanan anonim, lalu muat ulang halaman.</span>"
        );
        return;
      }
      removeOverlay();
    })
    .catch(function () {
      if (onError === "block") {
        lockUser(
          "Tidak dapat memverifikasi koneksi Anda.<br><span style=\"display:block;margin-top:10px;font-weight:500;font-size:0.92rem;opacity:0.88\">Periksa internet Anda atau coba lagi nanti.</span>"
        );
      } else {
        removeOverlay();
      }
    });
})();
