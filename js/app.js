// Ônibus Curitiba — lógica da tela
// Fase 0: carregar, listar e buscar as linhas.
//
// A ideia em 3 passos: (1) buscar o arquivo de dados, (2) desenhar a
// lista, (3) filtrar conforme a pessoa digita.

const elLista = document.getElementById("lista");
const elBusca = document.getElementById("busca");
const elStatus = document.getElementById("status");

let todasAsLinhas = []; // guarda a lista completa na memória

// (1) Carrega o arquivo gerado pelo extrator Python
fetch("dados/linhas.json")
  .then((resposta) => resposta.json())
  .then((linhas) => {
    todasAsLinhas = linhas;
    elStatus.textContent = `${linhas.length} linhas`;
    desenhar(linhas);
  })
  .catch((erro) => {
    elStatus.textContent = "Não consegui carregar as linhas :(";
    console.error(erro);
  });

// (2) Desenha uma lista de linhas na tela
function desenhar(linhas) {
  elLista.innerHTML = ""; // limpa antes de redesenhar
  for (const linha of linhas) {
    const li = document.createElement("li");
    li.className = "linha";
    li.innerHTML = `
      <span class="id">${linha.id}</span>
      <span class="nome">${linha.nome}</span>
    `;
    elLista.appendChild(li);
  }
}

// (3) Filtra conforme a pessoa digita na busca
elBusca.addEventListener("input", () => {
  const termo = elBusca.value.trim().toLowerCase();
  const filtradas = todasAsLinhas.filter(
    (l) =>
      l.nome.toLowerCase().includes(termo) ||
      l.id.toLowerCase().includes(termo)
  );
  elStatus.textContent = `${filtradas.length} linhas`;
  desenhar(filtradas);
});
