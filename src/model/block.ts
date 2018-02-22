import { Long } from "bson";

export class Block {

    public index : number;
    public timestamp : number;
    public previousHash : string;
    public data : any;
    public hash : string;
    public difficulty : number;
    public nonce : number;

    constructor(index : number, previousHash : string, timestamp : number,
                data : any, hash : string, difficulty : number, nonce : number) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
        this.difficulty = difficulty;
        this.nonce = nonce;
    }

}