import WebSocket = require("ws");
import {Message} from "../model/messsage";
import {MessageType} from "../model/message_type";
import {Blockchain, BlockchainManager} from "../blockchain/blockchain_manager";

export class P2PServer {

    private port : number;
    private sockets : WebSocket[];

    private server : WebSocket.Server;

    constructor(port : number) {
        this.port = port;
        this.sockets = [];
    }

    public start() : void {
        this.server = new WebSocket.Server({port: this.port});
        this.server.on('connection', this.handleConnection.bind(this));
    }

    private handleConnection(socket : WebSocket) : void {
        this.sockets.push(socket);

        this.initMessageHandler(socket);
        this.initErrorHandler(socket);
        this.queryClientLastBlock(socket);
    }

    private initMessageHandler(socket: WebSocket) {
        socket.on('message', (data : string) => {
            try {

                let message: Message = P2PServer.JSONtoObject<Message>(data);
                if (message === null) {
                    console.log('could not parse received JSON message: ' + data);
                    return;
                }

                console.log('Received message: %s', JSON.stringify(message));

                switch (message.type) {
                    case MessageType.QUERY_LATEST:

                        BlockchainManager.getLastestBlock()
                            .then(block => {
                                this.write(socket, ({'type' : MessageType.RESPONSE_BLOCKCHAIN, 'data': block}));
                            })
                            .catch(err => console.log(err));

                        break;
                    case MessageType.QUERY_ALL:

                        BlockchainManager.getChain()
                            .then(chain => {
                                this.write(socket, ({'type' : MessageType.RESPONSE_BLOCKCHAIN, 'data': chain}));
                            })
                            .catch(err => console.log(err));

                        break;
                    case MessageType.RESPONSE_BLOCKCHAIN:
                        let receivedChain: Blockchain = P2PServer.JSONtoObject<Blockchain>(message.data);
                        if (receivedChain === null) {
                            console.log('invalid blocks received: %s', JSON.stringify(message.data));
                            break;
                        }
                        this.handleBlockchainResponse(receivedChain);
                        break;
                }

            } catch (ex) {
                console.log(ex);
            }
        });
    }

    private initErrorHandler(socket: WebSocket) {
        socket.on('close', this.closeConnection.bind(this));
        socket.on('error', this.closeConnection.bind(this));
    }

    private queryClientLastBlock(socket: WebSocket) {
        this.write(socket, ({'type': MessageType.QUERY_LATEST, 'data': null}));
    }

    private queryClientChain(socket : WebSocket) : void {
        this.write(socket, ({'type': MessageType.QUERY_ALL, 'data': null}));
    }

    private write(socket : WebSocket, message : Message) : void {
        socket.send(JSON.stringify(message));
    }

    private closeConnection(socket : WebSocket) : void {
        console.log(`connection failed to peer: ${socket.url}`);
        this.sockets.splice(this.sockets.indexOf(socket), 1);
    }

    private static JSONtoObject<T>(data : string) : T {
        try {
            return JSON.parse(data);
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    private handleBlockchainResponse(receivedChain: Blockchain) {

    }
}