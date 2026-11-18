/* KUKA MUSIC - Espace artiste + catalogue public (Supabase) */
(function () {
  var C = window.KUKA_CONFIG || {};
  var OK = !!(C.url && C.anonKey && C.url.indexOf("COLLE") < 0 && window.supabase);
  var sb = OK ? window.supabase.createClient(C.url, C.anonKey) : null;
  var GN = ["Afrobeats", "Rap / Hip-hop", "R&B / Soul", "Pop", "Reggae / Dancehall", "Coupé-décalé", "Gospel", "Rock", "Électro", "Jazz", "Traditionnel", "Autre"];
  var IMG = ["image/jpeg", "image/png", "image/webp"];
  var ME = null, MEM = null, PR = null, MY = [], CAT = [], tab = "songs", flt = "all";
  function role() { try { return localStorage.getItem("kuka-role"); } catch (x) { return null; } }
  var q = function (s) { return document.querySelector(s); };
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function url(u) { return /^https?:\/\//i.test(u || "") ? u : ""; }
  function val(id) { var x = q("#" + id); return x ? x.value.trim() : ""; }
  function msg(id, m) { var x = q("#" + id); if (x) x.textContent = m; }
  function busy(id, on, t) { var b = q("#" + id); if (b) { b.disabled = on; if (t) b.textContent = t; } }
  function toast(m) {
    var d = document.createElement("div"); d.textContent = m;
    d.style.cssText = "position:fixed;left:50%;top:70px;transform:translateX(-50%);background:#ff5d73;color:#fff;padding:10px 16px;border-radius:999px;z-index:99;font-weight:600;max-width:90%;text-align:center";
    document.body.appendChild(d); setTimeout(function () { d.remove(); }, 4000);
  }
  var st = document.createElement("style");
  st.textContent = ".lb{display:block;margin:10px 4px 2px;font-size:13px;color:var(--mu)}textarea.in{border-radius:16px;min-height:90px}.bd{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600}.bd.pending{background:#f2a90033;color:var(--ac2)}.bd.approved{background:#2ecc7133;color:#2ecc71}.bd.rejected,.bd.removed{background:#ff5d7333;color:var(--ac)}.av{flex:none;width:72px;height:72px;border-radius:50%;background:var(--sf) center/cover}.err{color:var(--ac);padding:4px}.ck{display:flex;gap:10px;align-items:flex-start;margin:12px 4px;font-size:14px}.ck input{margin-top:3px}";
  document.head.appendChild(st);
  var ov = document.createElement("div");
  ov.style.cssText = "display:none;position:fixed;inset:0;z-index:4;overflow:auto;background:var(--bg);color:var(--tx);padding:calc(16px + env(safe-area-inset-top,0px)) 14px 270px";
  document.body.appendChild(ov);
  function show(h) { ov.style.display = "block"; ov.innerHTML = '<div style="max-width:720px;margin:auto"><button class="bt g" data-art="close">← Retour</button>' + h + '</div>'; ov.scrollTop = 0; }
  function loading() { show('<p class="empty">Chargement…</p>'); }
  function fld(l, id, v, a) { return '<label class="lb" for="' + id + '">' + l + '</label><input class="in" id="' + id + '" value="' + e(v) + '" ' + (a || "") + '>'; }
  function opts(list, cur) { return list.map(function (g) { return '<option' + (g === cur ? " selected" : "") + '>' + e(g) + '</option>'; }).join(""); }
  async function sign(b, paths) {
    var m = {}; if (!paths.length) return m;
    var r = await sb.storage.from(b).createSignedUrls(paths, 21600);
    (r.data || []).forEach(function (x) { if (x.signedUrl) m[x.path] = x.signedUrl; });
    return m;
  }
  function avatar(p) { return p ? sb.storage.from("avatars").getPublicUrl(p).data.publicUrl : ""; }

  /* ---------- Connexion ---------- */
  function need() { show('<h2>Espace artiste</h2><div class="pl"><p>Le service en ligne n’est pas encore configuré. Ajoute l’URL et la clé publique Supabase dans <b>config.js</b> (voir GUIDE.md).</p></div>'); }
  async function entry() {
    if (!OK) return need();
    loading();
    var s = await sb.auth.getSession(); ME = s.data.session ? s.data.session.user : null; route();
  }
  function authView(m) {
    show('<h2>Espace artiste</h2><p class="tag">Publie ta musique sur KUKA MUSIC : gratuit et ouvert à tous les artistes.</p><div class="pl"><input class="in" id="an" placeholder="Pseudo (pour l’inscription)" maxlength="40"><input class="in" id="ae" type="email" placeholder="E-mail" autocomplete="email"><input class="in" id="ap" type="password" placeholder="Mot de passe (8 caractères minimum)" autocomplete="current-password"><button class="bt" id="bl" data-art="login">Se connecter</button><button class="bt g" data-art="signup">Créer un compte artiste</button><p class="err" id="am">' + e(m || "") + '</p></div>');
  }
  async function login() {
    var em = val("ae"), pw = q("#ap").value;
    if (!em || pw.length < 8) return msg("am", "E-mail et mot de passe (8 caractères minimum) requis.");
    busy("bl", true);
    var r = await sb.auth.signInWithPassword({ email: em, password: pw });
    if (r.error) { busy("bl", false); return msg("am", "Connexion impossible : " + r.error.message); }
    ME = r.data.user; route();
  }
  async function signup() {
    var em = val("ae"), pw = q("#ap").value;
    if (!em || pw.length < 8) return msg("am", "E-mail et mot de passe (8 caractères minimum) requis.");
    if (val("an").length < 2) return msg("am", "Choisis un pseudo (2 caractères minimum) pour t’inscrire.");
    var r = await sb.auth.signUp({ email: em, password: pw, options: { emailRedirectTo: location.origin + location.pathname, data: { display_name: val("an") } } });
    if (r.error) return msg("am", "Inscription impossible : " + r.error.message);
    if (r.data.session) { ME = r.data.user; route(); } else msg("am", "Compte créé. Vérifie ta boîte e-mail pour confirmer, puis connecte-toi.");
  }
  async function route() {
    if (!ME) return authView();
    loading();
    var mm = await ensureMember(); if (mm.error) return show('<p class="err">Erreur : ' + e(mm.error) + '</p>');
    if (MEM.role === "listener") return listenerView();
    var r = await sb.from("profiles").select("*").eq("id", ME.id).maybeSingle();
    if (r.error) return show('<p class="err">Erreur : ' + e(r.error.message) + '</p>');
    PR = r.data; if (!PR) return profileForm(false);
    var p = await sb.from("artist_private").select("contact_email").eq("user_id", ME.id).maybeSingle();
    PR.contact_email = p.data ? p.data.contact_email : "";
    await mySongs(); dash();
  }
  async function mySongs() {
    var r = await sb.from("songs").select("*").eq("artist_id", ME.id).order("created_at", { ascending: false });
    MY = r.data || [];
    var m = await sign("covers", MY.filter(function (x) { return x.cover_path; }).map(function (x) { return x.cover_path; }));
    MY.forEach(function (x) { x.img = m[x.cover_path] || ""; });
  }

  async function ensureMember() {
    var r = await sb.from("members").select("*").eq("id", ME.id).maybeSingle(); if (r.error) return { error: r.error.message };
    if (!r.data) {
      var nm = ((ME.user_metadata && ME.user_metadata.display_name) || (ME.email || "membre").split("@")[0]).slice(0, 40); if (nm.length < 2) nm += "_";
      var i = await sb.from("members").insert({ id: ME.id, role: role() === "artist" ? "artist" : "listener", display_name: nm }).select().single();
      if (i.error) return { error: i.error.message }; MEM = i.data;
    } else MEM = r.data;
    return MEM.banned ? { error: "Ce compte est bloqué." } : {};
  }
  function listenerView() {
    show('<h2>Mon compte auditeur</h2><div class="pl"><p>Connecté en tant que <b>' + e(MEM.display_name) + '</b>.</p><p class="tag">Tu peux écouter, créer des playlists, suivre des artistes et participer à la communauté. La publication de chansons est réservée aux comptes artistes.</p><button class="bt g" data-art="logout">Se déconnecter</button></div>');
  }
  /* ---------- Profil ---------- */
  function profileForm(edit) {
    var p = PR || { socials: {} }, s = p.socials || {};
    show('<h2>' + (edit ? "Modifier mon profil" : "Crée ton profil artiste") + '</h2><div class="pl">' +
      fld("Nom d’artiste *", "pn", p.artist_name, 'maxlength="60"') +
      '<label class="lb" for="pb">Biographie</label><textarea class="in" id="pb" maxlength="1000">' + e(p.bio) + '</textarea>' +
      fld("Pays *", "pc", p.country, 'maxlength="60"') + fld("Ville (facultatif)", "pv", p.city, 'maxlength="60"') +
      '<label class="lb" for="pg">Genre musical *</label><select class="in" id="pg">' + opts(GN, p.genre) + '</select>' +
      fld("E-mail de contact *", "pe", p.contact_email || (ME && ME.email), 'type="email"') +
      fld("Instagram (lien)", "s_instagram", s.instagram, 'type="url"') + fld("YouTube (lien)", "s_youtube", s.youtube, 'type="url"') +
      fld("Facebook (lien)", "s_facebook", s.facebook, 'type="url"') + fld("TikTok (lien)", "s_tiktok", s.tiktok, 'type="url"') + fld("Site web (lien)", "s_website", s.website, 'type="url"') +
      '<label class="lb" for="pa">Photo de profil (JPG, PNG ou WebP, 3 Mo max)</label><input class="in" id="pa" type="file" accept="image/jpeg,image/png,image/webp">' +
      '<p class="err" id="pm"></p><button class="bt" id="ps" data-art="saveprofile">Enregistrer</button>' + (edit ? '<button class="bt g" data-art="back">Annuler</button>' : '') + '</div>');
  }
  async function saveProfile() {
    var d = { artist_name: val("pn"), bio: val("pb") || null, country: val("pc"), city: val("pv") || null, genre: val("pg") }, em = val("pe"), f = q("#pa").files[0];
    if (d.artist_name.length < 2 || !d.country || !d.genre) return msg("pm", "Nom d’artiste, pays et genre sont obligatoires.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return msg("pm", "Adresse e-mail de contact invalide.");
    var so = {}, bad = false;
    ["instagram", "youtube", "facebook", "tiktok", "website"].forEach(function (k) { var v = val("s_" + k); if (v) { if (url(v)) so[k] = v; else bad = true; } });
    if (bad) return msg("pm", "Les liens doivent commencer par http:// ou https://.");
    if (f && (IMG.indexOf(f.type) < 0 || f.size > 3145728)) return msg("pm", "Photo : JPG, PNG ou WebP, 3 Mo maximum.");
    busy("ps", true, "Enregistrement…");
    try {
      if (f) {
        var path = ME.id + "/avatar-" + Date.now() + "." + (f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg");
        var u = await sb.storage.from("avatars").upload(path, f, { contentType: f.type }); if (u.error) throw u.error;
        d.avatar_path = path;
      }
      d.id = ME.id; d.socials = so;
      var r = await sb.from("profiles").upsert(d); if (r.error) throw r.error;
      r = await sb.from("artist_private").upsert({ user_id: ME.id, contact_email: em }); if (r.error) throw r.error;
      toast("Profil enregistré"); route();
    } catch (x) { busy("ps", false, "Enregistrer"); msg("pm", "Échec : " + x.message); }
  }

  /* ---------- Tableau de bord ---------- */
  function dash() {
    var T3 = [["songs", "Chansons"], ["add", "Ajouter"], ["stats", "Stats"], ["pay", "Revenus"], ["profile", "Profil"]];
    var h = '<div style="display:flex;gap:12px;align-items:center;margin:14px 0"><div class="av" style="background-image:' + (PR.avatar_path ? "url(" + e(avatar(PR.avatar_path)) + ")" : "none") + '"></div><div class="m"><h2 style="margin:0">' + e(PR.artist_name) + '</h2><small class="tag">' + e(PR.genre) + ' · ' + e(PR.country) + '</small></div><button class="bt g" data-art="logout">Quitter</button></div>';
    h += '<div class="tabs" style="display:flex;gap:6px;margin:8px 0">' + T3.map(function (t) { return '<button class="bt ' + (tab === t[0] ? "" : "g") + '" data-art="tab" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join("") + '</div>';
    if (tab === "songs") h += songsList();
    else if (tab === "add") h += songForm();
    else if (tab === "stats" || tab === "pay") h += '<div id="sx"><p class="empty">Chargement…</p></div>';
    else h += '<div class="pl"><p>' + e(PR.bio || "Aucune biographie.") + '</p><p class="tag">Contact : ' + e(PR.contact_email) + '</p><button class="bt" data-art="editprofile">Modifier mon profil</button><button class="bt g" data-art="artist" data-id="' + e(ME.id) + '">Voir mon profil public</button></div>';
    show(h); if (tab === "stats") statsView(); if (tab === "pay") payView();
  }
  async function statsView() {
    var n = function (s) { return MY.filter(function (x) { return x.status === s; }).length; };
    var fo = await sb.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", ME.id);
    var pp = await sb.from("posts").select("id").eq("author_id", ME.id), ids = (pp.data || []).map(function (x) { return x.id; }), lk = 0;
    if (ids.length) { var l = await sb.from("likes").select("*", { count: "exact", head: true }).in("post_id", ids); lk = l.count || 0; }
    q("#sx").innerHTML = '<div class="pl"><b>Mon catalogue</b><p>Publiées : ' + n("approved") + ' · En attente : ' + n("pending") + ' · Refusées : ' + n("rejected") + '</p></div><div class="pl"><b>Ma communauté</b><p>Abonnés : ' + (fo.count || 0) + ' · J’aime reçus sur mes publications : ' + lk + '</p></div><p class="tag">Les statistiques d’écoute ne sont pas encore disponibles : KUKA MUSIC n’affiche que des chiffres réels.</p>';
  }
  async function payView() {
    var r = await sb.from("earnings").select("*").eq("artist_id", ME.id).order("created_at", { ascending: false }), L = r.data || [], t = 0;
    L.forEach(function (x) { t += Number(x.amount); });
    var pm = await sb.from("payout_methods").select("*").eq("artist_id", ME.id), P = pm.data || [];
    q("#sx").innerHTML = '<div class="pl"><b>Mes revenus</b><p style="font-size:22px;margin:4px 0">' + (L.length ? t.toLocaleString("fr-FR") + " " + e(L[0].currency) : "Aucun revenu enregistré") + '</p>' +
      L.map(function (x) { return '<div style="display:flex;justify-content:space-between;gap:8px"><span>' + e(x.period) + (x.note ? " · " + e(x.note) : "") + '</span><b>' + Number(x.amount).toLocaleString("fr-FR") + " " + e(x.currency) + '</b></div>'; }).join("") +
      '<p class="tag">Seuls toi et l’administration voient ces montants. Ils sont saisis par l’administration : aucun paiement automatique n’est actif pour l’instant.</p></div>' +
      '<div class="pl"><b>Moyens de paiement</b>' + (P.length ? P.map(function (x) { return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span>' + e(x.label) + ' · ' + e(x.account) + '</span><button class="bt g" data-art="delpay" data-id="' + e(x.id) + '">Retirer</button></div>'; }).join("") : '<p class="empty">Aucun moyen enregistré.</p>') +
      '<label class="lb" for="pk">Type</label><select class="in" id="pk"><option value="mobile_money">Mobile Money</option><option value="bank">Virement bancaire</option><option value="paypal">PayPal</option><option value="other">Autre</option></select>' +
      fld("Nom (ex. Orange Money)", "pl_", "", 'maxlength="40"') + fld("Numéro ou identifiant du compte", "pa_", "", 'maxlength="120"') +
      '<p class="tag">Ne saisis jamais de code PIN, mot de passe ou numéro de carte.</p><p class="err" id="pmm"></p><button class="bt" data-art="addpay">Ajouter</button></div>';
  }
  async function addPay() {
    var d = { artist_id: ME.id, kind: val("pk"), label: val("pl_"), account: val("pa_") };
    if (d.label.length < 2 || d.account.length < 3) return msg("pmm", "Nom et identifiant du compte requis.");
    var r = await sb.from("payout_methods").insert(d); if (r.error) return msg("pmm", r.error.message); payView();
  }
  async function delPay(id) { await sb.from("payout_methods").delete().eq("id", id); payView(); }
  async function fbtn(id) {
    var on = false, h = ov.querySelector(".av"); if (!h || (ME && ME.id === id)) return;
    if (ME) { var r = await sb.from("follows").select("followee_id").eq("follower_id", ME.id).eq("followee_id", id); on = (r.data || []).length > 0; }
    var b = document.createElement("button"); b.className = "bt" + (on ? " g" : ""); b.dataset.art = "follow"; b.dataset.id = id; b.textContent = on ? "Suivi ✓" : "Suivre"; h.parentNode.appendChild(b);
  }
  async function toggleFollow(id) {
    if (!ME) return entry();
    var r = await sb.from("follows").select("followee_id").eq("follower_id", ME.id).eq("followee_id", id);
    if ((r.data || []).length) await sb.from("follows").delete().eq("follower_id", ME.id).eq("followee_id", id);
    else { var i = await sb.from("follows").insert({ follower_id: ME.id, followee_id: id }); if (i.error) return toast(i.error.message); }
    openArtist(id);
  }
  var LBL = { pending: "En attente", approved: "Acceptée", rejected: "Refusée", removed: "Retirée" };
  function songsList() {
    var F = [["all", "Toutes"], ["pending", "En attente"], ["approved", "Acceptées"], ["rejected", "Refusées"]];
    var l = MY.filter(function (x) { return flt === "all" || x.status === flt; });
    return '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">' + F.map(function (f) { return '<button class="chip" style="' + (flt === f[0] ? "outline:2px solid var(--ac)" : "") + '" data-art="flt" data-f="' + f[0] + '">' + f[1] + '</button>'; }).join("") + '</div>' +
      (l.length ? l.map(function (x) {
        return '<div class="pl"><div style="display:flex;gap:10px;align-items:center"><div class="cv" style="background:' + (x.img ? "center/cover url(" + e(x.img) + ")" : "linear-gradient(135deg,#8b5cf6,#ec4899)") + '"></div><div class="m"><b>' + e(x.title) + '</b><small>' + e(x.genre) + ' · ' + e(x.country) + '</small></div><span class="bd ' + x.status + '">' + LBL[x.status] + '</span></div>' +
          ((x.status === "rejected" || x.status === "removed") ? '<p class="err">Motif : ' + e(x.reject_reason || "non précisé") + '</p>' : '') +
          ((x.status === "pending" || x.status === "rejected") ? '<button class="bt g" data-art="delsong" data-id="' + e(x.id) + '">Supprimer</button>' : '') + '</div>';
      }).join("") : '<p class="empty">Aucune chanson dans cette liste.</p>');
  }
  function songForm() {
    return '<div class="pl">' + fld("Titre *", "ut", "", 'maxlength="120"') + fld("Nom de l’artiste *", "un", PR.artist_name, 'maxlength="100"') +
      '<label class="lb" for="ug">Genre musical *</label><select class="in" id="ug">' + opts(GN, PR.genre) + '</select>' + fld("Pays d’origine *", "uk", PR.country, 'maxlength="60"') +
      fld("Date de sortie (facultatif)", "ud", "", 'type="date"') + fld("Artistes collaborateurs (facultatif)", "uf", "", 'maxlength="300"') +
      '<label class="lb" for="ua">Fichier audio MP3 * (25 Mo max)</label><input class="in" id="ua" type="file" accept="audio/mpeg,.mp3">' +
      '<label class="lb" for="uc">Pochette (JPG, PNG ou WebP, 3 Mo max)</label><input class="in" id="uc" type="file" accept="image/jpeg,image/png,image/webp">' +
      '<label class="ck"><input type="checkbox" id="ur"><span>Je confirme détenir tous les droits nécessaires, ou avoir l’autorisation de distribuer ce morceau sur KUKA MUSIC.</span></label>' +
      '<p class="tag">Ta chanson reste privée jusqu’à validation par l’équipe KUKA MUSIC.</p><p class="err" id="um"></p><button class="bt" id="us" data-art="submit">Envoyer pour validation</button></div>';
  }
  async function submitSong() {
    var a = q("#ua").files[0], c = q("#uc").files[0];
    var d = { title: val("ut"), artist_name: val("un"), genre: val("ug"), country: val("uk"), release_date: val("ud") || null, collaborators: val("uf") || null };
    if (!d.title || !d.artist_name || !d.genre || !d.country) return msg("um", "Titre, artiste, genre et pays sont obligatoires.");
    if (!a) return msg("um", "Choisis un fichier MP3.");
    if (!/\.mp3$/i.test(a.name) || (a.type && a.type !== "audio/mpeg" && a.type !== "audio/mp3")) return msg("um", "Le fichier audio doit être un MP3.");
    if (a.size > 26214400) return msg("um", "MP3 trop lourd (25 Mo maximum).");
    if (c && (IMG.indexOf(c.type) < 0 || c.size > 3145728)) return msg("um", "Pochette : JPG, PNG ou WebP, 3 Mo maximum.");
    if (!q("#ur").checked) return msg("um", "Tu dois confirmer que tu détiens les droits.");
    busy("us", true, "Envoi en cours…");
    var id = crypto.randomUUID(), ap = ME.id + "/" + id + ".mp3", up = [];
    var cp = c ? ME.id + "/" + id + "." + (c.type === "image/png" ? "png" : c.type === "image/webp" ? "webp" : "jpg") : null;
    try {
      var r = await sb.storage.from("audio").upload(ap, a, { contentType: "audio/mpeg" }); if (r.error) throw r.error; up.push(["audio", ap]);
      if (c) { r = await sb.storage.from("covers").upload(cp, c, { contentType: c.type }); if (r.error) throw r.error; up.push(["covers", cp]); }
      d.id = id; d.artist_id = ME.id; d.audio_path = ap; d.cover_path = cp; d.rights_confirmed = true; d.status = "pending";
      r = await sb.from("songs").insert(d); if (r.error) throw r.error;
      toast("Chanson envoyée : elle sera examinée avant publication."); tab = "songs"; flt = "pending"; await mySongs(); dash();
    } catch (x) {
      for (var i = 0; i < up.length; i++) { try { await sb.storage.from(up[i][0]).remove([up[i][1]]); } catch (z) {} }
      busy("us", false, "Envoyer pour validation"); msg("um", "Échec de l’envoi : " + x.message);
    }
  }
  async function delSong(id) {
    var s = MY.find(function (x) { return x.id === id; }); if (!s) return;
    var r = await sb.from("songs").delete().eq("id", id); if (r.error) return toast("Suppression impossible : " + r.error.message);
    try { await sb.storage.from("audio").remove([s.audio_path]); if (s.cover_path) await sb.storage.from("covers").remove([s.cover_path]); } catch (z) {}
    await mySongs(); dash();
  }

  /* ---------- Profil public, signalement, catalogue ---------- */
  async function openArtist(id) {
    loading();
    var r = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
    if (!r.data) return show('<p class="empty">Artiste introuvable.</p>');
    var p = r.data, s = await sb.from("songs").select("id,title,artist_name,collaborators").eq("artist_id", id).eq("status", "approved").order("created_at", { ascending: false }), ss = s.data || [], so = p.socials || {};
    var links = Object.keys(so).filter(function (k) { return url(so[k]); }).map(function (k) { return '<a class="chip" target="_blank" rel="noopener noreferrer" href="' + e(so[k]) + '">' + e(k) + '</a>'; }).join(" ");
    show('<div style="display:flex;gap:12px;align-items:center;margin:14px 0"><div class="av" style="background-image:' + (p.avatar_path ? "url(" + e(avatar(p.avatar_path)) + ")" : "none") + '"></div><div class="m"><h2 style="margin:0">' + e(p.artist_name) + '</h2><small class="tag">' + e(p.genre) + ' · ' + e(p.country) + (p.city ? ", " + e(p.city) : "") + '</small></div></div>' +
      (p.bio ? '<p style="white-space:pre-wrap">' + e(p.bio) + '</p>' : '') + (links ? '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0">' + links + '</div>' : '') +
      '<h2>Titres</h2>' + (ss.length ? ss.map(function (x) { return '<div class="row" style="cursor:default"><button class="ic" data-art="play" data-sid="' + e(x.id) + '" aria-label="Écouter">▶</button><div class="m"><b>' + e(x.title) + '</b><small>' + e(x.artist_name) + '</small></div><button class="hs" data-art="report" data-sid="' + e(x.id) + '" aria-label="Signaler" title="Signaler">⚑</button></div>'; }).join("") : '<p class="empty">Aucun titre publié.</p>')); fbtn(id);
  }
  function reportForm(sid) {
    show('<h2>Signaler une chanson</h2><div class="pl"><p class="tag">Contenu protégé par des droits, illégal ou inapproprié ? Dis-nous pourquoi. L’équipe examinera et pourra retirer la chanson.</p><label class="lb" for="rr">Motif *</label><textarea class="in" id="rr" maxlength="500"></textarea>' + fld("Ton e-mail (facultatif)", "rc", "", 'type="email" maxlength="200"') + '<p class="err" id="rm"></p><button class="bt" id="rs" data-art="sendreport" data-sid="' + e(sid) + '">Envoyer</button></div>');
  }
  async function sendReport(sid) {
    var re = val("rr"); if (re.length < 5) return msg("rm", "Explique le motif (5 caractères minimum).");
    busy("rs", true);
    var r = await sb.from("reports").insert({ song_id: sid, reason: re, contact: val("rc") || null });
    if (r.error) { busy("rs", false); return msg("rm", "Envoi impossible : " + r.error.message); }
    toast("Signalement envoyé. Merci."); ov.style.display = "none";
  }
  async function catalog() {
    if (!sb || role() === "artist") return;
    try {
      var r = await sb.from("songs").select("id,title,artist_name,collaborators,audio_path,cover_path,artist_id").eq("status", "approved").order("created_at", { ascending: false }).limit(100);
      if (r.error) throw r.error;
      var rows = r.data || [];
      var a = await sign("audio", rows.map(function (x) { return x.audio_path; })), c = await sign("covers", rows.filter(function (x) { return x.cover_path; }).map(function (x) { return x.cover_path; }));
      for (var i = T.length - 1; i >= 0; i--) if (T[i].sid) T.splice(i, 1);
      CAT = [];
      rows.forEach(function (x) { if (a[x.audio_path]) { CAT.push(x); T.push({ sid: x.id, aid: x.artist_id, t: x.title, a: x.artist_name + (x.collaborators ? " feat. " + x.collaborators : ""), url: a[x.audio_path], img: c[x.cover_path] || null, c: ["#ff5d73", "#ffc857"] }); } });
      render();
    } catch (x) { /* hors connexion ou non configuré : le reste de l'app continue */ }
  }
  function inject() {
    if (typeof view === "undefined" || view !== "home") return;
    var m = document.getElementById("main"); if (!m || m.querySelector("[data-art=open]")) return;
    var seen = {}, ar = CAT.filter(function (x) { if (seen[x.artist_id]) return false; seen[x.artist_id] = 1; return true; });
    m.insertAdjacentHTML("afterbegin", '<div class="pl" data-art="open" style="cursor:pointer;border:1px solid var(--ac)"><b>🎤 Espace artiste</b><p class="tag" style="margin:2px 0 0">Publie ta musique sur KUKA MUSIC.</p></div>');
    if (ar.length) m.insertAdjacentHTML("beforeend", '<h2>Artistes</h2><div class="chips">' + ar.map(function (x) { return '<button class="chip" data-art="artist" data-id="' + e(x.artist_id) + '">' + e(x.artist_name) + '</button>'; }).join("") + '</div>');
  }

  /* ---------- Événements ---------- */
  document.addEventListener("click", function (ev) {
    var x = ev.target.closest("[data-art]"); if (!x) return;
    var a = x.dataset.art, d = x.dataset;
    if (a === "open") entry();
    else if (a === "close") ov.style.display = "none";
    else if (a === "login") login();
    else if (a === "signup") signup();
    else if (a === "logout") sb.auth.signOut().then(function () { ME = null; PR = null; authView(); });
    else if (a === "tab") { tab = d.t; dash(); }
    else if (a === "flt") { flt = d.f; dash(); }
    else if (a === "back") dash();
    else if (a === "editprofile") profileForm(true);
    else if (a === "saveprofile") saveProfile();
    else if (a === "submit") submitSong();
    else if (a === "delsong") { if (confirm("Supprimer cette chanson ?")) delSong(d.id); }
    else if (a === "addpay") addPay();
    else if (a === "delpay") delPay(d.id);
    else if (a === "follow") toggleFollow(d.id);
    else if (a === "artist") openArtist(d.id);
    else if (a === "report") reportForm(d.sid);
    else if (a === "sendreport") sendReport(d.sid);
    else if (a === "play") { var i = T.findIndex(function (t) { return t.sid === d.sid; }); if (i >= 0) { ov.style.display = "none"; load(i, true); } else toast("Ce titre n’est pas disponible pour le moment."); }
  });
  var _r = window.render;
  window.render = function () { _r.apply(this, arguments); try { inject(); } catch (z) {} };
  window.addEventListener("online", catalog);
  if (sb) sb.auth.getSession().then(function (s) { ME = s.data.session ? s.data.session.user : null; if (ME) ensureMember().then(function () { render(); }); });
  window.KUKA = { sb: sb, OK: OK, e: e, toast: toast, me: function () { return ME; }, login: entry, role: role };
  render(); catalog();
})();
