import { NextFunction, Request, Response } from "express";

export const StatusController = {
  get: get
}

function get(req: Request, res: Response, next: NextFunction) {
  res.json({status: 'UP'});
}
