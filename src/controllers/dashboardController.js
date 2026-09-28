const db = require("../database/database");


// =========================
// ARREDONDAR VALORES
// =========================

function arredondar(valor) {
    return Number(Number(valor || 0).toFixed(2));
}


// =========================
// DASHBOARD
// =========================

function obterDashboard(req, res) {

    const { inicio, fim } = req.query;


    // =========================
    // VALIDAÇÃO DAS DATAS
    // =========================

    if ((inicio && !fim) || (!inicio && fim)) {

        return res.status(400).json({
            erro: "Informe inicio e fim."
        });

    }


    if (inicio && fim) {

        const formatoData = /^\d{4}-\d{2}-\d{2}$/;


        if (
            !formatoData.test(inicio) ||
            !formatoData.test(fim)
        ) {

            return res.status(400).json({
                erro: "As datas devem estar no formato YYYY-MM-DD."
            });

        }


        if (inicio > fim) {

            return res.status(400).json({
                erro: "A data inicial não pode ser maior que a data final."
            });

        }

    }


    // =========================
    // FILTRO
    // =========================

    let filtro = "";
    let parametros = [];


    if (inicio && fim) {

        filtro = `
            WHERE date(data)
            BETWEEN date(?) AND date(?)
        `;

        parametros = [inicio, fim];

    }


    // =========================
    // RESUMO
    // =========================

    const sqlResumo = `
        SELECT

            COUNT(*) AS quantidade_vendas,

            COALESCE(
                SUM(
                    subtotal -
                    desconto +
                    frete
                ),
                0
            ) AS faturamento,

            COALESCE(
                SUM(custo_produtos),
                0
            ) AS custo_produtos,

            COALESCE(
                SUM(taxas),
                0
            ) AS taxas,

            COALESCE(
                SUM(lucro),
                0
            ) AS lucro

        FROM vendas

        ${filtro}
    `;


    db.get(
        sqlResumo,
        parametros,
        (err, resumo) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    erro: "Erro ao calcular dashboard."
                });

            }


            // =========================
            // PRODUTOS VENDIDOS
            // =========================

            let filtroItens = "";
            let parametrosItens = [];


            if (inicio && fim) {

                filtroItens = `
                    WHERE date(vendas.data)
                    BETWEEN date(?) AND date(?)
                `;

                parametrosItens = [inicio, fim];

            }


            const sqlQuantidade = `
                SELECT

                    COALESCE(
                        SUM(itens_venda.quantidade),
                        0
                    ) AS produtos_vendidos

                FROM itens_venda

                INNER JOIN vendas
                    ON vendas.id = itens_venda.venda_id

                ${filtroItens}
            `;


            db.get(
                sqlQuantidade,
                parametrosItens,
                (err, quantidade) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            erro: "Erro ao calcular produtos vendidos."
                        });

                    }


                    // =========================
                    // CÁLCULOS
                    // =========================

                    const faturamento =
                        Number(resumo.faturamento);


                    const lucro =
                        Number(resumo.lucro);


                    const quantidadeVendas =
                        Number(
                            resumo.quantidade_vendas
                        );


                    const ticketMedio =
                        quantidadeVendas > 0
                            ? faturamento / quantidadeVendas
                            : 0;


                    const margem =
                        faturamento > 0
                            ? (lucro / faturamento) * 100
                            : 0;


                    // =========================
                    // VENDAS POR CANAL
                    // =========================

                    const sqlCanais = `
                        SELECT

                            canal,

                            COUNT(*) AS vendas,

                            COALESCE(
                                SUM(
                                    subtotal -
                                    desconto +
                                    frete
                                ),
                                0
                            ) AS faturamento,

                            COALESCE(
                                SUM(lucro),
                                0
                            ) AS lucro

                        FROM vendas

                        ${filtro}

                        GROUP BY canal

                        ORDER BY faturamento DESC
                    `;


                    db.all(
                        sqlCanais,
                        parametros,
                        (err, canais) => {

                            if (err) {

                                console.error(err);

                                return res.status(500).json({
                                    erro:
                                        "Erro ao calcular vendas por canal."
                                });

                            }


                            // =========================
                            // FORMATAR CANAIS
                            // =========================

                            const canaisFormatados =
                                canais.map(canal => {

                                    const faturamentoCanal =
                                        Number(
                                            canal.faturamento
                                        );


                                    const lucroCanal =
                                        Number(
                                            canal.lucro
                                        );


                                    const margemCanal =
                                        faturamentoCanal > 0
                                            ? (
                                                lucroCanal /
                                                faturamentoCanal
                                            ) * 100
                                            : 0;


                                    return {

                                        canal:
                                            canal.canal,

                                        vendas:
                                            Number(
                                                canal.vendas
                                            ),

                                        faturamento:
                                            arredondar(
                                                faturamentoCanal
                                            ),

                                        lucro:
                                            arredondar(
                                                lucroCanal
                                            ),

                                        margem:
                                            arredondar(
                                                margemCanal
                                            )

                                    };

                                });


                            // =========================
                            // EVOLUÇÃO DIÁRIA
                            // =========================

                            const sqlEvolucao = `
                                SELECT

                                    DATE(data) AS data,

                                    COALESCE(
                                        SUM(
                                            subtotal -
                                            desconto +
                                            frete
                                        ),
                                        0
                                    ) AS faturamento,

                                    COALESCE(
                                        SUM(lucro),
                                        0
                                    ) AS lucro

                                FROM vendas

                                ${filtro}

                                GROUP BY DATE(data)

                                ORDER BY DATE(data)
                            `;


                            db.all(
                                sqlEvolucao,
                                parametros,
                                (err, evolucao) => {

                                    if (err) {

                                        console.error(err);

                                        return res.status(500).json({
                                            erro:
                                                "Erro ao calcular evolução diária."
                                        });

                                    }


                                    // =========================
                                    // FORMATAR EVOLUÇÃO
                                    // =========================

                                    const evolucaoFormatada =
                                        evolucao.map(dia => {

                                            return {

                                                data:
                                                    dia.data,

                                                faturamento:
                                                    arredondar(
                                                        dia.faturamento
                                                    ),

                                                lucro:
                                                    arredondar(
                                                        dia.lucro
                                                    )

                                            };

                                        });


                                    // =========================
                                    // RESPOSTA
                                    // =========================

                                    res.json({

                                        periodo: {

                                            inicio:
                                                inicio || null,

                                            fim:
                                                fim || null

                                        },


                                        faturamento:
                                            arredondar(
                                                faturamento
                                            ),


                                        quantidade_vendas:
                                            quantidadeVendas,


                                        produtos_vendidos:
                                            Number(
                                                quantidade
                                                    .produtos_vendidos
                                            ),


                                        custo_produtos:
                                            arredondar(
                                                resumo.custo_produtos
                                            ),


                                        taxas:
                                            arredondar(
                                                resumo.taxas
                                            ),


                                        lucro:
                                            arredondar(
                                                lucro
                                            ),


                                        margem:
                                            arredondar(
                                                margem
                                            ),


                                        ticket_medio:
                                            arredondar(
                                                ticketMedio
                                            ),


                                        canais:
                                            canaisFormatados,


                                        evolucao:
                                            evolucaoFormatada

                                    });

                                }
                            );

                        }
                    );

                }
            );

        }
    );

}


// =========================
// EXPORTAÇÃO
// =========================

module.exports = {
    obterDashboard
};