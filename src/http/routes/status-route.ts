import express from "express";
import { StatusController } from "../controllers/status-controller";

export const StatusRouter = express.Router();

StatusRouter.get('/', StatusController.get);
