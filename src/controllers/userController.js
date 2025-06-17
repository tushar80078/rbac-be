const { hashPassword } = require("../utils/auth");
const { pool } = require("../config/database");

// Get all users with role and enterprise info
const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.status, u.last_login, u.created_at,
              r.name as role_name, e.name as enterprise_name
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       LEFT JOIN enterprises e ON u.enterprise_id = e.id 
       ORDER BY u.created_at DESC`
    );

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get users",
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.status, u.last_login, u.created_at,
              r.name as role_name, e.name as enterprise_name
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       LEFT JOIN enterprises e ON u.enterprise_id = e.id 
       WHERE u.id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user",
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { username, email, password, roleId, enterpriseId } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    // Check if username already exists
    const [existingUsername] = await pool.execute(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (existingUsername.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Check if email already exists
    const [existingEmail] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const [result] = await pool.execute(
      "INSERT INTO users (username, email, password, role_id, enterprise_id) VALUES (?, ?, ?, ?, ?)",
      [username, email, hashedPassword, roleId, enterpriseId]
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { id: result.insertId, username, email },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, roleId, enterpriseId, status } = req.body;

    // Check if user exists
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE id = ?",
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check username conflict
    if (username) {
      const [usernameConflict] = await pool.execute(
        "SELECT id FROM users WHERE username = ? AND id != ?",
        [username, id]
      );

      if (usernameConflict.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Username already exists",
        });
      }
    }

    // Check email conflict
    if (email) {
      const [emailConflict] = await pool.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, id]
      );

      if (emailConflict.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Update user
    const updateFields = [];
    const updateValues = [];

    if (username) {
      updateFields.push("username = ?");
      updateValues.push(username);
    }
    if (email) {
      updateFields.push("email = ?");
      updateValues.push(email);
    }
    if (roleId !== undefined) {
      updateFields.push("role_id = ?");
      updateValues.push(roleId);
    }
    if (enterpriseId !== undefined) {
      updateFields.push("enterprise_id = ?");
      updateValues.push(enterpriseId);
    }
    if (status) {
      updateFields.push("status = ?");
      updateValues.push(status);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await pool.execute(
        `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues
      );
    }

    res.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE id = ?",
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete user
    await pool.execute("DELETE FROM users WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// Lock/Unlock user account
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive", "locked"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be active, inactive, or locked",
      });
    }

    // Check if user exists
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE id = ?",
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user status
    await pool.execute("UPDATE users SET status = ? WHERE id = ?", [
      status,
      id,
    ]);

    res.json({
      success: true,
      message: `User ${status} successfully`,
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

// Get users by enterprise
const getUsersByEnterprise = async (req, res) => {
  try {
    const { enterpriseId } = req.params;

    const [users] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.status, u.last_login, u.created_at,
              r.name as role_name
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.enterprise_id = ?
       ORDER BY u.created_at DESC`,
      [enterpriseId]
    );

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get users by enterprise error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get users by enterprise",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUsersByEnterprise,
};
