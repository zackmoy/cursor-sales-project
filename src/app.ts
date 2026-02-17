import express from "express";
import analyticsRoutes from "./api/routes/analytics.js";

const app = express();
app.use(express.json());

app.use("/api", analyticsRoutes);

export { app };
