const { pool } = require("../config/database");

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const [roles] = await pool.execute(
      "SELECT * FROM roles ORDER BY created_at DESC"
    );

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get roles",
    });
  }
};

// Get role by ID with permissions
const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const [roles] = await pool.execute("SELECT * FROM roles WHERE id = ?", [
      id,
    ]);

    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    const [permissions] = await pool.execute(
      "SELECT * FROM permissions WHERE role_id = ?",
      [id]
    );

    // Filter out permissions that have no actual permissions (all values are 0/false)
    const filteredPermissions = permissions.filter(
      (permission) =>
        permission.can_read ||
        permission.can_create ||
        permission.can_update ||
        permission.can_delete
    );

    const role = roles[0];
    role.permissions = filteredPermissions;

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error("Get role error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get role",
    });
  }
};

// Create new role
const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Role name is required",
      });
    }

    // Validate that at least one permission is selected
    if (
      !permissions ||
      !Array.isArray(permissions) ||
      permissions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one permission must be selected",
      });
    }

    const hasAnyPermission = permissions.some(
      (permission) =>
        permission.can_read ||
        permission.can_create ||
        permission.can_update ||
        permission.can_delete
    );

    if (!hasAnyPermission) {
      return res.status(400).json({
        success: false,
        message: "At least one permission must be selected for the role",
      });
    }

    // Check if role name already exists
    const [existingRoles] = await pool.execute(
      "SELECT id FROM roles WHERE name = ?",
      [name]
    );

    if (existingRoles.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Role name already exists",
      });
    }

    // Create role
    const [result] = await pool.execute(
      "INSERT INTO roles (name, description) VALUES (?, ?)",
      [name, description]
    );

    const roleId = result.insertId;

    // Add permissions if provided
    if (permissions && Array.isArray(permissions)) {
      for (const permission of permissions) {
        await pool.execute(
          `INSERT INTO permissions (role_id, module, can_read, can_create, can_update, can_delete) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            roleId,
            permission.module,
            permission.can_read || false,
            permission.can_create || false,
            permission.can_update || false,
            permission.can_delete || false,
          ]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: { id: roleId, name, description },
    });
  } catch (error) {
    console.error("Create role error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create role",
    });
  }
};

// Update role
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    // Check if role exists
    const [existingRoles] = await pool.execute(
      "SELECT id FROM roles WHERE id = ?",
      [id]
    );

    if (existingRoles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Check if new name conflicts with existing roles
    if (name) {
      const [nameConflict] = await pool.execute(
        "SELECT id FROM roles WHERE name = ? AND id != ?",
        [name, id]
      );

      if (nameConflict.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Role name already exists",
        });
      }
    }

    // Update role
    await pool.execute(
      "UPDATE roles SET name = ?, description = ? WHERE id = ?",
      [name, description, id]
    );

    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      // Delete existing permissions
      await pool.execute("DELETE FROM permissions WHERE role_id = ?", [id]);

      // Add new permissions
      for (const permission of permissions) {
        await pool.execute(
          `INSERT INTO permissions (role_id, module, can_read, can_create, can_update, can_delete) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            id,
            permission.module,
            permission.can_read || false,
            permission.can_create || false,
            permission.can_update || false,
            permission.can_delete || false,
          ]
        );
      }
    }

    res.json({
      success: true,
      message: "Role updated successfully",
    });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update role",
    });
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if role exists
    const [existingRoles] = await pool.execute(
      "SELECT id FROM roles WHERE id = ?",
      [id]
    );

    if (existingRoles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Check if role is assigned to any users
    const [usersWithRole] = await pool.execute(
      "SELECT id FROM users WHERE role_id = ?",
      [id]
    );

    if (usersWithRole.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete role that is assigned to users",
      });
    }

    // Delete role (permissions will be deleted due to CASCADE)
    await pool.execute("DELETE FROM roles WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("Delete role error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete role",
    });
  }
};

// Get available modules for permissions
const getAvailableModules = async (req, res) => {
  try {
    const modules = [
      "dashboard",
      "users",
      "roles",
      "enterprises",
      "employees",
      "products",
    ];

    res.json({
      success: true,
      data: modules,
    });
  } catch (error) {
    console.error("Get modules error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get modules",
    });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAvailableModules,
};
