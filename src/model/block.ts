export interface Block {
    index: number;
    timestamp: number;
    previousHash: string;
    data: object;
    hash: string;
    difficulty: number;
    nonce: number;
}
