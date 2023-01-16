import { WebSocket } from 'ws';

import { Message } from '../model/messsage';

export type P2PConnectionType = 'INCOMING' | 'OUTGOING';

export interface P2PConnection {
  id: string;
  socket: WebSocket;
  connected: boolean;
  type: P2PConnectionType;
  address: string;
  // unix timestamp of last received/sent message
  lastTransaction: number;
  write: (message: Message) => void;
}
