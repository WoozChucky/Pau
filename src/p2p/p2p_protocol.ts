import * as WebSocket from 'ws';
import {Server} from 'ws';
import { Message } from '../model/messsage';
import { Block } from '../model/block'
import { MessageType } from '../model/message_type';
import * as ZNode from '../server';

const sockets: WebSocket[] = [];

const initP2PServer = (p2pPort : number) => {
    const server: Server = new WebSocket.Server({port: p2pPort});
    server.on('connection', (ws: WebSocket) => {
        initConnection(ws);
    });
    console.log('listening websocket p2p port on: ' + p2pPort);
} 

const initConnection = (ws : WebSocket) : void  => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLenghtMsg());
}

const getSockets = () : WebSocket[]  =>{
    return sockets;
}

const JSONToObject = <T>(data: string) : T => {

    try {
        return JSON.parse(data);
    } catch(e) {
        console.log(e);
        return null;
    }

}

const initMessageHandler = (ws : WebSocket) : void => {
    ws.on('message', (data : string) => {

        let message : Message = JSONToObject<Message>(data);
        if(message === null) {
            console.log('could not parse received JSON message: ' + data);
            return;
        }

        console.log('Message Received -> ' + JSON.stringify(message));

        switch(message.type) {

            case MessageType.QUERY_LATEST:
                write(ws, getLatestBlockMsg());
            break;

            case MessageType.QUERY_ALL:
                write(ws, getChainMsg());
            break;

            case MessageType.RESPONSE_BLOCKCHAIN:

                let receivedBlocks : Block[] = JSONToObject<Block[]>(message.data);
                if(receivedBlocks === null) {
                    console.log('invalid blocks received: ');
                    console.log(message.data);
                    break;
                }

                handleBlockchainResponse(receivedBlocks);

            break;
        }

    });
}

const write = (ws : WebSocket, message : Message) : void => {
    ws.send(JSON.stringify(message));
}

const broadcast = (message : Message) : void => {
    sockets.forEach(sock => write(sock, message));
}

const broadcastLatest = () : void => {
    broadcast(getLatestBlockMsg());
}

const connectToPeers = (newPeers : string[]) : void => {
    
    newPeers.forEach((peer) => {
        let ws : WebSocket = new WebSocket(peer);

        ws.on('open', () => initConnection(ws));
        ws.on('error', () => console.log('connection failed'));
    })
}

const handleBlockchainResponse = (receivedBlocks : Block[]) : void => {
    if (receivedBlocks.length === 0) {
        console.log('received block chain size of 0');
        return;
    }
    const latestBlockReceived: Block = receivedBlocks[receivedBlocks.length - 1];
    if (!ZNode.Server.blockchain.isValidBlockStructure(latestBlockReceived)) {
        console.log('block structuture not valid');
        return;
    }
    const latestBlockHeld: Block = ZNode.Server.blockchain.getLatestBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
        console.log('blockchain possibly behind.\nWe got: '
            + latestBlockHeld.index + ' blocks.\nPeer got: ' + latestBlockReceived.index + ' blocks.');
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            if (ZNode.Server.blockchain.addBlock(latestBlockReceived)) {
                broadcast(getLatestBlockMsg());
            }
        } else if (receivedBlocks.length === 1) {
            console.log('We have to query the chain from our peer');
            broadcast(queryAllMsg());
        } else {
            console.log('Received blockchain is longer than current blockchain');
            ZNode.Server.blockchain.replaceChain(receivedBlocks);
        }
    } else {
        console.log('received blockchain is not longer than received blockchain. Do nothing');
    }
}

const initErrorHandler = (ws : WebSocket) : void => {
    ws.on('close', () => onSocketDisconnect(ws));
    ws.on('error', () => onSocketError(ws));
}

const onSocketDisconnect = (ws : WebSocket) : void => {
    console.log('Disconnected from peer: ' + ws.url);
    sockets.splice(sockets.indexOf(ws), 1);
}

const onSocketError = (ws : WebSocket) : void => {
    console.log('Connection failed to peer: ' + ws.url);
    sockets.splice(sockets.indexOf(ws), 1);
}

const queryChainLenghtMsg = () : Message => {
    return new Message(
        {
            'type': MessageType.QUERY_LATEST,
            'data' : null
        });
}

const queryAllMsg = () : Message => {
    return new Message(
        {
            'type': MessageType.QUERY_ALL,
            'data' : null
        });
}

const getChainMsg = () : Message => {
    return new Message(
        {
            'type': MessageType.RESPONSE_BLOCKCHAIN, 
            'data' : JSON.stringify(ZNode.Server.blockchain.getChain())
        });
}

const getLatestBlockMsg = () : Message => {
    return new Message(
        {
            'type': MessageType.RESPONSE_BLOCKCHAIN,
            'data' : JSON.stringify([ZNode.Server.blockchain.getLatestBlock()])
        });
}

export { connectToPeers, broadcastLatest, initP2PServer, getSockets };