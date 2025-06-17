const { pool } = require("../config/database");

// Get all enterprises
const getAllEnterprises = async (req, res) => {
  try {
    const [enterprises] = await pool.execute(
      `SELECT e.*, 
              COUNT(DISTINCT u.id) as user_count,
              COUNT(DISTINCT emp.id) as employee_count,
              COUNT(DISTINCT p.id) as product_count
       FROM enterprises e
       LEFT JOIN users u ON e.id = u.enterprise_id
       LEFT JOIN employees emp ON e.id = emp.enterprise_id
       LEFT JOIN products p ON e.id = p.enterprise_id
       GROUP BY e.id
       ORDER BY e.created_at DESC`
    );

    res.json({
      success: true,
      data: enterprises,
    });
  } catch (error) {
    console.error("Get enterprises error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get enterprises",
    });
  }
};

// Get enterprise by ID with detailed info
const getEnterpriseById = async (req, res) => {
  try {
    const { id } = req.params;

    const [enterprises] = await pool.execute(
      "SELECT * FROM enterprises WHERE id = ?",
      [id]
    );

    if (enterprises.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Enterprise not found",
      });
    }

    const enterprise = enterprises[0];

    // Get users count
    const [userCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM users WHERE enterprise_id = ?",
      [id]
    );

    // Get employees count
    const [employeeCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM employees WHERE enterprise_id = ?",
      [id]
    );

    // Get products count
    const [productCount] = await pool.execute(
      "SELECT COUNT(*) as count FROM products WHERE enterprise_id = ?",
      [id]
    );

    enterprise.user_count = userCount[0].count;
    enterprise.employee_count = employeeCount[0].count;
    enterprise.product_count = productCount[0].count;

    res.json({
      success: true,
      data: enterprise,
    });
  } catch (error) {
    console.error("Get enterprise error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get enterprise",
    });
  }
};

// Create new enterprise
const createEnterprise = async (req, res) => {
  try {
    const { name, location, contactInfo } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Enterprise name is required",
      });
    }

    // Check if enterprise name already exists
    const [existingEnterprises] = await pool.execute(
      "SELECT id FROM enterprises WHERE name = ?",
      [name]
    );

    if (existingEnterprises.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Enterprise name already exists",
      });
    }

    // Create enterprise
    const [result] = await pool.execute(
      "INSERT INTO enterprises (name, location, contact_info) VALUES (?, ?, ?)",
      [name, location, JSON.stringify(contactInfo)]
    );

    res.status(201).json({
      success: true,
      message: "Enterprise created successfully",
      data: { id: result.insertId, name, location, contactInfo },
    });
  } catch (error) {
    console.error("Create enterprise error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create enterprise",
    });
  }
};

// Update enterprise
const updateEnterprise = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, contactInfo, status } = req.body;

    // Check if enterprise exists
    const [existingEnterprises] = await pool.execute(
      "SELECT id FROM enterprises WHERE id = ?",
      [id]
    );

    if (existingEnterprises.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Enterprise not found",
      });
    }

    // Check if new name conflicts with existing enterprises
    if (name) {
      const [nameConflict] = await pool.execute(
        "SELECT id FROM enterprises WHERE name = ? AND id != ?",
        [name, id]
      );

      if (nameConflict.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Enterprise name already exists",
        });
      }
    }

    // Update enterprise
    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push("name = ?");
      updateValues.push(name);
    }
    if (location) {
      updateFields.push("location = ?");
      updateValues.push(location);
    }
    if (contactInfo) {
      updateFields.push("contact_info = ?");
      updateValues.push(JSON.stringify(contactInfo));
    }
    if (status) {
      updateFields.push("status = ?");
      updateValues.push(status);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await pool.execute(
        `UPDATE enterprises SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues
      );
    }

    res.json({
      success: true,
      message: "Enterprise updated successfully",
    });
  } catch (error) {
    console.error("Update enterprise error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update enterprise",
    });
  }
};

// Delete enterprise
const deleteEnterprise = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if enterprise exists
    const [existingEnterprises] = await pool.execute(
      "SELECT id FROM enterprises WHERE id = ?",
      [id]
    );

    if (existingEnterprises.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Enterprise not found",
      });
    }

    // Check if enterprise has associated users
    const [usersWithEnterprise] = await pool.execute(
      "SELECT id FROM users WHERE enterprise_id = ?",
      [id]
    );

    if (usersWithEnterprise.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete enterprise that has associated users",
      });
    }

    // Delete enterprise (employees and products will be deleted due to CASCADE)
    await pool.execute("DELETE FROM enterprises WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Enterprise deleted successfully",
    });
  } catch (error) {
    console.error("Delete enterprise error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete enterprise",
    });
  }
};

// Get enterprise statistics
const getEnterpriseStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_enterprises,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_enterprises,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_enterprises
       FROM enterprises`
    );

    const [userStats] = await pool.execute(
      "SELECT COUNT(*) as total_users FROM users"
    );

    const [employeeStats] = await pool.execute(
      "SELECT COUNT(*) as total_employees FROM employees"
    );

    const [productStats] = await pool.execute(
      "SELECT COUNT(*) as total_products FROM products"
    );

    res.json({
      success: true,
      data: {
        enterprises: stats[0],
        users: userStats[0],
        employees: employeeStats[0],
        products: productStats[0],
      },
    });
  } catch (error) {
    console.error("Get enterprise stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get enterprise statistics",
    });
  }
};

module.exports = {
  getAllEnterprises,
  getEnterpriseById,
  createEnterprise,
  updateEnterprise,
  deleteEnterprise,
  getEnterpriseStats,
};
