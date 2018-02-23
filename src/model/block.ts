import { Long } from "bson";
import { Transaction } from "./transaction";

export class Block {

    public index : number;
    public timestamp : number;
    public previousHash : string;
    public data : Transaction[];
    public hash : string;
    public difficulty : number;
    public nonce : number;

    constructor(index: number, hash: string, previousHash: string,
        timestamp: number, data: Transaction[], difficulty: number, nonce: number) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
        this.difficulty = difficulty;
        this.nonce = nonce;
    }

}