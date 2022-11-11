import { EventEmitter } from "events";

import { WebSocket, Server } from "ws";

import { Message } from "../model/messsage";
import { MessageType } from "../model/message_type";
import {
  Blockchain,
  BlockchainManager,
} from "../blockchain/blockchain-manager";
import { Logger } from "../utils/logging";
import { AddressManager } from "../net/address-manager";
import { Block } from "../model/block";
import { Address } from "../model/address";
import { EventBus } from "../events/event-bus";

export interface P2PServerError {
  port: number;
  error: Error;
}

export class P2PServer extends EventEmitter {
  // 10 Minutes
  private static ASK_PEERS_TIMEOUT = 600000;
  // 10 Seconds
  private static LOAD_ADDRESSES_TIMER = 10000;

  private static port: number;
  private static sockets: WebSocket[] = [];

  private static server: Server;

  public static start(port: number): void {
    this.port = port;
    this.server = new WebSocket.Server({ port });

    this.server.on("connection", this.handleConnection.bind(this));

    this.server.on("error", (error: Error) =>
      EventBus.instance.dispatch<{ port: number; error: Error }>(
        "p2p-server.error",
        { port: this.port, error }
      )
    );

    this.server.on("listening", () => {
      EventBus.instance.dispatch<number>("p2p-server.listening", this.port);

      // Load all address 10 seconds after booting the p2p server
      setTimeout(() => {
        AddressManager.getAll()
          .then((addresses) => {
            addresses
              .map((addr: Address) => addr.endpoint)
              .forEach((addr) => {
                P2PServer.connectToPeer(addr);
              });
          })
          .catch((err) => Logger.warn(err));
      }, P2PServer.LOAD_ADDRESSES_TIMER);
    });

    // setInterval(P2PServer.askPeers.bind(P2PServer), P2PServer.ASK_PEERS_TIMEOUT);
    setInterval(P2PServer.askLatestBlockFromPeers, P2PServer.ASK_PEERS_TIMEOUT);
  }

  public static connectToPeer(endpoint: any): void {
    Logger.info(`Connecting to peer -> ${endpoint}`);

    const socks = P2PServer.getSockets();

    if (socks.find((sock: WebSocket) => sock.url === endpoint) !== undefined) {
      Logger.warn(`Already connected to ${endpoint}`);
      return;
    }

    /** TODO
     * Don't connect to local node
     * Check connected sockets and stop if already connected
     */

    const ws: WebSocket = new WebSocket(endpoint);
    ws.on("open", () => {
      this.handleConnection(ws);

      AddressManager.add(new Address(endpoint))
        .then(async () => {
          await AddressManager.saveLocally();
        })
        .catch((err: Error) => {
          Logger.warn(err);
        });
    });
    ws.on("error", (err) => {
      Logger.warn("connection failed -> ", err);
    });
  }

  public static getSockets(): WebSocket[] {
    return P2PServer.sockets;
  }

  public static askPeers(endpoint: string): void {
    Logger.info("Asking peers from connected sockets.");

    const socket = this.sockets.find(
      (sock: WebSocket) => sock.url === endpoint
    );

    if (socket) {
      this.write(socket, { type: MessageType.QUERY_PEERS, data: null });
    } else {
      this.sockets.forEach((socket) => {
        this.write(socket, { type: MessageType.QUERY_PEERS, data: null });
      });
    }
  }

  private static handleConnection(socket: WebSocket): void {
    this.sockets.push(socket);

    this.initMessageHandler(socket);
    this.initErrorHandler(socket);
    this.queryClientLastBlock(socket);
  }

