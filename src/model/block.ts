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

    public static isValidStructure(block: Block) : boolean {
        return typeof block.index === 'number'
            && typeof block.hash === 'string'
            && typeof block.previousHash === 'string'
            && typeof block.timestamp === 'number'
            && typeof block.data === 'object';
    }

    public isValidStructure() : boolean {
        return typeof this.index === 'number'
            && typeof this.hash === 'string'
            && typeof this.previousHash === 'string'
            && typeof this.timestamp === 'number'
            && typeof this.data === 'object';
    }

}
