import express from "express";

import { StatusController } from "../controllers/status-controller";

export const StatusRouter = express.Router();

// TODO: Add endpoint that return own address

StatusRouter.get(
  "/",
  async (req, res, next) => await StatusController.get(req, res, next)
);
