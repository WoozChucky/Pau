import levelup, { LevelUp } from "levelup";
import leveldown, { LevelDown } from "leveldown";

export class Database {
  public static BLOCKCHAIN_KEY = "blockchain_key";
  public static ADDRESS_LIST_KEY = "address_list_key";

  private static singletonInstance: Database;

  private db: LevelUp<LevelDown> | null = null;

  private initialized = false;

  private constructor() {}

  public static get instance(): Database {
    if (!Database.singletonInstance) {
      Database.singletonInstance = new Database();
    }
    return Database.singletonInstance;
  }

  public initialize(location: string): void {
    if (this.initialized) {
      throw new Error("Database already initialized");
    }

    this.db = levelup(leveldown(location), {
      createIfMissing: true,
      errorIfExists: false,
      compression: true,
      keyEncoding: "utf8",
      valueEncoding: "utf8", // JSON also supported
    });

    this.initialized = true;
  }

  public async get(key: string): Promise<string> {
    this.checkDatabaseStatus();

    return (await this.db!.get(key)).toString();
  }

  public async put(key: string, value: string) {
    this.checkDatabaseStatus();

    return await this.db?.put(key, value);
  }

  public async delete(key: string): Promise<void> {
    this.checkDatabaseStatus();

    return await this.db?.del(key);
  }

  private checkDatabaseStatus(): void {
    if (!this.initialized) {
      throw new Error("Database not initialized");
    }
  }
}
