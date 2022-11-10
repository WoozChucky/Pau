import { NextFunction, Request, Response } from "express";
import { AddressManager } from "../../net/address-manager";

const getAll = async (req: Request, res: Response, next: NextFunction) => {

  const addresses = await AddressManager.getAll();

  res.json(addresses);
}

const getByAddress = async (req: Request, res: Response, next: NextFunction) => {

  const address = await AddressManager.getAddress(req.params.address);

  res.json(address);
}

export const AddressController = {
  getAll,
  getByAddress
}
