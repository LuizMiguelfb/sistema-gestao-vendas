function validarProduto(dados) {
    const {
        nome,
        sku,
        custo,
        preco,
        estoque,
        estoque_minimo
    } = dados;

    if (!nome || nome.trim() === "") {
        return "O nome do produto é obrigatório.";
    }

    if (!sku || sku.trim() === "") {
        return "O SKU do produto é obrigatório.";
    }

    if (custo === undefined || custo === null) {
        return "O custo do produto é obrigatório.";
    }

    if (preco === undefined || preco === null) {
        return "O preço do produto é obrigatório.";
    }

    if (custo < 0) {
        return "O custo não pode ser negativo.";
    }

    if (preco <= 0) {
        return "O preço deve ser maior que zero.";
    }

    if (estoque !== undefined && estoque < 0) {
        return "O estoque não pode ser negativo.";
    }

    if (estoque_minimo !== undefined && estoque_minimo < 0) {
        return "O estoque mínimo não pode ser negativo.";
    }

    if (preco <= custo) {
        return "O preço deve ser maior que o custo.";
    }

    return null;
}

const db = require("../database/database");

function criarProduto(req, res) {
    const {
        nome,
        sku,
        categoria,
        custo,
        preco,
        estoque,
        estoque_minimo
    } = req.body;

    const erroValidacao = validarProduto(req.body);

    if (erroValidacao) {
    return res.status(400).json({
        erro: erroValidacao
    });
    }

    if (!nome || !sku || custo === undefined || preco === undefined) {
        return res.status(400).json({
            erro: "Nome, SKU, custo e preço são obrigatórios."
        });
    }

    const sql = `
        INSERT INTO produtos
        (nome, sku, categoria, custo, preco, estoque, estoque_minimo)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const valores = [
        nome,
        sku,
        categoria || null,
        custo,
        preco,
        estoque || 0,
        estoque_minimo || 0
    ];

    const resultadoMargem = calcularMargem(custo, preco);

    db.run(sql, valores, function (err) {
        if (err) {
            if (err.message.includes("UNIQUE")) {
                return res.status(409).json({
                    erro: "Já existe um produto com esse SKU."
                });
            }

            return res.status(500).json({
                erro: "Erro ao cadastrar produto."
            });
        }

        res.status(201).json({
            mensagem: "Produto cadastrado com sucesso!",
            id: this.lastID,
            lucro_bruto: resultadoMargem.lucro,
            margem: resultadoMargem.margem
        });
    });
}

function listarProdutos(req, res) {
    const sql = `
        SELECT *
        FROM produtos
        WHERE ativo = 1
        ORDER BY id DESC
    `;

    db.all(sql, [], (err, produtos) => {
        if (err) {
            return res.status(500).json({
                erro: "Erro ao buscar produtos."
            });
        }

        res.json(produtos);
    });
}

function buscarProduto(req, res) {
    const { id } = req.params;

    const sql = `
        SELECT *
        FROM produtos
        WHERE id = ? AND ativo = 1
    `;

    db.get(sql, [id], (err, produto) => {
        if (err) {
            return res.status(500).json({
                erro: "Erro ao buscar produto."
            });
        }

        if (!produto) {
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        res.json(produto);
    });
}

function atualizarProduto(req, res) {
    const { id } = req.params;

    const {
        nome,
        sku,
        categoria,
        custo,
        preco,
        estoque,
        estoque_minimo
    } = req.body;

    const sql = `
        UPDATE produtos
        SET
            nome = ?,
            sku = ?,
            categoria = ?,
            custo = ?,
            preco = ?,
            estoque = ?,
            estoque_minimo = ?
        WHERE id = ? AND ativo = 1
    `;

    const valores = [
        nome,
        sku,
        categoria || null,
        custo,
        preco,
        estoque,
        estoque_minimo,
        id
    ];

    db.run(sql, valores, function (err) {
        if (err) {
            return res.status(500).json({
                erro: "Erro ao atualizar produto."
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        res.json({
            mensagem: "Produto atualizado com sucesso!"
        });
    });
}

function excluirProduto(req, res) {
    const { id } = req.params;

    const sql = `
        UPDATE produtos
        SET ativo = 0
        WHERE id = ?
    `;

    db.run(sql, [id], function (err) {
        if (err) {
            return res.status(500).json({
                erro: "Erro ao excluir produto."
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        res.json({
            mensagem: "Produto excluído com sucesso!"
        });
    });
}

function calcularMargem(custo, preco) {
    const lucro = preco - custo;

    const margem = (lucro / preco) * 100;

    return {
        lucro: Number(lucro.toFixed(2)),
        margem: Number(margem.toFixed(2))
    };
}

module.exports = {
    criarProduto,
    listarProdutos,
    buscarProduto,
    atualizarProduto,
    excluirProduto
};
