import express, { Router } from "express";
import { PeerController } from "../controllers/peer-controller";

export const PeerRouter = express.Router();

PeerRouter.get('/', PeerController.getAll);
PeerRouter.post('/', PeerController.add);
PeerRouter.post('/ask', PeerController.ask);
PeerRouter.post('/ask/:peer', PeerController.ask);
