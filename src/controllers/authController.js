const {
  comparePassword,
  generateToken,
  hashPassword,
} = require("../utils/auth");
const { pool } = require("../config/database");

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Get user with role and enterprise info
    const [users] = await pool.execute(
      `SELECT u.*, r.name as role_name, e.name as enterprise_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       LEFT JOIN enterprises e ON u.enterprise_id = e.id 
       WHERE u.username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = users[0];

    // Check if user is active
    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Account is locked or inactive",
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    await pool.execute(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
      [user.id]
    );

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      roleId: user.role_id,
      enterpriseId: user.enterprise_id,
    });

    // Remove password from response
    delete user.password;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

const logout = async (req, res) => {
  try {
    // In a more complex system, you might want to blacklist the token
    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    // Check if user exists
    const [users] = await pool.execute("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await pool.execute("UPDATE users SET password = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.status, u.last_login, u.created_at,
              r.name as role_name, e.name as enterprise_name
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       LEFT JOIN enterprises e ON u.enterprise_id = e.id 
       WHERE u.id = ?`,
      [userId]
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
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
};

// Regenerate admin password
const regenerateAdminPassword = async (req, res) => {
  try {
    // Generate a new random password (e.g., 10 chars, alphanumeric)
    const newPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await hashPassword(newPassword);

    // Update admin password in DB (assume username is 'admin')
    const [result] = await pool.execute(
      "UPDATE users SET password = ? WHERE username = 'admin'",
      [hashedPassword]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found",
      });
    }

    res.json({
      success: true,
      message: "Admin password regenerated successfully",
      data: {
        username: "admin",
        password: newPassword,
      },
    });
  } catch (error) {
    console.error("Regenerate admin password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to regenerate admin password",
    });
  }
};

module.exports = {
  login,
  logout,
  resetPassword,
  getProfile,
  regenerateAdminPassword,
};
