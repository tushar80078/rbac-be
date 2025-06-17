const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
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
  canRead("products"),
  productController.getAllProducts
);
router.get(
  "/stats",
  authMiddleware,
  canRead("products"),
  productController.getProductStats
);
router.get(
  "/enterprise/:enterpriseId",
  authMiddleware,
  canRead("products"),
  productController.getProductsByEnterprise
);
router.get(
  "/employee/:employeeId",
  authMiddleware,
  canRead("products"),
  productController.getProductsByEmployee
);
router.get(
  "/:id",
  authMiddleware,
  canRead("products"),
  productController.getProductById
);
router.post(
  "/",
  authMiddleware,
  canCreate("products"),
  productController.createProduct
);
router.put(
  "/:id",
  authMiddleware,
  canUpdate("products"),
  productController.updateProduct
);
router.delete(
  "/:id",
  authMiddleware,
  canDelete("products"),
  productController.deleteProduct
);

module.exports = router;
