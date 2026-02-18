import express from "express";
import analyticsRoutes from "./api/routes/analytics.js";
import exportRoutes from "./api/routes/export.js";

const app = express();
app.use(express.json());

const apiRouter = express.Router();
apiRouter.use(analyticsRoutes);
apiRouter.use(exportRoutes);
app.use("/api", apiRouter);

export { app };
