const API_URL = "http://localhost:3000";

async function carregarDashboard(inicio = "", fim = "") {

    try {

        let url = `${API_URL}/dashboard`;

        if (inicio && fim) {
            url += `?inicio=${inicio}&fim=${fim}`;
        }

        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error("Erro ao buscar dados do dashboard.");
        }

        const dados = await resposta.json();

        console.log("Dados recebidos da API:", dados);

        atualizarDashboard(dados);

    } catch (erro) {

        console.error("Erro:", erro);

    }
}


function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


function atualizarDashboard(dados) {

    document.getElementById("faturamento").textContent =
        formatarMoeda(dados.faturamento);

    document.getElementById("lucro").textContent =
        formatarMoeda(dados.lucro);

    document.getElementById("quantidade-vendas").textContent =
        dados.quantidade_vendas;

    document.getElementById("ticket-medio").textContent =
        formatarMoeda(dados.ticket_medio);

    document.getElementById("custo-produtos").textContent =
        formatarMoeda(dados.custo_produtos);

    document.getElementById("taxas").textContent =
        formatarMoeda(dados.taxas);

    document.getElementById("margem").textContent =
        `${Number(dados.margem || 0).toFixed(2)}%`;

    document.getElementById("produtos-vendidos").textContent =
        dados.produtos_vendidos;

    atualizarCanais(dados.canais);
    criarGraficoCanais(dados.canais);
    criarGraficoFinanceiro(dados.evolucao);
}


function atualizarCanais(canais) {

    const container = document.getElementById("canais");

    container.innerHTML = "";

    if (!canais || canais.length === 0) {
        container.innerHTML = "<p>Nenhuma venda encontrada.</p>";
        return;
    }

    canais.forEach(canal => {

        const elemento = document.createElement("div");

        elemento.classList.add("canal");

        elemento.innerHTML = `
            <div class="canal-nome">
                ${canal.canal}
            </div>

            <div class="canal-info">
                <strong>${formatarMoeda(canal.faturamento)}</strong>
                <small>${canal.vendas} venda(s)</small>
            </div>
        `;

        container.appendChild(elemento);
    });
}

document.getElementById("btn-filtrar").addEventListener("click", () => {

    const inicio = document.getElementById("data-inicio").value;
    const fim = document.getElementById("data-fim").value;

    if (!inicio || !fim) {
        alert("Informe a data inicial e a data final.");
        return;
    }

    carregarDashboard(inicio, fim);
});

function criarGraficoCanais(canais) {

    const canvas = document.getElementById("graficoCanais");

    if (!canvas) {
        console.error("Canvas do gráfico não encontrado.");
        return;
    }

    if (typeof Chart === "undefined") {
        console.error("Chart.js não foi carregado.");
        return;
    }

    // Verifica se já existe um gráfico nesse canvas
    const graficoExistente = Chart.getChart(canvas);

    if (graficoExistente) {
        graficoExistente.destroy();
    }

    const nomes = canais.map(canal => canal.canal);

    const faturamento = canais.map(canal =>
        Number(canal.faturamento)
    );

    const lucro = canais.map(canal =>
        Number(canal.lucro)
    );

    const grafico = new Chart(canvas, {

        type: "bar",

        data: {
            labels: nomes,

            datasets: [
                {
                    label: "Faturamento",
                    data: faturamento
                },
                {
                    label: "Lucro",
                    data: lucro
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom"
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    ticks: {
                        callback: function(valor) {
                            return valor.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL"
                            });
                        }
                    }
                }
            }
        }

    });

    return grafico;
}

function criarGraficoFinanceiro(evolucao) {

    const canvas = document.getElementById("graficoFinanceiro");

    if (!canvas) {
        console.error("Canvas do gráfico financeiro não encontrado.");
        return;
    }

    if (typeof Chart === "undefined") {
        console.error("Chart.js não foi carregado.");
        return;
    }

    const graficoExistente = Chart.getChart(canvas);

    if (graficoExistente) {
        graficoExistente.destroy();
    }

    const datas = evolucao.map(item => {

        const data = new Date(`${item.data}T00:00:00`);

        return data.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit"
        });

    });


    const faturamento = evolucao.map(item =>
        Number(item.faturamento)
    );


    const lucro = evolucao.map(item =>
        Number(item.lucro)
    );


    new Chart(canvas, {

        type: "line",

        data: {

            labels: datas,

            datasets: [

                {
                    label: "Faturamento",

                    data: faturamento,

                    tension: 0.3,

                    fill: false
                },

                {
                    label: "Lucro",

                    data: lucro,

                    tension: 0.3,

                    fill: false
                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {

                legend: {
                    position: "bottom"
                }

            },

            scales: {

                y: {

                    beginAtZero: true,

                    ticks: {

                        callback: function(valor) {

                            return Number(valor).toLocaleString(
                                "pt-BR",
                                {
                                    style: "currency",
                                    currency: "BRL"
                                }
                            );

                        }

                    }

                }

            }

        }

    });

}

carregarDashboard();