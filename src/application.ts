/* eslint-disable eslint-comments/no-unlimited-disable */
import { Database } from './database/database-manager';
import { FileSystem } from './utils/filesystem';
import { HttpServer } from './http/http-server';
import { BlockchainManager } from './blockchain/blockchain-manager';
import { P2PServer, P2PServerError } from './p2p/p2p-server';
import { Logger } from './utils/logging';
import { AddressManager } from './net/address-manager';
import { EventBus } from './events/event-bus';
import { Block } from './model/block';
import { Events } from './events/events';

export class Application {
  private readonly httpPort: number;
  private readonly p2pPort: number;
  private readonly name: string;
  private readonly dataFolder: string;
  private readonly useAddress: boolean;

  private httpServer: HttpServer | null = null;
  private p2pServer: P2PServer | null = null;

  constructor(httpPort: number, p2pPort: number, name: string, dataLocation: string, useAddress: boolean) {
    this.httpPort = httpPort;
    this.p2pPort = p2pPort;
    this.name = name;
    this.dataFolder = dataLocation;
    this.useAddress = useAddress;
  }

  public async initialize(): Promise<void> {
    try {
      FileSystem.createFolderSync(this.dataFolder);
      FileSystem.createFolderSync(`${this.dataFolder}/db`);
      FileSystem.createFolderSync(`${this.dataFolder}/logs`);
      Database.instance.initialize(`${this.dataFolder}/db/${this.name}`);

      await AddressManager.instance.initialize(this.useAddress);
      Logger.info('AddressManager was initialized successfully.');

      await BlockchainManager.instance.initialize();
      Logger.info('BlockchainManager was initialized successfully.');
    } catch (err) {
      Logger.error(err);
      process.exit(1);
    }

    this.httpServer = new HttpServer(this.httpPort);

    process.on('SIGINT', this.GracefullyExit);
    // process.on("SIGKILL", this.GracefullyExit);
    process.on('SIGTERM', this.GracefullyExit);

    /* eslint-disable */
    EventBus.instance.register(Events.Http.Listening, this.onHttpServerListening);
    EventBus.instance.register(Events.Http.ErrorListening, this.onHttpServerListeningError);
    EventBus.instance.register(Events.Http.Error, this.onHttpServerError);

    EventBus.instance.register(Events.P2P.Listening, this.onP2PServerListening);
    EventBus.instance.register(Events.P2P.Error, this.onP2PServerError);

    EventBus.instance.register(Events.BlockchainManager.BlockGenerated, async (block: Block) =>{
      await this.onBlockchainManagerBlockGenerated(block);
    });
    /* eslint-enable */

    await this.httpServer.listen();
    P2PServer.instance.start(this.p2pPort);
  }

  private async onBlockchainManagerBlockGenerated(block: Block) {
    await P2PServer.instance.broadcastLatestBlock(block);
  }

  private onHttpServerListening(port: number) {
    Logger.info(`HTTP Server listening on port ${port}`);
  }

  private onHttpServerListeningError(port: number) {
    Logger.error(`HTTP Port ${port} is already in use.`);
    process.exit(1);
  }

  private onHttpServerError(error: Error) {
    Logger.error(error.message, error);
    process.exit(1);
  }

  private onP2PServerListening(port: number) {
    Logger.info(`P2P Server listening on port ${port}`);
  }

  private onP2PServerError(arg: P2PServerError) {
    Logger.error(`P2P Port ${arg.port} is already in use! ${arg.error.message}`, arg.error);
    process.exit(1);
  }

  private async GracefullyExit() {
    Logger.warn('Caught interrupt signal');

    try {
      await AddressManager.instance.saveLocally();
      await BlockchainManager.instance.saveLocally();

      process.exit(0);
    } catch (err) {
      Logger.warn("Didn't saved data locally: ", err);
      process.exit(1);
    }
  }
}
