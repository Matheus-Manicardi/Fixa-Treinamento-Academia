
"use strict";

// ==========================================
// 1. CONFIGURAÇÃO DO SUPABASE
// ==========================================

const SUPABASE_URL = "https://tdgagcutzczneriobbtc.supabase.co";
const SUPABASE_KEY = "sb_publishable_rxmejD6wjG0U6O5FyEt7Sw_hls-YHaa";

if (!window.supabase) {
    alert("A biblioteca do Supabase não carregou. Verifique sua conexão e o HTML.");
    throw new Error("Biblioteca Supabase indisponível.");
}

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ==========================================
// 2. ESTADO DA APLICAÇÃO
// ==========================================

let listaTreinos = [];
let treinoAtualId = null;
let treinoAtualLetra = null;
let carregando = false;

const $ = (id) => document.getElementById(id);

function mostrarStatus(mensagem, erro = false) {
    const elemento = $("mensagem-status");

    elemento.textContent = mensagem;
    elemento.style.color = erro ? "#dc2626" : "#16a34a";
}

function tratarErro(operacao, error) {
    console.error(`[${operacao}]`, error);

    const mensagem = error?.message || "Erro desconhecido.";
    mostrarStatus(`${operacao}: ${mensagem}`, true);
}

function definirBotoesDesabilitados(valor) {
    $("btn-novo-treino").disabled = valor;
    $("btn-excluir-treino").disabled = valor;
    $("form-exercicio").querySelector("button[type='submit']").disabled = valor;
}

// ==========================================
// 3. CARREGAR TREINOS DO BANCO
// ==========================================

async function carregarDados() {
    if (carregando) return;

    carregando = true;
    $("titulo-treino").textContent = "Carregando...";
    $("lista-exercicios").replaceChildren();

    try {
        const { data, error } = await db
            .from("treinos")
            .select("*")
            .order("letra", { ascending: true });

        if (error) throw error;

        listaTreinos = data || [];

        // Preserva o treino selecionado se ele ainda existir.
        const treinoSelecionado = listaTreinos.find(
            treino => String(treino.id) === String(treinoAtualId)
        );

        if (treinoSelecionado) {
            treinoAtualId = treinoSelecionado.id;
            treinoAtualLetra = treinoSelecionado.letra;
        } else if (listaTreinos.length > 0) {
            treinoAtualId = listaTreinos[0].id;
            treinoAtualLetra = listaTreinos[0].letra;
        } else {
            treinoAtualId = null;
            treinoAtualLetra = null;
        }

        renderizarAbas();

        if (treinoAtualId !== null) {
            await renderizarExercicios();
        } else {
            $("titulo-treino").textContent = "Nenhum treino cadastrado";

            const aviso = document.createElement("li");
            aviso.textContent = "Clique em + Novo Treino para começar.";
            $("lista-exercicios").appendChild(aviso);
        }
    } catch (error) {
        tratarErro("Erro ao carregar treinos", error);
        $("titulo-treino").textContent = "Falha ao carregar treinos";
    } finally {
        carregando = false;
    }
}

// ==========================================
// 4. RENDERIZAR ABAS
// ==========================================

function renderizarAbas() {
    const container = $("abas-treinos");
    container.replaceChildren();

    listaTreinos.forEach(treino => {
        const botao = document.createElement("button");

        botao.type = "button";
        botao.className = "btn-treino";
        botao.textContent = `Treino ${treino.letra}`;

        if (String(treino.id) === String(treinoAtualId)) {
            botao.classList.add("ativo");
        }

        botao.addEventListener("click", () => {
            treinoAtualId = treino.id;
            treinoAtualLetra = treino.letra;

            renderizarAbas();
            renderizarExercicios();
        });

        container.appendChild(botao);
    });
}

// ==========================================
// 5. CARREGAR EXERCÍCIOS
// ==========================================

