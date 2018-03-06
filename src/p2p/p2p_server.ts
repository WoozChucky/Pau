import WebSocket = require("ws");
import {Message} from "../model/messsage";
import {MessageType} from "../model/message_type";
import {Blockchain, BlockchainManager} from "../blockchain/blockchain_manager";
import {EventEmitter} from "events";
import {logger} from "../utils/logging";
import {Block} from "../model/block";
import * as _ from 'lodash';

export class P2PServer {

    private static ASK_PEERS_TIMEOUT = 600000; //10 Minutes

    private static port : number;
    private static sockets : WebSocket[] = [];

    private static server : WebSocket.Server;

    public static bus : EventEmitter = new EventEmitter();


    public static start(port : number) : void {
        this.port = port;
        this.server = new WebSocket.Server({port: port});

        this.server.on('connection', this.handleConnection.bind(this));

        this.server.on('error', () => {
            this.bus.emit('error', `P2P Port ${this.port} is already in use!`);
        });

        this.server.on('listening', () => {
            this.bus.emit('listening', this.port);
        });

        setTimeout(P2PServer.askPeers.bind(P2PServer), P2PServer.ASK_PEERS_TIMEOUT);

    }

    public static connectToPeer(endpoint : any) : void {
        const ws: WebSocket = new WebSocket(endpoint);
        ws.on('open', () => {
            this.handleConnection(ws);
        });
        ws.on('error', (err) => {
            logger.warn('connection failed -> ', err);
        });
    }

    public static getSockets() : WebSocket[] {
        return P2PServer.sockets;
    }

    public static askPeers(endpoint : string) : void {

        logger.info('Asking peers from connected sockets.');

        let socket = this.sockets.find(s => s.url == endpoint);

        if(socket != undefined) {
            this.write(socket, ({'type': MessageType.QUERY_PEERS, 'data' : null }));
        } else {

            this.sockets.forEach(socket => {
                this.write(socket, ({'type': MessageType.QUERY_PEERS, 'data' : null }));
            });
        }

    }

    private static handleConnection(socket : WebSocket) : void {
        this.sockets.push(socket);

        this.initMessageHandler(socket);
        this.initErrorHandler(socket);
        this.queryClientLastBlock(socket);
    }

    private static initMessageHandler(socket: WebSocket) {
        socket.on('message', (data : string) => {
            try {

                let message: Message = P2PServer.JSONtoObject<Message>(data);
                if (message === null) {
                    logger.warn('Could not parse received JSON message: ', data);
                    return;
                }

                logger.info('Received p2p message:', message);

                switch (message.type) {
                    case MessageType.QUERY_LATEST:

                        BlockchainManager.getLatestBlock()
                            .then(block => {
                                this.write(socket, ({'type' : MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify([block])}));
                            })
                            .catch(err => logger.error(err));

                        break;
                    case MessageType.QUERY_ALL:

                        BlockchainManager.getChain()
                            .then(chain => {
                                this.write(socket, ({'type' : MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(chain)}));
                            })
                            .catch(err => logger.error(err));

                        break;
                    case MessageType.RESPONSE_BLOCKCHAIN:
                        let receivedChain: Blockchain = P2PServer.JSONtoObject<Blockchain>(message.data);
                        if (receivedChain === null) {
                            logger.warn('Invalid blocks received: ', message.data);
                            break;
                        }
                        this.handleBlockchainResponse(receivedChain);
                        break;
                    case MessageType.QUERY_PEERS:

                        let sockets : string[] = this.getSockets().map((s : any) => 'ws://' + s._socket.remoteAddress + ':' + s._socket.remotePort);

                        let output = _.pull(sockets, socket.url);

                        this.write(socket, ({'type' : MessageType.RESPONSE_PEERS, 'data': JSON.stringify(output)}));
                        break;
                    case MessageType.RESPONSE_PEERS:

                        let receivedPeers : string[] = P2PServer.JSONtoObject<string[]>(message.data);

                        receivedPeers.forEach(peer => {
                            logger.info('Connecting to peer: ', peer);
                            this.connectToPeer(peer);
                        });

                        break;
                }

            } catch (ex) {
                logger.error(ex);
            }
        });
    }

    private static initErrorHandler(socket: WebSocket) {
        socket.on('close', this.closeConnection.bind(this));
        socket.on('error', this.closeConnection.bind(this));
    }

    private static queryClientLastBlock(socket: WebSocket) {
        this.write(socket, ({'type': MessageType.QUERY_LATEST, 'data': null}));
    }

    private static queryClientChain(socket : WebSocket) : void {
        this.write(socket, ({'type': MessageType.QUERY_ALL, 'data': null}));
    }

    private static write(socket : WebSocket, message : Message) : void {
        socket.send(JSON.stringify(message));
    }

    private static closeConnection(socket : WebSocket) : void {
        logger.info(`connection failed to peer: ${socket.url}`);
        this.sockets.splice(this.sockets.indexOf(socket), 1); //TODO: Check if this socket is really removed
    }

    public static broadcastBlockchain() : void {

        BlockchainManager.getChain()
            .then(chain => {
                this.broadcast(({'type' : MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(chain) }));
            })
            .catch(err => logger.error(err));

    }

    private static broadcast(message : Message) : void {
        this.sockets.forEach(socket => {
           this.write(socket, message);
        });
    }

    private static JSONtoObject<T>(data : any) : T {
        try {
            return JSON.parse(data);
        } catch (e) {
            logger.error(e.message);
            return null;
        }
    }

    private static handleBlockchainResponse(receivedChain: Blockchain) {

    }

}