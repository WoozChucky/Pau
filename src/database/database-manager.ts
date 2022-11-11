import levelup, { LevelUp } from "levelup";
import leveldown, { LevelDown } from "leveldown";

export class Database {
  public static BLOCKCHAIN_KEY = "blockchain_key";
  public static ADDRESS_LIST_KEY = "address_list_key";

  private static db: LevelUp<LevelDown>;

  private static initialized = false;

  public static initialize(location: string): void {
    if (Database.initialized) {
      throw new Error("Database already initialized");
    }

    Database.db = levelup(leveldown(location), {
      createIfMissing: true,
      errorIfExists: false,
      compression: true,
      keyEncoding: "utf8",
      valueEncoding: "utf8", // JSON also supported
    });

    Database.initialized = true;
  }

  public static async get(key: string): Promise<string> {
    this.checkDatabaseStatus();

    return (await Database.db.get(key)).toString();
  }

  public static async put(key: string, value: string): Promise<void> {
    this.checkDatabaseStatus();

    return await Database.db.put(key, value);
  }

  public static async delete(key: string): Promise<void> {
    this.checkDatabaseStatus();

    return await Database.db.del(key);
  }

  private static checkDatabaseStatus(): void {
    if (!Database.initialized) {
      throw new Error("Database not initialized");
    }
  }
}
