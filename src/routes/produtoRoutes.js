const express = require("express");

const {
    criarProduto,
    listarProdutos,
    buscarProduto,
    atualizarProduto,
    excluirProduto
} = require("../controllers/produtoController");

const router = express.Router();

router.post("/", criarProduto);

router.get("/", listarProdutos);

router.get("/:id", buscarProduto);

router.put("/:id", atualizarProduto);

router.delete("/:id", excluirProduto);

module.exports = router;