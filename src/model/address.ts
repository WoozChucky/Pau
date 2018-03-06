
export class Address {

    public endpoint : string;
    public found : number;

    constructor(url : string) {
        this.endpoint = url;
        this.found = Date.now();
    }

    public toString() : string {
        return `${this.endpoint}`;
    }

}