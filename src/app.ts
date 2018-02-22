import { Server } from './http/server';


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val : any) : any {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
    // named pipe
    return val;
    }

    if (port >= 0) {
    // port number
    return port;
    }

    return false;
}

let httpPort = normalizePort(process.env.HTTP_PORT || 3000);
let p2pPort : number = parseInt(process.env.P2P_PORT) || 6000;
let initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

let server = new Server();

server.listen(httpPort, p2pPort, initialPeers);