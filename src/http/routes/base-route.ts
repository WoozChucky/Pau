import {Request, Response, Router} from 'express';

/**
 * Constructor
 *
 * @class BaseRoute
 */
export abstract class BaseRoute {

    /**
     * Constructor
     *
     * @class BaseRoute
     * @constructor
     */
    constructor() {

    }

    public abstract use() : Router;


    /**
     * Send response in JSON format
     * 
     * @class json
     * @method json
     * @param req {Request} The request object.
     * @param res {Response} The response object.
     * @param code {number} HTTP status code
     * @param output {object} json object to send.
     * @return void
     */
    protected static json(req: Request, res: Response, code = 200, output: unknown = {}) {
      res.status(code).json(output);
    }
    
  }
