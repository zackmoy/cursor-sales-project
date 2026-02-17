import express from "express";
import analyticsRoutes from "./api/routes/analytics.js";

const app = express();
app.use(express.json());

app.use("/api", analyticsRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
