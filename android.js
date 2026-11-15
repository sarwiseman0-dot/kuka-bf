(function () {
  var P = window.Capacitor && window.Capacitor.Plugins, A = P && P.App;
  function toast(m) {
    var d = document.createElement("div");
    d.textContent = m;
    d.style.cssText = "position:fixed;left:50%;bottom:150px;transform:translateX(-50%);background:#ff5d73;color:#fff;padding:10px 16px;border-radius:999px;z-index:99;font:600 14px system-ui;max-width:88%;text-align:center";
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 3500);
  }
  window.addEventListener("offline", function () { toast("Hors connexion : tes musiques importées restent disponibles"); });
  window.addEventListener("online", function () { toast("Connexion rétablie"); });
  try { if (window.au) window.au.addEventListener("error", function () { toast("Impossible de lire ce fichier audio"); }); } catch (e) {}
  if (A && A.addListener) {
    A.addListener("backButton", function () {
      var ad = document.getElementById("ad");
      if (ad && ad.classList.contains("on")) return;
      var sh = document.getElementById("sheet");
      if (sh && sh.classList.contains("on")) { sh.classList.remove("on"); return; }
      if (typeof view !== "undefined" && view !== "home") {
        var b = document.querySelector('nav button[data-v="home"]');
        if (b) { b.click(); return; }
      }
      A.minimizeApp();
    });
  }
})();
