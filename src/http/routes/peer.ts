import {NextFunction, Request, Response, Router} from "express";
import {BaseRoute} from "./base-route";
import {P2PServer} from "../../p2p/p2p-server";

/***
 * / block
 *
 * @class BlockRoute
 */
export class PeerRoute extends BaseRoute {

    private router : Router;

    constructor() {
        super();

        this.router = Router();

        this.router.get("/", PeerRoute.getPeers.bind(this));

        this.router.post('/', PeerRoute.addPeer.bind(this));

        this.router.post('/ask', PeerRoute.askPeer.bind(this));

        this.router.post('/ask/:peer', PeerRoute.askPeer.bind(this));
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
    private static getPeers(req: Request, res: Response, next: NextFunction) {

        let peers = P2PServer.getSockets().map((s : any) => s._socket.remoteAddress + ':' + s._socket.remotePort);

        BaseRoute.json(req, res, 200, peers);

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
    private static addPeer(req: Request, res: Response, next: NextFunction) {

        P2PServer.connectToPeer(req.body.peer);

        BaseRoute.json(req, res, 200, {});
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
    private static askPeer(req: Request, res: Response, next: NextFunction) {

        let peer = req.params.peer || '';

        P2PServer.askPeers(peer);

        BaseRoute.json(req, res, 200, {});
    }

}