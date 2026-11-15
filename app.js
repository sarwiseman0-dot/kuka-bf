const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const LS=(k,d)=>{try{return JSON.parse(localStorage.getItem("kuka3-"+k))??d}catch(e){return d}},SV=(k,v)=>{try{localStorage.setItem("kuka3-"+k,JSON.stringify(v))}catch(e){}};
let fav=LS("fav",[]),pl=LS("pl",[]),hist=LS("hist",[]),plays=LS("plays",{});const SP=()=>SV("pl",pl);
const SY=[["Matin doré",92,261.6,"triangle",[0,2,4,2,5,4,2,0,0,2,4,7,5,4,2,-1]],["Pluie sur Dakar",76,220,"sine",[0,-1,3,-1,5,-1,3,2,0,-1,3,5,7,5,3,-1]],["Nuit néon",118,196,"sawtooth",[0,0,7,0,5,0,3,0,0,0,7,0,8,7,5,3]],["Lagune",68,246.9,"sine",[0,2,4,7,4,2,0,-1,2,4,7,9,7,4,2,-1]],["Vélo de nuit",126,329.6,"triangle",[0,3,5,3,0,3,7,5,0,3,5,3,10,7,5,3]],["Chaleur",110,277.2,"sawtooth",[0,-1,0,3,5,-1,3,0,7,-1,5,3,5,3,0,-1]]];
const T=SY.map((a,i)=>({id:"s"+i,title:a[0],artist:"Kuka Lab",album:"Créations synthétisées",kind:"synth",bpm:a[1],root:a[2],wave:a[3],pat:a[4]}));
const db=new Promise((ok,ko)=>{try{const r=indexedDB.open("kuka3",1);r.onupgradeneeded=()=>r.result.createObjectStore("t",{keyPath:"id"});r.onsuccess=()=>ok(r.result);r.onerror=ko}catch(e){ko(e)}});
const tx=(m,f)=>db.then(d=>new Promise((ok,ko)=>{const r=f(d.transaction("t",m).objectStore("t"));r.onsuccess=()=>ok(r.result);r.onerror=ko}));
const byId=id=>T.find(t=>t.id===id),fm=s=>isFinite(s)?Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0"):"0:00";
const cv=t=>{const h=Math.abs([...t.title].reduce((a,c)=>a*31+c.charCodeAt(0)|0,7))%360;return`background:linear-gradient(135deg,hsl(${h},80%,58%),hsl(${(h+55)%360},80%,42%))`};
/* ===== Moteur audio ===== */
let ctx,mg,eq=[],au=new Audio(),cur=null,queue=[],pos=0,dur=0,playing=false,shuf=false,rep=0,vol=.7,stepI=0,nextT=0,last=performance.now(),drag=0,sleepT=null;
const SC=[0,2,3,5,7,8,10,12,14,15,17,19],sd=()=>60/cur.bpm/2;
function init(){if(ctx)return;ctx=new(window.AudioContext||window.webkitAudioContext)();mg=ctx.createGain();mg.gain.value=vol*vol;const g=LS("eq",[0,0,0]);
eq=[["lowshelf",100],["peaking",1000],["highshelf",8000]].map(([t,f],i)=>{const b=ctx.createBiquadFilter();b.type=t;b.frequency.value=f;b.gain.value=g[i];return b});
let n=mg;eq.forEach(b=>{n.connect(b);n=b});n.connect(ctx.destination);ctx.createMediaElementSource(au).connect(mg)}
function note(f,t,d,w,g){const o=ctx.createOscillator(),e=ctx.createGain();o.type=w;o.frequency.value=f;e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(g,t+.02);e.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(e);e.connect(mg);o.start(t);o.stop(t+d+.05)}
function sched(){while(nextT<ctx.currentTime+.25){const i=stepI%16,d=cur.pat[i];if(d>=0)note(cur.root*2**(SC[d%12]/12),nextT,sd()*1.8,cur.wave,.16);if(i%4==0)note(cur.root/2,nextT,sd()*3,"triangle",.2);nextT+=sd();stepI++}}
function start(t,q){init();ctx.resume();au.pause();cur=t;if(q)queue=q;pos=0;stepI=0;nextT=ctx.currentTime+.05;
if(t.kind==="file"){t.url=t.url||URL.createObjectURL(t.blob);au.src=t.url;dur=0;au.play()}else dur=60;
playing=true;plays[t.id]=(plays[t.id]||0)+1;hist=[t.id,...hist.filter(x=>x!==t.id)].slice(0,50);SV("plays",plays);SV("hist",hist);media();ui()}
function toggle(){if(!cur)return;init();ctx.resume();if(playing){playing=false;au.pause()}else{playing=true;if(cur.kind==="file")au.play();else{stepI=Math.floor(pos/sd());nextT=ctx.currentTime+.05}}ui()}
function seek(p){pos=p;if(cur.kind==="file")au.currentTime=p;else{stepI=Math.floor(p/sd());nextT=ctx.currentTime+.05}}
function go(d,auto){if(!queue.length)return;let i=queue.indexOf(cur.id),n;if(shuf)n=queue[Math.random()*queue.length|0];else{i+=d;if(i>=queue.length){if(!rep&&auto){playing=false;ui();return}i=0}if(i<0)i=queue.length-1;n=queue[i]}start(byId(n));render()}
function end(){if(rep==2){seek(0);if(cur.kind==="file")au.play()}else go(1,true)}
au.onended=end;
setInterval(()=>{const n=performance.now(),dt=(n-last)/1e3;last=n;if(!cur)return;if(playing){if(cur.kind==="file"){pos=au.currentTime;dur=au.duration||0}else{pos+=dt;sched();if(pos>=dur)end()}}ui()},250);
function media(){try{const m=navigator.mediaSession;if(!m)return;m.metadata=new MediaMetadata({title:cur.title,artist:cur.artist,album:cur.album,artwork:[{src:"icon-512.png",sizes:"512x512",type:"image/png"}]});m.setActionHandler("play",toggle);m.setActionHandler("pause",toggle);m.setActionHandler("nexttrack",()=>go(1));m.setActionHandler("previoustrack",()=>go(-1))}catch(e){}}
function tf(id){fav=fav.includes(id)?fav.filter(x=>x!==id):[...fav,id];SV("fav",fav);ui();render()}
function ui(){const t=cur,c=$("#pcv");$("#pt").textContent=t?t.title:"Aucun titre";$("#pa").textContent=t?t.artist:"Choisis un titre";c.style.cssText=t?cv(t):"background:var(--sf2)";c.textContent=t?"♪":"";
$("#pp").textContent=playing?"⏸":"▶";$("#cu").textContent=fm(pos);$("#du").textContent=fm(dur);if(!drag)$("#sk").value=dur?pos/dur*1000:0;
const l=!!t&&fav.includes(t.id);$("#pf").textContent=l?"♥":"♡";$("#pf").classList.toggle("l",l);$("#sh").classList.toggle("on",shuf);$("#rp").classList.toggle("on",!!rep);$("#rp").textContent=rep==2?"①":"↻"}
/* ===== Interface ===== */
let view="home",tab="t",sort="title",q="",open=null,addId=null,LISTS=[];
const row=(t,li)=>`<div class="row${cur&&cur.id===t.id?" on":""}" data-p="${t.id}" data-l="${li}"><div class="cv" style="${cv(t)}">♪</div><div class="m"><b>${esc(t.title)}</b><small>${esc(t.artist)} · ${esc(t.album)}</small></div><button class="ic${fav.includes(t.id)?" l":""}" data-f="${t.id}" aria-label="Favori">${fav.includes(t.id)?"♥":"♡"}</button><button class="ic" data-m="${t.id}" aria-label="Ajouter à une playlist">＋</button></div>`;
const rows=ts=>{LISTS.push(ts.map(t=>t.id));return ts.map(t=>row(t,LISTS.length-1)).join("")};
const sec=(h,l,e)=>`<h2>${h}</h2>`+(l.length?rows(l):`<p class="empty">${e}</p>`);
function home(){const g=new Date().getHours(),rec=hist.map(byId).filter(Boolean).slice(0,6),top=T.filter(t=>plays[t.id]).sort((a,b)=>plays[b.id]-plays[a.id]).slice(0,5),mine=T.filter(t=>t.kind==="file").slice(-5).reverse(),art=[...new Set(T.map(t=>t.artist))];
return`<div class="hero"><h1>${g<6?"Bonne nuit":g<18?"Bonjour":"Bonsoir"} 👋</h1><p>Ta musique, ton style.</p></div>`+sec("Récemment écoutés",rec,"Rien pour l'instant. Lance un titre !")+sec("Nouveautés (tes imports)",mine,"Importe tes musiques dans Bibliothèque.")+sec("Créations Kuka Lab",T.filter(t=>t.kind==="synth"),"")+sec("Classement : les plus écoutés",top,"Le classement se remplit au fil de tes écoutes.")+`<h2>Artistes</h2><div class="chips">${art.map(a=>`<button class="chip" data-a="${esc(a)}">${esc(a)}</button>`).join("")}</div>`}
const res=()=>{const f=T.filter(t=>(t.title+" "+t.artist+" "+t.album).toLowerCase().includes(q.toLowerCase()));return f.length?rows(f):`<p class="empty">Aucun résultat.</p>`};
const srch=()=>`<input class="in" id="q" placeholder="Titre, artiste ou album" value="${esc(q)}"><div id="res">${res()}</div>`;
function lib(){let b="";const tabs=[["t","Titres"],["pl","Playlists"],["f","Favoris"],["h","Historique"]];
if(tab==="t"){const s=[...T].sort((a,b)=>(a[sort]||"").localeCompare(b[sort]||""));b=`<label class="bt">＋ Importer des musiques<input type="file" id="imp" accept="audio/*" multiple hidden></label><select class="in" id="so"><option value="title">Trier par titre</option><option value="artist">Trier par artiste</option><option value="album">Trier par album</option></select>`+rows(s)}
else if(tab==="f")b=fav.length?rows(fav.map(byId).filter(Boolean)):`<p class="empty">Aucun favori. Touche ♡ à côté d'un titre.</p>`;
else if(tab==="h")b=hist.length?rows(hist.map(byId).filter(Boolean)):`<p class="empty">Ton historique est vide.</p>`;
else if(open){const p=pl.find(x=>x.id===open);if(!p){open=null;return lib()}b=`<button class="bt g" id="bk">← Retour</button><div class="card"><input class="in" id="rn" value="${esc(p.name)}"><button class="bt" id="rs">Renommer</button><button class="bt g" id="dl">Supprimer</button></div>`+(p.ids.length?rows(p.ids.map(byId).filter(Boolean)).replace(/data-m="([^"]*)"([^>]*)>＋/g,'data-x="$1"$2>✕'):`<p class="empty">Playlist vide. Ajoute des titres avec ＋.</p>`)}
else b=`<input class="in" id="pn2" placeholder="Nom de la nouvelle playlist"><button class="bt" id="cp">Créer</button>`+(pl.length?pl.map(p=>`<div class="row" data-o="${p.id}"><div class="cv" style="${cv({title:p.name})}">♫</div><div class="m"><b>${esc(p.name)}</b><small>${p.ids.length} titres</small></div></div>`).join(""):`<p class="empty">Aucune playlist.</p>`);
return`<div class="tabs">${tabs.map(([k,l])=>`<button data-t="${k}" class="${tab===k?"on":""}">${l}</button>`).join("")}</div>`+b}
function sett(){const e=LS("eq",[0,0,0]);return`<h2>Égaliseur</h2><div class="card">${["Graves","Médiums","Aigus"].map((n,i)=>`<div class="sw"><span>${n}</span><input type="range" min="-12" max="12" value="${e[i]}" data-e="${i}" aria-label="${n}"></div>`).join("")}<button class="bt g" id="er">Réinitialiser</button></div><h2>Minuteur de sommeil</h2><div class="card"><select class="in" id="sl"><option value="0">Désactivé</option><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">1 heure</option></select></div><h2>À propos</h2><div class="card"><p>KUKA MUSIC V3.0. Comptes, synchronisation, administration et pubs arrivent ensuite.</p></div>`}
function render(){LISTS=[];const m=$("#main");m.innerHTML=({home,search:srch,lib,set:sett})[view]();m.style.animation="none";m.offsetHeight;m.style.animation="";
const so=$("#so");if(so)so.value=sort;const sl=$("#sl");if(sl)sl.value=sleepT?sleepT.m:"0"}
function sheet(){$("#sheet").innerHTML='<div><h2>Ajouter à une playlist</h2>'+pl.map(p=>`<button class="row" data-ap="${p.id}"><div class="m"><b>${esc(p.name)}</b><small>${p.ids.length} titres</small></div></button>`).join("")+'<button class="bt" data-np="1">＋ Nouvelle playlist</button></div>';$("#sheet").classList.add("on")}
function nav(v){view=v;open=null;document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));render()}
document.addEventListener("click",e=>{const c=s=>e.target.closest(s);let x;
if(x=c("[data-f]"))return tf(x.dataset.f);
if(x=c("[data-m]")){addId=x.dataset.m;return sheet()}
if(x=c("[data-x]")){const p=pl.find(p=>p.id===open);p.ids=p.ids.filter(i=>i!==x.dataset.x);SP();return render()}
if(x=c("[data-ap]")){const p=pl.find(p=>p.id===x.dataset.ap);if(!p.ids.includes(addId))p.ids.push(addId);SP();return $("#sheet").classList.remove("on")}
if(c("[data-np]")){pl.push({id:"p"+Date.now(),name:"Playlist "+(pl.length+1),ids:[addId]});SP();return $("#sheet").classList.remove("on")}
if(e.target.id==="sheet")return e.target.classList.remove("on");
if(x=c("[data-p]")){start(byId(x.dataset.p),LISTS[+x.dataset.l]||[]);return render()}
if(x=c("nav [data-v]"))return nav(x.dataset.v);
if(x=c("[data-t]")){tab=x.dataset.t;open=null;return render()}
if(x=c("[data-a]")){q=x.dataset.a;return nav("search")}
if(x=c("[data-o]")){open=x.dataset.o;return render()}
switch(e.target.id){case"bk":open=null;return render();
case"cp":{const n=$("#pn2").value.trim();if(n){pl.push({id:"p"+Date.now(),name:n,ids:[]});SP();render()}return}
case"rs":{const n=$("#rn").value.trim();if(n){pl.find(p=>p.id===open).name=n;SP();render()}return}
case"dl":pl=pl.filter(p=>p.id!==open);open=null;SP();return render();
case"er":SV("eq",[0,0,0]);eq.forEach(b=>b.gain.value=0);return render();
case"pp":return toggle();case"pn":return go(1);case"pb":return pos>3?seek(0):go(-1);
case"pf":return cur&&tf(cur.id);case"sh":shuf=!shuf;return ui();case"rp":rep=(rep+1)%3;return ui()}});
document.addEventListener("input",e=>{const t=e.target;
if(t.id==="q"){q=t.value;$("#res").innerHTML=res()}
if(t.id==="sk"){drag=1;$("#cu").textContent=fm(t.value/1000*dur)}
if(t.id==="vo"){vol=t.value/100;if(mg)mg.gain.value=vol*vol}
if(t.dataset.e!==undefined){const v=LS("eq",[0,0,0]);v[+t.dataset.e]=+t.value;SV("eq",v);if(eq[+t.dataset.e])eq[+t.dataset.e].gain.value=+t.value}});
document.addEventListener("change",async e=>{const t=e.target;
if(t.id==="sk"){drag=0;if(cur)seek(t.value/1000*dur)}
if(t.id==="so"){sort=t.value;render()}
if(t.id==="sl"){clearTimeout(sleepT&&sleepT.id);sleepT=null;const m=+t.value;if(m)sleepT={m:t.value,id:setTimeout(()=>{if(playing)toggle();sleepT=null},m*6e4)}}
if(t.id==="imp"){for(const f of t.files){const n=f.name.replace(/\.[^.]+$/,""),m=n.split(" - "),r={id:"f"+Date.now()+Math.random().toString(36).slice(2,6),title:(m[1]||m[0]).trim(),artist:m[1]?m[0].trim():"Artiste inconnu",album:"Mes imports",kind:"file",blob:f};try{await tx("readwrite",s=>s.put(r))}catch(x){}T.push(r)}render()}});
tx("readonly",s=>s.getAll()).then(a=>{T.push(...a);render()}).catch(()=>{});
render();ui();if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
