const express = require("express");
const router = express.Router();
const path = require("path");
const products = require(path.join(__dirname, "../../data/products.json"));

/**
 * GET /products
 * Returns the full mock product catalog.
 */
router.get("/", (req, res) => {
  res.json({ success: true, count: products.length, products });
});

module.exports = { router, products };