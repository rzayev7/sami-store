const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./src/config/db");
const { errorHandler } = require("./src/middleware/errorMiddleware");

dotenv.config();
connectDB();

const app = express();

const defaultOrigins = [
  "https://sami-store.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (process.env.FRONTEND_URL) {
  envOrigins.push(process.env.FRONTEND_URL.trim());
}

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Vercel preview deployments: https://sami-store-xxx.vercel.app
      if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Sami API is running");
});

app.use("/api/products", require("./src/routes/productRoutes"));
app.use("/api/orders", require("./src/routes/orderRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));
app.use("/api/admin", require("./src/routes/adminDashboardRoutes"));
app.use("/api/upload", require("./src/routes/uploadRoutes"));
app.use("/api/categories", require("./src/routes/categoryRoutes"));
app.use("/api/coupons", require("./src/routes/couponRoutes"));
app.use("/api/customers", require("./src/routes/customerRoutes"));
app.use("/api/payments/kapital", require("./src/routes/kapitalPaymentRoutes"));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
