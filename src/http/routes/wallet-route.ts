import express from "express";
import { WalletController } from "../controllers/wallet-controller";

export const WalletRouter = express.Router();

WalletRouter.post('', async (req, res, next) => await WalletController.create(req, res, next));
WalletRouter.get('/:privateKey', async (req, res, next) => await WalletController.getByPrivateKey(req, res, next));
