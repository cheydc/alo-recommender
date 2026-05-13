require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// Routes
const { router: productsRouter } = require("./routes/products");
const quizRouter = require("./routes/quiz");
const recommendationsRouter = require("./routes/recommendations");

app.use("/products", productsRouter);
app.use("/quiz", quizRouter);
app.use("/recommendations", recommendationsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});