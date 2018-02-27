import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";
import { Block } from "../../model/block";
import { HttpServer } from "../server";
import { connectToPeers, getSockets } from '../../p2p/p2p_protocol'
import { generatenextBlockWithTransaction, getAccountBalance, generateRawNextBlock, generateNextBlock, getBlockchain } from "../../blockchain/blockchain";

/**
 * / route
 *
 * @class IndexRoute
 */
export class IndexRoute extends BaseRoute {

    /**
     * Create the routes.
     *
     * @class IndexRoute
     * @method create
     * @static
     */
    public static create(router: Router) {
      //log
      console.log("[IndexRoute::create] Creating index route.");
  
      //add home page route
      router.get("/blocks", (req: Request, res: Response, next: NextFunction) => {
        new IndexRoute().getBlocks(req, res, next);
      });

      router.get('/blocks/:hash', (req: Request, res: Response, next: NextFunction) => {
        new IndexRoute().getBlock(req, res, next);
      });

      router.get('/transaction/:id', (req: Request, res: Response, next: NextFunction) => {
        new IndexRoute().getTransaction(req, res, next);
      });

      router.get('/address/:address', (req: Request, res: Response, next: NextFunction) => {
        new IndexRoute().getAddress(req, res, next);
      });

      router.get('/unspentTxOuts', (req: Request, res: Response, next: NextFunction) => {
        new IndexRoute().getUnspentTxOuts(req, res, next);
      });

      router.get('/myUnspentTxOuts', (req: Request, res: Response, next: NextFunction) => {
        new IndexRoute().getMyUnspentTxOuts(req, res, next);
      });

      router.post('mineRawBlock', (req: Request, res: Response, next: NextFunction) => {
        new IndexRoute().mineRawBlock(req, res, next);
      });

      router.post("/mineBlock", (req: Request, res: Response, next: NextFunction) => {
        new IndexRoute().mineBlock(req, res, next);
      });

      router.get('/balance', (req: Request, res: Response, next: NextFunction) => {
        new IndexRoute().getBalance(req, res, next);
      });

      router.get('/address', (req: Request, res: Response, next: NextFunction) => {
        new IndexRoute().getAddress(req, res, next);
      });

      router.post('/mineTransaction', (req: Request, res: Response, next: NextFunction) => {
        new IndexRoute().mineTransaction(req, res, next);
      });

      router.post('/sendTransaction', (req: Request, res: Response, next: NextFunction) => {
        new IndexRoute().sendTransaction(req, res, next);
      });

      router.get('/transactionPool', (req: Request, res: Response, next: NextFunction) => {
        new IndexRoute().getTransactionPool(req, res, next);
      });

      router.get('/peers', (req: Request, res: Response, next: NextFunction) => {
        new IndexRoute().getPeers(req, res, next);
      });

      router.post('/addPeer', (req: Request, res: Response, next: NextFunction) => {
        new IndexRoute().addPeer(req, res, next);
      });
    }
  
    /**
     * Constructor
     *
     * @class IndexRoute
     * @constructor
     */
    constructor() {
      super();
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
    public getBlocks(req: Request, res: Response, next: NextFunction) {
  
      let chain = getBlockchain();

      this.json(req, res, 200, chain);
    }

    public getBlock(req: Request, res: Response, next: NextFunction) {

      this.json(req, res, 200);
    }

    public getTransaction(req: Request, res: Response, next: NextFunction) {

      this.json(req, res, 200);
    }

    public getAddress(req: Request, res: Response, next: NextFunction) {

      this.json(req, res, 200);
    }

    public getUnspentTxOuts(req: Request, res: Response, next: NextFunction) {

      this.json(req, res, 200);
    }

    public getMyUnspentTxOuts(req: Request, res: Response, next: NextFunction) {

      this.json(req, res, 200);
    }

    public sendTransaction(req: Request, res: Response, next: NextFunction) {

      this.json(req, res, 200);
    }

    public getTransactionPool(req: Request, res: Response, next: NextFunction) {

      this.json(req, res, 200);
    }

    public mineBlock(req: Request, res: Response, next: NextFunction) {

      let newBlock : Block = generateNextBlock();
      if(newBlock == null) {
        this.json(req, res, 200, {"error_message" : "could not generate block"})
        return;
      }

      this.json(req, res, 200, newBlock);
    }

    public mineRawBlock(req: Request, res: Response, next: NextFunction) {
      
      if(req.body.data == null) {
        this.json(req, res, 400, {"error_message" : "data parameter is missing"})
        return;
      }

      let newBlock : Block = generateRawNextBlock(req.body.data);
      if(newBlock == null) {
        this.json(req, res, 400, {"error_message" : "could not generate block"})
        return;
      }

      this.json(req, res, 200, newBlock);
    }

    public mineTransaction(req: Request, res: Response, next: NextFunction) {
      
      let address = req.body.address;
      let amount = req.body.amount;
      try {
        let output = generatenextBlockWithTransaction(address, amount);
        this.json(req, res, 200, output);
      } catch (e) {
        console.log(e.message);
        this.json(req, res, 400, e.message);
      }

    }

    public getBalance(req: Request, res: Response, next: NextFunction) {

      let balance = getAccountBalance();

      this.json(req, res, balance);

    }

    public getPeers(req: Request, res: Response, next: NextFunction) {

      let output = getSockets().map((s : any) => s._socket.remoteAddress + ':' + s._socket.remotePort);

      this.json(req, res, 200, output);

    }

    public addPeer(req: Request, res: Response, next: NextFunction) {

      connectToPeers(req.body.peer);

      this.json(req, res, 200);

    }
  }