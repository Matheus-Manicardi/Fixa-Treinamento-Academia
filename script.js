// Configuração do Supabase
const SUPABASE_URL = "SEU_SUPABASE_URL";
const SUPABASE_KEY = "SUA_SUPABASE_ANON_KEY";
const supabase = @supabase/supabase-js.createClient(SUPABASE_URL, SUPABASE_KEY);

// Estados locais da aplicação
let listaTreinos = []; // Armazenará a lista de treinos vindos do banco
let treinoAtualId = null; // ID do treino selecionado no momento
let treinoAtualLetra = 'A';

// 1. CARREGAR DADOS DO BANCO
async function carregarDados() {
    // Busca os treinos ordenados por letra
    const { data: treinos, error: errTreinos } = await supabase
        .from('treinos')
        .select('*')
        .order('letra', { ascending: true });

    if (errTreinos) return console.error(errTreinos);
    listaTreinos = treinos;

    // Se houver treinos salvos e nenhum selecionado, seleciona o primeiro
    if (listaTreinos.length > 0 && !treinoAtualId) {
        treinoAtualId = listaTreinos[0].id;
        treinoAtualLetra = listaTreinos[0].letra;
    }

    renderizarAbas();
    renderizarExercicios();
}

// 2. RENDERIZAR BOTÕES DE ABAS
function renderizarAbas() {
    const containerAbas = document.getElementById('abas-treinos');
    containerAbas.innerHTML = '';

    listaTreinos.forEach(treino => {
        const classeAtivo = treino.id === treinoAtualId ? 'ativo' : '';
        containerAbas.innerHTML += `
            <button class="btn-treino ${classeAtivo}" onclick="mudarTreino('${treino.id}', '${treino.letra}')">
                Treino ${treino.letra}
            </button>
        `;
    });
}

// 3. RENDERIZAR LISTA DE EXERCÍCIOS
async function renderizarExercicios() {
    const lista = document.getElementById('lista-exercicios');
    const titulo = document.getElementById('titulo-treino');
    
    if (!treinoAtualId) {
        titulo.innerText = "Nenhum treino";
        lista.innerHTML = '<p style="color: #aaa; text-align: center; padding: 20px;">Crie um treino para começar.</p>';
        return;
    }

    titulo.innerText = `Treino ${treinoAtualLetra}`;
    lista.innerHTML = '<p style="color: #aaa; text-align: center;">Carregando...</p>';

    // Busca exercícios vinculados ao treino ativo
    const { data: exercicios, error } = await supabase
        .from('exercicios')
        .select('*')
        .eq('treino_id', treinoAtualId)
        .order('created_at', { ascending: true });

    if (error) return console.error(error);

    lista.innerHTML = '';
    if (exercicios.length === 0) {
        lista.innerHTML = '<p style="color: #aaa; text-align: center; padding: 20px;">Nenhum exercício cadastrado.</p>';
        return;
    }

    exercicios.forEach(ex => {
        lista.innerHTML += `
            <li class="item-exercicio ${ex.concluido ? 'concluido' : ''}">
                <div class="info-ex" onclick="alternarConcluido('${ex.id}', ${ex.concluido})" style="cursor: pointer; flex: 1;">
                    <strong>${ex.nome}</strong><br>
                    <span>${ex.detalhes}</span>
                </div>
                <div class="botoes-item">
                    <button class="btn-item" onclick="editarExercicio('${ex.id}', '${ex.nome}', '${ex.detalhes}')" title="Editar">✏️</button>
                    <button class="btn-item" onclick="removerExercicio('${ex.id}')" title="Excluir">🗑️</button>
                </div>
            </li>
        `;
    });
}

function mudarTreino(id, letra) {
    treinoAtualId = id;
    treinoAtualLetra = letra;
    renderizarAbas();
    renderizarExercicios();
}

// 4. OPERAÇÕES NO BANCO (CRUD EXERCÍCIOS)
async function adicionarExercicio(event) {
    event.preventDefault();
    if (!treinoAtualId) return alert("Crie um treino primeiro!");

    const nome = document.getElementById('novo-exercicio').value;
    const detalhes = document.getElementById('detalhes-exercicio').value;

    await supabase.from('exercicios').insert([{ treino_id: treinoAtualId, nome, detalhes }]);

    document.getElementById('novo-exercicio').value = '';
    document.getElementById('detalhes-exercicio').value = '';
    renderizarExercicios();
}

async function alternarConcluido(id, estadoAtual) {
    await supabase.from('exercicios').update({ concluido: !estadoAtual }).eq('id', id);
    renderizarExercicios();
}

async function editarExercicio(id, nomeAtual, detalhesAtual) {
    const novoNome = prompt("Altere o nome do exercício:", nomeAtual);
    if (!novoNome || novoNome.trim() === "") return;

    const novosDetalhes = prompt("Altere os detalhes:", detalhesAtual);
    if (!novosDetalhes || novosDetalhes.trim() === "") return;

    await supabase.from('exercicios').update({ nome: novoNome, detalhes: novosDetalhes }).eq('id', id);
    renderizarExercicios();
}

async function removerExercicio(id) {
    await supabase.from('exercicios').delete().eq('id', id);
    renderizarExercicios();
}

// 5. OPERAÇÕES NO BANCO (CRUD TREINOS)
async function criarNovoTreino() {
    const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const letrasEmUso = listaTreinos.map(t => t.letra);
    const proximaLetra = alfabeto.split('').find(letra => !letrasEmUso.includes(letra));

    if (!proximaLetra) return alert("Limite máximo de treinos atingido!");

    const { data, error } = await supabase.from('treinos').insert([{ letra: proximaLetra }]).select();
    
    if (error) return console.error(error);

    // Foca automaticamente no treino recém criado
    treinoAtualId = data[0].id;
    treinoAtualLetra = data[0].letra;
    carregarDados();
}

async function deletarTreinoAtual() {
    if (!treinoAtualId) return;

    if (confirm(`Apagar o Treino ${treinoAtualLetra} deletará todos os seus exercícios. Continuar?`)) {
        // O banco deletará os exercícios automaticamente por conta do "on delete cascade"
        await supabase.from('treinos').delete().eq('id', treinoAtualId);
        
        treinoAtualId = null; // Reseta seleção para recarregar o primeiro da lista
        carregarDados();
    }
}

// Inicializa a aplicação buscando dados do Supabase
carregarDados();
