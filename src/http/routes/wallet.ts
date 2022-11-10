import {BaseRoute} from "./base-route";
import {NextFunction, Request, Response, Router} from "express";
import {WalletManager} from "../../blockchain/wallet/wallet-manager";

export class WalletRoute extends BaseRoute {

    private router : Router;

    constructor() {
        super();

        this.router = Router();

        this.router.post('/', WalletRoute.generateNewWallet.bind(this));

        this.router.get('/:privateKey', WalletRoute.getWalletInformation.bind(this));
    }

    public use() : Router {
        return this.router;
    }

    private static getWalletInformation(req: Request, res: Response, next: NextFunction) {

        let address = WalletManager.getPublicAddress(req.params.privateKey);

        BaseRoute.json(req, res, 200, address);

    }

    private static generateNewWallet(req: Request, res: Response, next: NextFunction) {

        let wallet = WalletManager.generateNewWallet();

        BaseRoute.json(req, res, 200, wallet);

    }

}