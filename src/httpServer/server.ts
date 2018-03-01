import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as logger from "morgan";
import errorHandler = require("errorhandler");
import methodOverride = require("method-override");
import { initP2PServer, connectToPeers } from './../p2p/p2p_protocol'
import { IndexRoute } from "./routes";
import { EventEmitter } from "events";

/**
 * The server.
 *
 * @class Server
 */
export class HttpServer extends EventEmitter {

    private app: express.Application;
    private router : express.Router;
    private httpPort : any;
  
    /**
     * Constructor.
     *
     * @class Server
     * @constructor
     */
    constructor(port : number) {
      super();
      this.httpPort = port;

      //create expressjs application
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

    }
  
    /**
     * Configure application
     *
     * @class Server
     * @method config
     */
    private config() : void {

        //use logger middleware
        this.app.use(logger("dev"));

        //use json form parser middleware
        this.app.use(bodyParser.json());

        //use query string parser middleware
        this.app.use(bodyParser.urlencoded({
            extended: true
        }));

        //use cookie parser middleware
        this.app.use(cookieParser("SECRET_GOES_HERE"));

        //use override middleware
        this.app.use(methodOverride());

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

    private onError(error : any) : void {
        if (error.syscall !== 'listen') {
            throw error;
          }

        let bind = typeof this.httpPort === 'string'
            ? 'Pipe ' + this.httpPort
            : 'Port ' + this.httpPort;

        // handle specific listen errors with friendly messages
          switch (error.code) {
            case 'EACCES':
              console.error(bind + ' requires elevated privileges');
              process.exit(1);
              break;
            case 'EADDRINUSE':
              console.error(bind + ' is already in use');
              process.exit(1);
              break;
            default:
              throw error;
          }
    }

    public listen() : void {

        this.app.on('error', this.onError.bind(this));

        this.app.listen(this.httpPort);

        this.emit('listening', this.httpPort);

        //initP2PServer(p2pPort);
    }

  }