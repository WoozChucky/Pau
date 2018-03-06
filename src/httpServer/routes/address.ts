import {NextFunction, Request, Response, Router} from "express";
import {BaseRoute} from "./base-route";
import {BlockchainManager} from "../../blockchain/blockchain-manager";
import {AddressManager} from "../../net/address-manager";

/***
 * / block
 *
 * @class AddressRoute
 */
export class AddressRoute extends BaseRoute {

    private router : Router;

    constructor() {
        super();

        this.router = Router();

        this.router.get("/", AddressRoute.getAddresses.bind(this));

        this.router.get('/:address', AddressRoute.getAddress.bind(this));
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
    private static getAddresses(req: Request, res: Response, next: NextFunction) {

        AddressManager.getAll()
            .then( addresses => {
                BaseRoute.json(req, res, 200, addresses);
            })
            .catch((err : Error) => {
                BaseRoute.json(req, res, 400, { message : `${err.name} - ${err.message}`});
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
    private static getAddress(req: Request, res: Response, next: NextFunction) {

        BlockchainManager.getBlock(req.params.address)
            .then(chain => {
                BaseRoute.json(req, res, 200, chain);
            })
            .catch((err : Error) => {
                BaseRoute.json(req, res, 404, { message : `${err.name} - ${err.message}`});
            });
    }

}