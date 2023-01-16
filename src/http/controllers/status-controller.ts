import { NextFunction, Request, Response } from "express";

const get = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ status: "UP" });
};

export const StatusController = {
  get,
};
