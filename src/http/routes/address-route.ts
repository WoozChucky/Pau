import express from "express";
import { AddressController } from "../controllers/address-controller";

export const AddressRouter = express.Router();

AddressRouter.get('/', AddressController.getAll);
AddressRouter.get('/:address', AddressController.getByAddress);
