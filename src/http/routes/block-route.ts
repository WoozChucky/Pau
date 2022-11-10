import express from "express";
import { BlockController } from "../controllers/block-controller";

export const BlockRouter = express.Router();

BlockRouter.get('/', async (req, res, next) => await BlockController.getAll(req, res, next));
BlockRouter.get('/:hash',  async (req, res, next) => await BlockController.getOneByHash(req, res, next));
BlockRouter.get('/broadcast', async (req, res, next) => await BlockController.broadcast(req, res, next));
BlockRouter.post('/', async (req, res, next) => await BlockController.generateBlock(req, res, next));
