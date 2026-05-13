const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const path = require("path");
const db = require("../db");
const { products } = require("./products");

/**
 * Validates the incoming quiz payload.
 * Returns an array of error messages, empty if valid.
 */
function validateQuiz(body) {
  const errors = [];

  const womensActivities = ["yoga", "pilates", "court sports", "train", "run", "lounge"];
  const mensActivities   = ["train", "run", "yoga", "tennis", "recovery"];
  const womensColors     = ["black", "white", "espresso", "grey", "navy", "ivory"];
  const mensColors       = ["black", "espresso", "grey", "navy"];
  const womensSizes      = ["XXS", "XS", "S", "M", "L"];
  const mensSizes        = ["S", "M", "L", "XL", "2XL"];

  if (!["womens", "mens"].includes(body.gender))
    errors.push("gender must be womens or mens");

  const validActivities = body.gender === "womens" ? womensActivities : mensActivities;
  const validColors     = body.gender === "womens" ? womensColors : mensColors;
  const validSizes      = body.gender === "womens" ? womensSizes : mensSizes;

  if (!Array.isArray(body.activities) || body.activities.length === 0)
    errors.push("activities must be a non-empty array");
  else if (!body.activities.every((a) => validActivities.includes(a)))
    errors.push(`activities must be valid for selected gender`);

  if (!validSizes.includes(body.size))
    errors.push(`size must be valid for selected gender`);

  if (!Array.isArray(body.colors) || body.colors.length === 0)
    errors.push('colors must be a non-empty array');
  else if (!body.colors.every((c) => validColors.includes(c)))
    errors.push('colors must be valid for selected gender');

  return errors;
}

/**
 * Calls the Python recommendation engine as a child process.
 * Passes the user profile and product catalog via stdin,
 * receives ranked recommendations via stdout.
 */
function runRecommendationEngine(profile, topN = 5) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "../ml/recommend.py");
    const input = JSON.stringify({ profile, products, top_n: topN });

    const python = spawn("py", [scriptPath]);
    let output = "";
    let errorOutput = "";

    python.stdin.write(input);
    python.stdin.end();

    python.stdout.on("data", (data) => { output += data.toString(); });
    python.stderr.on("data", (data) => { errorOutput += data.toString(); });

    python.on("close", (code) => {
      if (code !== 0) return reject(new Error(`Python error: ${errorOutput}`));
      try {
        resolve(JSON.parse(output));
      } catch {
        reject(new Error("Failed to parse recommendation output"));
      }
    });
  });
}

/**
 * POST /quiz
 * Accepts quiz answers, creates a user, runs the recommendation
 * engine, persists results, and returns the ranked collection.
 */
router.post("/", async (req, res) => {
  const errors = validateQuiz(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const { activities, gender, size, colors } = req.body;

  try {
    // 1. Create a new user record
    const [userResult] = await db.execute("INSERT INTO users () VALUES ()");
    const userId = userResult.insertId;

    // 2. Save the quiz response
    await db.execute(
      `INSERT INTO quiz_responses (user_id, gender, activities, size, color)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, gender, JSON.stringify(activities), size, JSON.stringify(colors)]
    );

    // 3. Run the recommendation engine
    const profile = { activities, gender, size, colors };
    const recommendations = await runRecommendationEngine(profile);

    // 4. Save recommendations to the database
    for (const rec of recommendations) {
      await db.execute(
        `INSERT INTO recommendations (user_id, product_id, score, \`rank\`)
         VALUES (?, ?, ?, ?)`,
        [userId, rec.product_id, rec.score, rec.rank]
      );
    }

    // 5. Return the recommendations
    res.status(201).json({
      success: true,
      user_id: userId,
      recommendations,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

module.exports = router;