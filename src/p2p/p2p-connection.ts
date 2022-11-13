import { WebSocket } from 'ws';

import { Message } from '../model/messsage';

export type P2PConnectionType = 'INCOMING' | 'OUTGOING';

export interface P2PConnection {
  id: string;
  socket: WebSocket;
  connected: boolean;
  type: P2PConnectionType;
  // unix timestamp of last received/sent message
  lastTransaction: number;
  write: (message: Message) => void;
}
