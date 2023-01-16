import * as http from 'http';
import { Server } from 'http';

import swaggerUi from 'swagger-ui-express';
import express, { Express } from 'express';
import errorHandler from 'errorhandler';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import helmet from 'helmet';

import { EventBus } from '../events/event-bus';
import { Events } from '../events/events';

import { morganMiddleware } from './middlewares/morgan-middleware';
import { StatusRouter } from './routes/status-route';
import { BlockRouter } from './routes/block-route';
import { PeerRouter } from './routes/peer-route';
import { AddressRouter } from './routes/address-route';
import { WalletRouter } from './routes/wallet-route';

/**
 * The server.
 *
 * @class HttpServer
 */
export class HttpServer {
  private readonly app: Express;
  private readonly server: Server;
  private readonly router: express.Router;

  /**
   * Constructor.
   *
   * @class Server
   * @constructor
   */
  constructor() {
    // create express js application
    this.app = express();

    // create server
    this.server = http.createServer(this.app);

    this.router = express.Router();

    // configure application
    this.config();

    // add routes
    this.routes();

    this.server.on('listening', this.onServerListening.bind(this));
    this.server.on('error', this.onServerError.bind(this));
  }

  public get handle(): Server {
    return this.server;
  }

  private onServerListening() {
    EventBus.instance.dispatch<number>(Events.Http.Listening);
  }

  private onServerError(error: Error) {
    EventBus.instance.dispatch(Events.Http.Error, error);
  }

  /**
   * Configure application
   *
   * @class Server
   * @method config
   */
  private config(): void {
    this.app.disable('x-powered-by');

    this.app.set('trust proxy', 1);

    // use json form parser middleware
    this.app.use(express.json());

    // use query string parser middleware
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use(helmet());

    // use logger middleware
    this.app.use(morganMiddleware);

    this.app.use(cookieParser());

    this.app.use(csrf({ cookie: true }));

    this.app.use(express.static('public'));

    this.app.use(
      '/docs',
      swaggerUi.serve,
      swaggerUi.setup(undefined, {
        swaggerOptions: {
          url: '/swagger.json',
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
    this.router.use('/status', StatusRouter);
    this.router.use('/blocks', BlockRouter);
    this.router.use('/peers', PeerRouter);
    this.router.use('/address', AddressRouter);
    this.router.use('/wallet', WalletRouter);

    // use router middleware
    this.app.use('/v1', this.router);
  }
}
