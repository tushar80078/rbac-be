const { pool } = require("../config/database");

// Get dashboard data based on user role and permissions
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role_name;
    const userEnterpriseId = req.user.enterprise_id;

    let dashboardData = {};

    // Admin gets all data
    if (userRole === "Admin") {
      // Get overall statistics
      const [userStats] = await pool.execute(
        "SELECT COUNT(*) as total_users FROM users"
      );

      const [enterpriseStats] = await pool.execute(
        "SELECT COUNT(*) as total_enterprises FROM enterprises"
      );

      const [employeeStats] = await pool.execute(
        "SELECT COUNT(*) as total_employees FROM employees"
      );

      const [productStats] = await pool.execute(
        "SELECT COUNT(*) as total_products FROM products"
      );

      // Get recent activities
      const [recentUsers] = await pool.execute(
        "SELECT id, username, email, created_at FROM users ORDER BY created_at DESC LIMIT 5"
      );

      const [recentEnterprises] = await pool.execute(
        "SELECT id, name, location, created_at FROM enterprises ORDER BY created_at DESC LIMIT 5"
      );

      const [recentEmployees] = await pool.execute(
        "SELECT id, name, department, created_at FROM employees ORDER BY created_at DESC LIMIT 5"
      );

      const [recentProducts] = await pool.execute(
        "SELECT id, name, category, price, created_at FROM products ORDER BY created_at DESC LIMIT 5"
      );

      dashboardData = {
        stats: {
          users: userStats[0].total_users,
          enterprises: enterpriseStats[0].total_enterprises,
          employees: employeeStats[0].total_employees,
          products: productStats[0].total_products,
        },
        recentActivities: {
          users: recentUsers,
          enterprises: recentEnterprises,
          employees: recentEmployees,
          products: recentProducts,
        },
      };
    } else {
      // Non-admin users get enterprise-specific data
      if (userEnterpriseId) {
        // Get enterprise-specific statistics
        const [enterpriseStats] = await pool.execute(
          "SELECT COUNT(*) as total_employees FROM employees WHERE enterprise_id = ?",
          [userEnterpriseId]
        );

        const [productStats] = await pool.execute(
          "SELECT COUNT(*) as total_products FROM products WHERE enterprise_id = ?",
          [userEnterpriseId]
        );

        const [userStats] = await pool.execute(
          "SELECT COUNT(*) as total_users FROM users WHERE enterprise_id = ?",
          [userEnterpriseId]
        );

        // Get enterprise info
        const [enterpriseInfo] = await pool.execute(
          "SELECT name, location, status FROM enterprises WHERE id = ?",
          [userEnterpriseId]
        );

        // Get recent activities for this enterprise
        const [recentEmployees] = await pool.execute(
          "SELECT id, name, department, created_at FROM employees WHERE enterprise_id = ? ORDER BY created_at DESC LIMIT 5",
          [userEnterpriseId]
        );

        const [recentProducts] = await pool.execute(
          "SELECT id, name, category, price, created_at FROM products WHERE enterprise_id = ? ORDER BY created_at DESC LIMIT 5",
          [userEnterpriseId]
        );

        dashboardData = {
          enterprise: enterpriseInfo[0],
          stats: {
            employees: enterpriseStats[0].total_employees,
            products: productStats[0].total_products,
            users: userStats[0].total_users,
          },
          recentActivities: {
            employees: recentEmployees,
            products: recentProducts,
          },
        };
      } else {
        // User without enterprise assignment
        dashboardData = {
          message: "No enterprise assigned",
          stats: {
            employees: 0,
            products: 0,
            users: 0,
          },
          recentActivities: {
            employees: [],
            products: [],
          },
        };
      }
    }

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Get dashboard data error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard data",
    });
  }
};

// Get user permissions for dashboard widgets
const getUserPermissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role_name;

    if (userRole === "Admin") {
      // Admin has access to all modules
      const permissions = {
        dashboard: {
          can_read: true,
          can_create: true,
          can_update: true,
          can_delete: true,
        },
        users: {
          can_read: true,
          can_create: true,
          can_update: true,
          can_delete: true,
        },
        roles: {
          can_read: true,
          can_create: true,
          can_update: true,
          can_delete: true,
        },
        enterprises: {
          can_read: true,
          can_create: true,
          can_update: true,
          can_delete: true,
        },
        employees: {
          can_read: true,
          can_create: true,
          can_update: true,
          can_delete: true,
        },
        products: {
          can_read: true,
          can_create: true,
          can_update: true,
          can_delete: true,
        },
      };

      res.json({
        success: true,
        data: permissions,
      });
    } else {
      // Get user's role permissions
      const [permissions] = await pool.execute(
        "SELECT module, can_read, can_create, can_update, can_delete FROM permissions WHERE role_id = ?",
        [req.user.role_id]
      );

      const permissionMap = {};
      permissions.forEach((perm) => {
        permissionMap[perm.module] = {
          can_read: perm.can_read,
          can_create: perm.can_create,
          can_update: perm.can_update,
          can_delete: perm.can_delete,
        };
      });

      res.json({
        success: true,
        data: permissionMap,
      });
    }
  } catch (error) {
    console.error("Get user permissions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user permissions",
    });
  }
};

// Get quick statistics for dashboard widgets
const getQuickStats = async (req, res) => {
  try {
    const userRole = req.user.role_name;
    const userEnterpriseId = req.user.enterprise_id;

    let stats = {};

    if (userRole === "Admin") {
      // Admin gets overall stats
      const [userCount] = await pool.execute(
        "SELECT COUNT(*) as count FROM users"
      );
      const [enterpriseCount] = await pool.execute(
        "SELECT COUNT(*) as count FROM enterprises"
      );
      const [employeeCount] = await pool.execute(
        "SELECT COUNT(*) as count FROM employees"
      );
      const [productCount] = await pool.execute(
        "SELECT COUNT(*) as count FROM products"
      );

      stats = {
        users: userCount[0].count,
        enterprises: enterpriseCount[0].count,
        employees: employeeCount[0].count,
        products: productCount[0].count,
      };
    } else if (userEnterpriseId) {
      // Enterprise-specific stats
      const [employeeCount] = await pool.execute(
        "SELECT COUNT(*) as count FROM employees WHERE enterprise_id = ?",
        [userEnterpriseId]
      );
      const [productCount] = await pool.execute(
        "SELECT COUNT(*) as count FROM products WHERE enterprise_id = ?",
        [userEnterpriseId]
      );
      const [userCount] = await pool.execute(
        "SELECT COUNT(*) as count FROM users WHERE enterprise_id = ?",
        [userEnterpriseId]
      );

      stats = {
        employees: employeeCount[0].count,
        products: productCount[0].count,
        users: userCount[0].count,
      };
    } else {
      stats = {
        employees: 0,
        products: 0,
        users: 0,
      };
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get quick stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get quick statistics",
    });
  }
};

module.exports = {
  getDashboardData,
  getUserPermissions,
  getQuickStats,
};
