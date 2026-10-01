// Base de dados inicial dos treinos
let treinos = {
    A: [
        { nome: "Supino Reto", detalhes: "4x10" },
        { nome: "Tríceps Pulley", detalhes: "4x12" }
    ],
    B: [
        { nome: "Puxada Alta", detalhes: "4x10" },
        { nome: "Rosca Direta", detalhes: "3x12" }
    ]
};

let treinoAtual = 'A';

// Renderiza os botões das abas superiores (A, B, C...)
function renderizarAbas() {
    const containerAbas = document.getElementById('abas-treinos');
    containerAbas.innerHTML = '';

    Object.keys(treinos).forEach(letra => {
        const classeAtivo = letra === treinoAtual ? 'ativo' : '';
        containerAbas.innerHTML += `
            <button class="btn-treino ${classeAtivo}" onclick="mudarTreino('${letra}')">
                Treino ${letra}
            </button>
        `;
    });
}

// Renderiza a lista de exercícios do treino selecionado
function renderizarExercicios() {
    const lista = document.getElementById('lista-exercicios');
    const titulo = document.getElementById('titulo-treino');
    
    titulo.innerText = `Treino ${treinoAtual}`;
    lista.innerHTML = '';

    // Se o treino foi deletado ou está vazio, avisa o usuário
    if (!treinos[treinoAtual] || treinos[treinoAtual].length === 0) {
        lista.innerHTML = '<p style="color: #aaa; text-align: center; padding: 20px;">Nenhum exercício cadastrado.</p>';
        return;
    }

    treinos[treinoAtual].forEach((ex, index) => {
        lista.innerHTML += `
            <li class="item-exercicio ${ex.concluido ? 'concluido' : ''}">
                <div class="info-ex" onclick="alternarConcluido(${index})" style="cursor: pointer; flex: 1;">
                    <strong>${ex.nome}</strong><br>
                    <span>${ex.detalhes}</span>
                </div>
                <div class="botoes-item">
                    <button class="btn-item" onclick="editarExercicio(${index})" title="Editar">✏️</button>
                    <button class="btn-item" onclick="removerExercicio(${index})" title="Excluir">🗑️</button>
                </div>
            </li>
        `;
    });
}

function mudarTreino(tipo) {
    treinoAtual = tipo;
    renderizarAbas();
    renderizarExercicios();
}

function alternarConcluido(index) {
    treinos[treinoAtual][index].concluido = !treinos[treinoAtual][index].concluido;
    renderizarExercicios();
}

function adicionarExercicio(event) {
    event.preventDefault();
    const nome = document.getElementById('novo-exercicio').value;
    const detalhes = document.getElementById('detalhes-exercicio').value;

    if (!treinos[treinoAtual]) {
        alert("Crie ou selecione um treino válido primeiro!");
        return;
    }

    treinos[treinoAtual].push({ nome, detalhes, concluido: false });
    
    document.getElementById('novo-exercicio').value = '';
    document.getElementById('detalhes-exercicio').value = '';
    renderizarExercicios();
}

// NOVA FUNÇÃO: Edita o exercício usando caixas de prompt simples
function editarExercicio(index) {
    const ex = treinos[treinoAtual][index];
    
    const novoNome = prompt("Altere o nome do exercício:", ex.nome);
    if (novoNome === null || novoNome.trim() === "") return; // Cancela se vazio ou cancelado

    const novosDetalhes = prompt("Altere os detalhes (séries/repetições):", ex.detalhes);
    if (novosDetalhes === null || novosDetalhes.trim() === "") return;

    treinos[treinoAtual][index].nome = novoNome;
    treinos[treinoAtual][index].detalhes = novosDetalhes;
    renderizarExercicios();
}

function removerExercicio(index) {
    treinos[treinoAtual].splice(index, 1);
    renderizarExercicios();
}

// NOVA FUNÇÃO: Adiciona uma nova letra/treino à lista
function criarNovoTreino() {
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const chavesAtuais = Object.keys(treinos);
    
    // Descobre a próxima letra disponível do alfabeto
    let proximaLetra = letras.split('').find(letra => !chavesAtuais.includes(letra));

    if (!proximaLetra) {
        alert("Limite máximo de treinos atingido!");
        return;
    }

    treinos[proximaLetra] = [];
    treinoAtual = proximaLetra; // Muda o foco para o novo treino criado
    atualizarInterface();
}

// NOVA FUNÇÃO: Remove o treino atual
function deletarTreinoAtual() {
    const chavesAtuais = Object.keys(treinos);
    
    if (chavesAtuais.length <= 1) {
        alert("Você deve manter pelo menos um treino na sua lista!");
        return;
    }

    if (confirm(`Tem certeza que deseja apagar todo o Treino ${treinoAtual}?`)) {
        delete treinos[treinoAtual];
        // Seleciona a primeira chave disponível como treino padrão
        treinoAtual = Object.keys(treinos)[0];
        atualizarInterface();
    }
}

// Atualiza todas as partes da tela
function atualizarInterface() {
    renderizarAbas();
    renderizarExercicios();
}

// Inicializa o sistema ao abrir a tela
atualizarInterface();
