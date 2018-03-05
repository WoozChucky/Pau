
export class Address {

    public port : number;
    public ip : string;
    public found : number;

    constructor(ip : string, port : number) {
        this.ip = ip;
        this.port = port;
        this.found = Date.now();
    }

    public toString() : string {
        return `${this.ip}:${this.port}`;
    }

}