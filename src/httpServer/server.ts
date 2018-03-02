import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as expressLogger from "morgan";
import errorHandler = require("errorhandler");
import methodOverride = require("method-override");
import { IndexRoute } from "./routes";
import { EventEmitter } from "events";
import {isPortTaken} from "../utils/http";

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
        this.app.use(expressLogger("dev"));

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

    public listen() : void {

        let self = this;

        isPortTaken(this.httpPort)
            .then((available) => {

                if(!available) {
                    self.emit('error', `HTTP Port ${self.httpPort} is already in use.`)
                } else {
                    self.app.listen(self.httpPort);
                    self.emit('listening', self.httpPort);
                }

            })
            .catch(err => {
                self.emit('error', err);
            });
    }

  }