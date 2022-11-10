import { BaseRoute } from "./base-route";
import { NextFunction, Request, Response, Router } from "express";
import {BlockchainManager} from "../../blockchain/blockchain-manager";
import {P2PServer} from "../../p2p/p2p-server";

/***
 * / block
 *
 * @class BlockRoute
 */
export class BlockRoute extends BaseRoute {

    private router : Router;

    constructor() {
        super();

        this.router = Router();

        this.router.get("/", BlockRoute.getBlocks.bind(this));

        this.router.get('/:hash', BlockRoute.getBlock.bind(this));

        this.router.post('/broadcast', BlockRoute.broadcastBlockchain.bind(this));

        this.router.post('/', BlockRoute.generateBlock.bind(this));
    }

    public use(): Router {
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
    private static getBlocks(req: Request, res: Response, next: NextFunction) {

        BlockchainManager.getChain()
            .then(chain => {
                super.json(req, res, 200, chain);
            })
            .catch((err : Error) => {
                super.json(req, res, 400, { message : `${err.name} - ${err.message}`});
            });
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
    private static getBlock(req: Request, res: Response, next: NextFunction) {

        BlockchainManager.getBlock(req.params.hash)
            .then(chain => {
                super.json(req, res, 200, chain);
            })
            .catch((err : Error) => {
                super.json(req, res, 404, { message : `${err.name} - ${err.message}`});
            });
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
    private static broadcastBlockchain(req: Request, res: Response, next: NextFunction) {

        P2PServer.broadcastBlockchain();

        super.json(req, res, 200, {});
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
    private static generateBlock(req: Request, res: Response, next: NextFunction) {

        BlockchainManager.generateNextBlock(req.body.data)
            .then((block) => {
                super.json(req, res, 200, block);
            })
            .catch(err => {
                super.json(req, res, 500, err);
            });
    }

}
