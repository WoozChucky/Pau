import WebSocket = require("ws");
import {Message} from "../model/messsage";
import {MessageType} from "../model/message_type";
import {Blockchain, BlockchainManager} from "../blockchain/blockchain-manager";
import {EventEmitter} from "events";
import {logger} from "../utils/logging";
import {AddressManager} from "../net/address-manager";
import {Block} from "../model/block";

export class P2PServer {

    private static ASK_PEERS_TIMEOUT = 600000;   //10 Minutes
    private static LOAD_ADDRESSES_TIMER = 10000; //10 Seconds

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

            // Load all address 10 seconds after booting the p2p server
            setTimeout(() => {
                AddressManager.getAll()
                    .then((addresses) => {
                        addresses.map(a => a.endpoint).forEach(addr => {
                            P2PServer.connectToPeer(addr);
                        });
                    })
                    .catch(err => logger.warn(err));

            }, P2PServer.LOAD_ADDRESSES_TIMER);

        });

        setInterval(P2PServer.askPeers.bind(P2PServer), P2PServer.ASK_PEERS_TIMEOUT);
        setInterval(P2PServer.askLatestBlockFromPeers, P2PServer.ASK_PEERS_TIMEOUT);

    }

    public static connectToPeer(endpoint : any) : void {
        logger.info('Connecting to peer -> ' + endpoint);

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

        //this.askPeers(socket.url);
    }

    private static initMessageHandler(socket: WebSocket) {
        socket.on('message', (data : string) => {
            try {

                let message: Message = P2PServer.JSONtoObject<Message>(data);
                if (message === null) {
                    logger.warn('Could not parse received JSON message: ', data);
                    return;
                }

                logger.info('Received p2p message:', { peer: socket.url, message : message});

                switch (message.type) {
                    case MessageType.QUERY_LATEST_BLOCK:

                        BlockchainManager.getLatestBlock()
                            .then(block => {
                                this.write(socket, ({'type' : MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify([block])}));
                            })
                            .catch(err => logger.error(err));

                        break;
                    case MessageType.QUERY_ALL_BLOCKS:

                        BlockchainManager.getChain()
                            .then(chain => {
                                this.write(socket, ({'type' : MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(chain)}));
                            })
                            .catch(err => {
                                logger.error(err)
                            });

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
                        sockets.push('ws://127.0.0.1:' + this.port);

                        this.write(socket, ({'type' : MessageType.RESPONSE_PEERS, 'data': JSON.stringify(sockets)}));
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
                logger.error('Error somewhere in P2P - ', ex);
            }
        });
    }

    private static initErrorHandler(socket: WebSocket) {
        socket.on('close', (code, reason) => {
            P2PServer.closeConnection(code, reason);
            P2PServer.sockets.splice(this.sockets.indexOf(socket), 1);
        });
        socket.on('error', (error : Error) => {
            P2PServer.endAbruptConnection(error);
            P2PServer.sockets.splice(this.sockets.indexOf(socket), 1);
        });
    }

    private static queryClientLastBlock(socket: WebSocket) {
        this.write(socket, ({'type': MessageType.QUERY_LATEST_BLOCK, 'data': null}));
    }

    private static write(socket : WebSocket, message : Message) : void {
        socket.send(JSON.stringify(message));
    }

    private static closeConnection(code : number, reason : string) : void {
        logger.info(`connection failed to peer. Code ${code} - ${reason}`);
    }

    private static endAbruptConnection(error : Error) {
        logger.warn(`connection closed abruptly to peer:`, error);
    }

    public static broadcastBlockchain() : void {

        BlockchainManager.getChain()
            .then(chain => {
                this.broadcast(({'type' : MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(chain) }));
            })
            .catch(err => logger.error(err));

    }

    public static broadcastLatestBlock() {

        BlockchainManager.getLatestBlock()
            .then(block => {
                this.broadcast(({'type' : MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify([block]) }));
            })
            .catch(err => logger.error(err));

    }

    private static askLatestBlockFromPeers() {
        P2PServer.broadcast({'type': MessageType.QUERY_LATEST_BLOCK, 'data': null});
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

        if (receivedChain.length === 0) {
            logger.warn('Received block chain size of 0');
            return;
        }
        const latestBlockReceived: Block = receivedChain[receivedChain.length - 1];
        if (!Block.isValidStructure(latestBlockReceived)) {
            logger.info('Block structure is not valid');
            return;
        }
        BlockchainManager.getLatestBlock()
            .then(latestBlockHeld => {

                if (latestBlockReceived.index > latestBlockHeld.index) {
                    logger.info('blockchain possibly behind. We got block index: '
                        + latestBlockHeld.index + ' Peer got block index: ' + latestBlockReceived.index);
                    if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
                        if (BlockchainManager.addBlock(latestBlockReceived)) {
                            logger.info('Adding missing block: ', latestBlockReceived);
                            P2PServer.broadcast({ 'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify([latestBlockReceived]) });
                        }
                    } else if (receivedChain.length === 1) {
                        logger.info('We have to query the chain from our peers');
                        P2PServer.broadcast({'type': MessageType.QUERY_ALL_BLOCKS, 'data': null});
                    } else {
                        logger.info('Received blockchain is longer than current blockchain');
                        BlockchainManager.replaceChain(receivedChain)
                            .then(() => {
                                logger.info('Replaced blockchain with received one.');
                                //P2PServer.broadcastBlockchain(); // This might not be a good practise
                            })
                            .catch((err) => logger.warn('Error replacing blockchain -> ', err));
                    }
                } else {
                    logger.info('Received blockchain is not longer than received blockchain. Do nothing');
                }

            })
            .catch(err => logger.warn('Error retrieving latest block', err));
    }
}