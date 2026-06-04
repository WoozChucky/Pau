import { Mutex } from 'async-mutex';
import * as CryptoJS from 'crypto-js';

import { Block } from '../model/block';
import { Database } from '../database/database-manager';
import { Logger } from '../utils/logging';
import { hexToBinary } from '../utils/converter';
import { EventBus } from '../events/event-bus';
import { Events } from '../events/events';

export type Blockchain = Block[];

const mutex = new Mutex();

// in seconds
const BLOCK_GENERATION_INTERVAL = 5;

// in blocks
const DIFFICULTY_ADJUSTMENT_INTERVAL = 2;

// 10 Minutes
const SAVE_TIMEOUT = 600000;

// In seconds
const ONE_MINUTE = 60;

export class BlockchainManager {
  private static singletonInstance: BlockchainManager;

  public static get instance(): BlockchainManager {
    if (!BlockchainManager.singletonInstance) {
      BlockchainManager.singletonInstance = new BlockchainManager();
    }
    return BlockchainManager.singletonInstance;
  }

  private static getCurrentTimestamp(): number {
    return Math.round(new Date().getTime() / 1000);
  }

  private static isValidTimestamp(
    newBlock: Block,
    previousBlock: Block
  ): boolean {
    return (
      previousBlock.timestamp - ONE_MINUTE < newBlock.timestamp &&
      newBlock.timestamp - ONE_MINUTE < BlockchainManager.getCurrentTimestamp()
    );
  }

  private static hasValidHash(block: Block): boolean {
    if (!BlockchainManager.hashMatchesBlockContent(block)) {
      Logger.warn(`Invalid hash, got:${block.hash}`);
      return false;
    }

    if (
      !BlockchainManager.hashMatchesDifficulty(block.hash, block.difficulty)
    ) {
      Logger.warn(
        `Block difficulty not satisfied. Expected: ${block.difficulty} Got: ${block.hash}`
      );
      return false;
    }
    return true;
  }

  private static hashMatchesBlockContent(block: Block): boolean {
    const blockHash: string = BlockchainManager.calculateHash(
      block.index,
      block.previousHash,
      block.timestamp,
      block.data,
      block.difficulty,
      block.nonce
    );
    return blockHash === block.hash;
  }

  private static hashMatchesDifficulty(
    hash: string,
    difficulty: number
  ): boolean {
    const hashInBinary: string = hexToBinary(hash);
    const requiredPrefix: string = '0'.repeat(difficulty);
    return hashInBinary.startsWith(requiredPrefix);
  }

  private static calculateHash(
    index: number,
    previousHash: string,
    timestamp: number,
    data: object,
    difficulty: number,
    nonce: number
  ): string {
    return CryptoJS.SHA256(
      index + previousHash + timestamp + data + difficulty + nonce
    ).toString();
  }

  private static isValidNewBlock(newBlock: Block, previousBlock: Block) {
    if (previousBlock.index + 1 !== newBlock.index) {
      Logger.warn('invalid index');
      return false;
    } else if (previousBlock.hash !== newBlock.previousHash) {
      Logger.warn('invalid previous hash');
      return false;
    } else if (!BlockchainManager.isValidTimestamp(newBlock, previousBlock)) {
      Logger.warn('invalid timestamp');
      return false;
    } else if (!BlockchainManager.hasValidHash(newBlock)) {
      return false;
    }
    return true;
  }

  private static getGenesisChain(): Blockchain {
    const genesisTransaction: object = {
      txIns: [{ signature: '', txOutId: '', txOutIndex: 0 }],
      txOuts: [
        {
          address:
            '04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a',
          amount: 50,
        },
      ],
      id: 'e655f6a5f26dc9b4cac6e46f52336428287759cf81ef5ff10854f69d68f43fa3',
    };

    const genesisBlock: Block = {
      index: 0,
      timestamp: 1465154705,
      previousHash: '',
      data: [genesisTransaction],
      hash: '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627',
      difficulty: 0,
      nonce: 0,
    };

    return [genesisBlock];
  }

  private chain: Blockchain = [];

  private initialized = false;

  private constructor() {
    // empty on purpose
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      throw new Error('BlockchainManager is already initialized.');
    }

    const unlock = await mutex.acquire();

    try {
      const chain = await Database.instance.get(Database.BLOCKCHAIN_KEY);
      this.chain = JSON.parse(chain);
    } catch (error) {
      Logger.warn(
        'Error loading blockchain from local database. Using genesis block.',
        error
      );

      this.chain = BlockchainManager.getGenesisChain();
    }

    this.initialized = true;

    unlock();

