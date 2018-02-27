let levelup = require('levelup')
let leveldown = require('leveldown')

export class Database {

    private db : any;

    constructor(location : string) {
        
        this.db = levelup(leveldown(location), {
            createIfMissing : true,
            errorIfExists : false,
            compression : true,
            keyEnconding : 'utf8',
            valueEncoding : 'utf8' //JSON also supported
        });
        
    }

    public async get(key : string) : Promise<any> {

        return await this.db.get(key);
    }

    public async put(key : string, value : any) : Promise<void> {

        return await this.db.put(key, value);

    }

    public async delete(key : string) : Promise<void> {

        return await this.db.delete(key);

    }

}