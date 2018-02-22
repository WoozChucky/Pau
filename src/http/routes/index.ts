import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";
import { Blockchain } from "../../blockchain/blockchain";
import { Block } from "../../model/block";
import { Server } from "../../server";
import { connectToPeers, getSockets } from '../../p2p/p2p_protocol'

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

      router.post("/mineBlock", (req: Request, res: Response, next: NextFunction) => {
        new IndexRoute().mineBlock(req, res, next);
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
     * @next {NextFunction} Execute the next method.
     */
    public getBlocks(req: Request, res: Response, next: NextFunction) {
  
      let chain = Server.blockchain.getChain();

      this.json(req, res, chain);
    }

    public mineBlock(req: Request, res: Response, next: NextFunction) {
      
      let newBlock : Block = Server.blockchain.generateNextBlock(req.body.data);

      this.json(req, res, newBlock);
    }

    public getPeers(req: Request, res: Response, next: NextFunction) {

      let output = getSockets().map((s : any) => s._socket.remoteAddress + ':' + s._socket.remotePort);

      this.json(req, res, output);

    }

    public addPeer(req: Request, res: Response, next: NextFunction) {

      connectToPeers(req.body.peer);

      res.send();

    }
  }