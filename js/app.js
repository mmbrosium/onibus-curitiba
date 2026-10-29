// Ônibus Curitiba — Meu trajeto (Volta)
// Horários reais vêm de dados/trajeto.json. Os tempos de cada perna são
// ESTIMATIVAS (o feed não crava a troncal nem os trechos a pé) — ficam marcados
// com "~" e serão exatos quando entrar o tempo real (GPS).

const DIA = 24 * 60, ITEM = 28;
const pad2 = n => String(n).padStart(2, "0");
const toMin = s => { const [h, m] = s.split(":").map(Number); const t = h * 60 + m; return t < 4 * 60 ? t + DIA : t; };
const mh = x => pad2(Math.floor(x / 60) % 24) + ":" + pad2(x % 60);
const fmtData = d => d && d.length === 8 ? d.slice(6, 8) + "/" + d.slice(4, 6) : d;

// estimativas de tempo (minutos) — ajustar quando entrar o tempo real
const EST = { trabalho_rui: 8, troncal: 22, baldeacao: 3, cabral_erasto: 15, erasto_casa: 7 };

let GRADE = [], selH = 0, selM = 0;
const lista = document.getElementById("lista");
const valHora = document.getElementById("valHora");
const roloH = document.getElementById("roloH");
const roloM = document.getElementById("roloM");
const elRui = document.getElementById("h-rui");
const elCabral = document.getElementById("h-cabral");
const elCasa = document.getElementById("h-casa");

function render() {
  valHora.textContent = pad2(selH) + ":" + pad2(selM);
  const saida = selH * 60 + selM;
  const chegadaRui = saida + EST.trabalho_rui;
  const chegadaCabral = saida + EST.trabalho_rui + EST.troncal + EST.baldeacao;
  elRui.textContent = "~" + mh(chegadaRui);
  elCabral.textContent = "~" + mh(chegadaCabral);

  let base = chegadaCabral; if (base < 4 * 60) base += DIA;
  const prox = GRADE.map(l => { const s = l.saidas.find(x => toMin(x) >= base);
    return s ? { nome: l.nome, linha: l.linha, saida: s, espera: toMin(s) - base } : null; })
    .filter(Boolean).sort((a, b) => toMin(a.saida) - toMin(b.saida));

  if (!prox.length) { lista.innerHTML = '<div class="detalhe" style="padding-top:6px">Sem mais saídas até o fim do dia.</div>'; elCasa.textContent = "~--:--"; return; }
  const cls = e => e <= 5 ? "e0" : (e <= 12 ? "e1" : "e2");
  lista.innerHTML = prox.map(o => {
    const md = toMin(o.saida) >= DIA ? '<span class="madruga"> (último, madrugada)</span>' : '';
    return `<div class="saida"><div class="l"><span class="linhaRot alim">${o.linha}</span>${o.nome}${md}</div>
      <div class="r"><span class="h">${o.saida}</span>
      <span class="esp ${cls(o.espera)}">${o.espera === 0 ? "agora!" : o.espera + " min"}</span></div></div>`;
  }).join("");

  const melhor = prox[0];
  elCasa.textContent = "~" + mh(toMin(melhor.saida) + EST.cabral_erasto + EST.erasto_casa);
}

/* ---- seletor circular (touch + mouse) ---- */
const BLOCOS = 41, BASE = 20;
function buildCirc(el, unit) {
  let h = '<div class="pad"></div>';
  for (let b = 0; b < BLOCOS; b++) for (let i = 0; i < unit; i++) h += `<div class="pit">${pad2(i)}</div>`;
  el.innerHTML = h + '<div class="pad"></div>';
}
let blocoAntM = BASE, animH = false, tH, tM;
function posH(h, smooth) { animH = true; roloH.scrollTo({ top: (BASE * 24 + h) * ITEM, behavior: smooth ? "smooth" : "auto" }); setTimeout(() => animH = false, smooth ? 380 : 70); }
function posM(m) { roloM.scrollTop = (BASE * 60 + m) * ITEM; blocoAntM = BASE; }

roloH.addEventListener("scroll", () => { if (animH) return; clearTimeout(tH); tH = setTimeout(() => {
  selH = ((Math.round(roloH.scrollTop / ITEM) % 24) + 24) % 24;
  valHora.textContent = pad2(selH) + ":" + pad2(selM);
}, 90); });

roloM.addEventListener("scroll", () => { clearTimeout(tM); tM = setTimeout(() => {
  const idx = Math.round(roloM.scrollTop / ITEM);
  const bloco = Math.floor(idx / 60);
  const delta = bloco - blocoAntM;
  if (delta !== 0) { selH = ((selH + delta) % 24 + 24) % 24; blocoAntM = bloco; posH(selH, true); }
  selM = ((idx % 60) + 60) % 60;
  valHora.textContent = pad2(selH) + ":" + pad2(selM);
}, 90); });

