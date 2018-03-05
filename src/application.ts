import { Database } from './database';
import { FileSystem } from './utils/filesystem';
import { HttpServer } from './httpServer/server';
import { BlockchainManager } from "./blockchain/blockchain_manager";
import { P2PServer } from "./p2p/p2p_server";
import { logger } from './utils/logging';
import {AddressManager} from "./net/address_manager";

export class Application {

    private httpPort : number;
    private p2pPort : number;
    private name : string;
    private dataFolder : string;

    private httpServer : HttpServer;

    constructor(httpPort: number, p2pPort: number, name: string, dataLocation: string, use_address: boolean) {
        this.httpPort = httpPort;
        this.p2pPort = p2pPort;
        this.name = name;
        this.dataFolder = dataLocation;

        FileSystem.createFolderSync(this.dataFolder);
        FileSystem.createFolderSync(this.dataFolder + '/db');
        FileSystem.createFolderSync(this.dataFolder + '/logs');
        Database.initialize(this.dataFolder + '/db/' + name);

        AddressManager.initialize(use_address)
            .then(() => logger.info('AddressManager was initialized successfully.'))
            .catch((err) => logger.error(err) );

        BlockchainManager.initialize()
            .then(() => logger.info('BlockchainManager was initialized successfully.'))
            .catch((err) => logger.error(err) );

        this.httpServer = new HttpServer(httpPort);
    }

    public initialize() : void {

        process.on('SIGINT',() => {
            logger.warn('Caught interrupt signal');

            Promise.all([AddressManager.saveLocally(), BlockchainManager.saveLocally()])
                .then(() => {
                    process.exit(0)
                })
                .catch(err => {
                    logger.warn('Didn\'t saved data locally: ', err);
                    process.exit(1)
                });

        });

        this.httpServer.on('listening', (port) => {
            logger.info("HTTP Server listening on port: " + port);
        });
        this.httpServer.on('error', (err) => {
            logger.error(err);
            process.exit(1);
        });

        P2PServer.bus.on('listening', (port) => {
            logger.info("P2P Server listening on port: " + port);
        });
        P2PServer.bus.on('error', (err) => {
            logger.error(err);
            process.exit(1);
        });
        
        this.httpServer.listen();
        P2PServer.start(this.p2pPort);

    }

}
