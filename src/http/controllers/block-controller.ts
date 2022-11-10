import { BlockchainManager } from "../../blockchain/blockchain-manager";
import { NextFunction, Request, Response } from "express";
import { P2PServer } from "../../p2p/p2p-server";
import { Get, Route, Tags,  Post, Body, Path } from "tsoa";
import { Block } from "../../model/block";

/**
 * Gets the entire chain
 *
 * @method getAll
 * @param req {Request} The express Request object.
 * @param res {Response} The express Response object.
 * @param next {NextFunction} Execute the next middleware method.
 */
const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chain = await BlockchainManager.getChain();
    res.json(chain);
  } catch (err: any) {
    res.status(400).json({ message : `${err.message}`});
  }
}

/**
 * Gets a specific block by hash
 *
 * @method getOneByHash
 * @param req {Request} The express Request object.
 * @param res {Response} The express Response object.
 * @param next {NextFunction} Execute the next middleware method.
 */
const getOneByHash = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const block =  await BlockchainManager.getBlock(req.params.hash);
    res.json(block);
  } catch (err: any) {
    res.status(404).json({ message : `${err.message}`});
  }
}

/**
 * Broadcasts the chain to connected p2p peers
 *
 * @method broadcast
 * @param req {Request} The express Request object.
 * @param res {Response} The express Response object.
 * @param next {NextFunction} Execute the next middleware method.
 */
const broadcast = async (req: Request, res: Response, next: NextFunction) => {

  P2PServer.broadcastBlockchain();

  res.json({ success: true});
}

/**
 * Broadcasts the chain to connected p2p peers
 *
 * @method generateBlock
 * @param req {Request} The express Request object.
 * @param res {Response} The express Response object.
 * @param next {NextFunction} Execute the next middleware method.
 */
const generateBlock = async (req: Request, res: Response, next: NextFunction) => {

  const block = await BlockchainManager.generateNextBlock(req.body.data);

  res.json(block);

}

@Route('blocks')
export class Controller {

  @Get("/")
  public async findAll(): Promise<object> {
    return {
      message: "pong",
    };
  }

  @Get("/:hash")
  public async findOne(@Path() hash: string): Promise<Block> {
    return {
      timestamp: 0,
      index: 0,
      data: {},
      hash: '',
      difficulty: 0,
      nonce: 0,
      previousHash: ''
    };
  }

}

export const BlockController = {
  getAll,
  getOneByHash,
  broadcast,
  generateBlock
}