async function renderizarExercicios() {
    const lista = $("lista-exercicios");
    lista.replaceChildren();

    if (treinoAtualId === null) {
        $("titulo-treino").textContent = "Nenhum treino";
        return;
    }

    $("titulo-treino").textContent = `Treino ${treinoAtualLetra}`;

    const carregandoItem = document.createElement("li");
    carregandoItem.textContent = "Carregando exercícios...";
    lista.appendChild(carregandoItem);

    try {
        const { data, error } = await db
            .from("exercicios")
            .select("*")
            .eq("treino_id", treinoAtualId)
            .order("created_at", { ascending: true });

        if (error) throw error;

        lista.replaceChildren();

        if (!data || data.length === 0) {
            const item = document.createElement("li");
            item.textContent = "Nenhum exercício cadastrado neste treino.";
            lista.appendChild(item);
            return;
        }

        data.forEach(exercicio => {
            const item = document.createElement("li");
            item.className = "item-exercicio";

            if (exercicio.concluido) {
                item.classList.add("concluido");
            }

            const info = document.createElement("div");
            info.className = "info-ex";
            info.style.cssText = "cursor:pointer; flex:1;";

            const nome = document.createElement("strong");
            nome.textContent = exercicio.nome;

            const detalhes = document.createElement("span");
            detalhes.textContent = exercicio.detalhes || "";

            info.append(nome, document.createElement("br"), detalhes);

            info.addEventListener("click", () => {
                alternarConcluido(exercicio.id, !!exercicio.concluido);
            });

            const botoes = document.createElement("div");
            botoes.className = "botoes-item";

            const editar = document.createElement("button");
            editar.type = "button";
            editar.className = "btn-item";
            editar.textContent = "✏️";
            editar.title = "Editar exercício";
            editar.addEventListener("click", () => editarExercicio(exercicio));

            const excluir = document.createElement("button");
            excluir.type = "button";
            excluir.className = "btn-item";
            excluir.textContent = "🗑️";
            excluir.title = "Excluir exercício";
            excluir.addEventListener("click", () => removerExercicio(exercicio.id));

            botoes.append(editar, excluir);
            item.append(info, botoes);
            lista.appendChild(item);
        });
    } catch (error) {
        tratarErro("Erro ao carregar exercícios", error);
        lista.replaceChildren();

        const item = document.createElement("li");
        item.textContent = "Não foi possível carregar os exercícios. Confira a mensagem de erro.";
        lista.appendChild(item);
    }
}

// ==========================================
// 6. ADICIONAR EXERCÍCIO
// ==========================================

async function adicionarExercicio(event) {
    event.preventDefault();

    if (treinoAtualId === null) {
        mostrarStatus("Crie ou selecione um treino antes de adicionar exercícios.", true);
        return;
    }

    const nome = $("novo-exercicio").value.trim();
    const detalhes = $("detalhes-exercicio").value.trim();

    if (!nome || !detalhes) {
        mostrarStatus("Preencha o nome e os detalhes do exercício.", true);
        return;
    }

    definirBotoesDesabilitados(true);

    try {
        const { data, error } = await db
            .from("exercicios")
            .insert({
                treino_id: treinoAtualId,
                nome,
                detalhes,
                concluido: false
            })
            .select()
            .single();

        if (error) throw error;

        $("form-exercicio").reset();

        await renderizarExercicios();

        mostrarStatus(`Exercício "${data.nome}" salvo com sucesso.`);
        console.log("Exercício gravado no Supabase:", data);
    } catch (error) {
        tratarErro("Não foi possível salvar o exercício", error);
    } finally {
        definirBotoesDesabilitados(false);
    }
}

// ==========================================
// 7. MARCAR COMO CONCLUÍDO
// ==========================================

async function alternarConcluido(id, estadoAtual) {
    try {
        const { error } = await db
            .from("exercicios")
            .update({ concluido: !estadoAtual })
            .eq("id", id);

        if (error) throw error;

        await renderizarExercicios();
        mostrarStatus("Status do exercício atualizado.");
    } catch (error) {
        tratarErro("Não foi possível atualizar o exercício", error);
    }
}

// ==========================================
// 8. EDITAR EXERCÍCIO
// ==========================================

