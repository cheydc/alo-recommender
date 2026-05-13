const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * GET /recommendations/:userId
 * Returns stored recommendations for a given user ordered by rank.
 */
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT product_id, score, \`rank\`, created_at
       FROM recommendations
       WHERE user_id = ?
       ORDER BY \`rank\` ASC`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No recommendations found for user ${userId}`,
      });
    }

    res.json({ success: true, user_id: parseInt(userId), recommendations: rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

module.exports = router;