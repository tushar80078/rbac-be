const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authMiddleware } = require("../middlewares/auth");
const { canRead } = require("../middlewares/permissions");

router.get(
  "/",
  authMiddleware,
  canRead("dashboard"),
  dashboardController.getDashboardData
);
router.get(
  "/permissions",
  authMiddleware,
  canRead("dashboard"),
  dashboardController.getUserPermissions
);
router.get(
  "/quick-stats",
  authMiddleware,
  canRead("dashboard"),
  dashboardController.getQuickStats
);

module.exports = router;
