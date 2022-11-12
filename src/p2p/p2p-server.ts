import { RawData, WebSocket, WebSocketServer } from 'ws';
import { Mutex } from 'async-mutex';
import { v4 as uuidv4 } from 'uuid';

import { Message } from '../model/messsage';
import { MessageType } from '../model/message_type';
import {
  Blockchain,
  BlockchainManager,
} from '../blockchain/blockchain-manager';
import { Logger } from '../utils/logging';
import { AddressManager } from '../net/address-manager';
import { Block } from '../model/block';
import { Address } from '../model/address';
import { EventBus } from '../events/event-bus';
import { Events } from '../events/events';

export interface P2PServerError {
  port: number;
  error: Error;
}

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

export interface OutgoingP2PConnection extends P2PConnection {
  abc: number;
}

// 10 Minutes, in milliseconds
const ASK_PEERS_TIMEOUT = 600000;
// 10 Seconds, in milliseconds
const LOAD_ADDRESSES_TIMER = 10000;
// 60 seconds, in milliseconds
const CLIENT_LAST_TRANSACTION_TIMEOUT = 60000;

const mutex = new Mutex();

export class P2PServer {
  private static singletonInstance: P2PServer;

  public static get instance(): P2PServer {
    if (!P2PServer.singletonInstance) {
      P2PServer.singletonInstance = new P2PServer();
    }
    return P2PServer.singletonInstance;
  }

  private port = 0;
  private sockets: WebSocket[] = [];
  private connections: P2PConnection[] = [];

  private server: WebSocketServer | null = null;

  private initialized = false;

  private constructor() {
    // empty on purpose
  }

  private onServerError(error: Error) {
    EventBus.instance.dispatch<P2PServerError>(Events.P2P.Error, {
      port: this.port,
      error,
    });
  }

  private onServerListening() {
    Logger.warn('Weeeeeeeeeeeeeee');
    EventBus.instance.dispatch<number>(Events.P2P.Listening, this.port);

    // Load all address 10 seconds after booting the p2p server
    setTimeout(async () => {
      const addresses = await AddressManager.instance.getAll();

      const endpoints = addresses.map((addr: Address) => addr.endpoint);

      for (const endpoint of endpoints) {
        await this.connectToPeer(endpoint);
      }
    }, LOAD_ADDRESSES_TIMER);
  }

  public start(port: number): void {
    if (this.initialized) {
      throw new Error('P2PServer is already initialized.');
    }

    this.port = port;
    this.server = new WebSocketServer({ port }, () =>
      Logger.error('Dafuqqqqqqqqqqqqq')
    );

    this.server.on('listening', this.onServerListening.bind(this));
    this.server.on('error', this.onServerError.bind(this));
    this.server.on('connection', async (socket: WebSocket) => {
      await this.onServerConnection(socket);
    });

    // setInterval(P2PServer.askPeers.bind(P2PServer), P2PServer.ASK_PEERS_TIMEOUT);
    setInterval(P2PServer.askLatestBlockFromPeers, ASK_PEERS_TIMEOUT);
  }

  private async removeConnection(connection: P2PConnection) {
    const connections = await this.getConnections();

    const existingConnection = connections.find(
      (conn: P2PConnection) => conn.id === connection.id
    );

    if (!existingConnection) {
      Logger.warn('Connection was not found in connection list', connection);
      return;
    }

    // get connection index
    const connectionIndex = connections.indexOf(existingConnection);

    const unlock = await mutex.acquire();

    // remove connection from the list
    this.connections.splice(connectionIndex, 1);

    unlock();
  }

