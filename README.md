# Role-Based Access Control System with Enterprise Management (Backend)

## Stack
- Node.js + Express.js
- MySQL

## Features
- Role-based access control (RBAC)
- User, Role, Enterprise, Employee, Product, Dashboard modules
- JWT authentication & permissions middleware
- Modular, scalable backend

## Getting Started

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd <project-folder>
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your values:
```bash
cp env.example .env
```

### 4. Database Setup
- Create the database and tables:
  - Import `src/config/database.sql` into your MySQL server.
- Update your `.env` with your MySQL credentials.

### 5. Run the Server
```bash
npm run dev
```

Server runs on `http://localhost:3000` by default.

## Git Setup

### Initialize Git (if not already)
```bash
git init
git add .
git commit -m "Initial commit"
```

### Add Remote and Push
```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

## API Endpoints
- All endpoints are prefixed with `/api/`
- Use JWT token in `Authorization: Bearer <token>` header

## License
MIT 