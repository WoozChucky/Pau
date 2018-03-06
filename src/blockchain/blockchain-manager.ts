import {Block} from "../model/block";
import {Semaphore} from "prex";
import {Database} from "../database/database-manager";
import { logger } from '../utils/logging';
import {Transaction} from "../model/transaction";
import {P2PServer} from "../p2p/p2p-server";
import {hexToBinary} from "../utils/converter";
import * as CryptoJS from "crypto-js";

export type Blockchain = Block[];

const resourceLock = new Semaphore(1);

export class BlockchainManager {

    // in seconds
    private static BLOCK_GENERATION_INTERVAL: number = 5;

    // in blocks
    private static DIFFICULTY_ADJUSTMENT_INTERVAL: number = 2;

    private static SAVE_TIMEOUT : number = 600000; //10 Minutes

    private static chain : Blockchain;

    private static inited : boolean = false;

    public static async initialize() : Promise<void> {
        if(BlockchainManager.inited) {
            throw new Error("BlockchainManager is already initialized.");
        }

        await resourceLock.wait();

        Database.get(Database.BLOCKCHAIN_KEY)
            .then((chain : string) => {
                BlockchainManager.chain = JSON.parse(chain);
            })
            .catch(() => {
                logger.warn('Error loading blockchain from local database. Using genesis block.');

                BlockchainManager.chain = BlockchainManager.getGenesisChain();
            });

        BlockchainManager.inited = true;

        resourceLock.release();

        setInterval(this.saveLocally, this.SAVE_TIMEOUT);
    }

    public static async getChain() : Promise<Blockchain> {

        if(!BlockchainManager.inited) {
            throw new Error("BlockchainManager is not initialized.");
        }

        await resourceLock.wait();

        let chain = BlockchainManager.chain;

        resourceLock.release();

        return chain;

    }

    public static async getLatestBlock() : Promise<Block> {

        if(!BlockchainManager.inited) {
            throw new Error("BlockchainManager is not initialized.");
        }

        await resourceLock.wait();

        let chain = BlockchainManager.chain;

        let block = chain[chain.length - 1];

        resourceLock.release();

        if(block == undefined) {
            throw new Error("Block not found");
        }

        return block;

    }

    public static async getBlock(hash : string) : Promise<Block> {

        if(!BlockchainManager.inited) {
            throw new Error("BlockchainManager is not initialized.");
        }

        await resourceLock.wait();

        let chain = BlockchainManager.chain;

        let block = chain.find(f => f.hash == hash);

        resourceLock.release();

        if(block == undefined) {
            throw new Error("Block not found");
        }

        return block;

    }

    public static async addBlock(block : Block) : Promise<boolean> {

        if(!BlockchainManager.inited) {
            throw new Error("BlockchainManager is not initialized.");
        }

        let latestBlock = await BlockchainManager.getLatestBlock();

        if (BlockchainManager.isValidNewBlock(block, latestBlock)) {

            await resourceLock.wait();
            BlockchainManager.chain.push(block);
            resourceLock.release();
            return true;

        }
        return false;
    }

    private static isValidNewBlock(newBlock: Block, previousBlock: Block) {
        if (!BlockchainManager.isValidBlockStructure(newBlock)) {
            logger.warn('invalid block structure: %s', JSON.stringify(newBlock));
            return false;
        }
        if (previousBlock.index + 1 !== newBlock.index) {
            logger.warn('invalid index');
            return false;
        } else if (previousBlock.hash !== newBlock.previousHash) {
            logger.warn('invalid previous hash');
            return false;
        } else if (!BlockchainManager.isValidTimestamp(newBlock, previousBlock)) {
            logger.warn('invalid timestamp');
            return false;
        } else if (!BlockchainManager.hasValidHash(newBlock)) {
            return false;
        }
        return true;
    }

    public static async saveLocally() : Promise<void> {

        if(!BlockchainManager.inited) {
            throw new Error("BlockchainManager is not initialized.");
        }

        await resourceLock.wait();

        let chain = BlockchainManager.chain;

        resourceLock.release();

        return await Database.put(Database.BLOCKCHAIN_KEY, JSON.stringify(chain))
            .then(() => {
                logger.info('Safely written blockchain database.');
            })
            .catch(err => {
                logger.warn('An error occurred while saving blockchain database -> ', err);
            });
    }

    public static isValidBlockStructure(block: Block) : boolean {
        return typeof block.index === 'number'
            && typeof block.hash === 'string'
            && typeof block.previousHash === 'string'
            && typeof block.timestamp === 'number'
            && typeof block.data === 'object';
    };

