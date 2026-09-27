const express = require("express");
const cors = require("cors");

require("./database/database");

const produtoRoutes = require("./routes/produtoRoutes");
const vendaRoutes = require("./routes/vendaRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "API Sistema de Vendas funcionando!"
    });
});

app.use("/produtos", produtoRoutes);
app.use("/vendas", vendaRoutes);
app.use("/dashboard", dashboardRoutes);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});