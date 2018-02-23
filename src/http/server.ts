import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as logger from "morgan";
import * as path from "path";
import errorHandler = require("errorhandler");
import methodOverride = require("method-override");
import { initP2PServer, connectToPeers } from './../p2p/p2p_protocol'
import { IndexRoute } from "./../http/routes/index";

/**
 * The server.
 *
 * @class Server
 */
export class Server {

    private app: express.Application;
    private httpPort : any;

    /**
     * Bootstrap the application.
     *
     * @class Server
     * @method bootstrap
     * @static
     * @return {ng.auto.IInjectorService} Returns the newly created injector for this app.
     */
    public static bootstrap(): Server {
      return new Server();
    }
  
    /**
     * Constructor.
     *
     * @class Server
     * @constructor
     */
    constructor() {
      //create expressjs application
      this.app = express();
  
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
    private api() {

    }
  
    /**
     * Configure application
     *
     * @class Server
     * @method config
     */
    private config() {

        //use logger middleware
        this.app.use(logger("dev"));

        //use json form parser middlware
        this.app.use(bodyParser.json());

        //use query string parser middlware
        this.app.use(bodyParser.urlencoded({
            extended: true
        }));

        //use cookie parser middleware
        this.app.use(cookieParser("SECRET_GOES_HERE"));

        //use override middlware
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
    private routes() {
      
        let router : express.Router;
        router = express.Router();

        IndexRoute.create(router);

        //use router middleware
        this.app.use(router);

    }

    private onListening() : void {
        console.log('Listening on port ' + this.httpPort);
    }

    private onError(error : any) : void {
        if (error.syscall !== 'listen') {
            throw error;
          }
        
          var bind = typeof this.httpPort === 'string'
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

    public listen(httpPort : any, p2pPort : any, initialPeers : any) : void {

        this.httpPort = httpPort;

        this.app.listen(httpPort);

        this.app.on('listening', this.onListening);
        this.app.on('error', this.onError);

        initP2PServer(p2pPort);
    }

  }