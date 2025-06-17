const express = require("express");
const router = express.Router();
const enterpriseController = require("../controllers/enterpriseController");
const { authMiddleware } = require("../middlewares/auth");
const {
  canRead,
  canCreate,
  canUpdate,
  canDelete,
} = require("../middlewares/permissions");

router.get(
  "/",
  authMiddleware,
  canRead("enterprises"),
  enterpriseController.getAllEnterprises
);
router.get(
  "/stats",
  authMiddleware,
  canRead("enterprises"),
  enterpriseController.getEnterpriseStats
);
router.get(
  "/:id",
  authMiddleware,
  canRead("enterprises"),
  enterpriseController.getEnterpriseById
);
router.post(
  "/",
  authMiddleware,
  canCreate("enterprises"),
  enterpriseController.createEnterprise
);
router.put(
  "/:id",
  authMiddleware,
  canUpdate("enterprises"),
  enterpriseController.updateEnterprise
);
router.delete(
  "/:id",
  authMiddleware,
  canDelete("enterprises"),
  enterpriseController.deleteEnterprise
);

module.exports = router;