    private static getGenesisChain() : Blockchain {

        let genesisTransaction : Transaction = {
            'txIns': [{'signature': '', 'txOutId': '', 'txOutIndex': 0}],
            'txOuts': [{
                'address': '04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a',
                'amount': 50
            }],
            'id': 'e655f6a5f26dc9b4cac6e46f52336428287759cf81ef5ff10854f69d68f43fa3'
        };

        let genesisBlock : Block = new Block(
            0, '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627',
            '', 1465154705, [genesisTransaction], 0, 0
        );

        return [genesisBlock];
    }

    public static async replaceChain(newChain: Blockchain) {

        if(!BlockchainManager.inited) {
            throw new Error("BlockchainManager is not initialized.");
        }

        await resourceLock.wait();

        //TODO: Additional verification logic
        this.chain = newChain;

        resourceLock.release();

    }

    public static async generateNextBlock(blockData : object) : Promise<Block> {
        return new Promise<Block>(async (resolve) => {

            const previousBlock: Block = await BlockchainManager.getLatestBlock();

            const difficulty: number = await BlockchainManager.getDifficulty();

            const nextIndex: number = previousBlock.index + 1;
            const nextTimestamp: number = BlockchainManager.getCurrentTimestamp();

            const newBlock: Block = BlockchainManager.findBlock(nextIndex, previousBlock.hash, nextTimestamp, blockData, difficulty);

            let added = await BlockchainManager.addBlock(newBlock);

            if(added) {
                P2PServer.broadcastLatestBlock();
                return resolve(newBlock);
            } else {
                return resolve(null);
            }

        });
    }

    private static findBlock(index: number, previousHash: string, timestamp: number, data: object, difficulty: number) : Block {
        let nonce = 0;
        while (true) {
            const hash: string = BlockchainManager.calculateHash(index, previousHash, timestamp, data, difficulty, nonce);
            if (BlockchainManager.hashMatchesDifficulty(hash, difficulty)) {
                return new Block(index, hash, previousHash, timestamp, data, difficulty, nonce);
            }
            nonce++;
        }
    }

    private static hashMatchesDifficulty(hash: string, difficulty: number): boolean {
        const hashInBinary: string = hexToBinary(hash);
        const requiredPrefix: string = '0'.repeat(difficulty);
        return hashInBinary.startsWith(requiredPrefix);
    };

    private static calculateHash(index: number, previousHash: string, timestamp: number, data: object,
                           difficulty: number, nonce: number): string {
        return CryptoJS.SHA256(index + previousHash + timestamp + data + difficulty + nonce).toString();
    }


    private static async getDifficulty(): Promise<number> {

        const latestBlock: Block = await BlockchainManager.getLatestBlock();
        const chain : Blockchain = await BlockchainManager.getChain();

        if (latestBlock.index % BlockchainManager.DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock.index !== 0) {
            return BlockchainManager.getAdjustedDifficulty(latestBlock, chain);
        } else {
            return latestBlock.difficulty;
        }
    };

    private static async getAdjustedDifficulty(latestBlock: Block, otherChain: Block[]) : Promise<number> {

        const chain : Blockchain = await BlockchainManager.getChain();

        const prevAdjustmentBlock: Block = otherChain[chain.length - BlockchainManager.DIFFICULTY_ADJUSTMENT_INTERVAL];

        const timeExpected: number = BlockchainManager.BLOCK_GENERATION_INTERVAL * BlockchainManager.DIFFICULTY_ADJUSTMENT_INTERVAL;

        const timeTaken: number = latestBlock.timestamp - prevAdjustmentBlock.timestamp;

        if (timeTaken < timeExpected / 2) {
            return prevAdjustmentBlock.difficulty + 1;
        } else if (timeTaken > timeExpected * 2) {
            return prevAdjustmentBlock.difficulty - 1;
        } else {
            return prevAdjustmentBlock.difficulty;
        }
    };

    private static getCurrentTimestamp(): number {
        return Math.round(new Date().getTime() / 1000);
    }

    private static isValidTimestamp(newBlock: Block, previousBlock: Block): boolean {
        return ( previousBlock.timestamp - 60 < newBlock.timestamp )
            && newBlock.timestamp - 60 < BlockchainManager.getCurrentTimestamp();
    };

    private static hasValidHash(block: Block): boolean{

        if (!BlockchainManager.hashMatchesBlockContent(block)) {
            logger.warn('invalid hash, got:' + block.hash);
            return false;
        }

        if (!BlockchainManager.hashMatchesDifficulty(block.hash, block.difficulty)) {
            logger.warn('block difficulty not satisfied. Expected: ' + block.difficulty + 'got: ' + block.hash);
        }
        return true;
    };

    private static hashMatchesBlockContent(block: Block): boolean {
        const blockHash: string = BlockchainManager.calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce);
        return blockHash === block.hash;
    };
}