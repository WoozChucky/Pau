import express from "express";
import { WalletController } from "../controllers/wallet-controller";

export const WalletRouter = express.Router();

WalletRouter.post('', WalletController.create);
WalletRouter.get('/:privateKey', WalletController.getByPrivateKey);
