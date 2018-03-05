import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";
import { Block } from "../../model/block";
import { HttpServer } from "../server";
import { connectToPeers, getSockets } from '../../p2p/p2p_protocol'
import { generatenextBlockWithTransaction, getAccountBalance, generateRawNextBlock, generateNextBlock, getBlockchain } from "../../blockchain/blockchain";
import {Database} from "../../database";
import {BlockRoute} from "./block";
import {AddressRoute} from "./address";
import {PeerRoute} from "./peer";

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

        this.router.get('/transaction/:id', (req: Request, res: Response, next: NextFunction) => {
            this.getTransaction(req, res, next);
        });

        this.router.get('/unspentTxOuts', (req: Request, res: Response, next: NextFunction) => {
            this.getUnspentTxOuts(req, res, next);
        });

        this.router.get('/myUnspentTxOuts', (req: Request, res: Response, next: NextFunction) => {
            this.getMyUnspentTxOuts(req, res, next);
        });

        this.router.post('mineRawBlock', (req: Request, res: Response, next: NextFunction) => {
            this.mineRawBlock(req, res, next);
        });

        this.router.post("/mineBlock", (req: Request, res: Response, next: NextFunction) => {
            this.mineBlock(req, res, next);
        });

        this.router.get('/balance', (req: Request, res: Response, next: NextFunction) => {
            this.getBalance(req, res, next);
        });

        this.router.get('/address', (req: Request, res: Response, next: NextFunction) => {
            this.getAddress(req, res, next);
        });

        this.router.post('/mineTransaction', (req: Request, res: Response, next: NextFunction) => {
            this.mineTransaction(req, res, next);
        });

        this.router.post('/sendTransaction', (req: Request, res: Response, next: NextFunction) => {
            this.sendTransaction(req, res, next);
        });

        this.router.get('/transactionPool', (req: Request, res: Response, next: NextFunction) => {
            this.getTransactionPool(req, res, next);
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
    public getTransaction(req: Request, res: Response, next: NextFunction) {

      BaseRoute.json(req, res, 200);
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

    /**
     * The home page route.
     *
     * @class IndexRoute
     * @method index
     * @param req {Request} The express Request object.
     * @param res {Response} The express Response object.
     * @param next {NextFunction} Execute the next method.
     */
    public getUnspentTxOuts(req: Request, res: Response, next: NextFunction) {

      BaseRoute.json(req, res, 200);
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
    public getMyUnspentTxOuts(req: Request, res: Response, next: NextFunction) {

      BaseRoute.json(req, res, 200);
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
    public sendTransaction(req: Request, res: Response, next: NextFunction) {

      BaseRoute.json(req, res, 200);
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
    public getTransactionPool(req: Request, res: Response, next: NextFunction) {

      BaseRoute.json(req, res, 200);
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
    public mineBlock(req: Request, res: Response, next: NextFunction) {

      let newBlock : Block = generateNextBlock();
      if(newBlock == null) {
        BaseRoute.json(req, res, 200, {"error_message" : "could not generate block"});
        return;
      }

      BaseRoute.json(req, res, 200, newBlock);
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
    public mineRawBlock(req: Request, res: Response, next: NextFunction) {
      
      if(req.body.data == null) {
        BaseRoute.json(req, res, 400, {"error_message" : "data parameter is missing"});
        return;
      }

      let newBlock : Block = generateRawNextBlock(req.body.data);
      if(newBlock == null) {
        BaseRoute.json(req, res, 400, {"error_message" : "could not generate block"});
        return;
      }

      BaseRoute.json(req, res, 200, newBlock);
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
    public mineTransaction(req: Request, res: Response, next: NextFunction) {
      
      let address = req.body.address;
      let amount = req.body.amount;
      try {
        let output = generatenextBlockWithTransaction(address, amount);
        BaseRoute.json(req, res, 200, output);
      } catch (e) {
        console.log(e.message);
        BaseRoute.json(req, res, 400, e.message);
      }

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
    public getBalance(req: Request, res: Response, next: NextFunction) {

      let balance = getAccountBalance();

      BaseRoute.json(req, res, balance);

    }

  }