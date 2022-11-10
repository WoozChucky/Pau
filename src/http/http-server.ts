import * as bodyParser from "body-parser";
import express from "express";
import errorHandler from "errorhandler";
import { IndexRoute } from "./routes";
import { EventEmitter } from "events";
import {isPortTaken} from "../utils/http";
import {Express} from "express";
import {morganMiddleware} from "./middlewares/morgan-middleware";
import {Logger} from "../utils/logging";

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
        this.app.use(bodyParser.json());

        //use query string parser middleware
        this.app.use(bodyParser.urlencoded({ extended: true }));

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

        this.router.use('/v1', new IndexRoute().use());

        //use router middleware
        this.app.use(this.router);

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
