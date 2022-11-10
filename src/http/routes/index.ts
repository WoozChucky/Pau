import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./base-route";
import {BlockRoute} from "./block";
import {AddressRoute} from "./address";
import {PeerRoute} from "./peer";
import {WalletRoute} from "./wallet";

/**
 * / route
 *
 * @class IndexRoute
 */
export class IndexRoute extends BaseRoute {

    private router : Router;

    /**
     * Constructor
     *
     * @class IndexRoute
     * @constructor
     */
    constructor() {
        super();

        this.router = Router();

        this.router.use('/blocks', new BlockRoute().use());

        this.router.use('/address', new AddressRoute().use());

        this.router.use('/peers', new PeerRoute().use());

        this.router.use('/wallet', new WalletRoute().use());

        this.router.get('/address', (req: Request, res: Response, next: NextFunction) => {
            this.getAddress(req, res, next);
        });
    }

    public use() : Router {
        return this.router;
    }

    /**
     * The home page route.
     *
     * @class IndexRoute
     * @method index
     * @param req {Request} The express Request object.
     * @param res {Response} The express Response object.
     * @param next {NextFunction} Execute the next method.
     */
    public getAddress(req: Request, res: Response, next: NextFunction) {

      BaseRoute.json(req, res, 200);
    }

  }