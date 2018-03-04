let levelup = require('levelup');
let leveldown = require('leveldown');

export class Database {

    public static BLOCKCHAIN_KEY = "blockchain_key";
    public static ADDRESS_LIST_KEY = "";

    private static db : any;

    private static initialized : boolean = false;

    public static initialize(location : string) : void {
        if(Database.initialized) {
            throw new Error("Database already initialized");
        }

        Database.db = levelup(leveldown(location), {
            createIfMissing : true,
            errorIfExists : false,
            compression : true,
            keyEncoding : 'utf8',
            valueEncoding : 'utf8' //JSON also supported
        });

        Database.initialized = true;

    }

    public static async get(key : string) : Promise<string> {

        if(!Database.initialized) {
            throw new Error("Database not initialized");
        }

        return await Database.db.get(key);
    }

    public static async put(key : string, value : string) : Promise<void> {

        if(!Database.initialized) {
            throw new Error("Database not initialized");
        }

        return await Database.db.put(key, value);

    }

    public static async delete(key : string) : Promise<void> {

        if(!Database.initialized) {
            throw new Error("Database not initialized");
        }

        return await Database.db.delete(key);

    }

}