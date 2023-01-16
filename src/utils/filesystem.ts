import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

import { Logger } from "./logging";

/**
 * Util object for IO operations
 *
 * @class FileSystem
 */
export const FileSystem = {
  /**
   * Creates a folder structure recursively
   *
   * @method createFolder
   * @param targetDir {string} The folder structure
   * @param isRelativeToScript {any} Defaults to working directory, otherwise uses script folder as starting location
   */
  createFolderSync: (
    targetDir: string,
    { isRelativeToScript = false } = {}
  ): void => {
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir) ? sep : "";
    const baseDir = isRelativeToScript ? __dirname : ".";

    targetDir.split(sep).reduce((parentDir, childDir) => {
      const curDir = path.resolve(baseDir, parentDir, childDir);
      try {
        fs.mkdirSync(curDir);
        Logger.info(`Directory ${curDir} created!`);
      } catch (err: any) {
        if (err.code !== "EEXIST") {
          throw err;
        }
        Logger.debug(`Directory ${curDir} already exists!`);
      }

      return curDir;
    }, initDir);
  },

  readFromFile: (file: string): Promise<string[]> => {
    return new Promise<string[]>((resolve, reject) => {
      let rs: readline.Interface | null = null;

      try {
        rs = readline.createInterface({
          input: fs.createReadStream(file),
        });

        const result: string[] = [];

        rs.on("line", (line) => {
          result.push(line);
        });

        rs.on("close", () => {
          return resolve(result);
        });
      } catch (err) {
        return reject(err);
      } finally {
        if (rs !== null) {
          rs.close();
        }
      }
    });
  },
};
