import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logging';

/** 
 * Util class for IO operations
 * 
 * @class FileSystem
*/
export class FileSystem {

    /**
     * Creates a folder structure recursively
     * 
     * @method createFolder
     * @param targetDir {string} The folder structure
     * @param isRelativeToScript {any} Defaults to working directory, otherwise uses script folder as starting location
     */
    public static createFolderSync(targetDir : string, {isRelativeToScript = false} = {}) : void {
        const sep = path.sep;
        const initDir = path.isAbsolute(targetDir) ? sep : '';
        const baseDir = isRelativeToScript ? __dirname : '.';
      
        targetDir.split(sep).reduce((parentDir, childDir) => {
          const curDir = path.resolve(baseDir, parentDir, childDir);
          try {
            fs.mkdirSync(curDir);
            logger.info(`Directory ${curDir} created!`);
          } catch (err) {
            if (err.code !== 'EEXIST') {
              throw err;
            }

              logger.debug(`Directory ${curDir} already exists!`);
          }
      
          return curDir;
        }, initDir);
    }

}