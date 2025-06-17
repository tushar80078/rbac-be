const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/auth");

router.post("/login", authController.login);
router.post("/logout", authMiddleware, authController.logout);
router.post("/reset-password", authController.resetPassword);
router.get("/profile", authMiddleware, authController.getProfile);

module.exports = router;
