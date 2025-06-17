const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware } = require("../middlewares/auth");
const {
  canRead,
  canCreate,
  canUpdate,
  canDelete,
} = require("../middlewares/permissions");

router.get("/", authMiddleware, canRead("users"), userController.getAllUsers);
router.get(
  "/:id",
  authMiddleware,
  canRead("users"),
  userController.getUserById
);
router.post("/", authMiddleware, canCreate("users"), userController.createUser);
router.put(
  "/:id",
  authMiddleware,
  canUpdate("users"),
  userController.updateUser
);
router.delete(
  "/:id",
  authMiddleware,
  canDelete("users"),
  userController.deleteUser
);
router.patch(
  "/:id/status",
  authMiddleware,
  canUpdate("users"),
  userController.toggleUserStatus
);
router.get(
  "/enterprise/:enterpriseId",
  authMiddleware,
  canRead("users"),
  userController.getUsersByEnterprise
);

module.exports = router;
