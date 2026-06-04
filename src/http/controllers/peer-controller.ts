import { NextFunction, Request, Response } from 'express';

import { P2PServer } from '../../p2p/p2p-server';

const getAll = async (req: Request, res: Response, next: NextFunction) => {
  const connections = await P2PServer.instance.getConnections();

  // getSockets().map((s: any) => `${s._socket.remoteAddress}:${s._socket.remotePort}`);

  res.json(connections);
};

const add = async (req: Request, res: Response, next: NextFunction) => {
  await P2PServer.instance.connectToPeer(req.body.peer);

  res.status(201).json({});
};

const ask = async (req: Request, res: Response, next: NextFunction) => {
  const peer = req.body.peer || '';

  await P2PServer.instance.askPeers(peer);

  res.json({});
};

export const PeerController = {
  getAll,
  add,
  ask,
};
