import { Server } from 'http';

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

import { P2PConnection } from './p2p-connection';

// 10 Minutes, in milliseconds
const ASK_PEERS_TIMEOUT = 100000;
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

  private static JSONtoObject<T>(data: any): T | null {
    try {
      return JSON.parse(data);
    } catch (err: any) {
      Logger.error(err.message);
      return null;
    }
  }

  private connections: P2PConnection[] = [];

  private server: WebSocketServer | null = null;

  private initialized = false;

  private port = 0;

  private constructor() {
    // empty on purpose
  }

  public configure(server: Server, hostname: string, port: number): void {
    if (this.initialized) {
      throw new Error('P2PServer is already initialized.');
    }
    this.port = port;
    this.server = new WebSocketServer({ server, host: hostname });

    this.server.on('listening', this.onServerListening.bind(this));
    this.server.on('error', this.onServerError.bind(this));
    this.server.on('connection', async (socket: WebSocket) => {
      await this.onServerConnection(socket);
    });

    setInterval(this.askPeers.bind(this), ASK_PEERS_TIMEOUT);
    setInterval(this.askLatestBlockFromPeers.bind(this), ASK_PEERS_TIMEOUT);
    setInterval(async () => {
      const connections = await this.getConnections();
      if (connections.length <= 0) return;
      Logger.debug('Connections:');
      for (const connection of connections) {
        Logger.debug(`${connection.type} ${connection.address}`);
      }
    }, 10000);

    this.initialized = true;
  }

  public async connectToPeer(endpoint: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('P2PServer is not initialized.');
    }

    /**
     * TODO Don't connect to local node
     * TODO Check connected sockets and stop if already connected
     */

    if (endpoint === this.ownAddress()) {
      Logger.warn('Connecting to the current node is not allowed.');
      return;
    }

    Logger.info(`Connecting to peer -> ${endpoint}`);

    const connections = await this.getConnections();

    const existingClient = connections.find(
      (connection: P2PConnection) => connection.address === endpoint
    );

    if (!existingClient) {
      await this.handleNewOutgoingConnection(new WebSocket(endpoint));

      return;
    }

    if (existingClient && !existingClient.connected) {
      // try to reconnect
      Logger.error('Implement reconnect here');
      return;
    }

    if (
      existingClient.lastTransaction <
      Date.now() - CLIENT_LAST_TRANSACTION_TIMEOUT
    ) {
      existingClient.write({ type: MessageType.KEEP_ALIVE });
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

    Logger.info(`Asking peers from peer (${endpoint})`);

    const connection = await this.getConnection(endpoint, false);

    if (connection) {
      connection.write({ type: MessageType.QUERY_PEERS });
    } else {
      Logger.info(
        `Peer (${endpoint}) not connected. Sending message to all peers`
      );
      const connections = await this.getConnections();
      connections.forEach((conn: P2PConnection) =>
        conn.write({ type: MessageType.QUERY_PEERS })
      );
    }
  }

  public async broadcastBlockchain() {
    if (!this.initialized) {
      throw new Error('P2PServer is not initialized.');
    }

    const chain = await BlockchainManager.instance.getChain();
    await this.broadcast({
      type: MessageType.RESPONSE_BLOCKCHAIN,
      data: chain,
    });
  }

  public async broadcastLatestBlock(block: Block | null = null) {
    if (!this.initialized) {
      throw new Error('P2PServer is not initialized.');
    }

    // if no block passed by argument, fetch it from manager
    if (!block) {
      const latestBlock = await BlockchainManager.instance.getLatestBlock();
      await this.broadcast({
        type: MessageType.RESPONSE_BLOCKCHAIN,
        data: [latestBlock],
      });
      return;
    }

    await this.broadcast({
      type: MessageType.RESPONSE_BLOCKCHAIN,
      data: [block],
    });
  }

  private async onServerConnection(socket: WebSocket) {
    const connections = await this.getConnections();

    const existingConnection = connections.find(
      (connection: P2PConnection) => connection.address === socket.url
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

  private onServerError(error: Error) {
    EventBus.instance.dispatch(Events.P2P.Error, error);
  }

  private onServerListening() {
    EventBus.instance.dispatch(Events.P2P.Listening);

    // Load all address 10 seconds after booting the p2p server
    setTimeout(async () => {
      const addresses = await AddressManager.instance.getAll();

      const endpoints = addresses.map((addr: Address) => addr.endpoint);

      for (const endpoint of endpoints) {
        await this.connectToPeer(endpoint);
      }
    }, LOAD_ADDRESSES_TIMER);
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
      if (!message) {
        Logger.warn(`Could not parse received JSON message: ${data}`, data);
        return;
      }

      Logger.info(
        `Received p2p(${connection.socket.url}) message: ${
          MessageType[message.type]
        }`,
        {
          connection,
          message,
        }
      );

      switch (message.type) {
        case MessageType.QUERY_LATEST_BLOCK: {
          const latestBlock = await BlockchainManager.instance.getLatestBlock();
          connection.write({
            type: MessageType.RESPONSE_BLOCKCHAIN,
            data: [latestBlock],
          });
          break;
        }

        case MessageType.QUERY_ALL_BLOCKS: {
          const chain = await BlockchainManager.instance.getChain();
          connection.write({
            type: MessageType.RESPONSE_BLOCKCHAIN,
            data: chain,
          });
          break;
        }

        case MessageType.RESPONSE_BLOCKCHAIN: {
          const receivedChain: Blockchain = message.data;

          if (!receivedChain) {
            Logger.warn('Invalid blockchain received ', message.data);
            break;
          }

          await this.handleBlockchainResponse(connection, receivedChain);

          break;
        }

        case MessageType.QUERY_PEERS:
          try {
            const addresses = await AddressManager.instance.getAll();

            const sockets = addresses.map((addr: Address) => addr.endpoint);

            const connections = await this.getConnections();
            const addressList = connections.map((conn) => conn.address);

            connection.write({
              type: MessageType.RESPONSE_PEERS,
              data: addressList,
            });
          } catch (error) {
            Logger.warn('Could not retrieve addresses: ', error);
          }
          break;

        case MessageType.QUERY_PEER_ADDRESS: {
          connection.write({
            type: MessageType.RESPONSE_PEER_ADDRESS,
            data: `ws://${this.server?.options.host}:${this.port}`,
          });
          break;
        }

        case MessageType.RESPONSE_PEER_ADDRESS: {
          const address: string = message.data;

          const connections = await this.getConnections();

          if (
            connections.find((conn: P2PConnection) => conn.address === address)
          ) {
            // connection already exists, dropping it now
            connection.socket.close();
            Logger.debug('Dropping already existing connection');
          } else {
            // eslint-disable-next-line require-atomic-updates
            connection.address = message.data;
          }
          break;
        }

        case MessageType.RESPONSE_PEERS: {
          const receivedPeers: string[] = message.data;

          receivedPeers?.forEach((peer) => {
            Logger.info(`Connecting to peer: ${peer}`);
            this.connectToPeer(peer);
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
    Logger.info(`Connected to new incoming node at ${socket.url}`);
    const newConnection: P2PConnection = {
      id: uuidv4(),
      socket,
      type: 'INCOMING',
      connected: true,
      address: socket.url,
      lastTransaction: Date.now(),
      write: (message) => {
        socket.send(JSON.stringify(message));
        newConnection.lastTransaction = Date.now();
      },
    };

    // Query new connection's real address
    newConnection.write({
      type: MessageType.QUERY_PEER_ADDRESS,
    });

    await this.handleNewConnection(newConnection);
  }

  private async handleNewOutgoingConnection(socket: WebSocket) {
    // new connection to be added from outside
    socket.on('open', async () => {
      Logger.info(`Connected to new outgoing node at ${socket.url}`);
      const newConnection: P2PConnection = {
        id: uuidv4(),
        socket,
        type: 'OUTGOING',
        connected: true,
        address: socket.url,
        lastTransaction: Date.now(),
        write: (message) => {
          socket.send(JSON.stringify(message));
          newConnection.lastTransaction = Date.now();
        },
      };
      await this.handleNewConnection(newConnection);
    });
  }

  private async handleNewConnection(connection: P2PConnection) {
    // Add the connection to the list
    const unlock = await mutex.acquire();
    this.connections.push(connection);
    unlock();

    connection.socket.on('message', async (data: RawData) => {
      connection.lastTransaction = Date.now();
      await this.onClientMessage(connection, data);
    });

    connection.socket.on('close', async (code: number, reason: Buffer) => {
      Logger.info(`Connection lost to peer. ${code} - ${reason.toString()}`);
      await this.removeConnection(connection);
    });

    connection.socket.on('error', async (error: Error) => {
      Logger.warn(`Connection closed abruptly to peer`, error);
      await this.removeConnection(connection);
    });

    // Query new connection's latest block
    connection.write({
      type: MessageType.QUERY_LATEST_BLOCK,
    });
    Logger.warn(`${this.server?.options.host}:${this.port}`);
  }

  private async getConnection(endpoint: string, throwOnFailure = false) {
    if (!this.initialized) {
      throw new Error('P2PServer is not initialized.');
    }

    const connections = await this.getConnections();

    const connection = connections.find(
      (conn: P2PConnection) => conn.address === endpoint
    );

    if (!connection && throwOnFailure) {
      throw new Error(`Connection with endpoint (${endpoint}) not found`);
    }

    return connection;
  }

  private ownAddress(): string {
    return `ws://${this.server?.options.host}:${this.port}`;
  }

  private async askLatestBlockFromPeers() {
    if (!this.initialized) {
      throw new Error('P2PServer is not initialized.');
    }

    await this.broadcast({ type: MessageType.QUERY_LATEST_BLOCK });
  }

  private async broadcast(message: Message) {
    if (!this.initialized) {
      throw new Error('P2PServer is not initialized.');
    }

    const connections = await this.getConnections();
    connections.forEach((connection: P2PConnection) =>
      connection.write(message)
    );
  }

  private async handleBlockchainResponse(
    connection: P2PConnection,
    receivedChain: Blockchain
  ) {
    if (!this.initialized) {
      throw new Error('P2PServer is not initialized.');
    }

    if (receivedChain.length === 0) {
      Logger.warn('Received block chain size of 0');
      return;
    }
    const latestBlockReceived = receivedChain[receivedChain.length - 1];

    const latestBlockHeld = await BlockchainManager.instance.getLatestBlock();

    if (latestBlockReceived.index <= latestBlockHeld.index) {
      Logger.info(
        'Received blockchain is not longer than received blockchain. Do nothing'
      );
      return;
    }

    Logger.info(
      `Blockchain possibly behind. 
      We got block index: ${latestBlockHeld.index} 
      Peer got block index: ${latestBlockReceived.index}`
    );

    if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
      // current hash = peer's latest block previous hash, simply add missing block
      const addedBlock = await BlockchainManager.instance.addBlock(
        latestBlockReceived
      );
      if (addedBlock) {
        Logger.info(
          `Adding missing block ${latestBlockReceived.index}`,
          latestBlockReceived
        );
        await this.broadcast({
          type: MessageType.RESPONSE_BLOCKCHAIN,
          data: [latestBlockReceived],
        });
      }
    } else if (receivedChain.length === 1) {
      // we're missing more than one block, query peer for complete chain
      Logger.info('We have to query the chain from our peers');
      connection.write({
        type: MessageType.QUERY_ALL_BLOCKS,
      });
    } else {
      Logger.info('Received blockchain is longer than current blockchain');
      await BlockchainManager.instance.replaceChain(receivedChain);
      Logger.info('Replaced blockchain with received one.');
      await this.broadcast({
        type: MessageType.RESPONSE_BLOCKCHAIN,
        data: receivedChain,
      });
    }
  }
}