    setInterval(this.saveLocally.bind(this), SAVE_TIMEOUT);
  }

  public async getChain(): Promise<Blockchain> {
    if (!this.initialized) {
      throw new Error('BlockchainManager is not initialized.');
    }

    const unlock = await mutex.acquire();

    const chain = this.chain;

    unlock();

    return chain;
  }

  public async getLatestBlock(): Promise<Block> {
    if (!this.initialized) {
      throw new Error('BlockchainManager is not initialized.');
    }

    const unlock = await mutex.acquire();

    const chain = this.chain;

    unlock();

    const block = chain[chain.length - 1];

    if (!block) {
      throw new Error('Block not found');
    }

    return block;
  }

  public async getBlock(hash: string): Promise<Block> {
    if (!this.initialized) {
      throw new Error('BlockchainManager is not initialized.');
    }

    const unlock = await mutex.acquire();

    const chain = this.chain;

    unlock();

    const block = chain.find((block: Block) => block.hash === hash);

    if (!block) {
      throw new Error('Block not found');
    }

    return block;
  }

  public async addBlock(block: Block): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('BlockchainManager is not initialized.');
    }

    const latestBlock = await this.getLatestBlock();

    if (BlockchainManager.isValidNewBlock(block, latestBlock)) {
      const unlock = await mutex.acquire();
      this.chain.push(block);
      unlock();
      return true;
    }
    return false;
  }

  public async saveLocally(): Promise<void> {
    if (!this.initialized) {
      throw new Error('BlockchainManager is not initialized.');
    }

    const unlock = await mutex.acquire();

    const chain = this.chain;

    unlock();

    await Database.instance.put(Database.BLOCKCHAIN_KEY, JSON.stringify(chain));

    Logger.info('Safely written blockchain database.');
  }

  public async replaceChain(newChain: Blockchain) {
    if (!this.initialized) {
      throw new Error('BlockchainManager is not initialized.');
    }
    const unlock = await mutex.acquire();

    this.chain = newChain;

    unlock();
  }

  public async generateNextBlock(blockData: object): Promise<Block> {
    const previousBlock: Block = await this.getLatestBlock();

    const difficulty: number = await this.getDifficulty();

    const nextIndex: number = previousBlock.index + 1;
    const nextTimestamp: number = BlockchainManager.getCurrentTimestamp();

    const newBlock: Block = await this.findBlockAsync(
      nextIndex,
      previousBlock.hash,
      nextTimestamp,
      blockData,
      difficulty
    );

    const added = await this.addBlock(newBlock);

    if (!added) {
      throw new Error('Failed generate block');
    }

    EventBus.instance.dispatch<Block>(
      Events.BlockchainManager.BlockGenerated,
      newBlock
    );

    return newBlock;
  }

  private findBlockAsync(
    index: number,
    previousHash: string,
    timestamp: number,
    data: object,
    difficulty: number
  ) {
    return new Promise<Block>((resolve) => {
      let nonce = 0;
      let iterating = true;
      while (iterating) {
        const hash: string = BlockchainManager.calculateHash(
          index,
          previousHash,
          timestamp,
          data,
          difficulty,
          nonce
        );
        if (BlockchainManager.hashMatchesDifficulty(hash, difficulty)) {
          iterating = false;
          resolve({
            index,
            hash,
            previousHash,
            timestamp,
            data,
            difficulty,
            nonce,
          });
        }
        nonce++;
      }
    });
  }

  private async getDifficulty(): Promise<number> {
    const latestBlock: Block = await this.getLatestBlock();
    const chain: Blockchain = await this.getChain();

    if (await this.difficultyNeedsAdjustment()) {
      return this.getAdjustedDifficulty(latestBlock, chain);
    } else {
      return latestBlock.difficulty;
    }
  }

  private async difficultyNeedsAdjustment(): Promise<boolean> {
    const latestBlock: Block = await this.getLatestBlock();

    return (
      latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 &&
      latestBlock.index !== 0
    );
  }

  private async getAdjustedDifficulty(
    latestBlock: Block,
    otherChain: Block[]
  ): Promise<number> {
    const chain: Blockchain = await this.getChain();

    const prevAdjustmentBlock: Block =
      otherChain[chain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];

    const timeExpected: number =
      BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;

    const timeTaken: number =
      latestBlock.timestamp - prevAdjustmentBlock.timestamp;

    if (timeTaken < timeExpected / 2) {
      return prevAdjustmentBlock.difficulty + 1;
    } else if (timeTaken > timeExpected * 2) {
      return prevAdjustmentBlock.difficulty - 1 < 0
        ? 0
        : prevAdjustmentBlock.difficulty - 1;
    } else {
      return prevAdjustmentBlock.difficulty;
    }
  }
}
