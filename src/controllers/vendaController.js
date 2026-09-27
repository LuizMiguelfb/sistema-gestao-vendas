const db = require("../database/database");

function arredondar(valor) {
    return Number(Number(valor).toFixed(2));
}

function criarVenda(req, res) {

    const {
        canal,
        itens
    } = req.body;

    const desconto = Number(req.body.desconto || 0);
    const frete = Number(req.body.frete || 0);
    const taxas = Number(req.body.taxas || 0);

    // =========================
    // VALIDAÇÕES
    // =========================

    if (!canal) {
        return res.status(400).json({
            erro: "O canal da venda é obrigatório."
        });
    }

    if (!Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({
            erro: "A venda precisa ter pelo menos um item."
        });
    }

    for (const item of itens) {

        if (!item.produto_id) {
            return res.status(400).json({
                erro: "O produto_id é obrigatório."
            });
        }

        if (!Number.isInteger(item.quantidade) || item.quantidade <= 0) {
            return res.status(400).json({
                erro: "A quantidade deve ser um número inteiro maior que zero."
            });
        }
    }

    // =========================
    // INICIAR TRANSAÇÃO
    // =========================

    db.serialize(() => {

        db.run("BEGIN TRANSACTION");

        buscarProdutos(0, []);
    });

    // =========================
    // BUSCAR PRODUTOS
    // =========================

    function buscarProdutos(index, produtos) {

        if (index >= itens.length) {
            finalizarVenda(produtos);
            return;
        }

        const item = itens[index];

        const sql = `
            SELECT *
            FROM produtos
            WHERE id = ? AND ativo = 1
        `;

        db.get(sql, [item.produto_id], (err, produto) => {

            if (err) {
                return rollback("Erro ao buscar produto.");
            }

            if (!produto) {
                return rollback(
                    `Produto ${item.produto_id} não encontrado.`
                );
            }

            if (produto.estoque < item.quantidade) {
                return rollback(
                    `Estoque insuficiente para o produto ${produto.nome}.`
                );
            }

            produtos.push({
                produto,
                quantidade: item.quantidade
            });

            buscarProdutos(index + 1, produtos);
        });
    }

    // =========================
    // FINALIZAR VENDA
    // =========================

    function finalizarVenda(produtos) {

        let subtotal = 0;
        let custoProdutos = 0;

        produtos.forEach(item => {

            subtotal +=
                Number(item.produto.preco) * Number(item.quantidade);

            custoProdutos +=
                Number(item.produto.custo) * Number(item.quantidade);
        });

        subtotal = arredondar(subtotal);
        custoProdutos = arredondar(custoProdutos);

        const total =
            arredondar(subtotal - desconto + frete);

        const lucro =
            arredondar(total - taxas - custoProdutos);

        const data =
            new Date().toISOString();

        const sqlVenda = `
            INSERT INTO vendas
            (
                data,
                canal,
                subtotal,
                desconto,
                frete,
                taxas,
                custo_produtos,
                lucro
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(
            sqlVenda,
            [
                data,
                canal,
                subtotal,
                desconto,
                frete,
                taxas,
                custoProdutos,
                lucro
            ],
            function (err) {

                if (err) {
                    return rollback(
                        "Erro ao criar venda."
                    );
                }

                const vendaId = this.lastID;

                inserirItens(
                    produtos,
                    vendaId,
                    0
                );
            }
        );
    }

    // =========================
    // INSERIR ITENS
    // =========================

    function inserirItens(
        produtos,
        vendaId,
        index
    ) {

        if (index >= produtos.length) {

            db.run("COMMIT", err => {

                if (err) {
                    return rollback(
                        "Erro ao finalizar transação."
                    );
                }

                responderSucesso(
                    vendaId,
                    produtos
                );
            });

            return;
        }

        const item = produtos[index];

        const sql = `
            INSERT INTO itens_venda
            (
                venda_id,
                produto_id,
                quantidade,
                preco_unitario,
                custo_unitario
            )
            VALUES (?, ?, ?, ?, ?)
        `;

        db.run(
            sql,
            [
                vendaId,
                item.produto.id,
                item.quantidade,
                item.produto.preco,
                item.produto.custo
            ],
            function (err) {

                if (err) {
                    return rollback(
                        "Erro ao registrar item da venda."
                    );
                }

                atualizarEstoque(
                    item,
                    vendaId,
                    () => {

                        inserirItens(
                            produtos,
                            vendaId,
                            index + 1
                        );

                    }
                );
            }
        );
    }

    // =========================
    // ATUALIZAR ESTOQUE
    // =========================

    function atualizarEstoque(
        item,
        vendaId,
        callback
    ) {

        const sql = `
            UPDATE produtos
            SET estoque = estoque - ?
            WHERE id = ?
        `;

        db.run(
            sql,
            [
                item.quantidade,
                item.produto.id
            ],
            function (err) {

                if (err) {
                    return rollback(
                        "Erro ao atualizar estoque."
                    );
                }

                registrarMovimentacao(
                    item,
                    vendaId,
                    callback
                );
            }
        );
    }

    // =========================
    // MOVIMENTAÇÃO
    // =========================

    function registrarMovimentacao(
        item,
        vendaId,
        callback
    ) {

        const sql = `
            INSERT INTO movimentacoes_estoque
            (
                produto_id,
                tipo,
                quantidade,
                motivo,
                data
            )
            VALUES (?, ?, ?, ?, ?)
        `;

        db.run(
            sql,
            [
                item.produto.id,
                "SAIDA",
                item.quantidade,
                `Venda #${vendaId}`,
                new Date().toISOString()
            ],
            err => {

                if (err) {
                    return rollback(
                        "Erro ao registrar movimentação."
                    );
                }

                callback();
            }
        );
    }

    // =========================
    // ROLLBACK
    // =========================

    function rollback(mensagem) {

        db.run("ROLLBACK", () => {

            return res.status(500).json({
                erro: mensagem
            });

        });
    }

    // =========================
    // RESPOSTA
    // =========================

    function responderSucesso(
        vendaId,
        produtos
    ) {

        let subtotal = 0;
        let custoProdutos = 0;

        produtos.forEach(item => {

            subtotal +=
                item.produto.preco *
                item.quantidade;

            custoProdutos +=
                item.produto.custo *
                item.quantidade;
        });

        const total =
            subtotal - desconto + frete;

        const lucro =
            total - taxas - custoProdutos;

        res.status(201).json({
            mensagem: "Venda registrada com sucesso!",
            venda_id: vendaId,
            subtotal: Number(subtotal.toFixed(2)),
            desconto: Number(desconto.toFixed(2)),
            frete: Number(frete.toFixed(2)),
            taxas: Number(taxas.toFixed(2)),
            total: Number(total.toFixed(2)),
            custo_produtos: Number(
            custoProdutos.toFixed(2)),
            lucro: Number(lucro.toFixed(2))
        });
    }
}