  private static initMessageHandler(socket: WebSocket) {
    socket.on("message", (data: string) => {
      try {
        const message: Message | null = P2PServer.JSONtoObject<Message>(data);
        if (message === null) {
          Logger.warn("Could not parse received JSON message: ", data);
          return;
        }

        Logger.info("Received p2p message:", {
          peer: socket.url,
          message,
        });

        switch (message.type) {
          case MessageType.QUERY_LATEST_BLOCK:
            BlockchainManager.getLatestBlock()
              .then((block) => {
                this.write(socket, {
                  type: MessageType.RESPONSE_BLOCKCHAIN,
                  data: JSON.stringify([block]),
                });
              })
              .catch((err) => Logger.error(err));

            break;
          case MessageType.QUERY_ALL_BLOCKS:
            BlockchainManager.getChain()
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
              Logger.warn("Invalid blocks received: ", message.data);
              break;
            }

            this.handleBlockchainResponse(receivedChain);

            break;
          }
          case MessageType.QUERY_PEERS:
            AddressManager.getAll()
              .then((addresses) => {
                const sockets = addresses.map((addr: Address) => addr.endpoint);

                this.write(socket, {
                  type: MessageType.RESPONSE_PEERS,
                  data: JSON.stringify(sockets),
                });
              })
              .catch((err) => {
                Logger.warn("Could not retrieve addresses: ", err);
              });

            break;
          case MessageType.RESPONSE_PEERS: {
            const receivedPeers: string[] | null = P2PServer.JSONtoObject<
              string[]
            >(message.data);

            receivedPeers?.forEach((peer) => {
              Logger.info("Connecting to peer: ", peer);
              P2PServer.connectToPeer(peer);
            });

            break;
          }
        }
      } catch (ex) {
        Logger.error("Error somewhere in P2P - ", ex);
      }
    });
  }

  private static initErrorHandler(socket: WebSocket) {
    socket.on("close", (code: number, reason: Buffer) => {
      P2PServer.closeConnection(code, reason.toString());
      P2PServer.sockets.splice(this.sockets.indexOf(socket), 1);
    });
    socket.on("error", (error: Error) => {
      P2PServer.endAbruptConnection(error);
      P2PServer.sockets.splice(this.sockets.indexOf(socket), 1);
    });
  }

  private static queryClientLastBlock(socket: WebSocket) {
    this.write(socket, { type: MessageType.QUERY_LATEST_BLOCK, data: null });
  }

  private static write(socket: WebSocket, message: Message): void {
    socket.send(JSON.stringify(message));
  }

  private static closeConnection(code: number, reason: string): void {
    Logger.info(`connection lost to peer. Code ${code} - ${reason}`);
  }

  private static endAbruptConnection(error: Error) {
    Logger.warn(`connection closed abruptly to peer:`, error);
  }

  public static broadcastBlockchain(): void {
    BlockchainManager.getChain()
      .then((chain) => {
        this.broadcast({
          type: MessageType.RESPONSE_BLOCKCHAIN,
          data: JSON.stringify(chain),
        });
      })
      .catch((err) => Logger.error(err));
  }

  public static broadcastLatestBlock() {
    BlockchainManager.getLatestBlock()
      .then((block) => {
        this.broadcast({
          type: MessageType.RESPONSE_BLOCKCHAIN,
          data: JSON.stringify([block]),
        });
      })
      .catch((err) => Logger.error(err));
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
      Logger.warn("Received block chain size of 0");
      return;
    }
    const latestBlockReceived: Block = receivedChain[receivedChain.length - 1];

    BlockchainManager.getLatestBlock()
      .then(async (latestBlockHeld: Block) => {
        if (latestBlockReceived.index > latestBlockHeld.index) {
          Logger.info(
            `blockchain possibly behind. We got block index: ${latestBlockHeld.index} Peer got block index: ${latestBlockReceived.index}`
          );
          if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            const addedBlock = await BlockchainManager.addBlock(
              latestBlockReceived
            );
            if (addedBlock) {
              Logger.info("Adding missing block: ", latestBlockReceived);
              P2PServer.broadcast({
                type: MessageType.RESPONSE_BLOCKCHAIN,
                data: JSON.stringify([latestBlockReceived]),
              });
            }
          } else if (receivedChain.length === 1) {
            Logger.info("We have to query the chain from our peers");
            P2PServer.broadcast({
              type: MessageType.QUERY_ALL_BLOCKS,
              data: null,
            });
          } else {
            Logger.info(
              "Received blockchain is longer than current blockchain"
            );
            BlockchainManager.replaceChain(receivedChain)
              .then(() => {
                Logger.info("Replaced blockchain with received one.");
                // P2PServer.broadcastBlockchain(); // This might not be a good practise
              })
              .catch((err) =>
                Logger.warn("Error replacing blockchain -> ", err)
              );
          }
        } else {
          Logger.info(
            "Received blockchain is not longer than received blockchain. Do nothing"
          );
        }
      })
      .catch((err) => Logger.warn("Error retrieving latest block", err));
  }
}
