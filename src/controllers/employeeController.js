const { pool } = require("../config/database");

// Get all employees with enterprise info
const getAllEmployees = async (req, res) => {
  try {
    const [employees] = await pool.execute(
      `SELECT emp.*, e.name as enterprise_name
       FROM employees emp
       LEFT JOIN enterprises e ON emp.enterprise_id = e.id
       ORDER BY emp.created_at DESC`
    );

    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get employees",
    });
  }
};

// Get employees by enterprise
const getEmployeesByEnterprise = async (req, res) => {
  try {
    const { enterpriseId } = req.params;

    const [employees] = await pool.execute(
      "SELECT * FROM employees WHERE enterprise_id = ? ORDER BY created_at DESC",
      [enterpriseId]
    );

    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error("Get employees by enterprise error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get employees by enterprise",
    });
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const [employees] = await pool.execute(
      `SELECT emp.*, e.name as enterprise_name
       FROM employees emp
       LEFT JOIN enterprises e ON emp.enterprise_id = e.id
       WHERE emp.id = ?`,
      [id]
    );

    if (employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json({
      success: true,
      data: employees[0],
    });
  } catch (error) {
    console.error("Get employee error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get employee",
    });
  }
};

// Create new employee
const createEmployee = async (req, res) => {
  try {
    const { name, department, role, salary, enterpriseId } = req.body;

    if (!name || !enterpriseId) {
      return res.status(400).json({
        success: false,
        message: "Employee name and enterprise ID are required",
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

    // Create employee
    const [result] = await pool.execute(
      "INSERT INTO employees (name, department, role, salary, enterprise_id) VALUES (?, ?, ?, ?, ?)",
      [name, department, role, salary, enterpriseId]
    );

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: {
        id: result.insertId,
        name,
        department,
        role,
        salary,
        enterpriseId,
      },
    });
  } catch (error) {
    console.error("Create employee error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create employee",
    });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, role, salary, status, enterpriseId } = req.body;

    // Check if employee exists
    const [existingEmployees] = await pool.execute(
      "SELECT id FROM employees WHERE id = ?",
      [id]
    );

    if (existingEmployees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
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

    // Update employee
    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push("name = ?");
      updateValues.push(name);
    }
    if (department) {
      updateFields.push("department = ?");
      updateValues.push(department);
    }
    if (role) {
      updateFields.push("role = ?");
      updateValues.push(role);
    }
    if (salary !== undefined) {
      updateFields.push("salary = ?");
      updateValues.push(salary);
    }
    if (status) {
      updateFields.push("status = ?");
      updateValues.push(status);
    }
    if (enterpriseId) {
      updateFields.push("enterprise_id = ?");
      updateValues.push(enterpriseId);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await pool.execute(
        `UPDATE employees SET ${updateFields.join(", ")} WHERE id = ?`,
        updateValues
      );
    }

    res.json({
      success: true,
      message: "Employee updated successfully",
    });
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update employee",
    });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    const [existingEmployees] = await pool.execute(
      "SELECT id FROM employees WHERE id = ?",
      [id]
    );

    if (existingEmployees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check if employee has associated products
    const [productsWithEmployee] = await pool.execute(
      "SELECT id FROM products WHERE employee_id = ?",
      [id]
    );

    if (productsWithEmployee.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete employee that has associated products",
      });
    }

    // Delete employee
    await pool.execute("DELETE FROM employees WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete employee",
    });
  }
};

// Get employee statistics
const getEmployeeStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_employees,
        AVG(salary) as avg_salary,
        MIN(salary) as min_salary,
        MAX(salary) as max_salary
       FROM employees`
    );

    const [departmentStats] = await pool.execute(
      `SELECT 
        department,
        COUNT(*) as count,
        AVG(salary) as avg_salary
       FROM employees 
       WHERE department IS NOT NULL
       GROUP BY department
       ORDER BY count DESC`
    );

    res.json({
      success: true,
      data: {
        overall: stats[0],
        byDepartment: departmentStats,
      },
    });
  } catch (error) {
    console.error("Get employee stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get employee statistics",
    });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeesByEnterprise,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
};
