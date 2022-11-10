import { NextFunction, Request, Response } from "express";
import { P2PServer } from "../../p2p/p2p-server";

const getAll = async (req: Request, res: Response, next: NextFunction) => {

  const peers = P2PServer.getSockets().map((s : any) => `${s._socket.remoteAddress}:${s._socket.remotePort}`);

  res.json(peers)
}

const add = async (req: Request, res: Response, next: NextFunction) => {

  P2PServer.connectToPeer(req.body.peer);

  res.status(201).json({})
}

const ask = async (req: Request, res: Response, next: NextFunction) => {

  const peer = req.params.peer || '';

  P2PServer.askPeers(peer);

  res.json({})
}

export const PeerController = {
  getAll,
  add,
  ask
};
