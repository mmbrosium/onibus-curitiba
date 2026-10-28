// Busca das 309 linhas de Curitiba — lê dados/linhas.json
const elLista = document.getElementById("lista");
const elBusca = document.getElementById("busca");
const elStatus = document.getElementById("status");
let todas = [];

function desenhar(linhas) {
  elLista.innerHTML = linhas.map(l =>
    `<div class="linhaItem"><span class="id">${l.id}</span><span>${l.nome}</span></div>`
  ).join("");
}

fetch("dados/linhas.json")
  .then(r => r.json())
  .then(linhas => {
    todas = linhas;
    elStatus.textContent = `${linhas.length} linhas`;
    desenhar(linhas);
  })
  .catch(() => { elStatus.textContent = "Não consegui carregar (abra pela URL do GitHub, não pelo arquivo solto)."; });

elBusca.addEventListener("input", () => {
  const t = elBusca.value.trim().toLowerCase();
  const f = todas.filter(l => l.nome.toLowerCase().includes(t) || l.id.toLowerCase().includes(t));
  elStatus.textContent = `${f.length} linhas`;
  desenhar(f);
});
