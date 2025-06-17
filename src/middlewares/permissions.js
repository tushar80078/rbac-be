const { pool } = require("../config/database");

const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Admin has full access
      if (req.user.role_name === "Admin") {
        return next();
      }

      // Check user permissions
      const [permissions] = await pool.execute(
        `SELECT can_read, can_create, can_update, can_delete 
         FROM permissions 
         WHERE role_id = ? AND module = ?`,
        [req.user.role_id, module]
      );

      if (permissions.length === 0) {
        return res.status(403).json({
          success: false,
          message: "No permissions for this module",
        });
      }

      const permission = permissions[0];
      let hasPermission = false;

      switch (action) {
        case "read":
          hasPermission = permission.can_read;
          break;
        case "create":
          hasPermission = permission.can_create;
          break;
        case "update":
          hasPermission = permission.can_update;
          break;
        case "delete":
          hasPermission = permission.can_delete;
          break;
        default:
          hasPermission = false;
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `No ${action} permission for ${module}`,
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({
        success: false,
        message: "Permission check error",
      });
    }
  };
};

// Helper functions for common permission checks
const canRead = (module) => checkPermission(module, "read");
const canCreate = (module) => checkPermission(module, "create");
const canUpdate = (module) => checkPermission(module, "update");
const canDelete = (module) => checkPermission(module, "delete");

module.exports = {
  checkPermission,
  canRead,
  canCreate,
  canUpdate,
  canDelete,
};
