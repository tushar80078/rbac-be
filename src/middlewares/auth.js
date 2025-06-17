const { verifyToken, extractToken } = require("../utils/auth");
const { pool } = require("../config/database");

const authMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Get user data from database
    const [users] = await pool.execute(
      `SELECT u.*, r.name as role_name, e.name as enterprise_name 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       LEFT JOIN enterprises e ON u.enterprise_id = e.id 
       WHERE u.id = ? AND u.status = 'active'`,
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

module.exports = { authMiddleware };
