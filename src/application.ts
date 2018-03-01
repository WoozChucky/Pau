import { Database } from './database';
import { FileSystem } from './utils/filesystem';
import { HttpServer } from './httpServer/server';
import { BlockchainManager } from "./blockchain/blockchain_manager";
import { P2PServer } from "./p2p/p2p_server";
import Signals = NodeJS.Signals;

export class Application {

    private httpPort : number;
    private p2pPort : number;
    private name : string;
    private dataFolder : string;

    private httpServer : HttpServer;
    private p2pServer : P2PServer;

    constructor(httpPort : number, p2pPort : number, name : string, dataLocation : string) {
        this.httpPort = httpPort;
        this.p2pPort = p2pPort;
        this.name = name;
        this.dataFolder = dataLocation;

        FileSystem.createFolderSync(this.dataFolder);
        Database.initialize(this.dataFolder + '/' + name);

        BlockchainManager.initialize();


        this.httpServer = new HttpServer(httpPort);
        this.p2pServer = new P2PServer(p2pPort);
    }

    public initialize() : void {

        process.on('SIGINT', () => {
            console.log('Caught interrupt signal');

            BlockchainManager.saveLocally()
                .then(() => {
                    process.exit(0);
                })
                .catch(() => {
                    process.exit(1);
                });
        });

        this.httpServer.on('listening', (port) => {
            console.log("HTTP Server listening on port: " + port);
        });
        
        this.httpServer.listen();
        this.p2pServer.start();
            
    }

}
