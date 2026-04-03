const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./src/config/db");
const { errorHandler } = require("./src/middleware/errorMiddleware");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
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
