require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ALO Recommender API is running" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});