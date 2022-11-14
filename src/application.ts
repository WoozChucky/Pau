/* eslint-disable eslint-comments/no-unlimited-disable */
import { Server } from 'http';

import { Database } from './database/database-manager';
import { FileSystem } from './utils/filesystem';
import { HttpServer } from './http/http-server';
import { BlockchainManager } from './blockchain/blockchain-manager';
import { P2PServer } from './p2p/p2p-server';
import { Logger } from './utils/logging';
import { AddressManager } from './net/address-manager';
import { EventBus } from './events/event-bus';
import { Block } from './model/block';
import { Events } from './events/events';

export class Application {
  private readonly port: number;
  private readonly name: string;
  private readonly dataFolder: string;

  private readonly httpServer: HttpServer | null = null;
  private readonly server: Server;
  private readonly hostname: string;

  constructor(
    port: number,
    name: string,
    dataLocation: string,
    hostname = '0.0.0.0'
  ) {
    this.port = port;
    this.name = name;
    this.dataFolder = dataLocation;
    this.hostname = hostname;

    this.httpServer = new HttpServer();
    this.server = this.httpServer.handle;
  }

  public async initialize(): Promise<void> {
    try {
      FileSystem.createFolderSync(this.dataFolder);
      FileSystem.createFolderSync(`${this.dataFolder}/db`);
      FileSystem.createFolderSync(`${this.dataFolder}/logs`);
      Database.instance.initialize(`${this.dataFolder}/db/${this.name}`);

      await AddressManager.instance.initialize();
      Logger.info('AddressManager was initialized successfully.');

      await BlockchainManager.instance.initialize();
      Logger.info('BlockchainManager was initialized successfully.');
    } catch (err) {
      Logger.error(err);
      process.exit(1);
    }

    process.on('SIGINT', this.GracefullyExit);
    // process.on("SIGKILL", this.GracefullyExit);
    process.on('SIGTERM', this.GracefullyExit);

    /* eslint-disable */
    EventBus.instance.register(Events.Http.Listening, this.onHttpServerListening.bind(this));
    EventBus.instance.register(Events.Http.Error, this.onHttpServerError.bind(this));

    EventBus.instance.register(Events.P2P.Listening, this.onP2PServerListening.bind(this));
    EventBus.instance.register(Events.P2P.Error, this.onP2PServerError.bind(this));

    EventBus.instance.register(Events.BlockchainManager.BlockGenerated, async (block: Block) =>{
      await this.onBlockchainManagerBlockGenerated(block);
    });
    /* eslint-enable */
    P2PServer.instance.configure(this.server);

    this.server.listen(this.port, this.hostname);
  }

  private async onBlockchainManagerBlockGenerated(block: Block) {
    await P2PServer.instance.broadcastLatestBlock(block);
  }

  private onHttpServerListening() {
    Logger.info(`HTTP Server listening on port ${this.port}`);
  }

  private onHttpServerError(error: Error) {
    Logger.error(`HTTPServer got ${error.message}`, error);
    process.exit(1);
  }

  private onP2PServerListening() {
    Logger.info(`P2P Server listening on port ${this.port}`);
  }

  private onP2PServerError(error: Error) {
    Logger.error(`P2PServer got ${error.message}`, error);
    process.exit(1);
  }

  private async GracefullyExit() {
    Logger.warn('Caught interrupt signal');

    try {
      await BlockchainManager.instance.saveLocally();
      await AddressManager.instance.saveLocally();

      process.exit(0);
    } catch (err) {
      Logger.warn("Didn't saved data locally: ", err);
      process.exit(1);
    }
  }
}
