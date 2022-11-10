import swaggerUi from "swagger-ui-express";
import express from "express";
import errorHandler from "errorhandler";
import { EventEmitter } from "events";
import {isPortTaken} from "../utils/http";
import {Express} from "express";
import {morganMiddleware} from "./middlewares/morgan-middleware";
import {Logger} from "../utils/logging";
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
    private readonly router : express.Router;
    private httpPort : number;
  
    /**
     * Constructor.
     *
     * @class Server
     * @constructor
     */
    constructor(port : number) {
      super();
      this.httpPort = port;

      //create express js application
      this.app = express();

      this.router = express.Router();
  
      //configure application
      this.config();
  
      //add routes
      this.routes();
  
      //add api
      this.api();
    }
  
    /**
     * Create REST API routes
     *
     * @class Server
     * @method api
     */
    private api() : void {
        Logger.info('TODO: Create Rest API calls, or remote method')
    }
  
    /**
     * Configure application
     *
     * @class Server
     * @method config
     */
    private config() : void {

        //use logger middleware
        this.app.use(morganMiddleware);

        //use json form parser middleware
        this.app.use(express.json());

        //use query string parser middleware
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

        //catch 404 and forward to error handler
        this.app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
            err.status = 404;
            next(err);
        });

        //error handling
        this.app.use(errorHandler());
    }
  
    /**
     * Create router
     *
     * @class Server
     * @method api
     */
    private routes() : void {

        this.router.use('/status', StatusRouter);
        this.router.use('/blocks', BlockRouter);
        this.router.use('/peers', PeerRouter);
        this.router.use('/address', AddressRouter);
        this.router.use('/wallet', WalletRouter);

        //use router middleware
        this.app.use('/v1', this.router);

    }

    public async listen() : Promise<void> {
        try {
            const portTaken = await isPortTaken(this.httpPort);

            if(!portTaken) {
                this.emit('error', `HTTP Port ${this.httpPort} is already in use.`)
            } else {
                this.app.listen(this.httpPort);
                this.emit('listening', this.httpPort);
            }
        } catch (err) {
            this.emit('error', err);
        }
    }

  }
