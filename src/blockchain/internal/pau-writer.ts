import * as Buffer from 'buffer';

import { Encoder } from './buffer-operations';

export class PauWriter {
  public dataView: DataView;
  private readonly encoder: Encoder;

  constructor(public buffer: Buffer, public offset: number = 0) {
    this.dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this.encoder = new Encoder();
  }

  writeUint32(val: number) {
    this.dataView.setUint32(this.offset, val, true);
    this.offset += 4;
  }

  writeBuffer(buffer: Uint8Array, offset = 0) {
    for (let i = offset; i < buffer.byteLength; i++) {
      this.buffer[this.offset++] = buffer[i];
    }
  }

  writeByte(val: number) {
    this.buffer[this.offset++] = val;
  }

  writeBigUint(val: bigint) {
    this.dataView.setBigUint64(this.offset, val, true);
    this.offset += 8;
  }

  writeVarUint(val: number) {
    this.encoder.encode(val, this.buffer, this.offset);
    this.offset += this.encoder.bytes;
  }
}
