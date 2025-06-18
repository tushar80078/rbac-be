# Backend API - Role-Based Access Control (RBAC) System

A robust Node.js/Express.js backend API for managing enterprises, users, roles, permissions, employees, and products with role-based access control.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based permissions
- **User Management**: Complete CRUD operations for users with role assignment
- **Role Management**: Create, update, and manage roles with granular permissions
- **Enterprise Management**: Multi-enterprise support with enterprise-specific data
- **Employee Management**: Track employees within enterprises
- **Product Management**: Manage products with enterprise and employee associations
- **Permission System**: Granular permissions (read, create, update, delete) per module
- **Dashboard Analytics**: Role-based statistics and recent activities

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: Built-in validation with error handling

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
cd be
npm install
```

### 2. Database Setup

#### Create Database
```sql
CREATE DATABASE rbac_enterprise_db;
```

#### Run Database Schema
```bash
# Import the database schema
mysql -u root -p rbac_enterprise_db < src/config/database.sql
```

### 3. Environment Configuration

Copy the environment example file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` file with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=rbac_enterprise_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 4. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📊 Database Schema

### Core Tables

#### Users
- `id`: Primary key
- `username`: Unique username for login
- `email`: Unique email address
- `password`: Hashed password
- `role_id`: Foreign key to roles table
- `enterprise_id`: Foreign key to enterprises table
- `status`: active/inactive/locked
- `last_login`: Timestamp of last login

#### Roles
- `id`: Primary key
- `name`: Role name (Admin, Manager, etc.)
- `description`: Role description

#### Permissions
- `role_id`: Foreign key to roles table
- `module`: Module name (dashboard, users, roles, etc.)
- `can_read`: Boolean permission
- `can_create`: Boolean permission
- `can_update`: Boolean permission
- `can_delete`: Boolean permission

#### Enterprises
- `id`: Primary key
- `name`: Enterprise name
- `location`: Enterprise location
- `contact_info`: JSON contact information
- `status`: active/inactive

#### Employees
- `id`: Primary key
- `name`: Employee name
- `department`: Department name
- `role`: Employee role
- `salary`: Salary amount
- `enterprise_id`: Foreign key to enterprises table

#### Products
- `id`: Primary key
- `name`: Product name
- `sku`: Stock keeping unit
- `price`: Product price
- `category`: Product category
- `enterprise_id`: Foreign key to enterprises table
- `employee_id`: Foreign key to employees table

## 🔐 Authentication & Authorization

### JWT Token Structure
```javascript
{
  userId: user.id,
  username: user.username,
  roleId: user.role_id,
  enterpriseId: user.enterprise_id
}
```

### Permission System
The system uses a granular permission system where each role has specific permissions for each module:

- **Read**: View data
- **Create**: Add new records
- **Update**: Modify existing records
- **Delete**: Remove records

### Admin Role
The Admin role has full access to all modules and bypasses permission checks.

## 📡 API Endpoints

### Authentication
```
POST /api/auth/login          - User login
POST /api/auth/logout         - User logout
GET  /api/auth/profile        - Get user profile
POST /api/auth/reset-password - Reset password
```

### Users
```
GET    /api/users             - Get all users (requires read permission)
GET    /api/users/:id         - Get user by ID (requires read permission)
POST   /api/users             - Create user (requires create permission)
PUT    /api/users/:id         - Update user (requires update permission)
DELETE /api/users/:id         - Delete user (requires delete permission)
PATCH  /api/users/:id/status  - Toggle user status (requires update permission)
```

### Roles
```
GET    /api/roles             - Get all roles (requires read permission)
GET    /api/roles/:id         - Get role by ID (requires read permission)
GET    /api/roles/modules     - Get available modules (requires read permission)
POST   /api/roles             - Create role (requires create permission)
PUT    /api/roles/:id         - Update role (requires update permission)
DELETE /api/roles/:id         - Delete role (requires delete permission)
```

### Enterprises
```
GET    /api/enterprises       - Get all enterprises (requires read permission)
GET    /api/enterprises/:id   - Get enterprise by ID (requires read permission)
POST   /api/enterprises       - Create enterprise (requires create permission)
PUT    /api/enterprises/:id   - Update enterprise (requires update permission)
DELETE /api/enterprises/:id   - Delete enterprise (requires delete permission)
```

### Employees
```
GET    /api/employees         - Get all employees (requires read permission)
GET    /api/employees/:id     - Get employee by ID (requires read permission)
POST   /api/employees         - Create employee (requires create permission)
PUT    /api/employees/:id     - Update employee (requires update permission)
DELETE /api/employees/:id     - Delete employee (requires delete permission)
```

### Products
```
GET    /api/products          - Get all products (requires read permission)
GET    /api/products/:id      - Get product by ID (requires read permission)
POST   /api/products          - Create product (requires create permission)
PUT    /api/products/:id      - Update product (requires update permission)
DELETE /api/products/:id      - Delete product (requires delete permission)
```

### Dashboard
```
GET /api/dashboard            - Get dashboard statistics (requires read permission)
```

## 🔧 Middleware

### Authentication Middleware
- Validates JWT tokens
- Attaches user data to request object
- Handles token expiration

### Permission Middleware
- Checks user permissions for specific modules
- Supports read, create, update, delete actions
- Admin role bypasses all permission checks

### Error Handling Middleware
- Centralized error handling
- Consistent error response format
- Logging for debugging

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "err": "Detailed error information"
}
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **CORS Protection**: Configurable cross-origin requests
- **Input Validation**: Request data validation
- **SQL Injection Prevention**: Parameterized queries
- **Permission-Based Access**: Role-based authorization

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
   ```bash
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=your_secure_jwt_secret
   ```

2. **Database**
   - Use production MySQL instance
   - Configure connection pooling
   - Set up proper backups

3. **Process Management**
   ```bash
   npm install -g pm2
   pm2 start app.js --name "rbac-api"
   pm2 save
   pm2 startup
   ```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

### Manual Testing
```bash
# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test protected endpoint
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Default Data

The system comes with default data:

### Default Admin User
- **Username**: admin
- **Password**: admin123
- **Role**: Admin (full permissions)

### Default Permissions
- Admin role has full access to all modules
- Other roles need to be configured with specific permissions

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check MySQL service is running
   - Verify database credentials in .env
   - Ensure database exists

2. **JWT Token Issues**
   - Check JWT_SECRET is set
   - Verify token expiration time
   - Check token format in requests

3. **Permission Denied**
   - Verify user has correct role
   - Check role permissions in database
   - Ensure Admin role has full access

### Logs
```bash
# View application logs
npm run dev

# Check database logs
tail -f /var/log/mysql/error.log
```

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check database schema
4. Verify environment configuration

## 📄 License

This project is licensed under the MIT License. 