function listarVendas(req, res) {

    const sqlVendas = `
        SELECT *
        FROM vendas
        ORDER BY data DESC
    `;

    db.all(sqlVendas, [], (err, vendas) => {

        if (err) {
            return res.status(500).json({
                erro: "Erro ao buscar vendas."
            });
        }

        if (vendas.length === 0) {
            return res.json([]);
        }

        let vendasProcessadas = 0;

        vendas.forEach(venda => {

            const sqlItens = `
                SELECT
                    itens_venda.produto_id,
                    itens_venda.quantidade,
                    itens_venda.preco_unitario,
                    itens_venda.custo_unitario,
                    produtos.nome AS produto
                FROM itens_venda
                INNER JOIN produtos
                    ON produtos.id = itens_venda.produto_id
                WHERE itens_venda.venda_id = ?
            `;

            db.all(
                sqlItens,
                [venda.id],
                (err, itens) => {

                    if (err) {
                        return res.status(500).json({
                            erro: "Erro ao buscar itens da venda."
                        });
                    }

                    venda.itens = itens;

                    venda.subtotal = arredondar(venda.subtotal);
                    venda.desconto = arredondar(venda.desconto);
                    venda.frete = arredondar(venda.frete);
                    venda.taxas = arredondar(venda.taxas);
                    venda.custo_produtos = arredondar(venda.custo_produtos);
                    venda.lucro = arredondar(venda.lucro);

                    vendasProcessadas++;

                    if (vendasProcessadas === vendas.length) {
                        res.json(vendas);
                    }
                }
            );
        });
    });
}

module.exports = {
    criarVenda,
    listarVendas
};