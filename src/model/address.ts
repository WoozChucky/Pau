
export class Address {

    private port : number;
    private ip : string;
    private found : number;

    constructor(ip : string, port : number) {
        this.ip = ip;
        this.port = port;
        this.found = Date.now();
    }

}