// mouse: roda 1 item por "tique" do scroll (em vez de pular vários)
function ligaWheel(el) {
  el.addEventListener("wheel", e => { e.preventDefault(); el.scrollBy({ top: Math.sign(e.deltaY) * ITEM, behavior: "smooth" }); }, { passive: false });
}
ligaWheel(roloH); ligaWheel(roloM);

// mouse: setas ▲▼
document.querySelectorAll(".seta").forEach(btn => {
  btn.onclick = () => {
    const el = btn.dataset.r === "H" ? roloH : roloM;
    el.scrollBy({ top: (btn.dataset.d === "1" ? 1 : -1) * ITEM, behavior: "smooth" });
  };
});

const ovPicker = document.getElementById("ovPicker");
document.getElementById("chipHora").onclick = () => {
  ovPicker.classList.add("on");
  requestAnimationFrame(() => { posH(selH, false); posM(selM); });
};
function fechaPicker() { ovPicker.classList.remove("on"); render(); }
document.getElementById("okHora").onclick = fechaPicker;
ovPicker.onclick = e => { if (e.target === ovPicker) fechaPicker(); };

const ovCl = document.getElementById("ovCl");
document.getElementById("btnConfig").onclick = () => ovCl.classList.add("on");
document.getElementById("okCl").onclick = () => ovCl.classList.remove("on");
ovCl.onclick = e => { if (e.target === ovCl) ovCl.classList.remove("on"); };

// ---- mapa (Leaflet), iniciado só quando a aba Mapa é aberta ----
let mapaIniciado = false, mapObj = null;
let linhasLayers = [], linhaAberta = null;
const ovLinha = document.getElementById("ovLinha");
const linhaFolha = document.getElementById("linhaFolha");

// contraste: destaca a linha tocada e apaga as outras (sem mudar a cor-base)
function destacar(id) {
  linhasLayers.forEach(g => {
    const on = g.id === id;
    if (g.casing) g.casing.setStyle({ opacity: on ? .95 : .35 });
    if (g.solido) g.solido.setStyle({ weight: on ? 8 : 5, opacity: on ? 1 : .3 });
    g.pontilhados.forEach(p => p.setStyle({ opacity: on ? .55 : .12 }));
    if (g.pino && g.pino.getElement()) g.pino.getElement().style.opacity = on ? 1 : .35;
    if (on) g.todas.forEach(ly => ly.bringToFront && ly.bringToFront());
  });
}
function restaurar() {
  linhasLayers.forEach(g => {
    if (g.casing) g.casing.setStyle({ opacity: .9 });
    if (g.solido) g.solido.setStyle({ weight: 5, opacity: .95 });
    g.pontilhados.forEach(p => p.setStyle({ opacity: .45 }));
    if (g.pino && g.pino.getElement()) g.pino.getElement().style.opacity = 1;
  });
}
function abreLinha(l) {
  if (linhaAberta === l.linha) { fechaLinha(); return; }  // tocou de novo = fecha
  linhaAberta = l.linha; destacar(l.linha);
  const tr = l.tipo === "tronco", cls = tr ? "tronco" : "alim";
  const tipoTxt = tr ? "Troncal — vermelhão" : "Alimentadora — laranja";
  const trecho = tr
    ? "Você embarca no Tubo Rui Barbosa e desce no Terminal Cabral."
    : "Você embarca no Terminal Cabral e desce perto de casa (Av. Erasto Gaertner).";
  linhaFolha.innerHTML =
    `<div class="puxador"></div>
     <div class="linhaCab"><span class="linhaNum ${cls}">${l.linha}</span>
       <div><div class="linhaNome">${l.nome}</div><div class="linhaTipo ${cls}">${tipoTxt}</div></div></div>
     <p class="linhaTrecho">${trecho}</p>
     <p class="detalhe"><b>Linha cheia</b> = o trecho que você usa · <b>pontilhado</b> = o resto do itinerário da linha.</p>`;
  ovLinha.classList.add("on");
}
function fechaLinha() { ovLinha.classList.remove("on"); linhaAberta = null; restaurar(); }
ovLinha.onclick = e => { if (e.target === ovLinha) fechaLinha(); };

