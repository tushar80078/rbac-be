require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { testConnection } = require("./config/database");
const { errorHandler, notFound } = require("./middlewares/errorHandler");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
});
app.use(limiter);

// Test DB connection
(async () => {
  await testConnection();
})();

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/roles", require("./routes/roles"));
app.use("/api/users", require("./routes/users"));
app.use("/api/enterprises", require("./routes/enterprises"));
app.use("/api/employees", require("./routes/employees"));
app.use("/api/products", require("./routes/products"));
app.use("/api/dashboard", require("./routes/dashboard"));

// 404 and error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
