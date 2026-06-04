import { encodingLength } from './internal/buffer-operations';
import { PauWriter } from './internal/pau-writer';
import { PauReader } from './internal/pau-reader';
import { Block, EmptyScript } from './block';
import { doubleSHA256 } from './utils';

/**
 * Transaction output.
 *
 * The current implementation supports only unspent transaction outputs aka UTX0,
 * with a very limited range of supported locking script.
 */
export class Output {
  constructor(
    /**
     * The amount to be sent as (big) integer
     */
    public amount: bigint,
    /**
     * The locking script.
     *
     * Historically, the locking script was called a scriptPubKey, because it usually contained a public key or bitcoin address.
     */
    public scriptPubKey: Uint8Array,
  ) {}
}

export class Input {
  constructor(
    /**
     * The transaction hash.
     */
    public transaction: Uint8Array,
    /**
     * The UTXO index of the transaction
     */
    public outputIndex: number,
    /**
     * The unlocking script. The unlocking script is usually a signature, proving ownership of the address that is in the locking script.
     *
     * Historically, the unlocking script is called scriptSig, because it usually contained a digital signature.
     */
    public scriptSig: Uint8Array,
    public sequenceNumber: number,
  ) {}
}

export interface UTXO {
  block: Block;
  transaction: Transaction;
  outputIndex: number;
  amount: bigint;
}

export class Transaction {
  static SIGHASH_ALL = 0x00000001;
  static SIGHASH_NONE = 0x00000002;
  static SIGHASH_SINGLE = 0x00000003;
  static SIGHASH_ANYONECANPAY = 0x00000080;

  static fromBuffer(reader: PauReader) {
    const transaction = new Transaction();
    const version = reader.eatUInt32();
    const marker = reader.eatByte();
    let withWitnesses = false;

    if (marker === 0x00) {
      // its a marker. This works because tx_in count is never zero.
      const flag = reader.eatByte();
      withWitnesses = true;
    } else {
      // it's not a marker, fall back and read as var int.
      reader.offset--;
    }

    const inputs = reader.eatVarUint();
    for (let i = 0; i < inputs; i++) {
      transaction.input.push({
        transaction: reader.eatSlice(32),
        outputIndex: reader.eatUInt32(),
        scriptSig: reader.eatSlice(reader.eatVarUint()),
        sequenceNumber: reader.eatUInt32(),
      });
    }

    const outputs = reader.eatVarUint();
    for (let i = 0; i < outputs; i++) {
      transaction.output.push({
        amount: reader.eatBigInt64(),
        scriptPubKey: reader.eatSlice(reader.eatVarUint()),
      });
    }

    if (withWitnesses) {
      for (let i = 0; i < inputs; i++) {
        const components = reader.eatVarUint();
        const witnesses: Uint8Array[] = [];
        transaction.witnesses.push(witnesses);
        for (let j = 0; j < components; j++) {
          const size = reader.eatVarUint();
          witnesses.push(reader.eatBuffer(size));
        }
      }
    }

    transaction.locktime = reader.eatUInt32();

    return transaction;
  }

  version = 1;

  input: Input[] = [];
  output: Output[] = [];

  locktime = 0;

  witnesses: Uint8Array[][] = [];

  protected hash = new Uint8Array(0);

  /**
   * The binary representation of this transaction.
   * This is filled when read from the blockchain file or received from a peer.
   */
  protected buffer?: Uint8Array;

  getBuffer(): Uint8Array {
    if (this.buffer) return this.buffer;

    let inputSize = 0;
    let outputSize = 0;
    for (const input of this.input)
      inputSize += 32 + 4 + encodingLength(input.scriptSig.byteLength) + input.scriptSig.byteLength + 4;
    for (const output of this.output)
      outputSize += 8 + encodingLength(output.scriptPubKey.byteLength) + output.scriptPubKey.byteLength;

    const buffer = Buffer.allocUnsafe(
      4 + encodingLength(this.input.length) + inputSize + encodingLength(this.output.length) + outputSize + 4,
    );
    const writer = new PauWriter(buffer);
    writer.writeUint32(1);
    writer.writeVarUint(this.input.length);

    for (const input of this.input) {
      // transactionHash
      writer.writeBuffer(input.transaction);
      // outputIndex
      writer.writeUint32(input.outputIndex);
      // scriptSize
      writer.writeVarUint(input.scriptSig.byteLength);
      // script, in our case signature
      writer.writeBuffer(input.scriptSig);
      // sequenceNumber
      writer.writeUint32(input.sequenceNumber);
    }

    writer.writeVarUint(this.output.length);
    for (const output of this.output) {
      writer.writeBigUint(output.amount);
      // scriptSize
      writer.writeVarUint(output.scriptPubKey.byteLength);
      // script, in our case address
      writer.writeBuffer(output.scriptPubKey);
    }

    // locktime
    writer.writeUint32(this.locktime);
    this.buffer = buffer;
    return buffer;
  }

  getHash(): Uint8Array {
    if (this.hash.byteLength === 0) {
      this.hash = doubleSHA256(this.getBuffer());
    }

    return this.hash;
  }

  clone(): Transaction {
    const t = new Transaction();
    t.version = this.version;
    t.locktime = this.locktime;
    t.input = this.input.map((val) => {
      return { ...val };
    });
    t.output = this.output.map((val) => {
      return { ...val };
    });
    return t;
  }

  isValid(): boolean {
    if (!this.output.length) throw new Error(`Transaction has no outputs`);

    return true;
  }

  addInput(
    transaction: Uint8Array,
    outputIndex: number,
    scriptSig: Uint8Array = EmptyScript,
    sequenceNumber = 0xffff_ffff,
  ) {
    if (transaction.byteLength !== 32) throw new Error('Transaction hash has to be 32 bytes');
    this.input.push(new Input(transaction, outputIndex, scriptSig, sequenceNumber));
  }

  addOutput(amount: bigint, scriptPubKey: Uint8Array = EmptyScript) {
    this.output.push(new Output(amount, scriptPubKey));
  }
}
