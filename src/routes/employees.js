const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
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
  canRead("employees"),
  employeeController.getAllEmployees
);
router.get(
  "/stats",
  authMiddleware,
  canRead("employees"),
  employeeController.getEmployeeStats
);
router.get(
  "/enterprise/:enterpriseId",
  authMiddleware,
  canRead("employees"),
  employeeController.getEmployeesByEnterprise
);
router.get(
  "/:id",
  authMiddleware,
  canRead("employees"),
  employeeController.getEmployeeById
);
router.post(
  "/",
  authMiddleware,
  canCreate("employees"),
  employeeController.createEmployee
);
router.put(
  "/:id",
  authMiddleware,
  canUpdate("employees"),
  employeeController.updateEmployee
);
router.delete(
  "/:id",
  authMiddleware,
  canDelete("employees"),
  employeeController.deleteEmployee
);

module.exports = router;
