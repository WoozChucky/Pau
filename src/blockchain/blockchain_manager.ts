import {Block} from "../model/block";
import {Semaphore} from "prex";
import {getBlockchain} from "./blockchain";
import {Database} from "../database";

export type Blockchain = Block[];

const resourceLock = new Semaphore(1);

export class BlockchainManager {

    private static chain : Blockchain;

    private static inited : boolean = false;

    public static async initialize() : Promise<void> {
        if(BlockchainManager.inited) {
            throw new Error("BlockchainManager is already initialized.");
        }

        await resourceLock.wait();

        Database.get('CHAIN')
            .then((chain : string) => {
                BlockchainManager.chain  = JSON.parse(chain);
            })
            .catch(err => {
                console.log('Error loading blockchain from local database. Using genesis block.');

                BlockchainManager.chain = getBlockchain();
            });

        BlockchainManager.inited = true;

        resourceLock.release();
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

    public static async getLastestBlock() : Promise<Block> {

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

        await resourceLock.wait();

        let chain = BlockchainManager.chain;

        resourceLock.release();

        return Database.put('CHAIN', JSON.stringify(chain))
            .then(() => {
                console.log('Safely written blockchain database!')
            })
            .catch(err => {
                console.log(err);
            });
    }
}