import { NextFunction, Request, Response } from 'express';

/**
 * Constructor
 *
 * @class BaseRoute
 */
export class BaseRoute {

    private title: string;
  
    /**
     * Constructor
     *
     * @class BaseRoute
     * @constructor
     */
    constructor() {
      //initialize variables
      this.title = "Exchange API";
    }
  
    /**
     * Render a page.
     *
     * @class BaseRoute
     * @method render
     * @param req {Request} The request object.
     * @param res {Response} The response object.
     * @param view {String} The view to render.
     * @param options {Object} Additional options to append to the view's local scope.
     * @return void
     */
    public render(req: Request, res: Response, view: string, options?: Object) {
      //add constants
      res.locals.BASE_URL = "/";
  
      //add title
      res.locals.title = this.title;
  
      //render view
      res.render(view, options);
    }

    /**
     * Send response in JSON format
     * 
     * @class json
     * @method json
     * @param req {Request} The request object.
     * @param res {Response} The response object.
     * @param options {Object} json object to serialize.
     * @return void
     */
    public json(req: Request, res: Response, options?: Object) {
        
      console.log(options);

      res.json(options);

    }
  }