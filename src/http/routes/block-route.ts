import express from "express";
import { BlockController } from "../controllers/block-controller";

export const BlockRouter = express.Router();

BlockRouter.get('/', BlockController.getAll);
BlockRouter.get('/:hash',  BlockController.getOneByHash);
BlockRouter.get('/broadcast', BlockController.broadcast);
BlockRouter.post('/', BlockController.generateBlock);
