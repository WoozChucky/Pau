import * as Buffer from 'buffer';

import * as PBuffer from './buffer-operations';

export class PauReader {
  public size: number;
  public dataView: DataView;

  constructor(public buffer: Buffer, public offset: number = 0) {
    this.size = buffer.byteLength;
    this.dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }

  isParsing(): boolean {
    return this.offset < this.buffer.byteLength;
  }

  eatByte(): number {
    return this.buffer[this.offset++];
  }

  eatBuffer(size: number): Uint8Array {
    this.offset += size;
    return this.buffer.subarray(this.offset - size, this.offset);
  }

  eatUInt32(): number {
    this.offset += 4;
    return this.dataView.getUint32(this.offset - 4, true);
  }

  eatSlice(length: number): Uint8Array {
    const slice = this.buffer.subarray(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }

  eatVarUint(): number {
    const value = PBuffer.decode(this.buffer, this.offset);
    this.offset += PBuffer.decode.bytes;
    return value;
  }

  eatBigInt64(): bigint {
    const number = this.dataView.getBigUint64(this.offset, true);
    this.offset += 8;
    return number;
  }
}
