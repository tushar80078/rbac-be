const { pool } = require("../config/database");

// Get all products with enterprise and employee info
const getAllProducts = async (req, res) => {
  try {
    const [products] = await pool.execute(
      `SELECT p.*, e.name as enterprise_name, emp.name as employee_name
       FROM products p
       LEFT JOIN enterprises e ON p.enterprise_id = e.id
       LEFT JOIN employees emp ON p.employee_id = emp.id
       ORDER BY p.created_at DESC`
    );

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get products",
    });
  }
};

// Get products by enterprise
const getProductsByEnterprise = async (req, res) => {
  try {
    const { enterpriseId } = req.params;

    const [products] = await pool.execute(
      `SELECT p.*, emp.name as employee_name
       FROM products p
       LEFT JOIN employees emp ON p.employee_id = emp.id
       WHERE p.enterprise_id = ?
       ORDER BY p.created_at DESC`,
      [enterpriseId]
    );

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Get products by enterprise error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get products by enterprise",
    });
  }
};

// Get products by employee
const getProductsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const [products] = await pool.execute(
      `SELECT p.*, e.name as enterprise_name
       FROM products p
       LEFT JOIN enterprises e ON p.enterprise_id = e.id
       WHERE p.employee_id = ?
       ORDER BY p.created_at DESC`,
      [employeeId]
    );

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Get products by employee error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get products by employee",
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.execute(
      `SELECT p.*, e.name as enterprise_name, emp.name as employee_name
       FROM products p
       LEFT JOIN enterprises e ON p.enterprise_id = e.id
       LEFT JOIN employees emp ON p.employee_id = emp.id
       WHERE p.id = ?`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: products[0],
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get product",
    });
  }
};

// Create new product
const createProduct = async (req, res) => {
  try {
    const { name, sku, price, category, enterpriseId, employeeId } = req.body;

    if (!name || !enterpriseId) {
      return res.status(400).json({
        success: false,
        message: "Product name and enterprise ID are required",
      });
    }

    // Check if enterprise exists
    const [enterprises] = await pool.execute(
      "SELECT id FROM enterprises WHERE id = ?",
      [enterpriseId]
    );

    if (enterprises.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Enterprise not found",
      });
    }

    // Check if employee exists (if provided)
    if (employeeId) {
      const [employees] = await pool.execute(
        "SELECT id FROM employees WHERE id = ?",
        [employeeId]
      );

      if (employees.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
    }

    // Check if SKU already exists (if provided)
    if (sku) {
      const [existingSku] = await pool.execute(
        "SELECT id FROM products WHERE sku = ?",
        [sku]
      );

      if (existingSku.length > 0) {
        return res.status(409).json({
          success: false,
          message: "SKU already exists",
        });
      }
    }

    // Create product
    const [result] = await pool.execute(
      "INSERT INTO products (name, sku, price, category, enterprise_id, employee_id) VALUES (?, ?, ?, ?, ?, ?)",
      [name, sku, price, category, enterpriseId, employeeId]
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: {
        id: result.insertId,
        name,
        sku,
        price,
        category,
        enterpriseId,
        employeeId,
      },
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, price, category, status, enterpriseId, employeeId } =
      req.body;

    // Check if product exists
    const [existingProducts] = await pool.execute(
      "SELECT id FROM products WHERE id = ?",
      [id]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if new enterprise exists (if provided)
    if (enterpriseId) {
      const [enterprises] = await pool.execute(
        "SELECT id FROM enterprises WHERE id = ?",
        [enterpriseId]
      );

      if (enterprises.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Enterprise not found",
        });
      }
    }

    // Check if new employee exists (if provided)
    if (employeeId) {
      const [employees] = await pool.execute(
        "SELECT id FROM employees WHERE id = ?",
        [employeeId]
      );

      if (employees.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
    }

    // Check if new SKU conflicts (if provided)
    if (sku) {
      const [skuConflict] = await pool.execute(
        "SELECT id FROM products WHERE sku = ? AND id != ?",
        [sku, id]
      );

      if (skuConflict.length > 0) {
        return res.status(409).json({
          success: false,
          message: "SKU already exists",
        });
      }
    }

    // Update product
    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push("name = ?");
      updateValues.push(name);
    }
    if (sku) {
      updateFields.push("sku = ?");
      updateValues.push(sku);
    }
    if (price !== undefined) {
      updateFields.push("price = ?");
      updateValues.push(price);
    }
    if (category) {
      updateFields.push("category = ?");
      updateValues.push(category);
    }
    if (status) {
      updateFields.push("status = ?");
      updateValues.push(status);
    }
    if (enterpriseId) {
      updateFields.push("enterprise_id = ?");
      updateValues.push(enterpriseId);
    }
    if (employeeId !== undefined) {
      updateFields.push("employee_id = ?");
      updateValues.push(employeeId);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await pool.execute(
        `UPDATE products SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues
      );
    }

    res.json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const [existingProducts] = await pool.execute(
      "SELECT id FROM products WHERE id = ?",
      [id]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete product
    await pool.execute("DELETE FROM products WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

// Get product statistics
const getProductStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_products,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
       FROM products`
    );

    const [categoryStats] = await pool.execute(
      `SELECT 
        category,
        COUNT(*) as count,
        AVG(price) as avg_price
       FROM products 
       WHERE category IS NOT NULL
       GROUP BY category
       ORDER BY count DESC`
    );

    const [enterpriseStats] = await pool.execute(
      `SELECT 
        e.name as enterprise_name,
        COUNT(p.id) as product_count,
        AVG(p.price) as avg_price
       FROM enterprises e
       LEFT JOIN products p ON e.id = p.enterprise_id
       GROUP BY e.id, e.name
       ORDER BY product_count DESC`
    );

    res.json({
      success: true,
      data: {
        overall: stats[0],
        byCategory: categoryStats,
        byEnterprise: enterpriseStats,
      },
    });
  } catch (error) {
    console.error("Get product stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get product statistics",
    });
  }
};

module.exports = {
  getAllProducts,
  getProductsByEnterprise,
  getProductsByEmployee,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
};
