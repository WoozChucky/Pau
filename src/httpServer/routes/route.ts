import { NextFunction, Request, Response } from 'express';

/**
 * Constructor
 *
 * @class BaseRoute
 */
export class BaseRoute {
  
    /**
     * Constructor
     *
     * @class BaseRoute
     * @constructor
     */
    constructor() {
      //initialize variables
    }


    /**
     * Send response in JSON format
     * 
     * @class json
     * @method json
     * @param req {Request} The request object.
     * @param res {Response} The response object.
     * @param code {number} HTTP status code
     * @param output {any} json object to serialize.
     * @return void
     */
    public json(req: Request, res: Response, code : number = 200, output: any = "") {

      res.status(code).json(output);

    }
    
  }