  private async onClientMessage(connection: P2PConnection, data: RawData) {
    try {
      const message: Message | null = P2PServer.JSONtoObject<Message>(data);
      if (message === null) {
        Logger.warn('Could not parse received JSON message: ', data);
        return;
      }

      Logger.info('Received p2p message:', {
        peer: connection.socket.url,
        message,
      });

      switch (message.type) {
        case MessageType.QUERY_LATEST_BLOCK:
          BlockchainManager.instance
            .getLatestBlock()
            .then((block) => {
              this.write(socket, {
                type: MessageType.RESPONSE_BLOCKCHAIN,
                data: JSON.stringify([block]),
              });
            })
            .catch((err) => Logger.error(err));

          break;
        case MessageType.QUERY_ALL_BLOCKS:
          BlockchainManager.instance
            .getChain()
            .then((chain) => {
              this.write(socket, {
                type: MessageType.RESPONSE_BLOCKCHAIN,
                data: JSON.stringify(chain),
              });
            })
            .catch((err) => {
              Logger.error(err);
            });

          break;
        case MessageType.RESPONSE_BLOCKCHAIN: {
          const receivedChain = P2PServer.JSONtoObject<Blockchain>(
            message.data
          );

          if (receivedChain === null) {
            Logger.warn('Invalid blocks received: ', message.data);
            break;
          }

          this.handleBlockchainResponse(receivedChain);

          break;
        }
        case MessageType.QUERY_PEERS:
          try {
            const addresses = await AddressManager.instance.getAll();

            const sockets = addresses.map((addr: Address) => addr.endpoint);

            this.write(socket, {
              type: MessageType.RESPONSE_PEERS,
              data: JSON.stringify(sockets),
            });
          } catch (error) {
            Logger.warn('Could not retrieve addresses: ', error);
          }

          break;
        case MessageType.RESPONSE_PEERS: {
          const receivedPeers: string[] | null = P2PServer.JSONtoObject<
            string[]
          >(message.data);

          receivedPeers?.forEach((peer) => {
            Logger.info('Connecting to peer: ', peer);
            P2PServer.connectToPeer(peer);
          });

          break;
        }
      }
    } catch (ex) {
      Logger.error('Error somewhere in P2P - ', ex);
    }
  }

  private async handleNewIncomingConnection(socket: WebSocket) {
    // new connection to be added from outside
    const newConnection: P2PConnection = {
      id: uuidv4(),
      socket,
      type: 'INCOMING',
      connected: true,
      lastTransaction: Date.now(),
      write: (message) => socket.send(JSON.stringify(message)),
    };

    // Add the connection to the list
    const unlock = await mutex.acquire();
    this.connections.push(newConnection);
    unlock();

    newConnection.socket.on('message', async (data: RawData) => {
      await this.onClientMessage(newConnection, data);
    });

    newConnection.socket.on('close', async (code: number, reason: Buffer) => {
      Logger.info(`Connection lost to peer. ${code} - ${reason.toString()}`);
      await this.removeConnection(newConnection);
    });

    newConnection.socket.on('error', async (error: Error) => {
      Logger.warn(`Connection closed abruptly to peer`, error);
      await this.removeConnection(newConnection);
    });

    // Query new connection's latest block
    newConnection.write({
      type: MessageType.QUERY_LATEST_BLOCK,
    });
  }

  private async onServerConnection(socket: WebSocket) {
    const connections = await this.getConnections();

    // TODO: Implement outgoing connection logic
    const outgoingConnections = connections.filter(
      (connection: P2PConnection) => connection.type === 'OUTGOING'
    );

    const incomingConnections = connections.filter(
      (connection: P2PConnection) => connection.type === 'INCOMING'
    );

    const existingConnection = incomingConnections.find(
      (connection: P2PConnection) => connection.socket.url === socket.url
    );

    if (!existingConnection) {
      // non existent incoming connection
      await this.handleNewIncomingConnection(socket);
      return;
    }

    if (existingConnection) {
      //
    }
  }

  public async connectToPeer(endpoint: string): Promise<void> {
    if (this.initialized) {
      throw new Error('P2PServer is not initialized.');
    }

    /**
     * TODO Don't connect to local node
     * TODO Check connected sockets and stop if already connected
     */

    Logger.info(`Connecting to peer -> ${endpoint}`);

    const socks = await this.getSockets();
    const clients = await this.getConnections();

    const existingClient = clients.find(
      (client: P2PConnection) => client.clientSocket.url === endpoint
    );

    if (!existingClient) {
      // connect to this new client
      const newClient: P2PConnection = {
        hostSocket: new WebSocket(endpoint),
        connected: false,
        lastTransaction: Date.now(),
      };
      const ws: WebSocket = new WebSocket(endpoint);
      ws.on('open', async () => {
        this.onServerConnection(ws);

        await AddressManager.instance.add(new Address(endpoint));
        await AddressManager.instance.saveLocally();
      });
      ws.on('error', (err) => {
        Logger.warn('connection failed -> ', err);
      });

      return;
    }

    if (existingClient && !existingClient.connected) {
      // try to reconnect
      return;
    }

    if (
      existingClient.lastTransaction <
      Date.now() - CLIENT_LAST_TRANSACTION_TIMEOUT
    ) {
      // send keepalive
      return;
    }

    // At this point we know we're already connect to the client, since all previous validations have failed
    Logger.warn(`Already connected to client ${endpoint}`);
  }

