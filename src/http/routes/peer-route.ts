import express, { Router } from "express";
import { PeerController } from "../controllers/peer-controller";

export const PeerRouter = express.Router();

PeerRouter.get('/', async (req, res, next) => await PeerController.getAll(req, res, next));
PeerRouter.post('/', async (req, res, next) => await PeerController.add(req, res, next));
PeerRouter.post('/ask', async (req, res, next) => await PeerController.ask(req, res, next));
PeerRouter.post('/ask/:peer', async (req, res, next) => await PeerController.ask(req, res, next));
