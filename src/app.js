require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());

// Routes
const { router: productsRouter } = require("./routes/products");
const quizRouter = require("./routes/quiz");
const recommendationsRouter = require("./routes/recommendations");

app.use("/products", productsRouter);
app.use("/quiz", quizRouter);
app.use("/recommendations", recommendationsRouter);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ALO Recommender API is running" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});