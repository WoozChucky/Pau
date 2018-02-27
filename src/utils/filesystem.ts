import * as fs from 'fs';
import * as path from 'path';

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
     * @param isRelativeToScript {any} Defaults to working directory, otherwise uses script fodler as starting location  
     */
    public static createFolderSync(targetDir : string, {isRelativeToScript = false} = {}) : void {
        const sep = path.sep;
        const initDir = path.isAbsolute(targetDir) ? sep : '';
        const baseDir = isRelativeToScript ? __dirname : '.';
      
        targetDir.split(sep).reduce((parentDir, childDir) => {
          const curDir = path.resolve(baseDir, parentDir, childDir);
          try {
            fs.mkdirSync(curDir);
            console.log(`Directory ${curDir} created!`);
          } catch (err) {
            if (err.code !== 'EEXIST') {
              throw err;
            }
      
            console.log(`Directory ${curDir} already exists!`);
          }
      
          return curDir;
        }, initDir);
    }

}