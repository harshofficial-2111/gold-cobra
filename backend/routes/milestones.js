const express = require("express");

const router = express.Router();

const {
  getMilestones,
  getMilestoneById,
  addMilestone,
  updateMilestone,
  deleteMilestone,
} = require("../controllers/milestoneController");

const {
  verifyToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// GET /api/milestones?road=M.%20G.%20Road
router.get("/", getMilestones);

// GET /api/milestones/:id
router.get("/:id", getMilestoneById);

// POST /api/milestones — admin only
router.post("/", verifyToken, requireAdmin, addMilestone);

// PUT /api/milestones — admin only
router.put("/", verifyToken, requireAdmin, updateMilestone);

// DELETE /api/milestones/:id — admin only
router.delete("/:id", verifyToken, requireAdmin, deleteMilestone);

module.exports = router;