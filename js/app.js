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

document.getElementById("abas").addEventListener("click", e => {
  const aba = e.target.dataset.aba; if (!aba) return;
  document.querySelectorAll(".abas button").forEach(b => b.classList.toggle("on", b.dataset.aba === aba));
  document.querySelectorAll(".aba-conteudo").forEach(c => c.classList.toggle("on", c.id === "aba-" + aba));
});

// ---- carrega os dados e liga tudo ----
buildCirc(roloH, 24); buildCirc(roloM, 60);
const agora = new Date();
selH = agora.getHours(); selM = agora.getMinutes();

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
