import { EventEmitter } from "events";

import swaggerUi from "swagger-ui-express";
import express, { Express } from "express";
import errorHandler from "errorhandler";
import cookieParser from "cookie-parser";
import csrf from "csurf";
import helmet from "helmet";

import { isPortTaken } from "../utils/http";
import { Logger } from "../utils/logging";

import { morganMiddleware } from "./middlewares/morgan-middleware";
import { StatusRouter } from "./routes/status-route";
import { BlockRouter } from "./routes/block-route";
import { PeerRouter } from "./routes/peer-route";
import { AddressRouter } from "./routes/address-route";
import { WalletRouter } from "./routes/wallet-route";

/**
 * The server.
 *
 * @class HttpServer
 */
export class HttpServer extends EventEmitter {
  private app: Express;
  private readonly router: express.Router;
  private readonly httpPort: number;

  /**
   * Constructor.
   *
   * @class Server
   * @constructor
   */
  constructor(port: number) {
    super();
    this.httpPort = port;

    // create express js application
    this.app = express();

    this.router = express.Router();

    // configure application
    this.config();

    // add routes
    this.routes();

    // add api
    this.api();
  }

  public async listen(): Promise<void> {
    try {
      const notTaken = await isPortTaken(this.httpPort);

      if (notTaken) {
        this.app.listen(this.httpPort);
        this.emit("listening", this.httpPort);
      } else {
        this.emit("error", `HTTP Port ${this.httpPort} is already in use.`);
      }
    } catch (err) {
      this.emit("error", err);
    }
  }

  /**
   * Create REST API routes
   *
   * @class Server
   * @method api
   */
  private api(): void {
    Logger.info("TODO: Create Rest API calls, or remote method");
  }

  /**
   * Configure application
   *
   * @class Server
   * @method config
   */
  private config(): void {
    this.app.disable("x-powered-by");

    this.app.set("json spaces", 2);

    this.app.set("trust proxy", 1);

    this.app.use(helmet());

    // use logger middleware
    this.app.use(morganMiddleware);

    this.app.use(cookieParser());

    this.app.use(csrf({ cookie: true }));

    // use json form parser middleware
    this.app.use(express.json());

    // use query string parser middleware
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use(express.static("public"));

    this.app.use(
      "/docs",
      swaggerUi.serve,
      swaggerUi.setup(undefined, {
        swaggerOptions: {
          url: "/swagger.json",
        },
      })
    );

    // catch 404 and forward to error handler
    this.app.use(function (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) {
      /*
        Logger.error(
          `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${
            req.method
          } - ${req.ip}`
        );
        */
      console.log("error middlware");
      // res.status(err.status || 500);
      next();
    });

    // error handling
    this.app.use(errorHandler());
  }

  /**
   * Create router
   *
   * @class Server
   * @method api
   */
  private routes(): void {
    this.router.use("/status", StatusRouter);
    this.router.use("/blocks", BlockRouter);
    this.router.use("/peers", PeerRouter);
    this.router.use("/address", AddressRouter);
    this.router.use("/wallet", WalletRouter);

    // use router middleware
    this.app.use("/v1", this.router);
  }
}
