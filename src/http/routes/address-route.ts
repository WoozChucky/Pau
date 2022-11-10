import express from "express";
import { AddressController } from "../controllers/address-controller";

export const AddressRouter = express.Router();

AddressRouter.get('/',async (req, res, next) => await AddressController.getAll(req, res, next));
AddressRouter.get('/:address', async (req, res, next) => await AddressController.getByAddress(req, res, next));
