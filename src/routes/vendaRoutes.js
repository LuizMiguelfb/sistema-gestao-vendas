const express = require("express");

const {
    criarVenda,
    listarVendas
} = require("../controllers/vendaController");

const router = express.Router();

router.post("/", criarVenda);
router.get("/", listarVendas);

module.exports = router;