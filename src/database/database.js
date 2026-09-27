const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.sqlite", (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco:", err.message);
        return;
    }

    console.log("Banco de dados conectado!");

    criarTabelas();
});

function criarTabelas() {

    db.serialize(() => {

        // Tabela de produtos
        db.run(`
            CREATE TABLE IF NOT EXISTS produtos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                sku TEXT UNIQUE NOT NULL,
                categoria TEXT,
                custo REAL NOT NULL,
                preco REAL NOT NULL,
                estoque INTEGER NOT NULL DEFAULT 0,
                estoque_minimo INTEGER NOT NULL DEFAULT 0,
                ativo INTEGER NOT NULL DEFAULT 1
            )
        `);

        // Tabela de vendas
        db.run(`
            CREATE TABLE IF NOT EXISTS vendas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data TEXT NOT NULL,
                canal TEXT NOT NULL,
                subtotal REAL NOT NULL DEFAULT 0,
                desconto REAL NOT NULL DEFAULT 0,
                frete REAL NOT NULL DEFAULT 0,
                taxas REAL NOT NULL DEFAULT 0,
                custo_produtos REAL NOT NULL DEFAULT 0,
                lucro REAL NOT NULL DEFAULT 0
            )
        `);

        // Itens de cada venda
        db.run(`
            CREATE TABLE IF NOT EXISTS itens_venda (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                venda_id INTEGER NOT NULL,
                produto_id INTEGER NOT NULL,
                quantidade INTEGER NOT NULL,
                preco_unitario REAL NOT NULL,
                custo_unitario REAL NOT NULL,

                FOREIGN KEY (venda_id) REFERENCES vendas(id),
                FOREIGN KEY (produto_id) REFERENCES produtos(id)
            )
        `);

        // Movimentações do estoque
        db.run(`
            CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                produto_id INTEGER NOT NULL,
                tipo TEXT NOT NULL,
                quantidade INTEGER NOT NULL,
                motivo TEXT,
                data TEXT NOT NULL,

                FOREIGN KEY (produto_id) REFERENCES produtos(id)
            )
        `);

        // Despesas
        db.run(`
            CREATE TABLE IF NOT EXISTS despesas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                descricao TEXT NOT NULL,
                categoria TEXT NOT NULL,
                valor REAL NOT NULL,
                data TEXT NOT NULL
            )
        `);

        console.log("Tabelas verificadas/criadas!");
    });
}

module.exports = db;