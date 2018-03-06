export class Block {

    public index : number;
    public timestamp : number;
    public previousHash : string;
    public data : object;
    public hash : string;
    public difficulty : number;
    public nonce : number;

    constructor(index: number, hash: string, previousHash: string,
        timestamp: number, data: object, difficulty: number, nonce: number) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
        this.difficulty = difficulty;
        this.nonce = nonce;
    }

}