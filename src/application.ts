import { Database } from './database';
import { FileSystem } from './utils/filesystem';
import { HttpServer } from './httpServer/server';
import {BlockchainManager} from "./blockchain/blockchain_manager";

export class Application {

    private httpPort : number;
    private p2pPort : number;
    private name : string;
    private dataFolder : string;

    private httpServer : HttpServer;

    constructor(httpPort : number, p2pPort : number, name : string, dataLocation : string) {
        this.httpPort = httpPort;
        this.p2pPort = p2pPort;
        this.name = name;
        this.dataFolder = dataLocation;

        FileSystem.createFolderSync(this.dataFolder);

        BlockchainManager.initialize();
        Database.initialize(this.dataFolder + '/' + name);

        this.httpServer = new HttpServer(httpPort);
    }

    public initialize() : void {
        //Validate inputs
        this.httpServer.on('listening', (port) => {
            console.log("HTTP Server listening on port: " + port);
        });
        
        this.httpServer.listen();
            
    }

    private log(output : any) : void {
        console.log(output);
    }

}
