import { Database } from "./database/database-manager";
import { FileSystem } from "./utils/filesystem";
import { HttpServer } from "./http/http-server";
import { BlockchainManager } from "./blockchain/blockchain-manager";
import { P2PServer } from "./p2p/p2p-server";
import { Logger } from "./utils/logging";
import { AddressManager } from "./net/address-manager";

export class Application {
  private readonly httpPort: number;
  private readonly p2pPort: number;
  private name: string;
  private readonly dataFolder: string;
  private readonly useAddress: boolean;

  private httpServer: HttpServer | null = null;

  constructor(
    httpPort: number,
    p2pPort: number,
    name: string,
    dataLocation: string,
    useAddress: boolean
  ) {
    this.httpPort = httpPort;
    this.p2pPort = p2pPort;
    this.name = name;
    this.dataFolder = dataLocation;
    this.useAddress = useAddress;

    FileSystem.createFolderSync(this.dataFolder);
    FileSystem.createFolderSync(`${this.dataFolder}/db`);
    FileSystem.createFolderSync(`${this.dataFolder}/logs`);
    Database.instance.initialize(`${this.dataFolder}/db/${name}`);
  }

  public async initialize(): Promise<void> {
    try {
      await AddressManager.initialize(this.useAddress);
      Logger.info("AddressManager was initialized successfully.");

      await BlockchainManager.initialize();
      Logger.info("BlockchainManager was initialized successfully.");
    } catch (err) {
      Logger.error(err);
      process.exit(1);
    }

    this.httpServer = new HttpServer(this.httpPort);

    process.on("SIGINT", this.GracefullyExit);
    // process.on("SIGKILL", this.GracefullyExit);
    process.on("SIGTERM", this.GracefullyExit);

    this.httpServer.on("listening", (port) =>
      Logger.info(`HTTP Server listening on port: ${port}`)
    );
    this.httpServer.on("error", (err) => {
      Logger.error(err);
      process.exit(1);
    });

    P2PServer.bus.on("listening", (port) => {
      Logger.info(`P2P Server listening on port: ${port}`);
    });

    P2PServer.bus.on("error", (err) => {
      Logger.error(err);
      process.exit(1);
    });

    await this.httpServer.listen();
    P2PServer.start(this.p2pPort);
  }

  private async GracefullyExit() {
    Logger.warn("Caught interrupt signal");

    try {
      await AddressManager.saveLocally();
      await BlockchainManager.saveLocally();

      process.exit(0);
    } catch (err) {
      Logger.warn("Didn't saved data locally: ", err);
      process.exit(1);
    }
  }
}
