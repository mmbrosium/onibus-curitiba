// Ônibus Curitiba — Meu trajeto
// Os horários NÃO moram aqui: vêm de dados/trajeto.json (gerado pelo extrator).

const DIA = 24 * 60, ITEM = 28;
const pad2 = n => String(n).padStart(2, "0");
const toMin = s => { const [h, m] = s.split(":").map(Number); const t = h * 60 + m; return t < 4 * 60 ? t + DIA : t; };
const fmtData = d => d && d.length === 8 ? d.slice(6, 8) + "/" + d.slice(4, 6) : d;

let GRADE = [], selH = 0, selM = 0;
const lista = document.getElementById("lista");
const valHora = document.getElementById("valHora");
const roloH = document.getElementById("roloH");
const roloM = document.getElementById("roloM");

function render() {
  valHora.textContent = pad2(selH) + ":" + pad2(selM);
  let base = selH * 60 + selM; if (base < 4 * 60) base += DIA;
  const prox = GRADE.map(l => { const s = l.saidas.find(x => toMin(x) >= base);
    return s ? { nome: l.nome, linha: l.linha, saida: s, espera: toMin(s) - base } : null; })
    .filter(Boolean).sort((a, b) => toMin(a.saida) - toMin(b.saida));
  if (!prox.length) { lista.innerHTML = '<div class="detalhe" style="padding-top:8px">Sem mais saídas até o fim do dia.</div>'; return; }
  const cls = e => e <= 5 ? "e0" : (e <= 12 ? "e1" : "e2");
  lista.innerHTML = prox.map(o => {
    const md = toMin(o.saida) >= DIA ? '<span class="madruga"> (último, madrugada)</span>' : '';
    return `<div class="saida"><div class="l"><span class="linhaRot alim">${o.linha}</span>${o.nome}${md}</div>
      <div class="r"><span class="h">${o.saida}</span>
      <span class="esp ${cls(o.espera)}">${o.espera === 0 ? "agora!" : o.espera + " min"}</span></div></div>`;
  }).join("");
}

/* ---- seletor circular ---- */
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
    // ordena pela hora real (madrugada conta como fim do dia) pra a "próxima" sair certa
    GRADE = d.horarios_cabral.map(h => ({ linha: h.linha, nome: h.nome, saidas: [...h.saidas].sort((a, b) => toMin(a) - toMin(b)) }));
    const fv = document.getElementById("validade");
    if (fv && d.meta) fv.textContent = `Horários do GTFS de Curitiba · feed ${fmtData(d.meta.feed_inicio)}–${fmtData(d.meta.feed_fim)} (dia útil).`;
    render();
  })
  .catch(() => {
    lista.innerHTML = '<div class="detalhe" style="padding-top:8px">Não consegui carregar os horários. Lembra: este app precisa ser aberto pela URL do GitHub Pages, não pelo arquivo solto no celular.</div>';
  });
