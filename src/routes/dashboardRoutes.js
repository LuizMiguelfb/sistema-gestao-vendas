const express = require("express");

const {
    obterDashboard
} = require("../controllers/dashboardController");

const router = express.Router();

router.get("/", obterDashboard);

module.exports = router;