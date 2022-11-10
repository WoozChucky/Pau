import express from "express";
import { BlockController } from "../controllers/block-controller";

export const BlockRouter = express.Router();

BlockRouter.get('/', BlockController.getAll);
BlockRouter.get('/:hash',  BlockController.getOneByHash);
// BlockRouter.get('/broadcast', );
// BlockRouter.post('/', );


// this.router.post('/broadcast', BlockRoute.broadcastBlockchain.bind(this));

// this.router.post('/', BlockRoute.generateBlock.bind(this));
