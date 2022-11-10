import { NextFunction, Request, Response } from "express";
import sp from "synchronized-promise";
import { AddressManager } from "../../net/address-manager";

const getAll = (req: Request, res: Response, next: NextFunction) => {

  const addresses = sp(AddressManager.getAll)();

  res.json(addresses);
}

const getByAddress = (req: Request, res: Response, next: NextFunction) => {

  const address = sp(AddressManager.getAddress)(req.params.address);

  res.json(address);
}

export const AddressController = {
  getAll,
  getByAddress
}