function initMapa() {
  if (mapaIniciado) return; mapaIniciado = true;
  mapObj = L.map("map");
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(mapObj);
  const status = document.getElementById("mapaStatus");
  fetch("dados/mapa.json").then(r => r.json()).then(d => {
    const cor = t => t === "tronco" ? "#dc2626" : "#ea580c";
    const solidos = [];
    d.linhas.forEach(l => {
      const c = cor(l.tipo);
      const usado = l.shape.slice(l.i_emb, l.i_des + 1);
      const g = { id: l.linha, todas: [], solido: null, casing: null, pontilhados: [], pino: null };
      // casing branco embaixo: separa a linha do fundo do mapa e das outras linhas
      const casing = L.polyline(usado, { color: "#fff", weight: 9, opacity: .9, lineCap: "round", lineJoin: "round" }).addTo(mapObj);
      g.casing = casing; g.todas.push(casing);
      // trecho que você pega: linha cheia (cor real da linha)
      const solido = L.polyline(usado, { color: c, weight: 5, opacity: .95, lineCap: "round", lineJoin: "round" }).addTo(mapObj);
      solido.on("click", () => abreLinha(l));
      g.solido = solido; g.todas.push(solido); solidos.push(solido);
      // resto do itinerário: pontilhado, com casing fininho pra não sumir no mapa
      const addResto = pts => {
        const pc = L.polyline(pts, { color: "#fff", weight: 6, opacity: .5, lineCap: "round" }).addTo(mapObj);
        const pl = L.polyline(pts, { color: c, weight: 3, opacity: .45, dashArray: "2,8", lineCap: "round" }).addTo(mapObj);
        pl.on("click", () => abreLinha(l));
        g.todas.push(pc, pl); g.pontilhados.push(pl);
      };
      if (l.i_emb > 0) addResto(l.shape.slice(0, l.i_emb + 1));
      if (l.i_des < l.shape.length - 1) addResto(l.shape.slice(l.i_des));
      // pino com o número: identifica a linha sem mexer na cor do traçado
      const mid = usado[Math.floor(usado.length / 2)];
      const pino = L.marker(mid, { icon: L.divIcon({ className: "pino-wrap",
        html: `<span class="pino ${l.tipo === "tronco" ? "tronco" : "alim"}">${l.linha}</span>`,
        iconSize: [34, 20], iconAnchor: [17, 10] }) }).addTo(mapObj);
      pino.on("click", () => abreLinha(l));
      g.pino = pino; g.todas.push(pino);
      linhasLayers.push(g);
    });
    d.pontos.forEach(p => L.marker([p.lat, p.lon]).addTo(mapObj).bindPopup("<b>" + p.nome + "</b>"));
    if (solidos.length) mapObj.fitBounds(L.featureGroup(solidos).getBounds().pad(0.15));
    colocaPinos();
    status.textContent = "Toque numa linha (ou no número dela) pra ver os detalhes. Ative a localização pra aparecer no mapa.";
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        L.circleMarker([pos.coords.latitude, pos.coords.longitude],
          { radius: 8, color: "#fff", weight: 2, fillColor: "#2563eb", fillOpacity: 1 })
          .addTo(mapObj).bindPopup("Você está aqui");
        status.textContent = "Sua localização está no mapa (ponto azul). Toque numa linha pra ver os detalhes.";
      }, () => { status.textContent = "Permita a localização pra ver onde você está. Toque numa linha pra ver os detalhes."; });
    }
  }).catch(() => { status.textContent = "Não consegui carregar o mapa. Abra pela URL do GitHub Pages."; });
  setTimeout(() => mapObj.invalidateSize(), 250);
}

// trocar de aba só muda o conteúdo do trajeto (o mapa é compartilhado)
document.getElementById("abas").addEventListener("click", e => {
  const aba = e.target.dataset.aba; if (!aba) return;
  document.querySelectorAll(".abas button").forEach(b => b.classList.toggle("on", b.dataset.aba === aba));
  document.querySelectorAll("#faixaTrajeto .aba-conteudo").forEach(c => c.classList.toggle("on", c.id === "aba-" + aba));
});

// faixas recolhíveis (gaveta): mapa em cima, trajeto embaixo
document.querySelectorAll(".faixaCab").forEach(b => {
  b.onclick = () => {
    const sec = b.closest(".faixa");
    sec.classList.toggle("recolhida");
    if (sec.id === "faixaMapa" && mapObj && !sec.classList.contains("recolhida"))
      setTimeout(() => mapObj.invalidateSize(), 210);
  };
});

// ---- Casa / Trabalho: salvo no navegador (localStorage) + pino no mapa ----
const LOC = { casa: null, trabalho: null };
let pinCasa = null, pinTrab = null, tipoEdit = null;
const ovLoc = document.getElementById("ovLoc");
const locInput = document.getElementById("locInput");
const locMsg = document.getElementById("locMsg");
const locTitulo = document.getElementById("locTitulo");
const curto = q => q.split(",").slice(0, 2).join(",").trim();

