import express from "express";
import analyticsRoutes from "./api/routes/analytics.js";
import exportRoutes from "./api/routes/export.js";

const app = express();
app.use(express.json());

app.use("/api", analyticsRoutes);
app.use("/api", exportRoutes);

export { app };