async function editarExercicio(exercicio) {
    const nome = prompt("Nome do exercício:", exercicio.nome);
    if (nome === null) return;

    const nomeFinal = nome.trim();

    if (!nomeFinal) {
        mostrarStatus("O nome do exercício não pode ficar vazio.", true);
        return;
    }

    const detalhes = prompt("Séries e repetições:", exercicio.detalhes || "");
    if (detalhes === null) return;

    const detalhesFinal = detalhes.trim();

    if (!detalhesFinal) {
        mostrarStatus("Informe as séries e repetições.", true);
        return;
    }

    try {
        const { error } = await db
            .from("exercicios")
            .update({
                nome: nomeFinal,
                detalhes: detalhesFinal
            })
            .eq("id", exercicio.id);

        if (error) throw error;

        await renderizarExercicios();
        mostrarStatus("Exercício atualizado com sucesso.");
    } catch (error) {
        tratarErro("Não foi possível editar o exercício", error);
    }
}

// ==========================================
// 9. EXCLUIR EXERCÍCIO
// ==========================================

async function removerExercicio(id) {
    if (!confirm("Deseja excluir este exercício?")) return;

    try {
        const { error } = await db
            .from("exercicios")
            .delete()
            .eq("id", id);

        if (error) throw error;

        await renderizarExercicios();
        mostrarStatus("Exercício excluído.");
    } catch (error) {
        tratarErro("Não foi possível excluir o exercício", error);
    }
}

// ==========================================
// 10. CRIAR NOVO TREINO
// ==========================================

async function criarNovoTreino() {
    const letrasEmUso = new Set(listaTreinos.map(t => t.letra));
    let proximaLetra = null;

    for (let i = 0; i < 26; i++) {
        const letra = String.fromCharCode(65 + i);

        if (!letrasEmUso.has(letra)) {
            proximaLetra = letra;
            break;
        }
    }

    if (!proximaLetra) {
        mostrarStatus("Limite de 26 treinos atingido.", true);
        return;
    }

    definirBotoesDesabilitados(true);

    try {
        const { data, error } = await db
            .from("treinos")
            .insert({ letra: proximaLetra })
            .select()
            .single();

        if (error) throw error;

        treinoAtualId = data.id;
        treinoAtualLetra = data.letra;

        await carregarDados();
        mostrarStatus(`Treino ${data.letra} criado com sucesso.`);
    } catch (error) {
        tratarErro("Não foi possível criar o treino", error);
    } finally {
        definirBotoesDesabilitados(false);
    }
}

// ==========================================
// 11. EXCLUIR TREINO
// ==========================================

async function deletarTreinoAtual() {
    if (treinoAtualId === null) {
        mostrarStatus("Não há treino selecionado.", true);
        return;
    }

    if (!confirm(
        `Deseja apagar o Treino ${treinoAtualLetra} e todos os seus exercícios?`
    )) {
        return;
    }

    const idExcluido = treinoAtualId;

    definirBotoesDesabilitados(true);

    try {
        // Exclui primeiro os exercícios para não depender de CASCADE.
        const { error: erroExercicios } = await db
            .from("exercicios")
            .delete()
            .eq("treino_id", idExcluido);

        if (erroExercicios) throw erroExercicios;

        const { error: erroTreino } = await db
            .from("treinos")
            .delete()
            .eq("id", idExcluido);

        if (erroTreino) throw erroTreino;

        treinoAtualId = null;
        treinoAtualLetra = null;

        await carregarDados();
        mostrarStatus("Treino excluído com sucesso.");
    } catch (error) {
        tratarErro("Não foi possível excluir o treino", error);
    } finally {
        definirBotoesDesabilitados(false);
    }
}

// ==========================================
// 12. INICIAR A APLICAÇÃO
// ==========================================

$("form-exercicio").addEventListener("submit", adicionarExercicio);

$("btn-novo-treino").addEventListener("click", criarNovoTreino);

$("btn-excluir-treino").addEventListener("click", deletarTreinoAtual);

carregarDados();
