import { Block } from "../model/block";
import * as CryptoJS from "crypto-js";
import { Server } from "../http/server";
import { broadcastLatest } from '../p2p/p2p_protocol'
import { hexToBinary } from '../utils/converter';
import { UnspentTxOut } from "../model/unspent_tx_out";

// in seconds
const BLOCK_GENERATION_INTERVAL : number = 10;

// in blocks
const DIFFICULTY_ADJUSTMENT_INTERVAL : number = 10;

/** 
 * The blockchain manager
 * 
 * @class Blockchain
*/
export class Blockchain {

    /**
     * This is the first block in the chain
     */
    private genesisBlock : Block;

    /**
     * This is the actual chain (array of Blocks)
     * At the moments this is In-Memory, but in a near future will retrieved from local storage
     */
    private chain : Block[];

    private unspentTxOuts : UnspentTxOut[] = [];

    /** 
     * Constructor
     * 
     * @class Blockchain
     * @constructor
    */
    constructor() {

        this.genesisBlock = this.getGenesisBlock();
        this.chain = [this.genesisBlock];

    }

    /**
     * Generate a new block
     * 
     * @class Blockchain
     * @method generateNextBlock
     * @param blockData : string
     * @returns Block
     */
    public generateNextBlock(blockData : string) : Block {

        let previousBlock = this.getLatestBlock();
        let difficulty : number = this.getDifficulty(this.getChain());
        console.log('Difficulty : ' + difficulty);

        let nextIndex = previousBlock.index + 1;
        let nextTimestamp : number = this.getCurrentTimestamp();

        let newBlock : Block = this.findBlock(nextIndex, previousBlock.hash, nextTimestamp, blockData, difficulty)

        this.addBlock(newBlock);

        broadcastLatest();
        
        return newBlock;
    }

    /** 
     * Retrieves the entire blockchain
     * 
     * @class Blockchain
     * @method getChain
     * @returns Block[]
    */
    public getChain() : Block[] {
        return this.chain;
    }

    public addBlock(block : Block) : boolean {
        if(this.isValidNewBlock(block, this.getLatestBlock())) {
            this.chain.push(block);
            return true;
        }
        return false;
    }

    private getCurrentTimestamp() : number {
        return Math.round(new Date().getTime() / 1000);
    }

    private getDifficulty(otherChain: Block[]): number {
        const latestBlock: Block = otherChain[this.chain.length - 1];
        if (latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock.index !== 0) {
            return this.getAdjustedDifficulty(latestBlock, otherChain);
        } else {
            return latestBlock.difficulty;
        }
    };

    private getAdjustedDifficulty(latestBlock : Block, otherChain : Block[]) : number {

        let prevAdjustmentBlock: Block = otherChain[this.chain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
        let timeExpected: number = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
        let timeTaken: number = latestBlock.timestamp - prevAdjustmentBlock.timestamp;

        if (timeTaken < timeExpected / 2) {
            return prevAdjustmentBlock.difficulty + 1;
        } else if (timeTaken > timeExpected * 2) {
            return prevAdjustmentBlock.difficulty - 1;
        } else {
            return prevAdjustmentBlock.difficulty;
        }
    }

    private findBlock(index : number, previousHash : string, timestamp : number, data : string, difficulty : number) : Block {
        let nonce = 0;
        while(true) {
            let hash : string = this.calculateHash(index, previousHash, timestamp, data, difficulty, nonce);
            if(this.hashMatchesDifficulty(hash, difficulty)) {
                return new Block(index, previousHash, timestamp, data, hash, difficulty, nonce);
            }
            nonce++;
        }
    }

    private calculateHash(index : number, previousHash : string, timestamp : number, data : any,
                          difficulty : number, nonce : number) : string {
        return CryptoJS.SHA256(index.toString() + previousHash + timestamp + data + difficulty + nonce).toString();
    }

    private calculateHashForBlock(block : Block) : string {
        return this.calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce);
    }

    private getGenesisBlock() : Block {
        return new Block(0, "0", 1465154705, "This is the genesis block!!", "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7", 0, 0);
    }

    public getLatestBlock() : Block {
        return this.chain[this.chain.length - 1];
    }

    private isValidNewBlock(newBlock : Block, previousBlock : Block) : boolean {

        if (!this.isValidBlockStructure(newBlock)) {
            console.log('invalid structure');
            return false;
        }

        if (previousBlock.index + 1 !== newBlock.index) {
            console.log('invalid index');
            return false;
        } else if (previousBlock.hash !== newBlock.previousHash) {
            console.log('invalid previoushash');
            return false;
        } else if (!this.isValidTimestamp(newBlock, previousBlock)) {
            console.log('invalid timestamp');
            return false;
        } else if (!this.hasValidHash(newBlock)) {
            return false;
        }
        return true;
    }

    public isValidBlockStructure(block : Block) : boolean {
        return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && typeof block.previousHash === 'string'
        && typeof block.timestamp === 'number'
        && typeof block.data === 'string';
    }

    private isValidChain(blockchainToValidate: Block[]) : boolean {

        const isValidGenesis = (block: Block): boolean => {
            return JSON.stringify(block) === JSON.stringify(this.genesisBlock);
        };
    
        if (!isValidGenesis(blockchainToValidate[0])) {
            return false;
        }
    
        for (let i = 1; i < blockchainToValidate.length; i++) {
            if (!this.isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
                return false;
            }
        }

        return true;
    }

    private isValidTimestamp(newBlock : Block, previousBlock : Block) : boolean {

        return ( previousBlock.timestamp - 60 < newBlock.timestamp )
        && newBlock.timestamp - 60 < this.getCurrentTimestamp();

    }

    private hasValidHash(block : Block) : boolean {

        if(!this.hashMatchesBlockContent(block)) {
            console.log('invalid hash, got:' + block.hash);
            return false;
        }

        if(!this.hashMatchesDifficulty(block.hash, block.difficulty)) {
            console.log('block difficulty not satisfied. Expected: ' + block.difficulty + 'got: ' + block.hash);
            return false;
        }

        return true;

    }

    private hashMatchesBlockContent(block : Block) : boolean {

        let hash : string = this.calculateHashForBlock(block);
        return hash === block.hash;
    }

    private hashMatchesDifficulty(hash : string, difficulty : number) : boolean {

        let hashInBinary : string = hexToBinary(hash);
        let requiredPrefix : string = '0'.repeat(difficulty);

        return hashInBinary.startsWith(requiredPrefix);
    }

    private getAccumulatedDifficulty(chain : Block[]) : number {
        return chain
                .map((block) => block.difficulty)
                .map((difficulty) => Math.pow(2, difficulty))
                .reduce((a, b) => a + b);
    }

    public replaceChain(newBlocks : Block[]) : void {
        if (this.isValidChain(newBlocks) && 
            this.getAccumulatedDifficulty(newBlocks) > this.getAccumulatedDifficulty(this.getChain())) {
            console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
            this.chain = newBlocks;
            broadcastLatest();
        } else {
            console.log('Received blockchain invalid');
        }
    }

}