import { NextFunction, Request, Response } from "express";
import { WalletManager } from "../../blockchain/wallet/wallet-manager";

const getByPrivateKey = (req: Request, res: Response, next: NextFunction) => {

  const address = WalletManager.getPublicAddress(req.params.privateKey);

  res.json(address);

}

const create = (req: Request, res: Response, next: NextFunction) => {

  const wallet = WalletManager.generateNewWallet();

  res.json(wallet);

}


export const WalletController = {
  getByPrivateKey,
  create
}
