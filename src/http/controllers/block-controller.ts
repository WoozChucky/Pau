import { BlockchainManager } from "../../blockchain/blockchain-manager";
import { NextFunction, Request, Response } from "express";
import sp from 'synchronized-promise'
import { P2PServer } from "../../p2p/p2p-server";

/**
 * Gets the entire chain
 *
 * @method getAll
 * @param req {Request} The express Request object.
 * @param res {Response} The express Response object.
 * @param next {NextFunction} Execute the next middleware method.
 */
const getAll = (req: Request, res: Response, next: NextFunction) => {
  try {
    const chain = sp(BlockchainManager.getChain)()
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
const getOneByHash = (req: Request, res: Response, next: NextFunction) => {
  try {
    const block = sp(BlockchainManager.getBlock)(req.params.hash);
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
const broadcast = (req: Request, res: Response, next: NextFunction) => {

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
const generateBlock = (req: Request, res: Response, next: NextFunction) => {

  const block = sp(BlockchainManager.generateNextBlock)(req.body.data);

  res.json(block);

}

export const BlockController = {
  getAll,
  getOneByHash,
  broadcast,
  generateBlock
}
