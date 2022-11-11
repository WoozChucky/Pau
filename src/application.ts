import { Database } from "./database/database-manager";
import { FileSystem } from "./utils/filesystem";
import { HttpServer } from "./http/http-server";
import { BlockchainManager } from "./blockchain/blockchain-manager";
import { P2PServer, P2PServerError } from "./p2p/p2p-server";
import { Logger } from "./utils/logging";
import { AddressManager } from "./net/address-manager";
import { EventBus } from "./events/event-bus";

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
  }

  public async initialize(): Promise<void> {
    try {
      FileSystem.createFolderSync(this.dataFolder);
      FileSystem.createFolderSync(`${this.dataFolder}/db`);
      FileSystem.createFolderSync(`${this.dataFolder}/logs`);
      Database.instance.initialize(`${this.dataFolder}/db/${this.name}`);

      await AddressManager.instance.initialize(this.useAddress);
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

    EventBus.instance.register(
      "http-server.listening",
      this.onHttpServerListening
    );
    EventBus.instance.register(
      "http-server.error-listening",
      this.onHttpServerListeningError
    );

    EventBus.instance.register(
      "p2p-server.listening",
      this.onP2PServerListening
    );

    EventBus.instance.register("p2p-server.error", this.onP2PServerError);

    await this.httpServer.listen();
    P2PServer.start(this.p2pPort);
  }

  private onHttpServerListening(port: number) {
    Logger.info(`HTTP Server listening on port ${port}`);
  }

  private onHttpServerListeningError(port: number) {
    Logger.error(`HTTP Port ${port} is already in use.`);
    process.exit(1);
  }

  private onP2PServerListening(port: number) {
    Logger.info(`P2P Server listening on port ${port}`);
  }

  private onP2PServerError(arg: P2PServerError) {
    Logger.error(
      `P2P Port ${arg.port} is already in use! ${arg.error.message}`
    );
    process.exit(1);
  }

  private async GracefullyExit() {
    Logger.warn("Caught interrupt signal");

    try {
      await AddressManager.instance.saveLocally();
      await BlockchainManager.saveLocally();

      process.exit(0);
    } catch (err) {
      Logger.warn("Didn't saved data locally: ", err);
      process.exit(1);
    }
  }
}