  public async getConnections(): Promise<P2PConnection[]> {
    if (!this.initialized) {
      throw new Error('P2PServer is not initialized.');
    }

    const unlock = await mutex.acquire();

    const connections = this.connections;

    unlock();

    return connections;
  }

  public async askPeers(endpoint: string) {
    if (!this.initialized) {
      throw new Error('P2PServer is not initialized.');
    }
    Logger.info(`Asking peers from connected socket (${endpoint})`);

    const connection = await this.getConnection(endpoint, true);

    if (connection) {
      connection.write({ type: MessageType.QUERY_PEERS });
    } else {
      const connections = await this.getConnections();
      connections.forEach((conn: P2PConnection) =>
        conn.write({ type: MessageType.QUERY_PEERS })
      );
    }
  }

  private async getConnection(endpoint: string, throwOnFailure = false) {
    const connections = await this.getConnections();

    const connection = connections.find(
      (conn: P2PConnection) => conn.socket.url === endpoint
    );

    if (!connection && throwOnFailure) {
      throw new Error(`Connection with endpoint (${endpoint}) not found`);
    }

    return connection;
  }

  public static broadcastBlockchain(): void {
    BlockchainManager.instance
      .getChain()
      .then((chain) => {
        this.broadcast({
          type: MessageType.RESPONSE_BLOCKCHAIN,
          data: JSON.stringify(chain),
        });
      })
      .catch((err) => Logger.error(err));
  }

  public static broadcastLatestBlock(block: Block) {
    this.broadcast({
      type: MessageType.RESPONSE_BLOCKCHAIN,
      data: JSON.stringify([block]),
    });
  }

  private static askLatestBlockFromPeers() {
    P2PServer.broadcast({ type: MessageType.QUERY_LATEST_BLOCK, data: null });
  }

  private static broadcast(message: Message): void {
    this.sockets.forEach((socket) => {
      this.write(socket, message);
    });
  }

  private static JSONtoObject<T>(data: any): T | null {
    try {
      return JSON.parse(data);
    } catch (err: any) {
      Logger.error(err.message);
      return null;
    }
  }

  private static handleBlockchainResponse(receivedChain: Blockchain) {
    if (receivedChain.length === 0) {
      Logger.warn('Received block chain size of 0');
      return;
    }
    const latestBlockReceived: Block = receivedChain[receivedChain.length - 1];

    BlockchainManager.instance
      .getLatestBlock()
      .then(async (latestBlockHeld: Block) => {
        if (latestBlockReceived.index > latestBlockHeld.index) {
          Logger.info(
            `blockchain possibly behind. We got block index: ${latestBlockHeld.index} Peer got block index: ${latestBlockReceived.index}`
          );
          if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            const addedBlock = await BlockchainManager.instance.addBlock(
              latestBlockReceived
            );
            if (addedBlock) {
              Logger.info('Adding missing block: ', latestBlockReceived);
              P2PServer.broadcast({
                type: MessageType.RESPONSE_BLOCKCHAIN,
                data: JSON.stringify([latestBlockReceived]),
              });
            }
          } else if (receivedChain.length === 1) {
            Logger.info('We have to query the chain from our peers');
            P2PServer.broadcast({
              type: MessageType.QUERY_ALL_BLOCKS,
              data: null,
            });
          } else {
            Logger.info(
              'Received blockchain is longer than current blockchain'
            );
            BlockchainManager.instance
              .replaceChain(receivedChain)
              .then(() => {
                Logger.info('Replaced blockchain with received one.');
                // P2PServer.broadcastBlockchain(); // This might not be a good practise
              })
              .catch((err) =>
                Logger.warn('Error replacing blockchain -> ', err)
              );
          }
        } else {
          Logger.info(
            'Received blockchain is not longer than received blockchain. Do nothing'
          );
        }
      })
      .catch((err) => Logger.warn('Error retrieving latest block', err));
  }
}
