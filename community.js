/* KUKA MUSIC - choix du profil, communauté, idées, modération côté membre */
(function () {
  var K = window.KUKA; if (!K) return;
  var sb = K.sb, e = K.e, toast = K.toast, ROLE = K.role(), ct = "post", exp = {}, rt = {};
  var st = document.createElement("style");
  st.textContent = "nav button{font-size:11px!important}.rl{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.tg2{font-size:11px;padding:1px 8px;border-radius:999px;background:var(--ln);color:var(--mu)}.pc{background:var(--sf);border-radius:14px;padding:12px;margin:10px 0}.pc p{margin:6px 0;white-space:pre-wrap;overflow-wrap:anywhere}.ab{padding:6px 10px;border-radius:999px;color:var(--mu);font-size:14px}.ab.on{color:var(--ac)}" +
    (ROLE === "artist" ? ".player{display:none!important}body{padding-bottom:90px!important}nav button[data-v=search],nav button[data-v=fav],nav button[data-v=lists]{display:none}" : "");
  document.head.appendChild(st);
  if (!ROLE) {
    var o = document.createElement("div");
    o.style.cssText = "position:fixed;inset:0;z-index:60;background:var(--bg);color:var(--tx);display:flex;align-items:center;justify-content:center;padding:24px;text-align:center";
    o.innerHTML = '<div style="max-width:380px"><h1 style="margin:0 0 6px">Bienvenue sur KUKA MUSIC</h1><p class="tag">Choisis ton profil. Il sera fixé à la création de ton compte.</p><button class="bt" style="display:block;width:100%;margin:12px 0;border-radius:18px" data-r="listener">🎧 Auditeur<br><small>Écouter gratuitement et participer</small></button><button class="bt g" style="display:block;width:100%;border-radius:18px" data-r="artist">🎤 Artiste<br><small>Publier et gérer ma musique</small></button></div>';
    document.body.appendChild(o);
    o.addEventListener("click", function (ev) { var b = ev.target.closest("[data-r]"); if (b) { try { localStorage.setItem("kuka-role", b.dataset.r); } catch (x) {} location.reload(); } });
  }
  var nav = document.querySelector("nav"), cb = document.createElement("button");
  cb.dataset.v = "comm"; cb.textContent = "Communauté";
  nav.insertBefore(cb, nav.querySelector('[data-v="me"]'));
  cb.onclick = function () { document.querySelectorAll("nav button").forEach(function (x) { x.classList.toggle("on", x === cb); }); view = "comm"; render(); };
  var _p = window.render;
  window.render = function () {
    if (ROLE === "artist" && ["search", "fav", "lists"].indexOf(view) >= 0) view = "home";
    if (view === "comm") { draw(); return; }
    if (ROLE === "artist" && view === "home") { hub(); return; }
    _p.apply(this, arguments);
  };
  function hub() {
    document.getElementById("main").innerHTML = '<h2>🎤 Espace artiste</h2><div class="pl" data-art="open" style="cursor:pointer;border:1px solid var(--ac)"><b>Mon espace artiste</b><p class="tag" style="margin:2px 0 0">Profil, chansons, statistiques, revenus et paiements.</p></div><div class="pl" data-go="comm" style="cursor:pointer"><b>Communauté</b><p class="tag" style="margin:2px 0 0">Échange avec les auditeurs et les autres artistes.</p></div>';
  }
  var cnt = function (a) { return a && a[0] ? a[0].count : 0; };
  function composer() {
    return ct === "post" ? '<div class="pc"><textarea class="in" id="cb" maxlength="1000" placeholder="Partage quelque chose avec la communauté…" style="border-radius:16px;min-height:80px"></textarea><button class="bt" data-c="pub">Publier</button></div>' :
      '<div class="pc"><select class="in" id="cg"><option>Collaboration</option><option>Idée de chanson</option><option>Style musical</option><option>Projet / défi</option><option>Amélioration de KUKA MUSIC</option></select><input class="in" id="ctt" maxlength="100" placeholder="Titre de ta proposition"><textarea class="in" id="cb" maxlength="1000" placeholder="Décris ton idée…" style="border-radius:16px;min-height:80px"></textarea><button class="bt" data-c="pub">Proposer</button></div>';
  }
  function card(x, liked, me) {
    var a = x.members || {};
    return '<div class="pc"><div class="rl"><b>' + e(a.display_name || "Membre") + '</b><span class="tg2">' + (a.role === "artist" ? "Artiste" : "Auditeur") + '</span>' + (x.kind === "idea" ? '<span class="tg2">' + e(x.category || "Idée") + '</span>' : '') + '<small class="tag" style="margin-left:auto">' + e(x.created_at.slice(0, 10)) + '</small></div>' +
      (x.title ? '<b>' + e(x.title) + '</b>' : '') + '<p>' + e(x.body) + '</p><div class="rl"><button class="ab' + (liked ? " on" : "") + '" data-c="like" data-id="' + x.id + '">' + (x.kind === "idea" ? "▲ Voter " : "♥ ") + cnt(x.likes) + '</button><button class="ab" data-c="cm" data-id="' + x.id + '">💬 ' + cnt(x.comments) + '</button><button class="ab" data-c="share" data-id="' + x.id + '" data-t="' + e(x.title || x.body.slice(0, 60)) + '">↗</button>' +
      (me && me.id !== x.author_id ? '<button class="ab" data-c="fol" data-id="' + x.author_id + '">Suivre</button><button class="ab" data-c="rep" data-t="post" data-id="' + x.id + '" aria-label="Signaler">⚑</button><button class="ab" data-c="blk" data-id="' + x.author_id + '" aria-label="Bloquer">⛔</button>' : '') +
      (me && me.id === x.author_id ? '<button class="ab" data-c="del" data-id="' + x.id + '" aria-label="Supprimer">🗑</button>' : '') + '</div><div id="c' + x.id + '"></div></div>';
  }
  async function draw() {
    var m = document.getElementById("main"), me = K.me();
    if (!K.OK) { m.innerHTML = '<div class="pl"><b>Communauté</b><p class="tag">Le service en ligne n’est pas encore configuré (voir GUIDE.md).</p></div>'; return; }
    var h = '<div class="rl" style="margin:8px 0"><button class="bt' + (ct === "post" ? "" : " g") + '" data-c="tab" data-k="post">Fil</button><button class="bt' + (ct === "idea" ? "" : " g") + '" data-c="tab" data-k="idea">Idées</button></div>' +
      (me ? composer() : '<div class="pc"><b>Participe à la communauté</b><p class="tag">Connecte-toi pour publier, aimer, commenter et voter.</p><button class="bt" data-art="open">Se connecter</button></div>');
    m.innerHTML = h + '<p class="empty">Chargement…</p>';
    var r = await sb.from("posts").select("id,kind,category,title,body,created_at,author_id,members(display_name,role),likes(count),comments(count)").eq("kind", ct).order("created_at", { ascending: false }).limit(40);
    if (view !== "comm") return;
    if (r.error) { m.innerHTML = h + '<p class="err">Erreur : ' + e(r.error.message) + '</p>'; return; }
    var L = r.data || [], mine = {};
    if (me && L.length) { var l = await sb.from("likes").select("post_id").eq("user_id", me.id).in("post_id", L.map(function (x) { return x.id; })); (l.data || []).forEach(function (x) { mine[x.post_id] = 1; }); }
    if (view !== "comm") return;
    if (ct === "idea") L.sort(function (a, b) { return cnt(b.likes) - cnt(a.likes); });
    m.innerHTML = h + (L.length ? L.map(function (x) { return card(x, mine[x.id], me); }).join("") : '<p class="empty">Rien pour l’instant. Sois le premier !</p>');
    L.forEach(function (x) { if (exp[x.id]) loadC(x.id); });
  }
  async function loadC(pid) {
    var box = document.getElementById("c" + pid); if (!box) return;
    var r = await sb.from("comments").select("id,parent_id,body,created_at,author_id,members(display_name,role)").eq("post_id", pid).order("created_at"), L = r.data || [], me = K.me();
    function one(c, sub) {
      var a = c.members || {};
      return '<div style="margin:8px 0 0 ' + (sub ? "18px" : "0") + ';padding-left:8px;border-left:2px solid var(--ln)"><b>' + e(a.display_name || "Membre") + '</b> <span class="tg2">' + (a.role === "artist" ? "Artiste" : "Auditeur") + '</span><p>' + e(c.body) + '</p>' +
        (me ? '<button class="ab" data-c="reply" data-pid="' + pid + '" data-id="' + (c.parent_id || c.id) + '">Répondre</button>' + (me.id !== c.author_id ? '<button class="ab" data-c="rep" data-t="comment" data-id="' + c.id + '" aria-label="Signaler">⚑</button>' : '') : '') + '</div>';
    }
    box.innerHTML = L.filter(function (c) { return !c.parent_id; }).map(function (c) { return one(c, 0) + L.filter(function (s) { return s.parent_id === c.id; }).map(function (s) { return one(s, 1); }).join(""); }).join("") +
      (me ? '<div class="rl" style="margin-top:8px"><input class="in" id="ci' + pid + '" maxlength="500" placeholder="Ajouter un commentaire…" style="flex:1"><button class="bt" data-c="send" data-id="' + pid + '">Envoyer</button></div>' : '<p class="tag">Connecte-toi pour commenter.</p>');
  }
  var V = function (id) { var x = document.getElementById(id); return x ? x.value.trim() : ""; };
  document.addEventListener("click", async function (ev) {
    var g = ev.target.closest("[data-go]"); if (g) { var nb = document.querySelector('nav [data-v="' + g.dataset.go + '"]'); if (nb) nb.click(); return; }
    var b = ev.target.closest("[data-c]"); if (!b) return;
    var a = b.dataset.c, id = b.dataset.id, me = K.me();
    if (a === "tab") { ct = b.dataset.k; return draw(); }
    if (a === "share") {
      var u = location.href.split("#")[0], t = "KUKA MUSIC : " + b.dataset.t;
      if (navigator.share) { try { await navigator.share({ title: "KUKA MUSIC", text: t, url: u }); } catch (x) {} } else { try { await navigator.clipboard.writeText(t + " " + u); toast("Lien copié"); } catch (x) { toast(u); } }
      return;
    }
    if (a === "cm") { exp[id] = !exp[id]; var bx = document.getElementById("c" + id); if (exp[id]) loadC(id); else if (bx) bx.innerHTML = ""; return; }
    if (!me) return K.login();
    try {
      if (a === "pub") {
        var d = { author_id: me.id, kind: ct, body: V("cb") }; if (ct === "idea") { d.title = V("ctt"); d.category = V("cg"); }
        if (d.body.length < 2) return toast("Écris au moins 2 caractères."); if (ct === "idea" && d.title.length < 3) return toast("Ajoute un titre (3 caractères minimum).");
        var r = await sb.from("posts").insert(d); if (r.error) return toast(r.error.message); draw();
      } else if (a === "like") {
        if (b.classList.contains("on")) await sb.from("likes").delete().eq("post_id", id).eq("user_id", me.id); else { var l = await sb.from("likes").insert({ post_id: id, user_id: me.id }); if (l.error) return toast(l.error.message); }
        draw();
      } else if (a === "reply") { rt[b.dataset.pid] = id; var ip = document.getElementById("ci" + b.dataset.pid); if (ip) { ip.placeholder = "Ta réponse…"; ip.focus(); }
      } else if (a === "send") {
        var bd = V("ci" + id); if (!bd) return; var c = await sb.from("comments").insert({ post_id: id, author_id: me.id, parent_id: rt[id] || null, body: bd });
        if (c.error) return toast(c.error.message); rt[id] = null; exp[id] = true; draw();
      } else if (a === "fol") {
        var f = await sb.from("follows").select("followee_id").eq("follower_id", me.id).eq("followee_id", id);
        if ((f.data || []).length) { await sb.from("follows").delete().eq("follower_id", me.id).eq("followee_id", id); toast("Désabonné"); } else { var i = await sb.from("follows").insert({ follower_id: me.id, followee_id: id }); toast(i.error ? i.error.message : "Abonné ✓"); }
      } else if (a === "rep") {
        var re = prompt("Motif du signalement (spam, insulte, abus…) ?"); if (!re || re.trim().length < 3) return;
        var q2 = await sb.from("community_reports").insert({ target_type: b.dataset.t, target_id: id, reporter_id: me.id, reason: re.trim().slice(0, 500) }); toast(q2.error ? q2.error.message : "Signalement envoyé. Merci.");
      } else if (a === "blk") {
        if (!confirm("Bloquer ce membre ? Tu ne verras plus ses publications.")) return;
        var k = await sb.from("blocks").insert({ blocker_id: me.id, blocked_id: id }); toast(k.error ? k.error.message : "Membre bloqué"); draw();
      } else if (a === "del") { if (confirm("Supprimer ta publication ?")) { await sb.from("posts").delete().eq("id", id); draw(); } }
    } catch (x) { toast("Erreur : " + x.message); }
  });
  render();
})();
