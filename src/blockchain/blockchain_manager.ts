import {Block} from "../model/block";
import {Semaphore} from "prex";
import {Database} from "../database";
import { logger } from '../utils/logging';
import {Transaction} from "../model/transaction";

export type Blockchain = Block[];

const resourceLock = new Semaphore(1);

export class BlockchainManager {

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

        setTimeout(this.saveLocally, this.SAVE_TIMEOUT);
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

    public static async addBlock(block : Block) : Promise<void> {

        if(!BlockchainManager.inited) {
            throw new Error("BlockchainManager is not initialized.");
        }

        await resourceLock.wait();

        BlockchainManager.chain.push(block);

        resourceLock.release();
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
}