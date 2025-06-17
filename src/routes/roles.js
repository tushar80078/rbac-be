const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const { authMiddleware } = require("../middlewares/auth");
const {
  canRead,
  canCreate,
  canUpdate,
  canDelete,
} = require("../middlewares/permissions");

router.get("/", authMiddleware, canRead("roles"), roleController.getAllRoles);
router.get(
  "/modules",
  authMiddleware,
  canRead("roles"),
  roleController.getAvailableModules
);
router.get(
  "/:id",
  authMiddleware,
  canRead("roles"),
  roleController.getRoleById
);
router.post("/", authMiddleware, canCreate("roles"), roleController.createRole);
router.put(
  "/:id",
  authMiddleware,
  canUpdate("roles"),
  roleController.updateRole
);
router.delete(
  "/:id",
  authMiddleware,
  canDelete("roles"),
  roleController.deleteRole
);

module.exports = router;