function carregaLoc() {
  try {
    LOC.casa = JSON.parse(localStorage.getItem("oc_casa") || "null");
    LOC.trabalho = JSON.parse(localStorage.getItem("oc_trabalho") || "null");
  } catch (e) {}
  pintaChips();
}
function pintaChips() {
  const setChip = (id, rec, vazio) => {
    const el = document.getElementById(id);
    el.querySelector(".txt").textContent = rec ? rec.label : vazio;
    el.classList.toggle("set", !!rec);
  };
  setChip("chipCasa", LOC.casa, "definir casa");
  setChip("chipTrab", LOC.trabalho, "definir trabalho");
}
function colocaPinos() {
  if (!mapObj) return;
  const mk = (rec, emoji, nome) => L.marker([rec.lat, rec.lon], {
    icon: L.divIcon({ className: "pino-wrap", html: `<span class="pinoLoc">${emoji}</span>`, iconSize: [30, 30], iconAnchor: [15, 30] })
  }).addTo(mapObj).bindPopup(`<b>${nome}</b><br>${rec.endereco}`);
  if (pinCasa) { mapObj.removeLayer(pinCasa); pinCasa = null; }
  if (pinTrab) { mapObj.removeLayer(pinTrab); pinTrab = null; }
  if (LOC.casa && LOC.casa.lat != null) pinCasa = mk(LOC.casa, "🏠", "Casa");
  if (LOC.trabalho && LOC.trabalho.lat != null) pinTrab = mk(LOC.trabalho, "💼", "Trabalho");
}
function abreLoc(tipo) {
  tipoEdit = tipo;
  locTitulo.textContent = tipo === "casa" ? "Definir casa" : "Definir trabalho";
  const atual = LOC[tipo];
  locInput.value = atual ? (atual.endereco || atual.label) : "";
  locMsg.textContent = "Digite o endereço. Localizo no mapa e salvo no seu navegador.";
  ovLoc.classList.add("on");
  setTimeout(() => locInput.focus(), 120);
}
document.getElementById("chipCasa").onclick = () => abreLoc("casa");
document.getElementById("chipTrab").onclick = () => abreLoc("trabalho");
ovLoc.onclick = e => { if (e.target === ovLoc) ovLoc.classList.remove("on"); };

document.getElementById("locSalvar").onclick = async () => {
  const q = locInput.value.trim();
  if (!q) { locMsg.textContent = "Digite um endereço."; return; }
  locMsg.textContent = "Localizando…";
  let lat = null, lon = null;
  try {
    const u = "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q="
      + encodeURIComponent(q + ", Curitiba, PR");
    const r = await fetch(u, { headers: { "Accept-Language": "pt-BR" } });
    const j = await r.json();
    if (j && j.length) { lat = +j[0].lat; lon = +j[0].lon; }
  } catch (e) {}
  const rec = { label: curto(q), endereco: q, lat, lon };
  LOC[tipoEdit] = rec;
  try { localStorage.setItem("oc_" + tipoEdit, JSON.stringify(rec)); } catch (e) {}
  pintaChips();
  colocaPinos();
  if (lat == null) {
    locMsg.textContent = "Salvei o endereço, mas não achei no mapa agora (pode ser a conexão). Dá pra tentar de novo depois.";
  } else {
    if (mapObj) mapObj.panTo([lat, lon]);
    ovLoc.classList.remove("on");
  }
};

// ---- carrega os dados e liga tudo ----
buildCirc(roloH, 24); buildCirc(roloM, 60);
const agora = new Date();
selH = agora.getHours(); selM = agora.getMinutes();

carregaLoc();
initMapa();

fetch("dados/trajeto.json")
  .then(r => r.json())
  .then(d => {
    GRADE = d.horarios_cabral.map(h => ({ linha: h.linha, nome: h.nome, saidas: [...h.saidas].sort((a, b) => toMin(a) - toMin(b)) }));
    const fv = document.getElementById("validade");
    if (fv && d.meta) fv.textContent = `Horários do GTFS de Curitiba · feed ${fmtData(d.meta.feed_inicio)}–${fmtData(d.meta.feed_fim)} (dia útil). Tempos com ~ são estimados.`;
    render();
  })
  .catch(() => {
    lista.innerHTML = '<div class="detalhe" style="padding-top:6px">Não consegui carregar os horários. Lembra: abra pela URL do GitHub Pages, não pelo arquivo solto.</div>';
  });
